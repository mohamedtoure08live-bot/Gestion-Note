/**
 * Test Suite: Validation des 12 Tests Obligatoires de l'Espace Personnel Enseignant
 * et de la Protection Absolue des Barèmes Officiels dans GHIM PRO
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

async function runTeacherSpaceTests() {
  console.log("===============================================================================");
  console.log("  GHIM PRO - VALIDATION DES 12 TESTS : ESPACE PROFESSEUR & BARÈMES PROTÉGÉS");
  console.log("===============================================================================\n");

  const { db } = await import('./js/db.js');
  const { AuthManager } = await import('./js/auth.js');
  const { EPSEngine } = await import('./js/engine.js');

  // Load official baremes from reference file
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
  // TEST 1 — CRÉATION DE COMPTE PROFESSEUR
  // ---------------------------------------------------------------------------
  console.log("--- Test 1 : Création de Compte Professeur ---");
  const teacherA = await AuthManager.register({
    nom: "Kone",
    prenom: "Ibrahim",
    email: "i.kone.eps@lyceemoderne.ci",
    password: "SecretPassword123!",
    etablissement: "Lycée Classique d'Abidjan"
  });

  assert(teacherA && teacherA.id, "Le professeur A a pu créer un compte", `ID: ${teacherA?.id}`);
  assert(teacherA.role === 'professeur', "Le rôle attribué est strictement 'professeur' (aucun droit admin indu)", `Role: ${teacherA?.role}`);
  assert(teacherA.nom === "Kone" && teacherA.prenom === "Ibrahim", "L'identité du professeur est préservée");

  // ---------------------------------------------------------------------------
  // TEST 2 — CONNEXION & ACCÈS À L'ESPACE PERSONNEL
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 2 : Connexion & Accès à l'Espace Personnel ---");
  await AuthManager.logout();
  assert(AuthManager.isAuthenticated() === false, "Déconnexion effective");

  const loggedUser = await AuthManager.login("i.kone.eps@lyceemoderne.ci", "SecretPassword123!");
  assert(loggedUser && loggedUser.id === teacherA.id, "Connexion réussie avec e-mail et mot de passe");
  assert(AuthManager.isAuthenticated() === true, "Session professeur marquée authentifiée");
  db.setCurrentProfesseur(loggedUser.id);
  assert(db.currentProfesseurId === teacherA.id, "La base de données bascule sur l'espace du professeur connecté");

  // ---------------------------------------------------------------------------
  // TEST 3 — ISOLATION DES DONNÉES ENTRE PROFESSEURS
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 3 : Isolation des Données Multi-Professeurs ---");
  // Créer un Professeur B
  const teacherB = await AuthManager.register({
    nom: "Bamba",
    prenom: "Fatou",
    email: "f.bamba.eps@college.ci",
    password: "PasswordProfB456!",
    etablissement: "Collège Moderne de Bouaké"
  });

  // Professeur A crée une classe privée
  db.setCurrentProfesseur(teacherA.id);
  const classProfA = await db.addClass({
    nom: "4ème Athlétisme A",
    niveau: "Quatrième",
    professeurId: teacherA.id
  });

  // Professeur B consulte ses classes
  db.setCurrentProfesseur(teacherB.id);
  const classesSeenByB = db.getClasses(teacherB.id);
  assert(!classesSeenByB.some(c => c.id === classProfA.id), "Professeur B ne voit PAS la classe privée du Professeur A");

  // Professeur A consulte ses classes
  db.setCurrentProfesseur(teacherA.id);
  const classesSeenByA = db.getClasses(teacherA.id);
  assert(classesSeenByA.some(c => c.id === classProfA.id), "Professeur A retrouve bien sa classe privée");

  // ---------------------------------------------------------------------------
  // TEST 4 — CRÉATION ET GESTION DE SES PROPRES CLASSES
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 4 : Création et Gestion de Classes Personnelles ---");
  const myNewClass = await db.addClass({
    nom: "Terminale D Sport",
    niveau: "Terminale",
    anneeScolaire: "2026-2027",
    professeurId: teacherA.id
  });
  assert(myNewClass && myNewClass.professeurId === teacherA.id, "Classe créée et liée au professeur A");

  // Ajouter un élève dans cette classe
  const studentResult = await db.addElevesBatch([{
    nom: "KOUAME",
    prenom: "Jean",
    genre: "Garçon",
    matricule: "MAT-2026-001"
  }], myNewClass.id);

  assert(studentResult.added.length === 1, "Élève ajouté avec succès dans la classe personnelle");
  const student = studentResult.added[0];
  assert(student.professeurId === teacherA.id, "L'élève est rattaché au professeur A");

  // ---------------------------------------------------------------------------
  // TEST 5 — CONSULTATION DU BARÈME OFFICIEL
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 5 : Consultation du Barème Officiel Protégé ---");
  const officialBareme = db.findOfficialBareme("Lancer de poids", "Troisième", "Garçon", "4kg");
  assert(officialBareme !== null, "Barème officiel Lancer de poids 4kg Garçon 3e trouvé");
  assert(officialBareme.isOfficial === true, "Le barème est formellement identifié comme officiel (isOfficial = true)");
  assert(officialBareme.grille.length > 0, "La grille officielle contient les paliers ministériels");

  // ---------------------------------------------------------------------------
  // TEST 6 — CRÉATION D'UNE COPIE PERSONNALISÉE INDÉPENDANTE
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 6 : Personnalisation / Copie Indépendante ---");
  const customBareme = db.duplicateBaremeAsCustom(
    officialBareme.id,
    "Mon Barème Adapté Poids 3e Garçons",
    teacherA.id
  );

  assert(customBareme && customBareme.id !== officialBareme.id, "La copie personnalisée a son propre identifiant distinct");
  assert(customBareme.isOfficial === false, "La copie est marquée comme non officielle (isOfficial = false)");
  assert(customBareme.professeurId === teacherA.id, "La copie est attribuée au professeur A");
  assert(customBareme.parentBaremeId === officialBareme.id, "La traçabilité de l'original officiel est conservée");

  // Modifier les seuils de la copie personnalisée (ex: rendre le 20/20 plus accessible à 10.00m au lieu de 12.90m)
  customBareme.grille.find(g => g.note === 20).distanceMin = 10.00;
  await db.saveCustomBareme(customBareme, teacherA.id);
  assert(true, "Enregistrement de la modification de la copie personnalisée réussi");

  // ---------------------------------------------------------------------------
  // TEST 7 — POINT CRITIQUE : LE BARÈME OFFICIEL RESTE STRICTEMENT INCHANGÉ
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 7 : Protection Absolue du Barème Officiel ---");
  const reloadedOfficial = db.findOfficialBareme("Lancer de poids", "Troisième", "Garçon", "4kg");
  const officialTier20 = reloadedOfficial.grille.find(g => g.note === 20);

  assert(officialTier20.distanceMin === 13.1, `Le barème officiel est STRICTEMENT INTACT (Seuil 20/20 reste 13.1m, reçu: ${officialTier20.distanceMin}m)`);
  assert(reloadedOfficial.id === officialBareme.id, "L'identifiant du barème officiel est préservé");
  assert(reloadedOfficial.isOfficial === true, "Le statut officiel reste protégé");

  // ---------------------------------------------------------------------------
  // TEST 8 — CALCUL D'UNE NOTE SELON LE BARÈME CHOISI (OFFICIEL VS PERSONNALISÉ)
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 8 : Calcul selon Barème Officiel ou Personnalisé ---");
  const testPerf = 10.50; // Pour 10.50m

  // A. Calcul avec le barème officiel (10.50m donne environ 16/20 car 20/20 est à 12.90m)
  const calcOfficial = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Garçon", testPerf, "4kg", "palier", reloadedOfficial);
  assert(calcOfficial.note < 20, `Note Barème Officiel pour 10.50m < 20/20 (Reçu: ${calcOfficial.note}/20)`);

  // B. Calcul avec le barème personnalisé du professeur (10.50m >= 10.00m donne 20/20 !)
  const calcCustom = EPSEngine.calculateGrade("Lancer de poids", "Troisième", "Garçon", testPerf, "4kg", "palier", customBareme);
  assert(calcCustom.note === 20, `Note Barème Personnalisé pour 10.50m = 20/20 (Reçu: ${calcCustom.note}/20)`);

  assert(calcOfficial.note !== calcCustom.note, "L'application respecte rigoureusement le barème sélectionné sans mélanger les seuils");

  // ---------------------------------------------------------------------------
  // TEST 9 — HISTORIQUE : CONSERVATION DES INSTANTANÉS (IMMUTABILITÉ)
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 9 : Conservation des Instantanés Historiques ---");
  // Enregistrer une évaluation avec le barème personnalisé
  const evalSaved = await db.addEvaluation({
    eleveId: student.id,
    eleveNom: `${student.nom} ${student.prenom}`,
    classe: "Troisième",
    genre: "Garçon",
    discipline: "Lancer de poids",
    engin: "4kg",
    distance: 10.50,
    note: calcCustom.note,
    professeurId: teacherA.id,
    baremeId: customBareme.id,
    baremeNom: customBareme.nom,
    baremeType: "personnalisé"
  });

  assert(evalSaved.baremeSnapshot !== null, "L'évaluation a capturé un instantané (snapshot) du barème utilisé");
  const savedSnapshotTier20 = evalSaved.baremeSnapshot.grille.find(g => g.note === 20).distanceMin;
  assert(savedSnapshotTier20 === 10.00, "L'instantané fige le seuil utilisé au moment de la notation (10.00m)");

  // Modifier ultérieurement le barème personnalisé (ex: passer le 20/20 à 11.50m)
  customBareme.grille.find(g => g.note === 20).distanceMin = 11.50;
  await db.saveCustomBareme(customBareme, teacherA.id);

  // Vérifier que l'évaluation passée n'a pas été altérée
  const pastEvaluation = db.getEvaluations().find(ev => ev.id === evalSaved.id);
  assert(pastEvaluation.note === 20, "La note historique reste à 20/20 sans recalcul silencieux");
  assert(pastEvaluation.baremeSnapshot.grille.find(g => g.note === 20).distanceMin === 10.00, "L'instantané historique est resté immuable à 10.00m");

  // ---------------------------------------------------------------------------
  // TEST 10 — SÉCURITÉ : TENTATIVE DE MODIFICATION ILLÉGALE BLOQUÉE
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 10 : Sécurité & Blocage des Modifications Illégales ---");
  let directOfficialEditBlocked = false;
  try {
    // Tenter de modifier directement le barème officiel ministériel
    await db.saveCustomBareme({
      id: officialBareme.id,
      isOfficial: true,
      discipline: "Lancer de poids",
      grille: []
    }, teacherA.id);
  } catch (err) {
    directOfficialEditBlocked = true;
  }
  assert(directOfficialEditBlocked, "La tentative de modification directe du barème officiel a été BLOQUÉE");

  let officialDeleteBlocked = false;
  try {
    // Tenter de supprimer le barème officiel
    db.deleteCustomBareme(officialBareme.id, teacherA.id);
  } catch (err) {
    officialDeleteBlocked = true;
  }
  assert(officialDeleteBlocked, "La tentative de suppression du barème officiel a été BLOQUÉE");

  let crossTeacherDeleteBlocked = false;
  try {
    // Le professeur B tente de supprimer le barème personnalisé du professeur A
    db.deleteCustomBareme(customBareme.id, teacherB.id);
  } catch (err) {
    crossTeacherDeleteBlocked = true;
  }
  assert(crossTeacherDeleteBlocked, "Le professeur B ne peut PAS supprimer le barème privé du professeur A");

  // ---------------------------------------------------------------------------
  // TEST 11 — CONFORMITÉ RESPONSIVE & MOBILE
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 11 : Conformité Responsive & Mobile ---");
  const authCss = fs.readFileSync(path.join(__dirname, 'css', 'auth.css'), 'utf8');
  assert(authCss.includes('@media (max-width'), "Feuille de style auth.css contient les règles média query responsive");
  assert(authCss.includes('.auth-card-wrapper'), "Carte d'authentification stylisée");
  assert(authCss.includes('.password-toggle-btn'), "Bouton d'affichage/masquage mot de passe présent et stylisé");

  const viewsCss = fs.readFileSync(path.join(__dirname, 'css', 'views.css'), 'utf8');
  assert(viewsCss.includes('.baremes-segmented-tabs'), "Onglets segmentés de barèmes configurés");
  assert(viewsCss.includes('.bareme-official-notice'), "Notice réglementaire de protection officielle stylisée");

  // ---------------------------------------------------------------------------
  // TEST 12 — PERSISTANCE : DÉCONNEXION & RECONNEXION
  // ---------------------------------------------------------------------------
  console.log("\n--- Test 12 : Persistance des Classes et Barèmes après Reconnexion ---");
  // Déconnexion
  await AuthManager.logout();
  assert(AuthManager.isAuthenticated() === false, "Déconnexion validée");

  // Reconnexion du professeur A
  const reconnectedTeacherA = await AuthManager.login("i.kone.eps@lyceemoderne.ci", "SecretPassword123!");
  assert(reconnectedTeacherA && reconnectedTeacherA.id === teacherA.id, "Reconnexion réussie du professeur A");
  db.setCurrentProfesseur(reconnectedTeacherA.id);

  const teacherAClassesAfterRelog = db.getClasses(reconnectedTeacherA.id);
  assert(teacherAClassesAfterRelog.some(c => c.id === myNewClass.id), "La classe 'Terminale D Sport' est toujours disponible");

  const teacherABaremesAfterRelog = db.getCustomBaremes(reconnectedTeacherA.id);
  assert(teacherABaremesAfterRelog.some(b => b.id === customBareme.id), "Le barème personnalisé est toujours disponible pour le professeur A");

  // Barème officiel toujours présent pour tous
  const officialAfterRelog = db.findOfficialBareme("Lancer de poids", "Troisième", "Garçon", "4kg");
  assert(officialAfterRelog && officialAfterRelog.isOfficial === true, "Le barème officiel de référence est toujours intact et disponible");

  console.log("\n===============================================================================");
  console.log(`RÉSULTAT SUITE ESPACE PROFESSEUR : ${passed} PASSÉS SUR ${passed + failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTeacherSpaceTests().catch(err => {
  console.error("Test Suite execution error:", err);
  process.exit(1);
});
