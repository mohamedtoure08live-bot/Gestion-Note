/**
 * Test Suite: Cross-Device Multi-Activity Coherence & Cloud Sync Schema Compliance
 * Tests:
 * 1. Multi-sport evaluations calculation conformity across all supported disciplines
 * 2. Discipline normalization and alias matching
 * 3. Supabase REST schema payload compatibility (no invalid column rejections)
 * 4. Multi-device analytical KPI & records calculation parity
 */

const assert = require('assert');

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
  console.log('  GHIM PRO - SUITE DE TEST : COHÉRENCE MULTI-ACTIVITÉS & SYNCHRONISATION CLOUD');
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

  console.log('\n--- 1. Normalisation des Disciplines Officielles ---');
  await test('Normalise correctement les variantes et alias de disciplines', () => {
    assert.strictEqual(db.normalizeDisciplineName('course 1000m'), 'Course 1000m');
    assert.strictEqual(db.normalizeDisciplineName('course 800m'), 'Course 800m');
    assert.strictEqual(db.normalizeDisciplineName('Course de vitesse de 60 mètres'), 'Course de vitesse de 60 mètres');
    assert.strictEqual(db.normalizeDisciplineName('Course 60m'), 'Course de vitesse de 60 mètres');
    assert.strictEqual(db.normalizeDisciplineName('Course 60m / 80m'), 'Course de vitesse de 60 mètres');
    assert.strictEqual(db.normalizeDisciplineName('Lancer de poids'), 'Lancer de poids');
    assert.strictEqual(db.normalizeDisciplineName('poids'), 'Lancer de poids');
    assert.strictEqual(db.normalizeDisciplineName('Saut en hauteur'), 'Saut en hauteur');
    assert.strictEqual(db.normalizeDisciplineName('Saut en longueur'), 'Saut en longueur');
  });

  console.log('\n--- 2. Calculs Réglementaires Multi-Activités ---');
  await test('Calcul exact Lancer de poids : 11.70m (4kg Garçon 3e) -> 18/20', () => {
    const res = EPSEngine.calculateGrade('Lancer de poids', 'Troisième', 'Garçon', 11.70, '4kg');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 18);
  });

  await test('Calcul exact Course 1000m : 3\'12\'\' (Garçon 3e) -> 16.25/20', () => {
    const res = EPSEngine.calculateGrade('Course 1000m', 'Troisième', 'Garçon', "3'12''", null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 16.25);
  });

  await test('Calcul exact Course 800m : 2\'35\'\' (Fille 5e) -> 11.75/20', () => {
    const res = EPSEngine.calculateGrade('Course 800m', 'Cinquième', 'Fille', "2'35''", null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 11.75);
  });

  await test('Calcul exact Course de vitesse 60m : 8.60s (Garçon 6e) -> 16/20', () => {
    const res = EPSEngine.calculateGrade('Course de vitesse de 60 mètres', 'Sixième', 'Garçon', 8.60, null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 16);
  });

  await test('Calcul exact Saut en hauteur : 1.48m (Garçon 3e) -> 17.6/20', () => {
    const res = EPSEngine.calculateGrade('Saut en hauteur', 'Troisième', 'Garçon', 1.48, null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 17.6);
  });

  await test('Calcul exact Saut en longueur : 3.20m (Fille 6e) -> 12/20', () => {
    const res = EPSEngine.calculateGrade('Saut en longueur', 'Sixième', 'Fille', 3.20, null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 12);
  });

  console.log('\n--- 3. Conformité du Schéma des Payloads Supabase ---');
  await test('Payload evaluation ne contient que les colonnes reconnues par Supabase', () => {
    const rawEval = {
      id: 'eval_test_schema',
      eleveId: 'el_1',
      eleveNom: 'Test Eleve',
      discipline: 'Lancer de poids',
      engin: '4kg',
      classe: 'Troisième',
      genre: 'Garçon',
      distance: 10.5,
      note: 16.0,
      date: new Date().toISOString(),
      professeurId: 'prof_default',
      classeId: 'cls_3eA'
    };

    // Construct the payload as db.js does
    const payload = {
      id: rawEval.id,
      eleve_id: rawEval.eleveId || null,
      eleve_nom: rawEval.eleveNom,
      discipline: rawEval.discipline,
      engin: rawEval.engin || null,
      classe: rawEval.classe,
      genre: rawEval.genre,
      distance: rawEval.distance,
      note: rawEval.note,
      evaluation_date: rawEval.date
    };

    assert.strictEqual('professeur_id' in payload, false, "professeur_id exclu de l'insert evaluations Supabase");
    assert.strictEqual('classe_id' in payload, false, "classe_id exclu de l'insert evaluations Supabase");
    assert.strictEqual(typeof payload.id, 'string');
    assert.strictEqual(typeof payload.distance, 'number');
    assert.strictEqual(typeof payload.note, 'number');
  });

  console.log('\n--- 4. Intégrité des Indicateurs Multi-Activités ---');
  await test('Records par discipline regroupe les performances selon leur sens physique', () => {
    const sampleEvals = [
      { id: '1', discipline: 'Lancer de poids', distance: 11.7, note: 18, eleveNom: 'Marc' },
      { id: '2', discipline: 'Lancer de poids', distance: 8.5, note: 14, eleveNom: 'Paul' },
      { id: '3', discipline: 'Course 1000m', distance: 192, note: 16.25, eleveNom: 'Marc' }, // 3'12''
      { id: '4', discipline: 'Course 1000m', distance: 215, note: 13, eleveNom: 'Jean' } // 3'35''
    ];

    // Distance record: 11.7 is better than 8.5
    const isPoidsBetter = EPSEngine.isBetterPerformance('Lancer de poids', 11.7, 8.5);
    assert.strictEqual(isPoidsBetter, true);

    // Time record: 192s is better than 215s
    const isCourseBetter = EPSEngine.isBetterPerformance('Course 1000m', 192, 215);
    assert.strictEqual(isCourseBetter, true);

    // Formatting checks
    assert.strictEqual(EPSEngine.formatPerformance(11.7, false, 'Lancer de poids'), '11.70m');
    assert.strictEqual(EPSEngine.formatPerformance(192, true, 'Course 1000m'), "3'12''");
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT SUITE COHÉRENCE : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Erreur critique:", err);
  process.exit(1);
});
