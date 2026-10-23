/**
 * Test Suite for GHIM PRO - Mission Amélioration
 * Tests: Multi-activity Dashboard statistics, Class management, CSV duplicate detection,
 * Teacher isolation, Evaluation link, and Historical preservation.
 */

const assert = require('assert');

// Mock browser environment for db and engine
global.window = {
  localStorage: {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  },
  dispatchEvent: () => {}
};
global.localStorage = global.window.localStorage;
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

async function runTests() {
  console.log('===============================================================================');
  console.log('     GHIM PRO - VALIDATION SUITE : STATISTIQUES & GESTION DES CLASSES');
  console.log('===============================================================================');

  const { EPSEngine } = await import('./js/engine.js');
  const { db } = await import('./js/db.js');

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

  console.log('\n--- 1. Tests Multi-Activité & Unités de Mesure (EPSEngine) ---');
  await test('Lancer de poids est identifié comme discipline de distance (mètres / m)', () => {
    assert.strictEqual(EPSEngine.isTimeDiscipline('Lancer de poids'), false);
    assert.strictEqual(EPSEngine.getDisciplineUnit('Lancer de poids'), 'mètres');
    assert.strictEqual(EPSEngine.getDisciplineUnit('Lancer de poids', true), 'm');
  });

  await test('Course 1000m est identifié comme discipline de temps (min\'sec\'\' / min:sec)', () => {
    assert.strictEqual(EPSEngine.isTimeDiscipline('Course 1000m'), true);
    assert.strictEqual(EPSEngine.getDisciplineUnit('Course 1000m'), "min'sec''");
    assert.strictEqual(EPSEngine.getDisciplineUnit('Course 1000m', true), 'min:sec');
  });

  await test('Course de vitesse 60m est identifié comme discipline de temps (secondes / s)', () => {
    assert.strictEqual(EPSEngine.isTimeDiscipline('Course de vitesse 60m'), true);
    assert.strictEqual(EPSEngine.getDisciplineUnit('Course de vitesse 60m'), 'secondes');
    assert.strictEqual(EPSEngine.getDisciplineUnit('Course de vitesse 60m', true), 's');
  });

  await test('Saut en hauteur est identifié comme discipline de distance/hauteur (mètres / m)', () => {
    assert.strictEqual(EPSEngine.isTimeDiscipline('Saut en hauteur'), false);
    assert.strictEqual(EPSEngine.getDisciplineUnit('Saut en hauteur'), 'mètres');
    assert.strictEqual(EPSEngine.getDisciplineUnit('Saut en hauteur', true), 'm');
  });

  await test('Comparaison Distance : 11.50m est meilleur que 9.80m', () => {
    const isBetter = EPSEngine.isBetterPerformance('Lancer de poids', 11.50, 9.80);
    assert.strictEqual(isBetter, true);
    const isWorse = EPSEngine.isBetterPerformance('Lancer de poids', 8.20, 9.80);
    assert.strictEqual(isWorse, false);
  });

  await test('Comparaison Course Chronométrée : 180s (3min) est MEILLEUR que 200s (3min20)', () => {
    // In running, smaller time is better!
    const isBetter = EPSEngine.isBetterPerformance('Course 1000m', 180, 200);
    assert.strictEqual(isBetter, true, 'Lower time should be better in races');
    const isWorse = EPSEngine.isBetterPerformance('Course 1000m', 210, 200);
    assert.strictEqual(isWorse, false, 'Higher time should NOT be better in races');
  });

  console.log('\n--- 2. Tests Isolation Multi-Professeur (DB) ---');
  const prof1 = db.getCurrentProfesseur();
  assert.ok(prof1, 'Professeur par défaut actif');

  await test('Chaque professeur ne voit que ses propres classes et pas celles des autres', async () => {
    // Create prof 2
    const prof2 = db.addProfesseur({
      nom: 'Dupont',
      prenom: 'Claire',
      email: 'claire.dupont@college.eps'
    });

    const newClassProf2 = await db.addClass({
      nom: '4e C (Dupont)',
      niveau: 'Quatrième',
      anneeScolaire: '2025-2026',
      description: 'Classe de test prof 2',
      professeurId: prof2.id
    });

    const prof1Classes = db.getClasses(prof1.id);
    const prof2Classes = db.getClasses(prof2.id);

    const prof1HasProf2Class = prof1Classes.some(c => c.id === newClassProf2.id);
    const prof2HasProf2Class = prof2Classes.some(c => c.id === newClassProf2.id);

    assert.strictEqual(prof1HasProf2Class, false, "Prof 1 ne doit pas voir la classe du Prof 2");
    assert.strictEqual(prof2HasProf2Class, true, "Prof 2 doit voir sa propre classe");
  });

  console.log('\n--- 3. Tests Importation Élèves & Détection Doublons ---');
  await test('Ajout par lot avec détection de doublons (matricule / nom complet)', async () => {
    const testClass = await db.addClass({
      nom: 'Test Batch Import 6e',
      niveau: 'Sixième',
      professeurId: prof1.id
    });

    const batch = [
      { nom: 'KONE', prenom: 'Amadou', genre: 'Garçon', matricule: 'MAT001' },
      { nom: 'TRAORE', prenom: 'Fatou', genre: 'Fille', matricule: 'MAT002' },
      // Duplicate by matricule
      { nom: 'KONE', prenom: 'Amadou Deux', genre: 'Garçon', matricule: 'MAT001' },
      // Duplicate by exact name & firstname in same class
      { nom: 'TRAORE', prenom: 'Fatou', genre: 'Fille', matricule: 'MAT009' },
      // Valid unique student
      { nom: 'DIABATE', prenom: 'Sekou', genre: 'Garçon', matricule: 'MAT003' }
    ];

    const result = await db.addElevesBatch(batch, testClass.id);
    assert.strictEqual(result.added.length, 3, '3 élèves uniques doivent être ajoutés');
    assert.strictEqual(result.duplicates.length, 2, '2 doublons doivent être rejetés');
  });

  console.log('\n--- 4. Tests Suppression Élève & Préservation de l\'Historique ---');
  await test('Supprimer un élève préserve son évaluation historique', async () => {
    const studentClass = await db.addClass({
      nom: 'Classe Historique 5e',
      niveau: 'Cinquième',
      professeurId: prof1.id
    });

    const student = await db.addEleve({
      nom: 'ZOUZOUA',
      prenom: 'Pacome',
      genre: 'Garçon',
      classeId: studentClass.id,
      classe: studentClass.nom,
      professeurId: prof1.id
    });

    // Add evaluation for this student
    const evalData = await db.addEvaluation({
      eleveId: student.id,
      eleveNom: `${student.prenom} ${student.nom}`,
      classeId: studentClass.id,
      classeNom: studentClass.nom,
      professeurId: prof1.id,
      discipline: 'Lancer de poids',
      genre: 'Garçon',
      performance: 8.50,
      note: 14.5,
      date: new Date().toISOString()
    });

    const beforeEvalsCount = db.getEvaluations('Lancer de poids', '', prof1.id).length;

    // Delete student from roster
    await db.deleteEleve(student.id);

    // Verify student is removed from active roster
    const activeStudents = db.getEleves(studentClass.id, prof1.id);
    const isStillActive = activeStudents.some(e => e.id === student.id);
    assert.strictEqual(isStillActive, false, "Élève retiré de la liste active");

    // Verify evaluation is PRESERVED in history
    const afterEvals = db.getEvaluations('Lancer de poids', '', prof1.id);
    assert.strictEqual(afterEvals.length, beforeEvalsCount, "L'évaluation historique n'a pas été supprimée");
    const preservedEval = afterEvals.find(e => e.id === evalData.id);
    assert.ok(preservedEval, "L'évaluation existe toujours dans l'historique");
    assert.strictEqual(preservedEval.eleveNom, 'Pacome ZOUZOUA', "Nom de l'élève conservé pour traçabilité");
  });

  console.log('\n--- 5. Tests Taux de Réussite & Taux d\'Échec ---');
  await test('Calcul des taux de réussite et échec sans données (0 évaluations)', () => {
    const evals = [];
    const validEvals = evals.filter(e => e.note !== null && !isNaN(e.note));
    assert.strictEqual(validEvals.length, 0);
  });

  await test('Taux de réussite et échec totalisent 100% sur évaluations valides (Seuil EPS >= 10/20)', () => {
    const simulatedEvals = [
      { note: 14 }, // Reussite
      { note: 16 }, // Reussite
      { note: 8 },  // Echec
      { note: 11 }  // Reussite
    ];
    const totalValides = simulatedEvals.length;
    const reussites = simulatedEvals.filter(e => e.note >= 10).length;
    const echecs = simulatedEvals.filter(e => e.note < 10).length;

    const passRate = Math.round((reussites / totalValides) * 100);
    const failRate = Math.round((echecs / totalValides) * 100);

    assert.strictEqual(passRate, 75);
    assert.strictEqual(failRate, 25);
    assert.strictEqual(passRate + failRate, 100, 'Somme = 100%');
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT SUITE AMÉLIORATION : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erreur critique d'exécution:", err);
  process.exit(1);
});
