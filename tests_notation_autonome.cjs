/**
 * Test Suite: Notation Autonome & Calcul Direct sans liste de classe
 * GHIM PRO - EPS Evaluation System
 */

const assert = require('assert');

// Mock browser environment for Node execution
const mockStore = {};
global.localStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => {}
};

async function runTests() {
  console.log("===============================================================================");
  console.log("  GHIM PRO - VALIDATION : CALCUL DIRECT & NOTATION AUTONOME");
  console.log("===============================================================================");

  const { EPSEngine } = await import('./js/engine.js');
  const { db } = await import('./js/db.js');

  await db.init();

  let passed = 0;
  function it(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(e);
      process.exit(1);
    }
  }

  // 1. Constantes et normalisation des niveaux officiels
  it("EPSEngine.OFFICIAL_LEVELS est défini et complet", () => {
    assert(Array.isArray(EPSEngine.OFFICIAL_LEVELS), "Doit être un tableau");
    assert.strictEqual(EPSEngine.OFFICIAL_LEVELS.length, 7, "Doit comporter 7 niveaux officiels");
    assert(EPSEngine.OFFICIAL_LEVELS.includes("Sixième"));
    assert(EPSEngine.OFFICIAL_LEVELS.includes("Troisième"));
    assert(EPSEngine.OFFICIAL_LEVELS.includes("Terminale"));
  });

  it("EPSEngine.normalizeNiveau résout correctement tout nom ou variante", () => {
    assert.strictEqual(EPSEngine.normalizeNiveau("Troisième"), "Troisième");
    assert.strictEqual(EPSEngine.normalizeNiveau("3e A"), "Troisième");
    assert.strictEqual(EPSEngine.normalizeNiveau("6e 1"), "Sixième");
    assert.strictEqual(EPSEngine.normalizeNiveau("Seconde"), "Seconde");
    assert.strictEqual(EPSEngine.normalizeNiveau("Terminale"), "Terminale");
    assert.strictEqual(EPSEngine.normalizeNiveau(null), "Troisième");
  });

  // 2. Calcul direct sans élève spécifié
  it("Calcul direct Lancer de poids pour classe standard Troisième Fille 3kg (7.20m -> 14/20)", () => {
    const res = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Fille", "7.20", "3kg", "interpolation");
    assert(res.valid, "Le calcul doit être valide");
    assert.strictEqual(res.note, 14, "La note doit être de 14/20");
    assert.strictEqual(res.appreciation, "Bien");
  });

  it("Calcul direct Lancer de poids pour classe standard Troisième Garçon 4kg (11.70m -> 18/20)", () => {
    const res = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Garçon", "11.70", "4kg", "interpolation");
    assert(res.valid);
    assert.strictEqual(res.note, 18);
    assert.strictEqual(res.appreciation, "Excellent");
  });

  it("Calcul direct Course 1000m pour classe standard Troisième Garçon (3'09'' -> 17/20)", () => {
    const res = EPSEngine.calculateGrade("Course 1000m", "Troisième", "Garçon", "3'09''", null, "interpolation");
    assert(res.valid);
    assert.strictEqual(res.note, 17);
  });

  it("Calcul direct Course de vitesse 60m pour Sixième Garçon (8.60s -> 16/20)", () => {
    const res = EPSEngine.calculateGrade("Course de vitesse de 60 mètres", "Sixième", "Garçon", "8.60", null, "interpolation");
    assert(res.valid);
    assert.strictEqual(res.note, 16);
  });

  // 3. Enregistrement autonome dans la DB sans élève lié
  it("Enregistrement d'une évaluation autonome sans élève lié (Calcul direct)", async () => {
    const evalData = {
      eleveId: null,
      eleveNom: "Élève (Garçon - Troisième)",
      classeId: null,
      classeNom: "Troisième",
      classe: "Troisième",
      genre: "Garçon",
      discipline: "Lancer de poids",
      engin: "4kg",
      distance: 11.70,
      note: 18,
      noteExacte: 18,
      notePalier: 18,
      professeurId: "prof_default"
    };

    const saved = await db.addEvaluation(evalData);
    assert(saved.id, "Doit avoir un ID généré");
    assert.strictEqual(saved.eleveId, null, "L'id de l'élève est null en mode autonome");
    assert.strictEqual(saved.eleveNom, "Élève (Garçon - Troisième)");

    // Vérification que l'évaluation apparaît bien dans les filtres
    const evals = db.getEvaluations("Lancer de poids", "Troisième");
    assert(evals.some(e => e.id === saved.id), "L'évaluation doit être présente dans les évaluations de 3e");
  });

  console.log("\n===============================================================================");
  console.log(`RÉSULTAT SUITE NOTATION AUTONOME : ${passed} PASSÉS SUR 7`);
  console.log("===============================================================================\n");
}

runTests();
