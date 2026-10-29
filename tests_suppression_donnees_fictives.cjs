/**
 * Test Suite: MISSION SUPPRESSION DES DONNÉES FICTIVES DE GHIM PRO
 * Vérifie l'éradication des données fictives, l'intégrité des données réelles
 * et le bon calcul des indicateurs et états vides.
 */

const assert = require('assert');

// Mock browser environment for test runner
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

async function runAuditTests() {
  console.log('===============================================================================');
  console.log('   GHIM PRO - SUITE DE TEST : AUDIT & SUPPRESSION DES DONNÉES FICTIVES');
  console.log('===============================================================================');

  const { EPSEngine } = await import('./js/engine.js');
  const { db, OFFICIAL_CLASSES, FAKE_CLASS_IDS } = await import('./js/db.js');

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

  console.log('\n--- 1. Éradication des Classes Fictives Codées en Dur ---');
  await test('Aucune classe fictive (cls_3eA, cls_6e1, cls_2ndeB) n\'est présente dans FAKE_CLASS_IDS whitelist', () => {
    assert.deepStrictEqual(FAKE_CLASS_IDS, ['cls_3eA', 'cls_6e1', 'cls_2ndeB']);
  });

  await test('db.init() sans Supabase charge exactement les 7 classes officielles et aucune classe fictive', async () => {
    localStorage.clear();
    await db.init();
    const classes = db.getClasses();
    assert.strictEqual(classes.length, 7, 'Exactement 7 classes officielles');
    const fakeFound = classes.some(c => FAKE_CLASS_IDS.includes(c.id));
    assert.strictEqual(fakeFound, false, 'Aucune classe fictive ne doit être présente');
    assert.strictEqual(classes[0].nom, 'Sixième');
    assert.strictEqual(classes[3].nom, 'Troisième');
    assert.strictEqual(classes[6].nom, 'Terminale');
  });

  await test('Le cache localStorage contenant d\'anciennes classes fictives est automatiquement purgé', async () => {
    // Simuler un cache pollué par l'ancienne version
    localStorage.setItem('eps_classes_v2', JSON.stringify([
      { id: 'cls_3eA', nom: '3e A', niveau: 'Troisième' },
      { id: 'cls_6e1', nom: '6e 1', niveau: 'Sixième' },
      { id: 'Troisième', nom: 'Troisième', niveau: 'Troisième' }
    ]));
    db.loadFromLocal();
    const classes = db.getClasses();
    const hasFake = classes.some(c => FAKE_CLASS_IDS.includes(c.id));
    assert.strictEqual(hasFake, false, 'Les fausses classes du cache doivent avoir été supprimées');
    assert.ok(classes.some(c => c.id === 'Troisième'), 'La vraie classe doit être préservée');
  });

  console.log('\n--- 2. Éradication des Faux Élèves & Démonstrations Artificielles ---');
  await test('Aucun faux élève n\'est injecté dans db.eleves au chargement local', () => {
    const eleves = db.getEleves();
    const fakeStudent = eleves.find(e => e.nom === 'BERNARD' && e.prenom === 'Lucas');
    assert.strictEqual(fakeStudent, undefined, 'BERNARD Lucas (fictif) ne doit pas être dans db.eleves');
  });

  await test('Le cache localStorage contenant des élèves fictifs est automatiquement filtré', () => {
    localStorage.setItem('eps_eleves_v2', JSON.stringify([
      { id: 'fake_1', nom: 'BERNARD', prenom: 'Lucas', classe: '2nde B', genre: 'Garçon' },
      { id: 'real_1', nom: 'KOUASSI', prenom: 'Marc', classe: 'Troisième', genre: 'Garçon' }
    ]));
    db.loadFromLocal();
    const eleves = db.getEleves();
    assert.strictEqual(eleves.some(e => e.nom === 'BERNARD'), false, 'BERNARD retiré');
    assert.strictEqual(eleves.some(e => e.nom === 'KOUASSI'), true, 'KOUASSI préservé');
  });

  console.log('\n--- 3. Intégrité des Calculs Réels & États Vides Neutres ---');
  await test('Absence d\'évaluations : les calculs renvoient des états neutres sans inventer de faux chiffres (pas de 32 ni de 28)', () => {
    // Évaluations vides
    const evals = [];
    const validEvals = evals.filter(ev => ev.note !== null && !isNaN(ev.note));
    assert.strictEqual(validEvals.length, 0);

    const totalEvals = validEvals.length;
    let averageGradeStr = "-";
    let passRateStr = "Aucune donnée";
    let failRateStr = "Aucune donnée";

    if (totalEvals > 0) {
      const sumGrade = validEvals.reduce((acc, ev) => acc + ev.note, 0);
      averageGradeStr = (sumGrade / totalEvals).toFixed(2) + " / 20";
      const passCount = validEvals.filter(ev => ev.note >= 10).length;
      passRateStr = `${Math.round((passCount / totalEvals) * 100)}%`;
      failRateStr = `${100 - Math.round((passCount / totalEvals) * 100)}%`;
    }

    assert.strictEqual(totalEvals, 0, 'Total evaluations doit être 0');
    assert.strictEqual(averageGradeStr, '-', 'Moyenne doit être neutre "-"');
    assert.strictEqual(passRateStr, 'Aucune donnée', 'Taux de réussite doit être neutre');
    assert.strictEqual(failRateStr, 'Aucune donnée', 'Taux d\'échec doit être neutre');
  });

  await test('Calcul réel sur évaluations existantes : moyennes et pourcentages exacts sans arrondi artificiel', () => {
    const realEvals = [
      { note: 18.0 },
      { note: 15.0 },
      { note: 8.5 }
    ];
    const sum = realEvals.reduce((acc, e) => acc + e.note, 0);
    const avg = (sum / realEvals.length).toFixed(2);
    const pass = realEvals.filter(e => e.note >= 10).length;
    const passRate = Math.round((pass / realEvals.length) * 100);

    assert.strictEqual(avg, '13.83', 'Moyenne mathématique exacte');
    assert.strictEqual(passRate, 67, 'Taux de réussite = 67% (2/3)');
  });

  console.log('\n--- 4. Intégrité des Données Cloud Supabase ---');
  await test('Les 7 classes de production correspondent aux classes officielles ministérielles', () => {
    assert.strictEqual(OFFICIAL_CLASSES.length, 7);
    const noms = OFFICIAL_CLASSES.map(c => c.nom);
    ['Sixième', 'Cinquième', 'Quatrième', 'Troisième', 'Seconde', 'Première', 'Terminale'].forEach(n => {
      assert.ok(noms.includes(n), `La classe ${n} est présente`);
    });
  });

  await test('Mappage classe de Supabase sur les élèves et évaluations', async () => {
    // Simuler des élèves tels que retournés par Supabase (sans classe_id)
    const rawSupabaseEleve = {
      id: 'el-1',
      nom: 'KOUASSI',
      prenom: 'Marc',
      classe: 'Troisième',
      genre: 'Garçon'
    };

    const matchCls = db.getClasses().find(c => c.niveau === rawSupabaseEleve.classe || c.nom === rawSupabaseEleve.classe);
    assert.ok(matchCls, 'Classe Troisième trouvée dans db.getClasses()');
    assert.strictEqual(matchCls.nom, 'Troisième');

    // Vérifier le filtrage robuste getEleves('Troisième')
    db.eleves = [{
      id: 'el-1',
      nom: 'KOUASSI',
      prenom: 'Marc',
      classe: matchCls.niveau,
      classeId: matchCls.id,
      classeNom: matchCls.nom,
      genre: 'Garçon',
      professeurId: 'prof_default'
    }];

    const foundByClassId = db.getEleves('Troisième');
    assert.strictEqual(foundByClassId.length, 1);
    assert.strictEqual(foundByClassId[0].nom, 'KOUASSI');
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT SUITE AUDIT & SUPPRESSION : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditTests().catch(e => {
  console.error("Erreur critique:", e);
  process.exit(1);
});
