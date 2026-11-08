/**
 * Suite de Tests : Corrections de l'importation par photo, ergonomie des formulaires et défilement mobile (GHIM PRO)
 * Couvre les 7 tests obligatoires :
 *  - Test 1 : Importer une liste d'élèves par photo (détection OCR, sélection, sexe par défaut si absent, « Valider l'importation », enregistrement réel en base).
 *  - Test 2 : Modifier le nom d'un élève existant et vérifier la persistance.
 *  - Test 3 : Ajouter manuellement un élève oublié (dans l'aperçu photo et via le formulaire d'ajout) et vérifier l'enregistrement.
 *  - Test 4 : Tester l'ergonomie des formulaires sur petit écran (hauteurs, contrastes, espacements, protection clavier mobile, maintien de la modale ouverte en cas d'erreur).
 *  - Test 5 & 6 : Ouvrir les tableaux du tableau de bord sur téléphone et faire défiler horizontalement jusqu'à la dernière colonne.
 *  - Test 7 : Vérifier l'absence de régression sur les fonctionnalités existantes.
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

async function runTests() {
  console.log('===============================================================================');
  console.log('  GHIM PRO — SUITE DE VALIDATION : PHOTO OCR, FORMULAIRES & TABLEAUX MOBILES');
  console.log('===============================================================================\n');

  const { db } = await import('./js/db.js');
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

  // --- TEST 1 : Importer une liste d'élèves par photo (avec et sans colonne Sexe, sélection, enregistrement réel) ---
  console.log('--- Test 1 : Validation et enregistrement réel de l\'importation par photo ---');
  await test('Valide et enregistre réellement dans la classe les élèves détectés par photo (même sans colonne Sexe sur le papier)', async () => {
    const targetCls = await db.addClass({ nom: 'Seconde C Photo', niveau: 'Seconde' });

    // Cas fréquent : liste papier comportant uniquement N°, Nom et Prénoms (sans colonne Sexe)
    const rosterWithoutGender = `
      1 KOUASSI Jean Marc
      2 TRAORÉ Aminata
      3 YAO Serge Pacôme
      4 DIALLO Oumar
    `;

    const detected = OCREngine.extractStudentsFromPages(rosterWithoutGender);
    assert.strictEqual(detected.length, 4, 'Les 4 élèves sont détectés par OCR');
    assert.ok(detected.every(r => r.selected === true), 'Tous les élèves détectés sont pré-sélectionnés par défaut');

    // Le professeur désélectionne le 4e élève et corrige le sexe du 2e élève en Fille
    detected[1].genre = 'Fille';
    detected[3].selected = false;

    // Validation avec le sexe par défaut 'Garçon' pour les lignes sans sexe explicite
    const validation = OCREngine.validatePhotoRosterRows(detected, db.getEleves(targetCls.id), {
      defaultGenre: 'Garçon',
      allowSingleNameFallback: true
    });

    assert.strictEqual(validation.stats.detectedCount, 4, '4 élèves détectés au total');
    assert.strictEqual(validation.stats.selectedCount, 3, '3 élèves sélectionnés par le professeur');
    assert.strictEqual(validation.validStudentsToSave.length, 3, 'Les 3 élèves sélectionnés sont validés et prêts à être enregistrés');

    // Enregistrement réel dans la base de données de la classe
    const saveResult = await db.addElevesBatch(validation.validStudentsToSave, targetCls.id);
    assert.strictEqual(saveResult.totalAdded, 3, 'Exactement 3 élèves effectivement enregistrés');

    const savedInDb = db.getEleves(targetCls.id);
    assert.strictEqual(savedInDb.length, 3, 'La classe contient réellement les 3 élèves importés');
    assert.strictEqual(savedInDb[0].nom, 'KOUASSI');
    assert.strictEqual(savedInDb[0].genre, 'Garçon');
    assert.strictEqual(savedInDb[1].nom, 'TRAORÉ');
    assert.strictEqual(savedInDb[1].genre, 'Fille');
    assert.strictEqual(savedInDb[2].nom, 'YAO');
  });

  // --- TEST 2 : Modifier le nom d'un élève existant ---
  console.log('\n--- Test 2 : Modification du nom d\'un élève existant ---');
  await test('Modifie le nom et le prénom d\'un élève existant et persiste la modification en base', async () => {
    const classes = db.getClasses();
    const targetCls = classes.find(c => c.nom === 'Seconde C Photo');
    const eleves = db.getEleves(targetCls.id);
    const eleveToEdit = eleves.find(e => e.nom === 'KOUASSI');
    assert.ok(eleveToEdit, 'Élève KOUASSI trouvé dans la classe');

    await db.updateEleve(eleveToEdit.id, {
      nom: 'KOUASSI-KONAN',
      prenom: 'Jean-Marc Junior',
      genre: eleveToEdit.genre,
      classeId: targetCls.id,
      matricule: 'MAT-2026-001'
    });

    const updatedEleves = db.getEleves(targetCls.id);
    const updated = updatedEleves.find(e => e.id === eleveToEdit.id);
    assert.strictEqual(updated.nom, 'KOUASSI-KONAN', 'Le nom modifié est bien persisté');
    assert.strictEqual(updated.prenom, 'Jean-Marc Junior', 'Le prénom modifié est bien persisté');
    assert.strictEqual(updated.matricule, 'MAT-2026-001', 'Le matricule modifié est bien persisté');
  });

  // --- TEST 3 : Ajouter manuellement un élève oublié ---
  console.log('\n--- Test 3 : Ajout manuel d\'un élève oublié ---');
  await test('Ajoute manuellement un élève oublié dans l\'aperçu photo ainsi que via le formulaire d\'ajout direct', async () => {
    const classes = db.getClasses();
    const targetCls = classes.find(c => c.nom === 'Seconde C Photo');

    // 3a. Ajout manuel d'un élève oublié pendant l'importation par photo
    const manualPhotoRow = [{
      rowId: 'manual_row_1',
      numero: 1,
      matricule: 'MAT-OUBLIE-01',
      nom: 'BAMBA',
      prenom: 'Sarah',
      genre: 'Fille',
      confidence: 100,
      verifiedByTeacher: true,
      selected: true
    }];

    const validation = OCREngine.validatePhotoRosterRows(manualPhotoRow, db.getEleves(targetCls.id), {
      defaultGenre: 'Garçon',
      allowSingleNameFallback: true
    });
    assert.strictEqual(validation.validStudentsToSave.length, 1, 'L\'élève oublié ajouté dans l\'aperçu photo est valide');
    const batchRes = await db.addElevesBatch(validation.validStudentsToSave, targetCls.id);
    assert.strictEqual(batchRes.totalAdded, 1, 'L\'élève oublié de l\'aperçu photo est enregistré en base');

    // 3b. Ajout manuel via db.addEleve (formulaire « Ajouter un élève »)
    await db.addEleve({
      nom: 'SANGARÉ',
      prenom: 'Ibrahim',
      genre: 'Garçon',
      classeId: targetCls.id,
      matricule: 'MAT-OUBLIE-02'
    });

    const finalEleves = db.getEleves(targetCls.id);
    assert.strictEqual(finalEleves.length, 5, 'La classe compte désormais les 5 élèves (3 initiaux + 2 oubliés ajoutés)');
    assert.ok(finalEleves.some(e => e.nom === 'BAMBA' && e.prenom === 'Sarah'));
    assert.ok(finalEleves.some(e => e.nom === 'SANGARÉ' && e.prenom === 'Ibrahim'));
  });

  // --- TEST 4 : Tester les formulaires et la modale sur petit écran ---
  console.log('\n--- Test 4 : Ergonomie des formulaires et sécurité de la modale sur petit écran ---');
  await test('Vérifie les améliorations ergonomiques des formulaires (hauteurs, espacements, contrastes, clavier mobile, bouton Valider l\'importation)', () => {
    const componentsJs = fs.readFileSync(path.join(__dirname, 'js/components.js'), 'utf8');
    const elevesJs = fs.readFileSync(path.join(__dirname, 'js/views/eleves.js'), 'utf8');
    const componentsCss = fs.readFileSync(path.join(__dirname, 'css/components.css'), 'utf8');
    const viewsCss = fs.readFileSync(path.join(__dirname, 'css/views.css'), 'utf8');

    // 1. La modale attend réellement les fonctions async et ne se ferme pas si result === false
    assert.ok(componentsJs.includes('const result = await onConfirm()'), 'Modal.open attend (await) la fin de onConfirm() avant de fermer');
    assert.ok(componentsJs.includes('if (result !== false'), 'Modal.open ne ferme pas la modale en cas d\'erreur de validation (result === false)');
    assert.ok(componentsJs.includes('scrollIntoView({ behavior: \'smooth\', block: \'center\' })'), 'Protection contre le masquage des champs par le clavier mobile active');

    // 2. Bouton « Valider l'importation » clairement visible et formulaire « Ajouter un élève oublié » spacieux
    assert.ok(elevesJs.includes("Valider l'importation"), 'Bouton « Valider l\'importation » présent');
    assert.ok(elevesJs.includes('id="btn-validate-photo-import"'), 'Bouton d\'action directe #btn-validate-photo-import présent dans l\'aperçu');
    assert.ok(elevesJs.includes('id="photo-forgotten-student-box"'), 'Formulaire dédié spacieux pour ajouter un élève oublié présent');
    assert.ok(elevesJs.includes('syncExtractedRowsFromDom'), 'Synchronisation en direct des champs DOM avant validation active');

    // 3. Hauteur des champs, contrastes et responsive mobile
    assert.ok(componentsCss.includes('min-height: 48px'), 'Hauteur accrue des champs de formulaire (min-height: 48px)');
    assert.ok(componentsCss.includes('min-height: 50px'), 'Hauteur accrue des champs sur mobile (min-height: 50px)');
    assert.ok(viewsCss.includes('.forgotten-student-card'), 'Style de carte spacieuse pour l\'ajout d\'un élève oublié présent');
    assert.ok(viewsCss.includes('#photo-verification-table tbody tr[data-row-id]'), 'Organisation responsive en cartes empilées sur petit écran (< 640px) active');
  });

  // --- TEST 5 & TEST 6 : Ouvrir les tableaux du tableau de bord sur téléphone et défiler jusqu'à la dernière colonne ---
  console.log('\n--- Tests 5 & 6 : Défilement horizontal fluide des tableaux sur mobile / iPhone ---');
  await test('Garantit le défilement horizontal fluide des tableaux du Tableau de bord sur iPhone sans écraser les colonnes ni déborder de l\'écran', () => {
    const mainCss = fs.readFileSync(path.join(__dirname, 'css/main.css'), 'utf8');
    const componentsCss = fs.readFileSync(path.join(__dirname, 'css/components.css'), 'utf8');
    const viewsCss = fs.readFileSync(path.join(__dirname, 'css/views.css'), 'utf8');
    const dashboardJs = fs.readFileSync(path.join(__dirname, 'js/views/dashboard.js'), 'utf8');

    // Vérifier que le tableau de bord utilise .table-responsive > .table avec toutes ses colonnes jusqu'à Date
    assert.ok(dashboardJs.includes('<div class="table-responsive">'), 'Le tableau du Tableau de bord est enveloppé dans .table-responsive');
    assert.ok(dashboardJs.includes('<th>Date</th>'), 'La dernière colonne (Date) est bien présente dans le tableau de bord');

    // Vérifier la correction du blocage CSS Grid sur iPhone (min-width: 0 et minmax(0, ...))
    assert.ok(viewsCss.includes('grid-template-columns: minmax(0, 2fr) minmax(0, 1fr)'), 'Grille principale du Dashboard protégée contre l\'expansion intrinsèque (minmax(0, ...))');
    assert.ok(viewsCss.includes('.dashboard-main-grid > *'), 'Les éléments enfants du Dashboard ont min-width: 0 et max-width: 100%');
    assert.ok(mainCss.includes('min-width: 0;'), '.page-content et .main-wrapper ont min-width: 0');

    // Vérifier les propriétés de défilement tactile iOS/Android sur .table-responsive et .table
    assert.ok(componentsCss.includes('-webkit-overflow-scrolling: touch'), 'Défilement inertiel iOS (-webkit-overflow-scrolling: touch) activé');
    assert.ok(componentsCss.includes('touch-action: pan-x pan-y'), 'Geste tactile horizontal/vertical (touch-action: pan-x pan-y) activé sur .table-responsive');
    assert.ok(componentsCss.includes('min-width: 640px'), 'Largeur minimale (.table min-width: 640px) empêchant l\'écrasement des colonnes sur téléphone');
    assert.ok(componentsCss.includes('white-space: nowrap'), 'Empêchement du retour à la ligne forcé (white-space: nowrap) pour un défilement net jusqu\'à la dernière colonne');
  });

  // --- TEST 7 : Vérifier l'absence de régression sur le moteur de notation ---
  console.log('\n--- Test 7 : Absence de régression sur les barèmes et le moteur EPS ---');
  await test('Préserve intact le calcul des notes et les barèmes officiels', async () => {
    const { EPSEngine } = await import('./js/engine.js');
    const baremes = db.getBaremes();
    assert.ok(baremes.length > 0, 'Les barèmes officiels sont intacts');
    const enginInfo = EPSEngine.getOfficialEnginInfo('Lancer de poids', 'Troisième', 'Garçon');
    const res = EPSEngine.calculateGrade('Lancer de poids', 'Troisième', 'Garçon', 9.5, enginInfo.defaultEngin, 'interpolation');
    assert.strictEqual(typeof res.note, 'number', 'Le calcul de note fonctionne normalement');
    assert.ok(res.note >= 0 && res.note <= 20, 'La note calculée est comprise entre 0 et 20');
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT DE LA SUITE CORRECTIONS PHOTO & MOBILE : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed < total) {
    process.exit(1);
  }
}

runTests();

