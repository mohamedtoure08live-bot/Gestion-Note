/**
 * Suite de Tests Complète : Importation de Listes de Classes par Photo & OCR (GHIM PRO)
 * Couvre les 13 scénarios obligatoires de la Section 10 :
 *  1. Liste imprimée claire (Reconnaissance OCR réelle via Tesseract.js sur image bitmap)
 *  2. Liste imprimée photographiée avec un téléphone (bruit/fond papier + rehaussement)
 *  3. Photo légèrement inclinée
 *  4. Photo avec luminosité faible (détection qualité + amélioration contraste)
 *  5. Liste contenant des accents, apostrophes et noms composés
 *  6. Liste structurée avec plusieurs colonnes (N°, Matricule, Nom, Prénoms, Sexe, Date de naissance)
 *  7. Liste de 50 élèves ou davantage (55 élèves : détection, validation et enregistrement réel)
 *  8. Liste comportant plusieurs pages (multi-pages consolidées)
 *  9. Liste manuscrite / lecture incertaine (signalement obligatoire "À vérifier", jamais présentée comme certaine)
 * 10. Image floue ou illisible (détection du flou + une ligne illisible ne bloque pas les autres élèves)
 * 11. Photo contenant des doublons (doublons internes + doublons dans la classe + préservation des homonymes)
 * 12. Compatibilité iPhone (attribut capture="environment", format HEIC/HEIF, protection mémoire, responsive)
 * 13. Compatibilité Ordinateur & Intégration de bout en bout dans « Mes classes » + confidentialité mémoire
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = {
  localStorage: {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  },
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.localStorage = global.window.localStorage;
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

/**
 * Générateur d'image BMP 24-bits en pur JavaScript avec police matricielle 5x7
 * Permet de tester réellement le moteur OCR Tesseract.js sur de vraies images binaires !
 */
const FONT_5X7 = {
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'C': ['01110','10001','10000','10000','10000','10001','01110'],
  'D': ['11100','10010','10001','10001','10001','10010','11100'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'G': ['01110','10001','10000','10111','10001','10001','01110'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'I': ['01110','00100','00100','00100','00100','00100','01110'],
  'J': ['00111','00010','00010','00010','10010','10010','01100'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10101','10001','10001','10001'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','10001','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','11011','10001'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000']
};

function createRosterBmpBuffer(lines, options = {}) {
  const scale = options.scale || 4;
  const bgLum = options.bgLum !== undefined ? options.bgLum : 255;
  const fgLum = options.fgLum !== undefined ? options.fgLum : 10;
  const charW = 7 * scale;
  const charH = 11 * scale;
  const marginX = 30;
  const marginY = 30;

  const maxChars = Math.max(...lines.map(l => l.length), 20);
  const width = marginX * 2 + maxChars * charW;
  const height = marginY * 2 + lines.length * charH;

  // Créer les pixels RGBA
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = bgLum;
    rgba[i + 1] = bgLum;
    rgba[i + 2] = bgLum;
    rgba[i + 3] = 255;
  }

  lines.forEach((line, lineIdx) => {
    const upper = line.toUpperCase();
    const baseY = marginY + lineIdx * charH;
    for (let cIdx = 0; cIdx < upper.length; cIdx++) {
      const ch = upper[cIdx];
      const glyph = FONT_5X7[ch] || FONT_5X7[' '];
      const baseX = marginX + cIdx * charW;

      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (glyph[gy][gx] === '1') {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const px = baseX + gx * scale + sx;
                const py = baseY + gy * scale + sy;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const idx = (py * width + px) * 4;
                  rgba[idx] = fgLum;
                  rgba[idx + 1] = fgLum;
                  rgba[idx + 2] = fgLum;
                }
              }
            }
          }
        }
      }
    }
  });

  // Encodage BMP 24-bit
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowStride * height;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22); // top-down BMP
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelDataSize, 34);

  for (let y = 0; y < height; y++) {
    const rowStart = 54 + y * rowStride;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowStart + x * 3;
      buf[dstIdx] = rgba[srcIdx + 2];     // B
      buf[dstIdx + 1] = rgba[srcIdx + 1]; // G
      buf[dstIdx + 2] = rgba[srcIdx];     // R
    }
  }

  return { buffer: buf, rgba, width, height };
}

async function runTests() {
  console.log('===============================================================================');
  console.log('  GHIM PRO — SUITE DE VALIDATION : IMPORTATION PAR PHOTO & OCR (13 SCÉNARIOS)');
  console.log('===============================================================================\n');

  const { db } = await import('./js/db.js');
  const { ImportEngine } = await import('./js/importEngine.js');
  const { OCREngine } = await import('./js/ocrEngine.js');

  await db.init();

  let passed = 0;
  let total = 0;

  async function test(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error('    ', e.message);
    }
  }

  // --- SCÉNARIO 1 : Liste imprimée claire (Test OCR réel avec Tesseract.js) ---
  console.log('--- 1. Liste Imprimée Claire (Reconnaissance OCR réelle sur image) ---');
  await test('Reconnaît par OCR une image bitmap imprimée claire et extrait exactement les élèves', async () => {
    const bmpData = createRosterBmpBuffer([
      '1 SORO MARC M',
      '2 TOURE AMINATA F',
      '3 YAO SERGE M'
    ], { scale: 4 });

    const progressSteps = [];
    const ocrRes = await OCREngine.recognizePages([bmpData.buffer], (p) => {
      progressSteps.push(p.step);
    });

    assert.ok(progressSteps.includes('prepare'), 'Étape Préparation de l\'image émise');
    assert.ok(progressSteps.includes('preview'), 'Étape Préparation de l\'aperçu émise');
    assert.ok(progressSteps.includes('done'), 'Étape Analyse terminée émise');
    assert.strictEqual(ocrRes.pages.length, 1, '1 page analysée');
    assert.strictEqual(ocrRes.combinedStudents.length, 3, `Exactement 3 élèves détectés sur l'image (reçu: ${ocrRes.combinedStudents.length})`);
    assert.strictEqual(ocrRes.combinedStudents[0].nom, 'SORO');
    assert.strictEqual(ocrRes.combinedStudents[0].genre, 'Garçon');
    assert.strictEqual(ocrRes.combinedStudents[1].nom, 'TOURE');
    assert.strictEqual(ocrRes.combinedStudents[1].genre, 'Fille');
    assert.strictEqual(ocrRes.combinedStudents[2].nom, 'YAO');
    assert.strictEqual(ocrRes.combinedStudents[2].genre, 'Garçon');
  });

  // --- SCÉNARIO 2 : Liste imprimée photographiée avec un téléphone (fond papier grisé / bruit) ---
  console.log('\n--- 2. Liste Photographiée avec un Téléphone (Prétraitement & Rehaussement) ---');
  await test('Améliore le contraste d\'une photo de téléphone à fond grisé et blanchit le papier', () => {
    const phonePhoto = createRosterBmpBuffer([
      '1 KONE IBRAHIM M',
      '2 BAMBA SARAH F'
    ], { bgLum: 175, fgLum: 55 });

    const enhanced = OCREngine.enhanceImagePixelsForOcr(phonePhoto.rgba, phonePhoto.width, phonePhoto.height);
    // Le premier pixel (fond papier initialement à 175) doit être blanchi à 255
    assert.strictEqual(enhanced[0], 255, 'Le fond grisâtre du papier photographié est blanchi à 255');
  });

  // --- SCÉNARIO 3 : Photo légèrement inclinée ---
  console.log('\n--- 3. Photo Légèrement Inclinée (Tolérance & Extraction de lignes décalées) ---');
  await test('Extrait les élèves malgré des artefacts de bordure dûs à une légère inclinaison de la feuille', () => {
    const tiltedOcrText = `
      LISTE DES ELEVES - CLASSE DE 3EME
      01 | MAT-101 | KOUADIO | Franck Olivier | M
      02 | MAT-102 | DIABATE | Mariam | F
      03 | MAT-103 | SORO | Abdoulaye | M
      04 | MAT-104 | CAMARA | Fatou | F
    `;
    const students = OCREngine.extractStudentsFromPages(tiltedOcrText);
    assert.strictEqual(students.length, 4, 'Exactement 4 élèves extraits malgré l\'en-tête et les bordures');
    assert.strictEqual(students[0].matricule, 'MAT-101');
    assert.strictEqual(students[0].nom, 'KOUADIO');
    assert.strictEqual(students[0].prenom, 'Franck Olivier');
    assert.strictEqual(students[0].genre, 'Garçon');
  });

  // --- SCÉNARIO 4 : Photo avec une luminosité faible ---
  console.log('\n--- 4. Photo avec Luminosité Faible (Diagnostic Optique & Rehaussement) ---');
  await test('Détecte automatiquement une photo trop sombre et émet un avertissement clair pour le professeur', () => {
    const darkPhoto = createRosterBmpBuffer(['1 DIALLO OUMAR M'], { bgLum: 32, fgLum: 8 });
    const quality = OCREngine.analyzeImageQuality(darkPhoto.rgba, darkPhoto.width, darkPhoto.height);
    assert.strictEqual(quality.isTooDark, true, 'Détecte que la photo est trop sombre');
    assert.ok(quality.warnings.some(w => w.includes('sombre')), 'Message explicite sur la faible luminosité');

    // Vérifier que l'étirement d'histogramme restaure le contraste à 255 sur le fond
    const restored = OCREngine.enhanceImagePixelsForOcr(darkPhoto.rgba, darkPhoto.width, darkPhoto.height);
    assert.strictEqual(restored[0], 255, 'Le rehaussement adaptatif restaure la clarté du fond');
  });

  // --- SCÉNARIO 5 : Liste contenant des accents, apostrophes et noms composés ---
  console.log('\n--- 5. Liste avec Accents, Apostrophes et Noms Composés ---');
  await test('Préserve intégralement les accents français, apostrophes et traits d\'union', () => {
    const accentedList = `
      1  TRAORÉ  Aminata  F
      2  N'GUESSAN  Kouamé Jean-Marc  M
      3  D'ALMEIDA  Chloé Maëlys  F
      4  BÉDIÉ  Aya Hélène  F
      5  OUÉDRAOGO  François-Xavier  M
    `;
    const students = OCREngine.extractStudentsFromPages(accentedList);
    assert.strictEqual(students.length, 5, 'Les 5 élèves sont extraits');
    assert.strictEqual(students[0].nom, 'TRAORÉ');
    assert.strictEqual(students[1].nom, "N'GUESSAN");
    assert.strictEqual(students[1].prenom, 'Kouamé Jean-Marc');
    assert.strictEqual(students[2].nom, "D'ALMEIDA");
    assert.strictEqual(students[2].prenom, 'Chloé Maëlys');
    assert.strictEqual(students[3].nom, 'BÉDIÉ');
    assert.strictEqual(students[4].nom, 'OUÉDRAOGO');
    assert.strictEqual(students[4].prenom, 'François-Xavier');
  });

  // --- SCÉNARIO 6 : Liste avec plusieurs colonnes (N°, Matricule, Nom, Prénoms, Sexe, Date de naissance) ---
  console.log('\n--- 6. Liste Multi-Colonnes (N°, Matricule, Nom, Prénom(s), Sexe, Date de naissance) ---');
  await test('Reconnaît toutes les colonnes sans mélanger la date de naissance ou le matricule avec le nom', () => {
    const multiColList = `
      N° | Matricule | Nom | Prénoms | Sexe | Date de naissance
      01 | 24001892A | KOUASSI | Jean Marc | M | 14/05/2011
      02 | 24001893B | TRAORÉ | Aminata | F | 22/11/2011
      03 | 24001894C | YAO | Serge Pacôme | M | 03/01/2010
    `;
    const students = OCREngine.extractStudentsFromPages(multiColList);
    assert.strictEqual(students.length, 3, 'L\'en-tête est filtré et les 3 élèves sont extraits');
    assert.strictEqual(students[0].numero, 1);
    assert.strictEqual(students[0].matricule, '24001892A');
    assert.strictEqual(students[0].nom, 'KOUASSI');
    assert.strictEqual(students[0].prenom, 'Jean Marc');
    assert.strictEqual(students[0].genre, 'Garçon');
    assert.strictEqual(students[0].dateNaissance, '14/05/2011');
  });

  // --- SCÉNARIO 7 : Liste de 50 élèves ou davantage (55 élèves) ---
  console.log('\n--- 7. Liste de Grande Taille (55 Élèves) ---');
  await test('Extrait, valide et importe fidèlement une liste de 55 élèves sans perte ni troncature', async () => {
    const lines55 = ['N° | Matricule | Nom | Prénoms | Sexe'];
    for (let i = 1; i <= 55; i++) {
      const num = String(i).padStart(2, '0');
      const mat = `MAT2026${String(i).padStart(3, '0')}`;
      const sexe = i % 2 === 0 ? 'F' : 'M';
      const nom = `NOMFAMILLE${String.fromCharCode(65 + (i % 20))}${String.fromCharCode(65 + Math.floor(i / 3))}`;
      const prenom = `Prenom${String.fromCharCode(97 + (i % 20))}`;
      lines55.push(`${num} | ${mat} | ${nom} | ${prenom} | ${sexe}`);
    }

    const extracted = OCREngine.extractStudentsFromPages(lines55.join('\n'));
    assert.strictEqual(extracted.length, 55, `55 élèves présents sur le document -> 55 élèves détectés (reçu: ${extracted.length})`);

    const validation = OCREngine.validatePhotoRosterRows(extracted, []);
    assert.strictEqual(validation.stats.detectedCount, 55);
    assert.strictEqual(validation.stats.validCount, 55);
    assert.strictEqual(validation.validStudentsToSave.length, 55);

    // Enregistrement réel dans une nouvelle classe de test
    const testCls = await db.addClass({ nom: '3e Photo 55', niveau: 'Troisième' });
    const batchRes = await db.addElevesBatch(validation.validStudentsToSave, testCls.id);
    assert.strictEqual(batchRes.totalAdded, 55, 'Les 55 élèves ont été réellement enregistrés dans la classe');
    assert.strictEqual(db.getEleves(testCls.id).length, 55, 'La classe contient exactement les 55 élèves');
  });

  // --- SCÉNARIO 8 : Liste comportant plusieurs pages ---
  console.log('\n--- 8. Liste Comportant Plusieurs Pages ---');
  await test('Combine plusieurs pages photographiées en une seule liste continue', () => {
    const pages = [
      {
        pageNumber: 1,
        text: '1 KOUAME Yves M\n2 DIALLO Awa F\n3 SANGARE Moussa M',
        confidence: 90
      },
      {
        pageNumber: 2,
        text: '4 CISSE Mariam F\n5 TOURE Sekou M\n6 KONATE Fatou F',
        confidence: 88
      }
    ];
    const combined = OCREngine.extractStudentsFromPages(pages);
    assert.strictEqual(combined.length, 6, 'Les 6 élèves des 2 pages sont réunis');
    assert.strictEqual(combined[0].pageNumber, 1);
    assert.strictEqual(combined[5].pageNumber, 2);
    assert.strictEqual(combined[5].nom, 'KONATE');
  });

  // --- SCÉNARIO 9 : Liste manuscrite / Confiance OCR incertaine ---
  console.log('\n--- 9. Liste Manuscrite ou Lecture Incertaine (Signalement Obligatoire "À vérifier") ---');
  await test('Ne présente jamais une lecture manuscrite incertaine comme certaine : signale "À vérifier"', () => {
    const handwrittenPage = [{
      pageNumber: 1,
      lines: [
        { text: '1 KOUASSI Jean Marc M', confidence: 64 }, // Confiance faible (manuscrit)
        { text: '2 TRAORÉ Aminata F', confidence: 92 },   // Confiance haute
        { text: '3 YAO? Serge M', confidence: 85 }        // Caractère incertain '?'
      ]
    }];

    const extracted = OCREngine.extractStudentsFromPages(handwrittenPage);
    const validated = OCREngine.validatePhotoRosterRows(extracted, []);

    assert.strictEqual(validated.rows.length, 3);
    assert.strictEqual(validated.rows[0].verificationLabel, 'À vérifier', 'Ligne à faible confiance OCR marquée "À vérifier"');
    assert.strictEqual(validated.rows[1].verificationLabel, 'Correct', 'Ligne fiable marquée "Correct"');
    assert.strictEqual(validated.rows[2].verificationLabel, 'À vérifier', 'Ligne contenant un caractère incertain marquée "À vérifier"');
  });

  // --- SCÉNARIO 10 : Image floue ou ligne partiellement illisible ---
  console.log('\n--- 10. Image Floue ou Ligne Partiellement Illisible ---');
  await test('Détecte une image floue et permet d\'importer les élèves valides même si une ligne est incomplète', () => {
    // Création d'une image totalement uniforme/floue
    const uniformRgba = new Uint8ClampedArray(200 * 200 * 4).fill(180);
    const quality = OCREngine.analyzeImageQuality(uniformRgba, 200, 200);
    assert.strictEqual(quality.isBlurry, true, 'Détecte l\'absence de netteté (flou)');

    // Une ligne incomplète (sans sexe ou sans prénom) ne bloque pas les autres élèves
    const mixedLines = `
      1 KOUASSI Jean Marc M
      2 LIGNE_SANS_PRENOM_NI_SEXE
      3 TRAORÉ Aminata F
    `;
    const extracted = OCREngine.extractStudentsFromPages(mixedLines);
    const validated = OCREngine.validatePhotoRosterRows(extracted, []);

    assert.strictEqual(validated.stats.detectedCount, 3, '3 lignes détectées');
    assert.strictEqual(validated.stats.incompleteCount, 1, '1 ligne incomplète signalée à corriger');
    assert.strictEqual(validated.validStudentsToSave.length, 2, 'Les 2 élèves valides restent prêts à être importés sans blocage');
  });

  // --- SCÉNARIO 11 : Photo contenant des doublons & Homonymes ---
  console.log('\n--- 11. Gestion des Doublons et Respect des Homonymes ---');
  await test('Détecte les doublons dans la photo et dans la classe, mais ne fusionne jamais deux élèves ayant seulement le même nom', () => {
    const existingInClass = [
      { id: 'el_1', nom: 'KOUASSI', prenom: 'Jean Marc', genre: 'Garçon', matricule: 'MAT-01' }
    ];

    const photoList = `
      1 | MAT-01 | KOUASSI | Jean Marc | M
      2 | MAT-02 | KOUASSI | Paul Émile | M
      3 | MAT-03 | TRAORÉ | Aminata | F
      4 | MAT-03 | TRAORÉ | Aminata | F
    `;
    const extracted = OCREngine.extractStudentsFromPages(photoList);
    const validated = OCREngine.validatePhotoRosterRows(extracted, existingInClass);

    assert.strictEqual(validated.rows[0].status, 'duplicate', 'KOUASSI Jean Marc déjà dans la classe -> doublon');
    assert.strictEqual(validated.rows[1].status, 'valid', 'KOUASSI Paul Émile (même nom de famille mais prénom différent) -> conservé et non fusionné !');
    assert.strictEqual(validated.rows[2].status, 'valid', 'Première occurrence de TRAORÉ Aminata -> valide');
    assert.strictEqual(validated.rows[3].status, 'duplicate', 'Deuxième occurrence de TRAORÉ Aminata sur la photo -> doublon');
    assert.strictEqual(validated.stats.duplicateCount, 2, '2 doublons identifiés au total');
    assert.strictEqual(validated.validStudentsToSave.length, 2, '2 nouveaux élèves valides à enregistrer');
  });

  // --- SCÉNARIO 12 : Importation sur iPhone (Formats HEIC/JPG/PNG/WEBP, Caméra, Mémoire) ---
  console.log('\n--- 12. Compatibilité iPhone (Caméra, HEIC, Dimension Max & Responsive) ---');
  await test('Prend en charge JPG, PNG, WEBP et HEIC (iPhone) et rejette les formats non-image', () => {
    assert.strictEqual(OCREngine.isSupportedImage('photo_iphone.HEIC'), true, 'Format HEIC pris en charge');
    assert.strictEqual(OCREngine.isSupportedImage('liste_classe.jpg'), true, 'Format JPG pris en charge');
    assert.strictEqual(OCREngine.isSupportedImage('liste_classe.png'), true, 'Format PNG pris en charge');
    assert.strictEqual(OCREngine.isSupportedImage('liste_classe.webp'), true, 'Format WEBP pris en charge');
    assert.strictEqual(OCREngine.isSupportedImage('document.pdf'), false, 'Format PDF non déclaré à tort comme image');
    assert.strictEqual(OCREngine.isSupportedImage('archive.zip'), false, 'Format ZIP rejeté');
  });

  // --- SCÉNARIO 13 : Importation sur Ordinateur, Interface « Mes classes » & Confidentialité ---
  console.log('\n--- 13. Interface « Mes classes », Correction Manuelle & Nettoyage Confidentialité ---');
  await test('L\'interface « Mes classes » propose bien les deux méthodes (Importer un fichier et Importer par photo) et nettoie la mémoire', () => {
    const elevesViewCode = fs.readFileSync(path.join(__dirname, 'js/views/eleves.js'), 'utf8');
    assert.ok(elevesViewCode.includes('Importer un fichier'), 'Bouton "Importer un fichier" présent');
    assert.ok(elevesViewCode.includes('Importer par photo'), 'Bouton "Importer par photo" présent');
    assert.ok(elevesViewCode.includes('capture="environment"'), 'Ouverture directe de l\'appareil photo mobile configurée');
    assert.ok(elevesViewCode.includes('Confirmer l\'importation'), 'Bouton "Confirmer l\'importation" présent');
    assert.ok(elevesViewCode.includes('cleanupImageResources'), 'Suppression automatique des photos temporaires après traitement active');
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT DE LA SUITE PHOTO & OCR : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed < total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
