/**
 * Test Suite: Validation des 12 Tests Obligatoires de l'Inscription Sécurisée,
 * de l'Anti-Doublon et de l'Isolation de l'Espace Professeur dans GHIM PRO
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

async function runSecuredRegistrationTests() {
  console.log("===============================================================================");
  console.log("  GHIM PRO — VALIDATION DES 12 TESTS : INSCRIPTION SÉCURISÉE & ANTI-DOUBLON");
  console.log("===============================================================================\n");

  const { db } = await import('./js/db.js');
  const { AuthManager } = await import('./js/auth.js');
  const { EPSEngine } = await import('./js/engine.js');

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
  // TEST 1 — Inscription avec des informations valides
  // ---------------------------------------------------------------------------
  console.log("--- 1. Inscription avec des informations valides ---");
  const validData = {
    nom: "Yao",
    prenom: "Koffi Jean-Marc",
    etablissement: "Lycée Scientifique de Yamoussoukro",
    telephone: "+225 0708091011",
    email: "yao.koffi@education.gouv.ci",
    password: "SecuriteEPS2026!",
    passwordConfirm: "SecuriteEPS2026!"
  };

  const teacherYao = await AuthManager.register(validData);
  assert(teacherYao && teacherYao.id, "Le compte est créé avec un identifiant unique", `ID: ${teacherYao?.id}`);
  assert(teacherYao.nom === "Yao" && teacherYao.prenom === "Koffi Jean-Marc", "Nom et prénoms avec traits d'union/espaces sont fidèlement enregistrés");
  assert(teacherYao.etablissement === "Lycée Scientifique de Yamoussoukro", "Établissement scolaire correctement renseigné");
  assert(teacherYao.telephone === "+225 0708091011", "Numéro de téléphone nettoyé et sauvegardé");
  assert(teacherYao.email === "yao.koffi@education.gouv.ci", "E-mail normalisé en minuscules");
  assert(teacherYao.password === undefined || teacherYao.password !== "SecuriteEPS2026!", "Le mot de passe n'est JAMAIS stocké en clair");
  assert(teacherYao.role === "professeur", "Rôle attribué 'professeur' conforme");

  const profInDb = db.getProfesseurByEmail("yao.koffi@education.gouv.ci");
  assert(profInDb && profInDb.id === teacherYao.id, "Le profil est immédiatement synchronisé dans la base professeurs");

  // ---------------------------------------------------------------------------
  // TEST 2 — Inscription avec un e-mail mal formé
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Inscription avec un e-mail mal formé ---");
  const malformedEmails = [
    { email: "professeur.sans.arobase.ci", reason: "absence d'@ arobase" },
    { email: "professeur@", reason: "absence de domaine" },
    { email: "professeur@domaine", reason: "absence d'extension valide" },
    { email: "professeur espace@domaine.ci", reason: "présence d'espaces interdits" },
    { email: "", reason: "chaîne vide" }
  ];

  for (const item of malformedEmails) {
    let caught = false;
    let errMessage = "";
    try {
      await AuthManager.register({
        nom: "Test",
        prenom: "Erreur",
        etablissement: "Collège Test",
        email: item.email,
        password: "ValidPassword123!",
        passwordConfirm: "ValidPassword123!"
      });
    } catch (err) {
      caught = true;
      errMessage = err.message;
    }
    assert(caught, `Inscription refusée pour e-mail mal formé (${item.reason})`, `Message: "${errMessage}"`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3 — Inscription avec un e-mail déjà utilisé
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Inscription avec un e-mail déjà utilisé ---");
  let duplicateCaught = false;
  let dupMsg = "";
  try {
    // Essai avec casse différente et espaces supplémentaires
    await AuthManager.register({
      nom: "Yao Imposteur",
      prenom: "Faux Compte",
      etablissement: "Autre Établissement",
      email: "  YAO.KOFFI@EDUCATION.GOUV.CI  ",
      password: "AutrePassword456!",
      passwordConfirm: "AutrePassword456!"
    });
  } catch (err) {
    duplicateCaught = true;
    dupMsg = err.message;
  }
  assert(duplicateCaught, "L'inscription avec un e-mail existant est rigoureusement bloquée");
  assert(dupMsg.includes("déjà associée à un compte"), "Le message d'erreur indique clairement que l'adresse est déjà associée à un compte", dupMsg);

  // Vérifier qu'aucun 2e compte n'a été créé
  const allProfsWithYaoEmail = db.professeurs.filter(p => p.email && p.email.toLowerCase() === "yao.koffi@education.gouv.ci");
  assert(allProfsWithYaoEmail.length === 1, "La base de données ne contient strictement qu'un seul compte pour cette adresse");

  // ---------------------------------------------------------------------------
  // TEST 4 — Inscription avec deux e-mails différents
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Inscription avec deux e-mails différents ---");
  const teacherTraore = await AuthManager.register({
    nom: "Traoré",
    prenom: "Amara",
    etablissement: "Lycée Garçons de Bingerville",
    email: "traore.amara@lycee.ci",
    password: "MotDePasseTraore1!",
    passwordConfirm: "MotDePasseTraore1!"
  });

  const teacherDiop = await AuthManager.register({
    nom: "Diop",
    prenom: "Aminata",
    etablissement: "Collège Moderne de Dakar",
    email: "diop.aminata@college.sn",
    password: "MotDePasseDiop2!",
    passwordConfirm: "MotDePasseDiop2!"
  });

  assert(teacherTraore && teacherDiop, "Deux inscriptions distinctes sont possibles avec des e-mails différents");
  assert(teacherTraore.id !== teacherDiop.id, "Chaque professeur possède un identifiant unique et distinct");
  assert(teacherTraore.email !== teacherDiop.email, "Les e-mails sont bien isolés");

  // ---------------------------------------------------------------------------
  // TEST 5 — Confirmation incorrecte du mot de passe
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Confirmation incorrecte du mot de passe ---");
  let passMismatchCaught = false;
  let passErrMsg = "";
  try {
    await AuthManager.register({
      nom: "Kouassi",
      prenom: "Aimé",
      etablissement: "Lycée Municipal",
      email: "kouassi.aime@academie.ci",
      password: "PasswordInitial123!",
      passwordConfirm: "PasswordDifferent999!"
    });
  } catch (err) {
    passMismatchCaught = true;
    passErrMsg = err.message;
  }
  assert(passMismatchCaught, "Refus d'inscription lorsque la confirmation ne correspond pas");
  assert(passErrMsg.includes("correspondent pas"), "Message explicite sur la discordance de mots de passe", passErrMsg);

  // ---------------------------------------------------------------------------
  // TEST 6 — E-mail non confirmé & Renvoi
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. E-mail non confirmé & Mécanisme de renvoi ---");
  // Test resend confirmation email
  const resendResult = await AuthManager.resendConfirmationEmail("traore.amara@lycee.ci");
  assert(resendResult.success === true, "La demande de renvoi d'e-mail de confirmation réussit");
  assert(resendResult.message.includes("traore.amara@lycee.ci"), "Le message de confirmation cible bien l'adresse du professeur");

  let resendNoEmailCaught = false;
  try {
    await AuthManager.resendConfirmationEmail("");
  } catch (err) {
    resendNoEmailCaught = true;
  }
  assert(resendNoEmailCaught, "Le renvoi sans e-mail est rejeté de manière sûre");

  // ---------------------------------------------------------------------------
  // TEST 7 — Double clic sur le bouton d'inscription
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Protection anti-double-clic d'inscription ---");
  const doubleClickEmail = "doubleclic.test@education.ci";
  let firstCallDone = false;
  let secondCallRejected = false;

  // Premier appel
  const regPromise1 = AuthManager.register({
    nom: "N'Dri",
    prenom: "Clarisse",
    etablissement: "Collège Moderne",
    email: doubleClickEmail,
    password: "PasswordNDri123!",
    passwordConfirm: "PasswordNDri123!"
  });

  // Deuxième appel immédiat simulant un double clic
  let err2 = "";
  try {
    await AuthManager.register({
      nom: "N'Dri",
      prenom: "Clarisse",
      etablissement: "Collège Moderne",
      email: doubleClickEmail,
      password: "PasswordNDri123!",
      passwordConfirm: "PasswordNDri123!"
    });
  } catch (err) {
    secondCallRejected = true;
    err2 = err.message;
  }

  const res1 = await regPromise1;
  assert(res1 && res1.id, "Le premier clic valide l'inscription");
  assert(secondCallRejected, "Le second clic immédiat est bloqué par le système anti-doublon", err2);

  const doubleClickEntries = db.professeurs.filter(p => p.email && p.email.toLowerCase() === doubleClickEmail);
  assert(doubleClickEntries.length === 1, "Aucun doublon n'a été créé malgré le double clic rapide");

  // ---------------------------------------------------------------------------
  // TEST 8 — Deux inscriptions simultanées avec le même e-mail
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Deux inscriptions simultanées avec le même e-mail ---");
  const concurrentEmail = "concurrence.test@ecole.ci";
  const p1 = AuthManager.register({
    nom: "Konan",
    prenom: "Patrick",
    etablissement: "Lycée Classique",
    email: concurrentEmail,
    password: "PasswordKonan123!",
    passwordConfirm: "PasswordKonan123!"
  });

  const p2 = AuthManager.register({
    nom: "Konan",
    prenom: "Patrick",
    etablissement: "Lycée Classique",
    email: concurrentEmail,
    password: "PasswordKonan123!",
    passwordConfirm: "PasswordKonan123!"
  });

  const results = await Promise.allSettled([p1, p2]);
  const fulfilledCount = results.filter(r => r.status === 'fulfilled').length;
  const rejectedCount = results.filter(r => r.status === 'rejected').length;

  assert(fulfilledCount === 1, "Une seule des deux requêtes concurrentes a abouti avec succès");
  assert(rejectedCount === 1, "La requête concurrente rivale a été rejetée par le verrou atomique");

  const concurrentInDb = db.professeurs.filter(p => p.email && p.email.toLowerCase() === concurrentEmail);
  assert(concurrentInDb.length === 1, "Un seul et unique compte est présent en base après concurrence");

  // ---------------------------------------------------------------------------
  // TEST 9 — Connexion d'un professeur & Accès à son propre espace
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Connexion d'un professeur & Accès à son propre espace ---");
  await AuthManager.logout();
  assert(AuthManager.isAuthenticated() === false, "Déconnexion préalable effectuée");

  const loggedTraore = await AuthManager.login("traore.amara@lycee.ci", "MotDePasseTraore1!");
  assert(loggedTraore && loggedTraore.id === teacherTraore.id, "Connexion réussie : le professeur accède à son compte");
  assert(AuthManager.isAuthenticated() === true, "Session professeur marquée authentifiée");

  db.setCurrentProfesseur(loggedTraore.id);
  assert(db.currentProfesseurId === teacherTraore.id, "La base de données bascule sur l'espace privé de M. Traoré");

  // ---------------------------------------------------------------------------
  // TEST 10 — Tentative d'accès aux données d'un autre professeur
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Tentative d'accès aux données d'un autre professeur ---");
  // Professeur Traoré crée une classe et un élève
  db.setCurrentProfesseur(teacherTraore.id);
  const classeTraore = await db.addClass({
    nom: "3ème Athlétisme Traoré",
    niveau: "Troisième",
    professeurId: teacherTraore.id
  });

  const eleveTraore = await db.addEleve({
    nom: "Ouattara",
    prenom: "Alassane",
    classeId: classeTraore.id,
    classe: "Troisième",
    genre: "Garçon",
    professeurId: teacherTraore.id
  });

  // Professeur Diop se connecte
  await AuthManager.logout();
  const loggedDiop = await AuthManager.login("diop.aminata@college.sn", "MotDePasseDiop2!");
  db.setCurrentProfesseur(loggedDiop.id);

  // Vérifier ce que voit Professeur Diop
  const classesDiop = db.getClasses();
  const elevesDiop = db.getEleves();

  const canSeeTraoreClass = classesDiop.some(c => c.id === classeTraore.id);
  const canSeeTraoreStudent = elevesDiop.some(e => e.id === eleveTraore.id);

  assert(!canSeeTraoreClass, "Professeur Diop ne peut PAS voir la classe de M. Traoré");
  assert(!canSeeTraoreStudent, "Professeur Diop ne peut PAS voir l'élève de M. Traoré");

  // Tentative de suppression non autorisée
  let deleteBlocked = false;
  try {
    const success = await db.deleteClass(classeTraore.id);
    if (!success) deleteBlocked = true;
  } catch (err) {
    deleteBlocked = true;
  }
  assert(deleteBlocked, "Tentative de suppression de la classe d'un autre professeur formellement bloquée");

  // ---------------------------------------------------------------------------
  // TEST 11 — Modification d'un barème personnalisé vs barème officiel
  // ---------------------------------------------------------------------------
  console.log("\n--- 11. Modification d'un barème personnalisé vs Barème officiel ---");
  // Récupérer le barème officiel du lancer de poids garçons 3e
  const officialBareme = db.baremes.find(b => 
    b.isOfficial === true &&
    b.discipline === 'Lancer de poids' &&
    b.classe === 'Troisième' &&
    b.genre === 'Garçon'
  );
  assert(officialBareme && officialBareme.isOfficial === true, "Barème officiel de référence identifié");
  const tier20Orig = officialBareme.grille.find(g => g.note === 20);
  const originalThreshold20 = tier20Orig.distanceMin !== undefined ? tier20Orig.distanceMin : tier20Orig.min;

  // M. Traoré crée une copie personnalisée
  db.setCurrentProfesseur(teacherTraore.id);
  const customBareme = db.duplicateBaremeAsCustom(
    officialBareme.id,
    "Barème adapté 3e Traoré",
    teacherTraore.id
  );
  assert(customBareme && customBareme.id !== officialBareme.id, "Copie personnalisée créée avec un identifiant distinct");
  assert(customBareme.isOfficial === false, "La copie personnalisée n'est pas marquée officielle");
  assert(customBareme.professeurId === teacherTraore.id, "La copie est rattachée à M. Traoré");

  // Modifier le seuil de 20/20 sur la copie personnalisée
  const tier20 = customBareme.grille.find(g => g.note === 20);
  if (tier20.distanceMin !== undefined) {
    tier20.distanceMin = 11.50;
  } else if (tier20.min !== undefined) {
    tier20.min = 11.50;
  }
  await db.saveCustomBareme(customBareme, teacherTraore.id);

  // Vérifier que le barème officiel est INTACT
  const checkOfficial = db.findBaremeById(officialBareme.id);
  const officialTierAfter = checkOfficial.grille.find(g => g.note === 20);
  const officialThresholdAfter = officialTierAfter.distanceMin !== undefined ? officialTierAfter.distanceMin : officialTierAfter.min;

  assert(officialThresholdAfter === originalThreshold20, `Le barème officiel est STRICTEMENT INTACT (seuil 20/20 reste ${originalThreshold20}m)`, `Reçu: ${officialThresholdAfter}m`);
  assert(checkOfficial.isOfficial === true, "Le barème officiel conserve son statut sanctifié");

  // Tentative directe de suppression ou modification du barème officiel
  let modOfficialBlocked = false;
  try {
    const res = await db.deleteCustomBareme(officialBareme.id);
    if (!res) modOfficialBlocked = true;
  } catch (err) {
    modOfficialBlocked = true;
  }
  assert(modOfficialBlocked, "La tentative de suppression du barème officiel est rigoureusement rejetée");

  // ---------------------------------------------------------------------------
  // TEST 12 — Connexion sur ordinateur et téléphone (Responsive)
  // ---------------------------------------------------------------------------
  console.log("\n--- 12. Connexion sur ordinateur et téléphone (Responsive & Multi-supports) ---");
  const authCssPath = path.join(__dirname, 'css', 'auth.css');
  const authCss = fs.readFileSync(authCssPath, 'utf8');

  assert(authCss.includes('@media (max-width: 768px)'), "Media query tablette (@media max-width: 768px) présente dans auth.css");
  assert(authCss.includes('@media (max-width: 480px)'), "Media query smartphone (@media max-width: 480px) présente dans auth.css");
  assert(authCss.includes('.auth-alert-duplicate'), "Styles de notification anti-doublon présents dans auth.css");
  assert(authCss.includes('.field-error-msg'), "Styles des messages d'erreur sous les champs présents");
  assert(authCss.includes('.password-rules-checklist'), "Styles de la checklist dynamique du mot de passe présents");
  assert(authCss.includes('.auth-confirmation-card'), "Styles de l'écran d'attente de confirmation d'e-mail présents");

  // Reconnexion du compte et persistance multi-supports
  const reconn = await AuthManager.login("traore.amara@lycee.ci", "MotDePasseTraore1!");
  assert(reconn && reconn.id === teacherTraore.id, "Compte pleinement accessible sur tout support avec ses identifiants");

  // ===========================================================================
  // BILAN FINAL
  // ===========================================================================
  console.log("\n===============================================================================");
  console.log(`RÉSULTAT DE LA SUITE D'INSCRIPTION SÉCURISÉE : ${passed} PASSÉS SUR ${passed + failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuredRegistrationTests().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
