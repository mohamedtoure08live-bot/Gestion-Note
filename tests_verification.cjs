/**
 * Automated Verification Test Suite for EPS PRO
 * Tests all 6 mandatory requirements from user specification.
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node.js environment
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

async function runTests() {
  console.log("===============================================================================");
  console.log("              EPS PRO - TEST SUITE DE VALIDATION REGLEMENTAIRE");
  console.log("===============================================================================\n");

  const { db } = await import('./js/db.js');
  const { EPSEngine } = await import('./js/engine.js');

  // Load baremes from data/default_baremes.json
  const defaultBaremes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'default_baremes.json'), 'utf8'));
  db.baremes = defaultBaremes;

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '--> ' + details : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ACTIVITE INCOMPATIBLE AVEC LE SEXE ET LA CLASSE
  // ---------------------------------------------------------------------------
  console.log("--- 1. Tests Activité Incompatible ---");

  // Cas 1.1: Fille en 3e + Course 1000m
  const v1 = EPSEngine.validateInput("Course 1000m", "Troisième", "Fille", null);
  assert(!v1.valid, "Course 1000m pour Fille de 3e est refusée");
  assert(v1.errorType === 'activity_incompatible', "Type d'erreur est 'activity_incompatible'");
  assert(v1.message.includes("Erreur de saisie : cette activité n’est pas autorisée"), "Message d'erreur officiel présent");

  const calc1 = EPSEngine.calculateGrade("Course 1000m", "Troisième", "Fille", "3'45''", null);
  assert(calc1.valid === false && calc1.note === null, "Aucune note produite pour Course 1000m Fille de 3e");

  // Cas 1.2: Garçon en 3e + Course 800m
  const v2 = EPSEngine.validateInput("Course 800m", "Troisième", "Garçon", null);
  assert(!v2.valid, "Course 800m pour Garçon de 3e est refusée");
  const calc2 = EPSEngine.calculateGrade("Course 800m", "Troisième", "Garçon", "2'15''", null);
  assert(calc2.valid === false && calc2.note === null, "Aucune note produite pour Course 800m Garçon de 3e");

  // Cas 1.3: Fille en 3e + Lancer de disque (non prévu en 3e)
  const v3 = EPSEngine.validateInput("Lancer de disque", "Troisième", "Fille", "2kg");
  assert(!v3.valid, "Lancer de disque pour 3e Fille est refusé");

  // ---------------------------------------------------------------------------
  // 2. POIDS DE L'ENGIN INCOMPATIBLE
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Tests Poids de l'Engin Incompatible ---");

  // Cas 2.1: Fille en 3e + Lancer de poids avec engin de 4kg (barème prévoit 3kg uniquement)
  const v4 = EPSEngine.validateInput("Lancer de poids", "Troisième", "Fille", "4kg");
  assert(!v4.valid, "Engin 4kg refusé pour Fille de 3e au Lancer de poids");
  assert(v4.errorType === 'engin_incompatible', "Type d'erreur est 'engin_incompatible'");
  assert(v4.message === "Erreur de saisie : le poids de l’engin sélectionné ne correspond pas au barème de cette classe et de ce sexe. Pour cette catégorie, utilisez un engin de 3 kg.", "Message exact demandé par le sujet");

  const calc4 = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Fille", 7.50, "4kg");
  assert(calc4.valid === false && calc4.note === null, "Aucune note produite pour Fille de 3e avec engin de 4kg");

  // Cas 2.2: Garçon en 3e + Lancer de poids avec engin de 5kg (barème prévoit 3kg ou 4kg)
  const v5 = EPSEngine.validateInput("Lancer de poids", "Troisième", "Garçon", "5kg");
  assert(!v5.valid, "Engin 5kg refusé pour Garçon de 3e au Lancer de poids");
  assert(v5.message.includes("utilisez un engin de 3 kg ou 4 kg"), "Message liste les engins autorisés (3 kg ou 4 kg)");

  // Cas 2.3: Garçon en Seconde + Lancer de poids avec 3kg (barème Seconde prévoit 4kg ou 5kg)
  const v6 = EPSEngine.validateInput("Lancer de poids", "Seconde", "Garçon", "3kg");
  assert(!v6.valid, "Engin 3kg refusé pour Garçon de Seconde au Lancer de poids");
  assert(v6.message.includes("utilisez un engin de 4 kg ou 5 kg"), "Message liste les engins autorisés (4 kg ou 5 kg)");

  // ---------------------------------------------------------------------------
  // 3. SAISIE VALIDE (CALCUL CORRECT)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Tests Saisie Valide ---");

  // Cas 3.1: Fille en 3e + Lancer de poids avec 3kg + 7.20m -> Note = 14/20
  const v7 = EPSEngine.validateInput("Lancer de poids", "Troisième", "Fille", "3kg");
  assert(v7.valid, "Validation réussie pour Fille 3e Poids 3kg");
  const calc7 = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Fille", 7.20, "3kg");
  assert(calc7.valid && calc7.note === 14, `Note 14/20 obtenue pour 7.20m (Reçu: ${calc7.note})`);

  // Cas 3.2: Garçon en 3e + Course 1000m + 3'09'' -> Note = 17/20
  const calc8 = EPSEngine.calculateGrade("Course 1000m", "Troisième", "Garçon", "3'09''", null);
  assert(calc8.valid && calc8.note === 17, `Note 17/20 obtenue pour 1000m en 3'09'' (Reçu: ${calc8.note})`);

  // Cas 3.3: Fille en 3e + Course 800m + 2'10'' -> Note = 17/20
  const calc9 = EPSEngine.calculateGrade("Course 800m", "Troisième", "Fille", "2'10''", null);
  assert(calc9.valid && calc9.note === 17, `Note 17/20 obtenue pour 800m en 2'10'' (Reçu: ${calc9.note})`);

  // Cas 3.4: Garçon en 6e + Lancer de poids 4kg + 11.10m -> Note = 20/20
  const calc10 = EPSEngine.calculateGrade("Lancer de poids", "Sixième", "Garçon", 11.10, "4kg");
  assert(calc10.valid && calc10.note === 20, `Note 20/20 obtenue pour 11.10m 4kg (Reçu: ${calc10.note})`);

  // ---------------------------------------------------------------------------
  // 4. CORRECTION INVERSION SAUT EN LONGUEUR (1.60m et 1.70m)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Tests Saut en longueur (Inversion 1.60m et 1.70m) ---");

  // Sixième Fille
  const lg6f_160 = EPSEngine.calculateGrade("Saut en longueur", "Sixième", "Fille", 1.60, null);
  const lg6f_170 = EPSEngine.calculateGrade("Saut en longueur", "Sixième", "Fille", 1.70, null);
  const lg6f_165 = EPSEngine.calculateGrade("Saut en longueur", "Sixième", "Fille", 1.65, null);
  assert(lg6f_160.note === 6.5, `Sixième Fille 1.60m = 6.5/20 (Reçu: ${lg6f_160.note})`);
  assert(lg6f_170.note === 7.5, `Sixième Fille 1.70m = 7.5/20 (Reçu: ${lg6f_170.note})`);
  assert(lg6f_165.note === 7.0, `Sixième Fille 1.65m interpolé = 7.0/20 (Reçu: ${lg6f_165.note})`);
  assert(lg6f_170.note > lg6f_160.note, "Sixième Fille : Progression strictement croissante (1.70m > 1.60m)");

  // Cinquième Fille
  const lg5f_160 = EPSEngine.calculateGrade("Saut en longueur", "Cinquième", "Fille", 1.60, null);
  const lg5f_170 = EPSEngine.calculateGrade("Saut en longueur", "Cinquième", "Fille", 1.70, null);
  assert(lg5f_160.note === 6.0, `Cinquième Fille 1.60m = 6.0/20 (Reçu: ${lg5f_160.note})`);
  assert(lg5f_170.note === 7.0, `Cinquième Fille 1.70m = 7.0/20 (Reçu: ${lg5f_170.note})`);
  assert(lg5f_170.note > lg5f_160.note, "Cinquième Fille : Progression strictement croissante (1.70m > 1.60m)");

  // Quatrième Fille
  const lg4f_160 = EPSEngine.calculateGrade("Saut en longueur", "Quatrième", "Fille", 1.60, null);
  const lg4f_170 = EPSEngine.calculateGrade("Saut en longueur", "Quatrième", "Fille", 1.70, null);
  assert(lg4f_160.note === 5.5, `Quatrième Fille 1.60m = 5.5/20 (Reçu: ${lg4f_160.note})`);
  assert(lg4f_170.note === 6.5, `Quatrième Fille 1.70m = 6.5/20 (Reçu: ${lg4f_170.note})`);
  assert(lg4f_170.note > lg4f_160.note, "Quatrième Fille : Progression strictement croissante (1.70m > 1.60m)");

  // Troisième Fille
  const lg3f_160 = EPSEngine.calculateGrade("Saut en longueur", "Troisième", "Fille", 1.60, null);
  const lg3f_170 = EPSEngine.calculateGrade("Saut en longueur", "Troisième", "Fille", 1.70, null);
  assert(lg3f_160.note === 5.0, `Troisième Fille 1.60m = 5.0/20 (Reçu: ${lg3f_160.note})`);
  assert(lg3f_170.note === 6.0, `Troisième Fille 1.70m = 6.0/20 (Reçu: ${lg3f_170.note})`);
  assert(lg3f_170.note > lg3f_160.note, "Troisième Fille : Progression strictement croissante (1.70m > 1.60m)");

  // Sixième Garçon (vérification préservation ordre croissant)
  const lg6g_160 = EPSEngine.calculateGrade("Saut en longueur", "Sixième", "Garçon", 1.60, null);
  const lg6g_170 = EPSEngine.calculateGrade("Saut en longueur", "Sixième", "Garçon", 1.70, null);
  assert(lg6g_160.note === 3.0, `Sixième Garçon 1.60m = 3.0/20 (Reçu: ${lg6g_160.note})`);
  assert(lg6g_170.note === 4.0, `Sixième Garçon 1.70m = 4.0/20 (Reçu: ${lg6g_170.note})`);
  assert(lg6g_170.note > lg6g_160.note, "Sixième Garçon : Ordre croissant maintenu (3.0 < 4.0)");

  // ---------------------------------------------------------------------------
  // 5. PROTECTION DES AUTRES BAREMES ET CLASSES LYCEE
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Protection des Autres Barèmes & Lycée ---");

  // Saut en longueur Lycée (Seconde, Première, Terminale) strictement inchangés
  const lg2nde_g = EPSEngine.calculateGrade("Saut en longueur", "Seconde", "Garçon", 6.20, null);
  assert(lg2nde_g.note === 20, "Saut en longueur Seconde Garçon 6.20m = 20/20 préservé");

  const lg2nde_f = EPSEngine.calculateGrade("Saut en longueur", "Seconde", "Fille", 4.90, null);
  assert(lg2nde_f.note === 20, "Saut en longueur Seconde Fille 4.90m = 20/20 préservé");

  const lg1ere_g = EPSEngine.calculateGrade("Saut en longueur", "Première", "Garçon", 6.40, null);
  assert(lg1ere_g.note === 20, "Saut en longueur Première Garçon 6.40m = 20/20 préservé");

  const lgTerm_f = EPSEngine.calculateGrade("Saut en longueur", "Terminale", "Fille", 5.20, null);
  assert(lgTerm_f.note === 20, "Saut en longueur Terminale Fille 5.20m = 20/20 préservé");

  // Autres disciplines de saut (Hauteur & Triple saut) strictement inchangées
  const ht6g = EPSEngine.calculateGrade("Saut en hauteur", "Sixième", "Garçon", 1.45, null);
  assert(ht6g.note === 20, "Saut en hauteur 6e Garçon 1.45m = 20/20 préservé");

  const ts6f = EPSEngine.calculateGrade("Triple saut", "Sixième", "Fille", 8.50, null);
  assert(ts6f.note === 20, "Triple saut 6e Fille 8.50m = 20/20 préservé");

  // ---------------------------------------------------------------------------
  // 6. ABSENCE DE REGRESSION (DONNEES & CRUD)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Tests Absence de Régression ---");
  const disc = db.getDisciplines();
  assert(disc.length > 0, `Liste des disciplines non vide (${disc.length} trouvées)`);
  assert(disc.some(d => d.nom === "Lancer de poids"), "Discipline 'Lancer de poids' présente");
  assert(disc.some(d => d.nom === "Saut en longueur"), "Discipline 'Saut en longueur' présente");

  console.log("\n===============================================================================");
  console.log(`RÉSULTAT FINAL: ${passed} PASSÉS, ${failed} ÉCHOUÉS`);
  console.log("===============================================================================");
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
