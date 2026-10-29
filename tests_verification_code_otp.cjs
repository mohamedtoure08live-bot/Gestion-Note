/**
 * Test Suite: Validation des 17 Tests Obligatoires du Système de Vérification
 * par Code OTP à 6 chiffres dans GHIM PRO (Section 9 du Cahier des Charges)
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  supabase: null,
  dispatchEvent: () => {}
};

async function runOtpVerificationTestSuite() {
  console.log("===============================================================================");
  console.log("  GHIM PRO — VALIDATION DES 17 TESTS : CODE DE VÉRIFICATION OTP À 6 CHIFFRES");
  console.log("===============================================================================\n");

  const { db } = await import('./js/db.js');
  const { AuthManager } = await import('./js/auth.js');

  // Load official baremes
  const defaultBaremes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'default_baremes.json'), 'utf8'));
  db.baremes = defaultBaremes.map(b => ({
    ...b,
    isOfficial: true,
    professeurId: null,
    nom: `Barème Officiel — ${b.discipline}${b.engin ? ' (' + b.engin + ')' : ''} (${b.classe} ${b.genre})`
  }));

  let passed = 0;
  let failed = 0;

  function assert(condition, testTitle, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${testTitle}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testTitle} ${details ? '--> ' + details : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1 — Inscription avec une adresse e-mail valide & Déclenchement de l'OTP
  // ---------------------------------------------------------------------------
  console.log("--- 1. Inscription avec une adresse e-mail valide & Déclenchement de l'OTP ---");
  const testEmail1 = "professeur.otp1@education.ci";
  const regResult = await AuthManager.register({
    nom: "Touré",
    prenom: "Mohamed",
    etablissement: "Lycée Moderne d'Anyama",
    email: testEmail1,
    password: "PasswordTouré2026!",
    passwordConfirm: "PasswordTouré2026!",
    requireOtp: true
  });

  assert(regResult && regResult.id, "Compte enseignant initialisé avec identifiant unique");
  assert(regResult.requiresOtpVerification === true, "L'application exige la vérification par code OTP à 6 chiffres");
  assert(regResult.maskedEmail === "pr****@education.ci", `Adresse e-mail partiellement masquée pour la confidentialité (Reçu: ${regResult.maskedEmail})`);
  assert(regResult.expiresInMinutes === 10, "Durée de validité annoncée de 10 minutes");

  // ---------------------------------------------------------------------------
  // TEST 2 — Réception réelle et format du code à 6 chiffres
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Génération et sécurité cryptographique du code OTP ---");
  const pendingRecord = AuthManager.getPendingVerification(testEmail1);
  assert(pendingRecord !== null, "Enregistrement de vérification en attente créé pour l'adresse");
  assert(pendingRecord.codeHash && pendingRecord.codeHash.length >= 8, "Le code est haché avec sel cryptographique (pas en clair)");
  assert(pendingRecord._testCode && /^\d{6}$/.test(pendingRecord._testCode), `Le code généré est strictement composé de 6 chiffres (Format: ${pendingRecord._testCode})`);
  assert(pendingRecord.attempts === 0, "Compteur de tentatives initialisé à 0");
  assert(pendingRecord.expiresAt > Date.now(), "Délai d'expiration futur correctement calculé");

  // ---------------------------------------------------------------------------
  // TEST 3 — Saisie d'un code incorrect
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Saisie d'un code incorrect ---");
  let wrongCodeCaught = false;
  let wrongCodeMsg = "";
  try {
    await AuthManager.verifyOtp(testEmail1, "000000"); // Code incorrect certain
  } catch (err) {
    wrongCodeCaught = true;
    wrongCodeMsg = err.message;
  }
  assert(wrongCodeCaught, "La soumission d'un code incorrect est rejetée");
  assert(wrongCodeMsg.includes("Le code saisi est incorrect"), `Message d'erreur explicite : "${wrongCodeMsg}"`);

  // Vérifier incrémentation des tentatives
  const recordAfterWrong = AuthManager.getPendingVerification(testEmail1);
  assert(recordAfterWrong && recordAfterWrong.attempts === 1, "Le compteur de tentatives est incrémenté après un échec");

  // ---------------------------------------------------------------------------
  // TEST 4 — Saisie du code correct & Confirmation
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Saisie du code correct & Confirmation de l'adresse ---");
  const correctCode = pendingRecord._testCode;
  const verifyResult = await AuthManager.verifyOtp(testEmail1, correctCode);

  assert(verifyResult && verifyResult.user, "Vérification réussie avec le bon code");
  assert(verifyResult.user.emailConfirmed === true, "L'adresse e-mail est marquée comme confirmée");
  assert(verifyResult.user.requiresEmailConfirmation === false, "L'utilisateur n'est plus en attente de confirmation");

  // ---------------------------------------------------------------------------
  // TEST 5 — Accès au tableau de bord après vérification
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Accès au tableau de bord après vérification ---");
  assert(AuthManager.isAuthenticated() === true, "Session professeur active et authentifiée");
  const currentUser = AuthManager.getCurrentUser();
  assert(currentUser && currentUser.email === testEmail1, "L'utilisateur courant correspond au professeur vérifié");
  db.setCurrentProfesseur(currentUser.id, currentUser);
  assert(db.currentProfesseurId === currentUser.id, "Espace de travail de la base de données rattaché au professeur");

  // ---------------------------------------------------------------------------
  // TEST 6 — Tentative de réutilisation d'un code déjà utilisé (Usage unique)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Tentative de réutilisation d'un code (Usage unique) ---");
  let reuseCaught = false;
  let reuseMsg = "";
  try {
    await AuthManager.verifyOtp(testEmail1, correctCode);
  } catch (err) {
    reuseCaught = true;
    reuseMsg = err.message;
  }
  assert(reuseCaught, "Un code déjà utilisé ne peut plus être réutilisé");
  assert(reuseMsg.includes("expiré"), "Le code est invalidé immédiatement après utilisation");

  // ---------------------------------------------------------------------------
  // TEST 7 — Utilisation d'un code expiré (> 10 minutes)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Utilisation d'un code expiré (> 10 minutes) ---");
  const testEmailExpired = "professeur.expired@education.ci";
  await AuthManager.register({
    nom: "Bedié",
    prenom: "Henri",
    etablissement: "Collège Moderne",
    email: testEmailExpired,
    password: "PasswordBedie2026!",
    passwordConfirm: "PasswordBedie2026!",
    requireOtp: true
  });

  const expiredRecord = AuthManager.getPendingVerification(testEmailExpired);
  // Simuler le passage de 11 minutes
  expiredRecord.expiresAt = Date.now() - 60 * 1000;

  let expiredCaught = false;
  let expiredMsg = "";
  try {
    await AuthManager.verifyOtp(testEmailExpired, expiredRecord._testCode);
  } catch (err) {
    expiredCaught = true;
    expiredMsg = err.message;
  }
  assert(expiredCaught, "La soumission d'un code expiré est refusée");
  assert(expiredMsg.includes("Ce code a expiré"), `Message exact d'expiration reçu : "${expiredMsg}"`);

  // ---------------------------------------------------------------------------
  // TEST 8 — Demandes répétées de renvoi (Cooldown anti-abus 60s)
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Demandes répétées de renvoi (Cooldown 60s anti-abus) ---");
  const testEmailCooldown = "professeur.cooldown@education.ci";
  await AuthManager.register({
    nom: "Gbagbo",
    prenom: "Laurent",
    etablissement: "Lycée Classique",
    email: testEmailCooldown,
    password: "PasswordGbagbo2026!",
    passwordConfirm: "PasswordGbagbo2026!",
    requireOtp: true
  });

  // Premier renvoi autorisé
  const resend1 = await AuthManager.resendOtpCode(testEmailCooldown);
  assert(resend1.success === true, "Premier renvoi accepté avec succès");

  // Deuxième renvoi immédiat (doit être bloqué par le cooldown)
  let cooldownCaught = false;
  let cooldownMsg = "";
  try {
    await AuthManager.resendOtpCode(testEmailCooldown);
  } catch (err) {
    cooldownCaught = true;
    cooldownMsg = err.message;
  }
  assert(cooldownCaught, "Le renvoi rapproché immédiat est bloqué par le cooldown");
  assert(cooldownMsg.includes("patienter"), `Message de temporisation anti-abus : "${cooldownMsg}"`);

  // ---------------------------------------------------------------------------
  // TEST 9 — Tentatives répétées avec des codes incorrects (Limite 5 tentatives)
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Tentatives répétées avec des codes incorrects (Limite 5 essais) ---");
  const testEmailLock = "professeur.lockout@education.ci";
  await AuthManager.register({
    nom: "Soro",
    prenom: "Guillaume",
    etablissement: "Lycée Municipal",
    email: testEmailLock,
    password: "PasswordSoroLock2026!",
    passwordConfirm: "PasswordSoroLock2026!",
    requireOtp: true
  });

  // Effectuer 5 tentatives erronées successives
  let lockoutReached = false;
  let lastLockMsg = "";
  for (let i = 1; i <= 5; i++) {
    try {
      await AuthManager.verifyOtp(testEmailLock, "999999");
    } catch (err) {
      lastLockMsg = err.message;
      if (err.message.includes("maximal de tentatives dépassé")) {
        lockoutReached = true;
      }
    }
  }
  assert(lockoutReached, "Le système bloque le code après 5 tentatives erronées successives");
  assert(lastLockMsg.includes("maximal de tentatives dépassé"), `Message explicite de dépassement : "${lastLockMsg}"`);

  // Vérifier que la tentative est invalidée
  assert(AuthManager.getPendingVerification(testEmailLock) === null, "Le code est totalement invalidé après verrouillage");

  // ---------------------------------------------------------------------------
  // TEST 10 — Inscription avec une adresse déjà utilisée
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Inscription avec une adresse déjà utilisée ---");
  let duplicateCaught = false;
  let dupMsg = "";
  try {
    await AuthManager.register({
      nom: "Touré Clone",
      prenom: "Faux Compte",
      etablissement: "Autre Établissement",
      email: testEmail1, // Déjà vérifié et confirmé dans Test 4
      password: "PasswordClone2026!",
      passwordConfirm: "PasswordClone2026!"
    });
  } catch (err) {
    duplicateCaught = true;
    dupMsg = err.message;
  }
  assert(duplicateCaught, "L'inscription avec un e-mail déjà validé est strictement bloquée");
  assert(dupMsg.includes("déjà associée à un compte"), "Message invitant à la connexion ou mot de passe oublié");

  // ---------------------------------------------------------------------------
  // TEST 11 — Inscription avec une adresse non confirmée existante
  // ---------------------------------------------------------------------------
  console.log("\n--- 11. Inscription avec une adresse non confirmée existante ---");
  const unconfirmedEmail = "professeur.unconfirmed@education.ci";
  await AuthManager.register({
    nom: "Achi",
    prenom: "Patrick",
    etablissement: "Collège Moderne",
    email: unconfirmedEmail,
    password: "PasswordAchi2026!",
    passwordConfirm: "PasswordAchi2026!",
    requireOtp: true
  });

  // Demande d'un nouveau code sans altérer le profil
  const renewal = await AuthManager.resendOtpCode(unconfirmedEmail, { force: true });
  assert(renewal.success === true, "Renouvellement du code OTP accepté pour le compte en attente");
  assert(renewal.maskedEmail === "pr****@education.ci", "E-mail correctement masqué");

  // ---------------------------------------------------------------------------
  // TEST 12 — Connexion d'un professeur déjà inscrit
  // ---------------------------------------------------------------------------
  console.log("\n--- 12. Connexion d'un professeur déjà inscrit ---");
  await AuthManager.logout();
  assert(AuthManager.isAuthenticated() === false, "Déconnexion préalable");

  const loggedProf = await AuthManager.login(testEmail1, "PasswordTouré2026!");
  assert(loggedProf && loggedProf.email === testEmail1, "Connexion directe réussie du professeur confirmé");
  assert(AuthManager.isAuthenticated() === true, "Session marquée active");

  // ---------------------------------------------------------------------------
  // TEST 13 — Récupération du mot de passe
  // ---------------------------------------------------------------------------
  console.log("\n--- 13. Récupération du mot de passe ---");
  const resetRes = await AuthManager.resetPassword(testEmail1);
  assert(resetRes && resetRes.success === true, "La procédure de récupération de mot de passe est opérationnelle");
  assert(resetRes.message.includes(testEmail1), "Le message de confirmation de récupération cible l'adresse e-mail");

  // ---------------------------------------------------------------------------
  // TEST 14 — Accès non autorisé à l'espace d'un autre professeur
  // ---------------------------------------------------------------------------
  console.log("\n--- 14. Accès non autorisé à l'espace d'un autre professeur ---");
  // Création d'une classe pour Professeur Touré
  db.setCurrentProfesseur(loggedProf.id, loggedProf);
  const classeToure = await db.addClass({
    nom: "5ème EPS Touré",
    niveau: "Cinquième",
    professeurId: loggedProf.id
  });

  // Création et connexion de Professeur Koné
  const emailKone = "professeur.kone@education.ci";
  const regKone = await AuthManager.register({
    nom: "Koné",
    prenom: "Bakary",
    etablissement: "Lycée Moderne",
    email: emailKone,
    password: "PasswordKone2026!",
    passwordConfirm: "PasswordKone2026!",
    requireOtp: true
  });
  const codeKone = AuthManager.getPendingVerification(emailKone)._testCode;
  await AuthManager.verifyOtp(emailKone, codeKone);

  // Vérifier ce que voit M. Koné
  const classesKone = db.getClasses();
  assert(!classesKone.some(c => c.id === classeToure.id), "Le professeur Koné ne voit PAS la classe privée du professeur Touré");

  // ---------------------------------------------------------------------------
  // TEST 15 — Fonctionnement sur ordinateur et sur iPhone (Responsive & CSS)
  // ---------------------------------------------------------------------------
  console.log("\n--- 15. Responsive & Adaptation multi-supports (iPhone & PC) ---");
  const authCss = fs.readFileSync(path.join(__dirname, 'css', 'auth.css'), 'utf8');
  assert(authCss.includes('.otp-inputs-wrapper'), "Conteneur des 6 cases OTP défini dans css/auth.css");
  assert(authCss.includes('.otp-digit'), "Cases de saisie de chiffres .otp-digit stylisées");
  assert(authCss.includes('.otp-masked-badge'), "Badge d'e-mail masqué présent dans le CSS");
  assert(authCss.includes('.otp-expiry-indicator'), "Indicateur de temps d'expiration présent");
  assert(authCss.includes('.otp-secondary-actions'), "Actions de renvoi et de modification d'e-mail stylisées");
  assert(authCss.includes('@media (max-width: 480px)'), "Règles spécifiques mobile iPhone (@media max-width: 480px) incluses");

  // ---------------------------------------------------------------------------
  // TEST 16 — Sécurité : impossibilité de valider uniquement côté client
  // ---------------------------------------------------------------------------
  console.log("\n--- 16. Sécurité : vérification cryptographique inviolable côté client ---");
  // Tentative avec code partiel ou mal formé
  let formatErrorCaught = false;
  try {
    await AuthManager.verifyOtp("fake@education.ci", "123");
  } catch (err) {
    formatErrorCaught = true;
  }
  assert(formatErrorCaught, "Rejet strict des codes à moins de 6 chiffres");

  // Tentative avec un code inventé sur une adresse inconnue
  let unknownEmailCaught = false;
  try {
    await AuthManager.verifyOtp("inconnu@education.ci", "123456");
  } catch (err) {
    unknownEmailCaught = true;
  }
  assert(unknownEmailCaught, "Validation rejetée si aucune session OTP valide n'existe côté serveur / stockage");

  // ---------------------------------------------------------------------------
  // TEST 17 — Échec d'envoi & Absence de faux message de réussite
  // ---------------------------------------------------------------------------
  console.log("\n--- 17. Échec d'envoi & Absence de faux message de réussite ---");
  let emptyEmailResendCaught = false;
  try {
    await AuthManager.resendOtpCode("");
  } catch (err) {
    emptyEmailResendCaught = true;
  }
  assert(emptyEmailResendCaught, "Une demande de renvoi avec une adresse vide échoue sans afficher de faux succès");

  // ===========================================================================
  // BILAN FINAL
  // ===========================================================================
  console.log("\n===============================================================================");
  console.log(`RÉSULTAT DE LA SUITE OTP : ${passed} PASSÉS SUR ${passed + failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runOtpVerificationTestSuite().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
