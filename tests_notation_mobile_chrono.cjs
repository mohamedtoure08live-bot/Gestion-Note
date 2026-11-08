/**
 * GHIM PRO — Suite de tests : Notation Rapide Mobile, Placeholder, Clavier iOS & Validation Chrono
 * Vérifie l'ensemble des exigences des sections 2 à 8 du cahier des charges.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  supabase: null
};

async function main() {
  console.log('===================================================================');
  console.log(' GHIM PRO — TESTS NOTATION RAPIDE MOBILE, CLAVIER & FORMATS CHRONO');
  console.log('===================================================================\n');

  const { db } = await import('./js/db.js');
  const { EPSEngine } = await import('./js/engine.js');

  const defaultBaremes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'default_baremes.json'), 'utf8'));
  db.baremes = defaultBaremes;

  const notationCode = fs.readFileSync(path.join(__dirname, 'js', 'views', 'notation.js'), 'utf8');
  const viewsCssCode = fs.readFileSync(path.join(__dirname, 'css', 'views.css'), 'utf8');

  let passed = 0;
  let failed = 0;

  function runTest(name, fn) {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   ↳ ${err.message}`);
      failed++;
    }
  }

  // 1. Valeurs obligatoires du tableau de la Section 7
  runTest('Section 7 - Format "45,32" : converti en 45.32 secondes et validé', () => {
    const val = EPSEngine.parsePerformance('45,32');
    assert.strictEqual(val, 45.32);
    const check = EPSEngine.validatePerformanceFormat('45,32', 'Course de vitesse de 60 mètres');
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.value, 45.32);
  });

  runTest('Section 7 - Format "1:25,48" : converti en 85.48 secondes (1 min 25 s 48 cent) et validé', () => {
    const val = EPSEngine.parsePerformance('1:25,48');
    assert.strictEqual(val, 85.48);
    const check = EPSEngine.validatePerformanceFormat('1:25,48', 'Course 800m');
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.value, 85.48);
  });

  runTest('Section 7 - Format "12:05,30" : converti en 725.30 secondes (12 min 05 s 30 cent) et validé', () => {
    const val = EPSEngine.parsePerformance('12:05,30');
    assert.strictEqual(val, 725.30);
    const check = EPSEngine.validatePerformanceFormat('12:05,30', 'Course 1000m');
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.value, 725.30);
  });

  runTest('Section 7 - Format "45.32" : converti en 45.32 secondes et validé', () => {
    const val = EPSEngine.parsePerformance('45.32');
    assert.strictEqual(val, 45.32);
    const check = EPSEngine.validatePerformanceFormat('45.32', 'Course de vitesse de 60 mètres');
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.value, 45.32);
  });

  runTest('Section 7 - Format invalide "1:75,30" (secondes >= 60) : strictement refusé avec message explicite', () => {
    const val = EPSEngine.parsePerformance('1:75,30');
    assert.strictEqual(Number.isNaN(val), true, '1:75,30 doit retourner NaN');
    const check = EPSEngine.validatePerformanceFormat('1:75,30', 'Course 1000m');
    assert.strictEqual(check.valid, false);
    assert.ok(check.error.includes('00 et 59'), `Message attendu sur les secondes (00 et 59), reçu: ${check.error}`);

    const gradeRes = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', '1:75,30');
    assert.strictEqual(gradeRes.formatValid, false);
    assert.strictEqual(gradeRes.note, null);
  });

  runTest('Section 7 - Format invalide "abc" : strictement refusé avec message explicite', () => {
    const val = EPSEngine.parsePerformance('abc');
    assert.strictEqual(Number.isNaN(val), true, 'abc doit retourner NaN');
    const check = EPSEngine.validatePerformanceFormat('abc', 'Course 1000m');
    assert.strictEqual(check.valid, false);
    assert.ok(check.error.length > 10);

    const gradeRes = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', 'abc');
    assert.strictEqual(gradeRes.formatValid, false);
    assert.strictEqual(gradeRes.note, null);
  });

  runTest('Section 7 - Champ vide "" : détecté comme vide avec message de validation approprié', () => {
    const val = EPSEngine.parsePerformance('');
    assert.strictEqual(Number.isNaN(val), true);
    const check = EPSEngine.validatePerformanceFormat('', 'Course 1000m');
    assert.strictEqual(check.valid, false);
    assert.strictEqual(check.isEmpty, true);
    assert.ok(check.error.includes('Veuillez saisir'));
  });

  // 2. Cohérence des calculs de notes (Section 6)
  runTest('Section 6 - Calcul de note identique entre "3:09", "3:09,00" et "3\'09\'\'" sur Course 1000m', () => {
    const r1 = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', '3:09');
    const r2 = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', '3:09,00');
    const r3 = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', "3'09''");
    assert.strictEqual(r1.valid, true);
    assert.strictEqual(r2.valid, true);
    assert.strictEqual(r3.valid, true);
    assert.strictEqual(r1.note, r2.note);
    assert.strictEqual(r2.note, r3.note);
    assert.strictEqual(r1.note, 13.5);
  });

  runTest('Section 6 - Calcul de note précis avec centièmes "3:20,50" (interpolation linéaire)', () => {
    const res = EPSEngine.calculateGrade('Course 1000m', 'Terminale', 'Garçon', '3:20,50', null, 'interpolation');
    assert.strictEqual(res.valid, true);
    assert.ok(res.note > 11 && res.note < 13.5, `Note interpolée attendue entre 11 et 13.5, obtenue: ${res.note}`);
  });

  runTest('Section 6 - Calcul de note Course de vitesse 60m avec virgule "8,20" et point "8.20"', () => {
    const rComma = EPSEngine.calculateGrade('Course de vitesse de 60 mètres', 'Sixième', 'Garçon', '8,20');
    const rDot = EPSEngine.calculateGrade('Course de vitesse de 60 mètres', 'Sixième', 'Garçon', '8.20');
    assert.strictEqual(rComma.valid, true);
    assert.strictEqual(rDot.valid, true);
    assert.strictEqual(rComma.note, rDot.note);
  });

  runTest('Section 6 - Autres disciplines (Lancer de Poids, Saut) préservées sans régression', () => {
    const rPoids = EPSEngine.calculateGrade('Lancer de Poids', 'Terminale', 'Garçon', '11,70', '5kg');
    assert.strictEqual(rPoids.valid, true);
    assert.ok(rPoids.note >= 10);
  });

  // 3. Vérification de la correction du problème de superposition du placeholder (Section 2)
  runTest('Section 2 - #unit-badge ne contient plus de texte d\'exemple superposé au champ #input-distance', () => {
    assert.ok(
      !notationCode.includes('unitBadge.textContent = isLongRun ? "min\'sec\'\' (ex:'),
      'L\'ancien texte long dans #unit-badge qui se superposait à la saisie doit être supprimé'
    );
    assert.ok(
      notationCode.includes('unitBadge.textContent = isLongRun ? "min:s" : (isTime ? "s" : "m")'),
      '#unit-badge doit afficher uniquement le symbole d\'unité court (min:s, s, m)'
    );
    assert.ok(
      notationCode.includes('id="performance-format-hint"'),
      'Les exemples de format doivent être placés dans #performance-format-hint en dessous du champ'
    );
  });

  runTest('Section 2 - CSS .distance-big-input et ::placeholder empêchent toute superposition sur mobile', () => {
    assert.ok(
      viewsCssCode.includes('.distance-big-input:not(:placeholder-shown)::placeholder'),
      'La règle CSS :not(:placeholder-shown)::placeholder doit garantir la disparition totale du placeholder dès la saisie'
    );
    assert.ok(
      viewsCssCode.includes('padding: 16px 76px') && viewsCssCode.includes('padding: 10px 64px'),
      'Le padding horizontal du champ doit réserver l\'espace du badge d\'unité pour éviter tout chevauchement'
    );
    assert.ok(
      viewsCssCode.includes('pointer-events: none'),
      '.distance-unit doit avoir pointer-events: none pour ne jamais gêner le focus ou la sélection'
    );
  });

  // 4. Vérification du clavier mobile et des touches rapides : et , (Section 3 & Section 5)
  runTest('Section 3 & 5 - Clavier mobile adapté (inputmode="text" en course, boutons rapides : et ,)', () => {
    assert.ok(
      notationCode.includes("inputDistance.setAttribute('inputmode', isTime ? 'text' : 'decimal')"),
      'inputmode doit basculer dynamiquement sur "text" pour les courses afin de permettre : et , sur iPhone'
    );
    assert.ok(
      notationCode.includes('data-insert=":"') && notationCode.includes('data-insert=","'),
      'Les boutons tactiles d\'insertion rapide ":" et "," doivent être présents pour faciliter la saisie mobile'
    );
    assert.ok(
      notationCode.includes('id="btn-clear-distance"'),
      'Un bouton d\'effacement rapide doit être disponible'
    );
  });

  console.log('\n-------------------------------------------------------------------');
  console.log(`RÉSULTAT : ${passed} test(s) réussi(s), ${failed} échec(s)`);
  console.log('-------------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
