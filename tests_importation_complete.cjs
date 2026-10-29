/**
 * Suite de tests réels : Validation de l'Importation Complète Multi-Formats
 * (CSV, XLSX, XLS, ODS, TXT, volumes de 10 à 500 élèves, cas d'erreurs et doublons)
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Configuration de l'environnement virtuel pour Node.js
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  supabase: null,
  XLSX: XLSX,
  dispatchEvent: () => {}
};

async function runImportValidationTests() {
  console.log("===============================================================================");
  console.log("  GHIM PRO - TESTS RÉELS : IMPORTATION COMPLÈTE MULTI-FORMATS & VOLUMÉTRIE");
  console.log("===============================================================================\n");

  const { ImportEngine } = await import('./js/importEngine.js');
  const { db } = await import('./js/db.js');

  await db.init();
  db.setCurrentProfesseur('prof_test_import', {
    nom: 'TOURE',
    prenom: 'Mohamed',
    etablissement: 'Lycée Classique'
  });

  // Création d'une classe de test dédiée
  const testClass = await db.addClass({
    nom: 'Troisième 4 - Test Import',
    niveau: 'Troisième',
    anneeScolaire: '2025-2026'
  });

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, title, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${title}`);
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      if (details) console.error(`     Détails: ${details}`);
    }
  }

  // Dossier temporaire pour les fichiers de test réels
  const tempDir = path.join(__dirname, 'temp_test_imports');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    // -------------------------------------------------------------------------
    // SECTION 1 : TESTS DE FORMATS DE FICHIERS
    // -------------------------------------------------------------------------
    console.log("--- 1. Prise en charge des différents formats de fichiers ---");

    // 1.1 CSV avec virgules
    const csvCommaContent = "Nom,Prénom,Genre,Matricule\nKOUASSI,Jean,Garçon,MAT-C1\nDIABATE,Aïcha,Fille,MAT-C2\nYAPO,Christian,M,MAT-C3\n";
    const wbCsvComma = await ImportEngine.readWorkbook(csvCommaContent, 'test_virgule.csv');
    assert(wbCsvComma.sheets[0].rows.length === 4, "CSV avec virgules : 4 lignes lues correctement");
    const colsComma = ImportEngine.detectColumns(wbCsvComma.sheets[0].rows);
    const procComma = ImportEngine.processRows(wbCsvComma.sheets[0].rows, colsComma.headerRowIndex, colsComma.mapping);
    assert(procComma.validStudents.length === 3, "CSV avec virgules : 3 élèves valides détectés");

    // 1.2 CSV avec points-virgules
    const csvSemicolonContent = "Nom;Prénom;Genre;Matricule\nTOURE;Adama;Garçon;MAT-S1\nKONE;Fatou;Fille;MAT-S2\nBAMBA;Sekou;G;MAT-S3\n";
    const wbCsvSemi = await ImportEngine.readWorkbook(csvSemicolonContent, 'test_point_virgule.csv');
    const colsSemi = ImportEngine.detectColumns(wbCsvSemi.sheets[0].rows);
    const procSemi = ImportEngine.processRows(wbCsvSemi.sheets[0].rows, colsSemi.headerRowIndex, colsSemi.mapping);
    assert(procSemi.validStudents.length === 3, "CSV avec points-virgules : 3 élèves valides détectés");
    assert(procSemi.validStudents[2].genreNormalized === 'Garçon', "Genre 'G' normalisé avec succès en 'Garçon'");

    // 1.3 Fichier TXT avec tabulations
    const txtTabContent = "Nom\tPrénom\tGenre\tMatricule\nOUATTARA\tIbrahim\tM\tMAT-T1\nCISSE\tMariam\tF\tMAT-T2\n";
    const wbTxt = await ImportEngine.readWorkbook(txtTabContent, 'test_tabulation.txt');
    const colsTxt = ImportEngine.detectColumns(wbTxt.sheets[0].rows);
    const procTxt = ImportEngine.processRows(wbTxt.sheets[0].rows, colsTxt.headerRowIndex, colsTxt.mapping);
    assert(procTxt.validStudents.length === 2, "Fichier TXT tabulé : 2 élèves valides détectés");

    // 1.4 Fichier Excel XLSX réel
    const xlsxPath = path.join(tempDir, 'classe_3e.xlsx');
    const wbXlsxData = [
      ["Nom", "Prénom", "Genre", "Matricule"],
      ["SORO", "Abdoulaye", "Garçon", "XLSX-01"],
      ["TRAORE", "Aminata", "Fille", "XLSX-02"],
      ["GOMEZ", "Marc", "Masculin", "XLSX-03"]
    ];
    const wsXlsx = XLSX.utils.aoa_to_sheet(wbXlsxData);
    const wbXlsx = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbXlsx, wsXlsx, "Élèves 3e");
    XLSX.writeFile(wbXlsx, xlsxPath);

    const xlsxBuffer = fs.readFileSync(xlsxPath);
    const parsedXlsx = await ImportEngine.readWorkbook(xlsxBuffer, 'classe_3e.xlsx');
    assert(parsedXlsx.sheets.length === 1 && parsedXlsx.sheets[0].name === "Élèves 3e", "Excel XLSX : classeur et feuille 'Élèves 3e' lus avec succès");
    const colsXlsx = ImportEngine.detectColumns(parsedXlsx.sheets[0].rows);
    const procXlsx = ImportEngine.processRows(parsedXlsx.sheets[0].rows, colsXlsx.headerRowIndex, colsXlsx.mapping);
    assert(procXlsx.validStudents.length === 3, "Excel XLSX : 3 élèves valides détectés");

    // 1.5 Fichier Excel XLS (Ancien format Excel 97-2004)
    const xlsPath = path.join(tempDir, 'classe_ancienne.xls');
    XLSX.writeFile(wbXlsx, xlsPath, { bookType: 'biff8' });
    const xlsBuffer = fs.readFileSync(xlsPath);
    const parsedXls = await ImportEngine.readWorkbook(xlsBuffer, 'classe_ancienne.xls');
    assert(parsedXls.sheets.length > 0, "Ancien Excel XLS (biff8) : lu avec succès par SheetJS");
    const procXls = ImportEngine.processRows(parsedXls.sheets[0].rows, colsXlsx.headerRowIndex, colsXlsx.mapping);
    assert(procXls.validStudents.length === 3, "Ancien Excel XLS : 3 élèves valides extraits");

    // 1.6 Fichier OpenDocument ODS (LibreOffice / OpenOffice)
    const odsPath = path.join(tempDir, 'classe_libreoffice.ods');
    XLSX.writeFile(wbXlsx, odsPath, { bookType: 'ods' });
    const odsBuffer = fs.readFileSync(odsPath);
    const parsedOds = await ImportEngine.readWorkbook(odsBuffer, 'classe_libreoffice.ods');
    assert(parsedOds.sheets.length > 0, "OpenDocument ODS : lu avec succès");
    const procOds = ImportEngine.processRows(parsedOds.sheets[0].rows, colsXlsx.headerRowIndex, colsXlsx.mapping);
    assert(procOds.validStudents.length === 3, "OpenDocument ODS : 3 élèves valides extraits");

    // 1.7 Fichier avec accents, cédilles et apostrophes françaises
    const accentsCsv = "\uFEFFNom;Prénom;Genre;Matricule\nL'HUILLIER;François;Garçon;ACC-01\nKOUAMÉ;Éléonore;Féminin;ACC-02\nN'GUESSAN;Jean-Noël;H;ACC-03\n";
    const wbAccents = await ImportEngine.readWorkbook(accentsCsv, 'accents.csv');
    const colsAcc = ImportEngine.detectColumns(wbAccents.sheets[0].rows);
    const procAcc = ImportEngine.processRows(wbAccents.sheets[0].rows, colsAcc.headerRowIndex, colsAcc.mapping);
    assert(procAcc.validStudents.length === 3, "Accents et apostrophes : 3 élèves préservés fidèlement");
    assert(procAcc.validStudents[0].nom === "L'HUILLIER" && procAcc.validStudents[0].prenom === "François", "Apostrophe et cédille préservées (L'HUILLIER François)");
    assert(procAcc.validStudents[1].prenom === "Éléonore" && procAcc.validStudents[1].genreNormalized === "Fille", "Accents et genre 'Féminin' normalisé");
    assert(procAcc.validStudents[2].genreNormalized === "Garçon", "Genre 'H' (Homme) normalisé en Garçon");

    // 1.8 Fichier Excel avec plusieurs feuilles
    const multiSheetPath = path.join(tempDir, 'multi_feuilles.xlsx');
    const wbMulti = XLSX.utils.book_new();
    const wsSheet1 = XLSX.utils.aoa_to_sheet([["Info", "Classe 6e A"]]);
    const wsSheet2 = XLSX.utils.aoa_to_sheet([
      ["Nom", "Prénom", "Genre", "Matricule"],
      ["KOFFI", "Serge", "Garçon", "M-01"],
      ["BAH", "Aïssatou", "Fille", "M-02"]
    ]);
    XLSX.utils.book_append_sheet(wbMulti, wsSheet1, "Page de Garde");
    XLSX.utils.book_append_sheet(wbMulti, wsSheet2, "Liste Élèves");
    XLSX.writeFile(wbMulti, multiSheetPath);

    const parsedMulti = await ImportEngine.readWorkbook(fs.readFileSync(multiSheetPath), 'multi_feuilles.xlsx');
    assert(parsedMulti.sheets.length === 2, "Excel multi-feuilles : 2 feuilles détectées");
    assert(parsedMulti.sheets[1].name === "Liste Élèves" && parsedMulti.sheets[1].rowCount === 3, "Feuille cible sélectionnable avec 3 lignes de données");

    // 1.9 Fichier avec colonne combinée "Nom et Prénoms"
    const singleColContent = "Nom et Prénoms;Genre;Matricule\nKOUAME Jean-Philippe;M;MAT-U1\nDIALLO Fatoumata;F;MAT-U2\n";
    const wbSingle = await ImportEngine.readWorkbook(singleColContent, 'single_col.csv');
    const colsSingle = ImportEngine.detectColumns(wbSingle.sheets[0].rows);
    assert(colsSingle.mapping.colNomComplet !== -1, "Auto-détection de la colonne combinée 'Nom et Prénoms'");
    const procSingle = ImportEngine.processRows(wbSingle.sheets[0].rows, colsSingle.headerRowIndex, colsSingle.mapping);
    assert(procSingle.validStudents[0].nom === "KOUAME" && procSingle.validStudents[0].prenom === "Jean-Philippe", "Découpage automatique 'Nom' et 'Prénoms' réussi");

    // -------------------------------------------------------------------------
    // SECTION 2 : TESTS DE VOLUMÉTRIE & ENREGISTREMENT RÉEL EN BASE
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Tests de volumétrie et intégrité de l'enregistrement en base ---");

    async function testVolume(count) {
      const rows = [["Nom", "Prénom", "Genre", "Matricule"]];
      for (let i = 1; i <= count; i++) {
        const g = i % 2 === 0 ? "Fille" : "Garçon";
        const code = String(i).padStart(4, '0');
        rows.push([`ELEVE_${count}_${code}`, `Prenom${code}`, g, `MAT-${count}-${code}`]);
      }

      // Création du classeur en mémoire
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Vol_${count}`);
      const wbBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Lecture via ImportEngine
      const parsed = await ImportEngine.readWorkbook(wbBuffer, `test_${count}.xlsx`);
      const cols = ImportEngine.detectColumns(parsed.sheets[0].rows);
      const processed = ImportEngine.processRows(parsed.sheets[0].rows, cols.headerRowIndex, cols.mapping, []);

      assert(processed.totalDataRows === count, `Volume ${count} élèves : ${count} lignes de données détectées`);
      assert(processed.validStudents.length === count, `Volume ${count} élèves : ${count} élèves valides identifiés`);

      // Enregistrement réel dans la base de données GHIM PRO
      const targetClassForVol = await db.addClass({
        nom: `Classe Vol ${count}`,
        niveau: 'Seconde',
        anneeScolaire: '2025-2026'
      });

      const batchResult = await db.addElevesBatch(processed.validStudents, targetClassForVol.id);
      assert(batchResult.totalAdded === count, `Volume ${count} élèves : exactement ${count} élèves enregistrés en base`);
      assert(batchResult.errors.length === 0, `Volume ${count} élèves : 0 erreur de traitement`);

      // Vérification que db.getEleves() renvoie fidèlement le nombre attendu
      const studentsInDb = db.getEleves(targetClassForVol.id);
      assert(studentsInDb.length === count, `Volume ${count} élèves : getEleves() renvoie bien ${count} élèves réels (aucun oublié silencieusement)`);
    }

    // Exécution des paliers de volume
    await testVolume(10);
    await testVolume(75);   // Cas expressément mentionné par l'utilisateur
    await testVolume(100);
    await testVolume(250);
    await testVolume(500);

    // -------------------------------------------------------------------------
    // SECTION 3 : TESTS DES CAS LIMITES, ERREURS ET DOUBLONS
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Tests des cas d'erreurs, lignes invalides et doublons ---");

    // 3.1 Fichier vide
    const wbEmpty = await ImportEngine.readWorkbook("", 'empty.csv');
    assert(wbEmpty.sheets[0].rowCount === 0, "Fichier vide : géré sans crash, 0 ligne");

    // 3.2 Lignes vides intercalées au milieu des données
    const csvHoles = "Nom;Prénom;Genre;Matricule\nKOUAME;Paul;Garçon;M1\n\n   \n\nTRAORE;Fatou;Fille;M2\n";
    const wbHoles = await ImportEngine.readWorkbook(csvHoles, 'trous.csv');
    const colsHoles = ImportEngine.detectColumns(wbHoles.sheets[0].rows);
    const procHoles = ImportEngine.processRows(wbHoles.sheets[0].rows, colsHoles.headerRowIndex, colsHoles.mapping);
    assert(procHoles.totalDataRows === 2 && procHoles.validStudents.length === 2, "Lignes vides au milieu ignorées sans bloquer la fin du fichier");

    // 3.3 Lignes avec champs obligatoires manquants ou genre invalide
    const csvErrors = "Nom;Prénom;Genre;Matricule\n;Paul;Garçon;E1\nKOUASSI;;Garçon;E2\nTOURE;Adama;Inconnu;E3\nVALIDE;Marc;Garçon;E4\n";
    const wbErr = await ImportEngine.readWorkbook(csvErrors, 'erreurs.csv');
    const colsErr = ImportEngine.detectColumns(wbErr.sheets[0].rows);
    const procErr = ImportEngine.processRows(wbErr.sheets[0].rows, colsErr.headerRowIndex, colsErr.mapping);
    assert(procErr.invalidRows.length === 3, "3 lignes invalides détectées et isolées");
    assert(procErr.validStudents.length === 1 && procErr.validStudents[0].nom === "VALIDE", "La ligne valide suivante est correctement traitée malgré les erreurs précédentes");

    // 3.4 Doublons intra-fichier
    const csvDupFile = "Nom;Prénom;Genre;Matricule\nKOUASSI;Jean;Garçon;D1\nKOUASSI;Jean;Garçon;D1\nKONE;Awa;Fille;D2\n";
    const wbDupFile = await ImportEngine.readWorkbook(csvDupFile, 'dup.csv');
    const colsDup = ImportEngine.detectColumns(wbDupFile.sheets[0].rows);
    const procDup = ImportEngine.processRows(wbDupFile.sheets[0].rows, colsDup.headerRowIndex, colsDup.mapping);
    assert(procDup.validStudents.length === 2, "Doublon intra-fichier : le 1er est retenu, le 2ème est isolé");
    assert(procDup.duplicateRows.length === 1, "Le doublon intra-fichier est identifié dans duplicateRows");

    // 3.5 Doublons inter-classes et ré-importation du même fichier
    const classForDupTest = await db.addClass({ nom: 'Classe Doublon Test', niveau: 'Sixième' });
    const initialBatch = await db.addElevesBatch(procDup.validStudents, classForDupTest.id);
    assert(initialBatch.totalAdded === 2, "Importation initiale réussie de 2 élèves");

    // Ré-importation du même fichier dans la même classe
    const existingInDupClass = db.getEleves(classForDupTest.id);
    const reImportProc = ImportEngine.processRows(wbDupFile.sheets[0].rows, colsDup.headerRowIndex, colsDup.mapping, existingInDupClass);
    assert(reImportProc.duplicateRows.length === 3, "Ré-importation du même fichier : tous les élèves déjà présents sont détectés comme doublons");
    assert(reImportProc.validStudents.length === 0, "0 élève valide à ré-importer (évite la duplication en base)");

    // -------------------------------------------------------------------------
    // SECTION 4 : CONSERVATION DES DONNÉES & FONCTIONNALITÉS EXISTANTES
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Intégrité des fonctionnalités existantes et sécurité professeur ---");

    const profEleves = db.getEleves();
    assert(profEleves.length > 0, "Les élèves sont bien rattachés au professeur connecté");
    const otherProfEleves = db.getEleves(null, 'autre_prof_inconnu');
    assert(otherProfEleves.length === 0, "Isolation professeur : un autre enseignant ne voit pas ces élèves");

  } finally {
    // Nettoyage des fichiers temporaires
    try {
      const files = fs.readdirSync(tempDir);
      for (const f of files) fs.unlinkSync(path.join(tempDir, f));
      fs.rmdirSync(tempDir);
    } catch (e) {}
  }

  console.log("\n===============================================================================");
  console.log(`RÉSULTAT DE LA SUITE D'IMPORTATION : ${passedTests} PASSÉS SUR ${totalTests}`);
  console.log("===============================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runImportValidationTests().catch(err => {
  console.error("Erreur critique suite de tests:", err);
  process.exit(1);
});
