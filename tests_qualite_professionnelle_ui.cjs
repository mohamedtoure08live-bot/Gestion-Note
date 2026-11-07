/**
 * Suite de Tests : Audit & Qualité Professionnelle de l'Interface (GHIM PRO)
 * Vérifie :
 * 1. L'absence totale de mentions techniques (Supabase, PostgreSQL, Database connected, API Status, EPSEngine, IDs internes) dans l'interface utilisateur.
 * 2. Le maintien intégral des services techniques en arrière-plan (SupabaseManager, db, AuthManager, EPSEngine, ImportEngine).
 * 3. La présence des indicateurs réels et de l'état vide professionnel sur le Tableau de bord.
 * 4. La traduction des erreurs techniques en messages compréhensibles pour un enseignant d'EPS.
 * 5. La cohérence visuelle et responsive (Desktop, Tablette, iPhone).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock minimaliste du DOM et de localStorage pour les tests
global.window = {
  localStorage: {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  },
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.localStorage = global.window.localStorage;
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

async function runTests() {
  console.log('===============================================================================');
  console.log('  GHIM PRO — SUITE DE VALIDATION : QUALITÉ VISUELLE & EXPÉRIENCE PRO');
  console.log('===============================================================================\n');

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

  // 1. Audit statique de tous les fichiers de vue et index.html
  console.log('--- 1. Suppression des Mentions Techniques de l\'Interface Utilisateur ---');

  const uiFiles = [
    'index.html',
    'js/app.js',
    'js/views/landing.js',
    'js/views/dashboard.js',
    'js/views/notation.js',
    'js/views/baremes.js',
    'js/views/eleves.js',
    'js/views/historique.js',
    'js/views/auth.js'
  ];

  const forbiddenUiPatterns = [
    { label: 'Supabase connecté', regex: /Supabase\s+Connecté/i },
    { label: 'PostgreSQL dans le DOM', regex: /PostgreSQL\s+Connecté|PostgreSQL\s*&\s*Supabase|Base de données PostgreSQL connectée/i },
    { label: 'Database connected', regex: /Database\s+connected/i },
    { label: 'API Connected / API Status', regex: /API\s+Connected|API\s+Status/i },
    { label: 'Backend status / Backend connected', regex: /Backend\s+status|Backend\s+connected/i },
    { label: 'SQL Database', regex: /SQL\s+Database/i },
    { label: 'Auth provider / Supabase Auth Actif', regex: /Auth\s+provider|Supabase\s+Auth\s+Actif/i },
    { label: 'Moteur EPSEngine visible', regex: /Moteur\s+EPSEngine/i },
    { label: 'Supprimer de Supabase (Historique)', regex: /supprimer.*de\s+Supabase|supprimée\s+de\s+Supabase/i },
    { label: 'Erreur de synchronisation cloud (Dashboard)', regex: /Erreur de synchronisation cloud|synchroniseront automatiquement avec Supabase/i },
    { label: 'Affichage brut ID barème (ID: activeCustom.id)', regex: /ID:\s*\$\{activeCustom\.id\}/ },
    { label: 'Affichage brut Identifiant Professeur', regex: /Identifiant Professeur/ }
  ];

  for (const fileRel of uiFiles) {
    const content = fs.readFileSync(path.join(__dirname, fileRel), 'utf8');
    await test(`Fichier UI [${fileRel}] exempt de mentions techniques destinées aux développeurs`, () => {
      for (const pat of forbiddenUiPatterns) {
        assert.strictEqual(
          pat.regex.test(content),
          false,
          `Mention technique interdite "${pat.label}" trouvée dans ${fileRel}`
        );
      }
    });
  }

  // 2. Préservation des services techniques en arrière-plan
  console.log('\n--- 2. Préservation Intégrale du Fonctionnement Technique en Arrière-plan ---');

  const { SupabaseManager } = await import('./js/supabaseClient.js');
  const { db } = await import('./js/db.js');
  const { AuthManager } = await import('./js/auth.js');
  const { EPSEngine } = await import('./js/engine.js');
  const { ImportEngine } = await import('./js/importEngine.js');
  const { Toast } = await import('./js/components.js');

  await test('Le service SupabaseManager est intact et fonctionnel en arrière-plan', () => {
    assert.strictEqual(typeof SupabaseManager.getClient, 'function');
    assert.strictEqual(typeof SupabaseManager.checkConnection, 'function');
    assert.strictEqual(typeof SupabaseManager.onStatusChange, 'function');
  });

  await test('La couche de persistance db (PostgreSQL + cache local) et les barèmes officiels sont intacts', async () => {
    await db.init();
    const disciplines = db.getDisciplines();
    assert.ok(disciplines.length >= 10, 'Les 10 disciplines officielles sont présentes');
    const baremes = db.getBaremes();
    assert.ok(baremes.length > 0, 'Les barèmes officiels sont chargés');
  });

  await test('Le moteur de calcul EPSEngine et le moteur d\'importation ImportEngine sont intacts', () => {
    const res = EPSEngine.calculateGrade('Lancer de poids', 'Troisième', 'Garçon', 11.70, '4kg');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.note, 18);
    assert.strictEqual(typeof ImportEngine.isSupported, 'function');
  });

  // 3. Traduction des messages d'erreur techniques (Section 7)
  console.log('\n--- 3. Libellés & Messages d\'Erreur Adaptés aux Enseignants ---');

  await test('Traduction de "Fetch error" -> "Impossible de récupérer les informations. Réessayez."', () => {
    assert.strictEqual(db.formatUserError('Fetch error'), 'Impossible de récupérer les informations. Réessayez.');
    assert.strictEqual(AuthManager.formatUserError('Failed to fetch'), 'Impossible de récupérer les informations. Réessayez.');
    assert.strictEqual(Toast.formatMessage('Fetch error'), 'Impossible de récupérer les informations. Réessayez.');
  });

  await test('Traduction de "Database error" -> "Une erreur est survenue lors de l\'enregistrement."', () => {
    assert.strictEqual(db.formatUserError('Database error'), "Une erreur est survenue lors de l'enregistrement.");
    assert.strictEqual(AuthManager.formatUserError('Database error'), "Une erreur est survenue lors de l'enregistrement.");
    assert.strictEqual(Toast.formatMessage('Database error'), "Une erreur est survenue lors de l'enregistrement.");
  });

  await test('Traduction de "API request failed" -> "Le service est temporairement indisponible."', () => {
    assert.strictEqual(db.formatUserError('API request failed'), 'Le service est temporairement indisponible.');
    assert.strictEqual(AuthManager.formatUserError('API request failed'), 'Le service est temporairement indisponible.');
    assert.strictEqual(Toast.formatMessage('API request failed'), 'Le service est temporairement indisponible.');
  });

  await test('Traduction de "Loading data" -> "Chargement des informations..."', () => {
    assert.strictEqual(db.formatUserError('Loading data'), 'Chargement des informations...');
    assert.strictEqual(Toast.formatMessage('Loading data'), 'Chargement des informations...');
  });

  await test('Protection contre l\'affichage de "Null value" ou "null"', () => {
    assert.ok(!db.formatUserError('Null value in column').toLowerCase().includes('null value'));
    assert.ok(!Toast.formatMessage(null).toLowerCase().includes('null'));
  });

  // 4. Vérification du Tableau de Bord (Section 5)
  console.log('\n--- 4. Tableau de Bord Centré sur les Besoins du Professeur d\'EPS ---');

  const dashSource = fs.readFileSync(path.join(__dirname, 'js/views/dashboard.js'), 'utf8');

  await test('Le tableau de bord met en avant Mes classes, Élèves, Évaluations réalisées, Activités sportives, Dernières évaluations et Accès rapide à la notation', () => {
    assert.ok(dashSource.includes('Mes classes'), 'Indicateur "Mes classes" présent');
    assert.ok(dashSource.includes('Élèves inscrits'), 'Indicateur "Élèves inscrits" présent');
    assert.ok(dashSource.includes('Évaluations réalisées'), 'Indicateur "Évaluations réalisées" présent');
    assert.ok(dashSource.includes('Activités sportives'), 'Indicateur "Activités sportives" présent');
    assert.ok(dashSource.includes('Dernières Évaluations'), 'Section "Dernières Évaluations" présente');
    assert.ok(dashSource.includes('Accès rapide à la notation'), 'Bouton "Accès rapide à la notation" présent');
  });

  await test('État vide professionnel lorsque le professeur n\'a aucune classe : "Vous n\'avez pas encore créé de classe. Commencez par ajouter votre première classe."', () => {
    assert.ok(
      dashSource.includes("Vous n'avez pas encore créé de classe. Commencez par ajouter votre première classe"),
      'Message d\'état vide professionnel présent dans dashboard.js'
    );
  });

  // 5. Vérification Responsive Design & Cohérence Visuelle (Sections 4, 6, 8)
  console.log('\n--- 5. Responsive Design (Ordinateur, Tablette, iPhone) & Cohérence Visuelle ---');

  const mainCss = fs.readFileSync(path.join(__dirname, 'css/main.css'), 'utf8');
  const viewsCss = fs.readFileSync(path.join(__dirname, 'css/views.css'), 'utf8');
  const authCss = fs.readFileSync(path.join(__dirname, 'css/auth.css'), 'utf8');

  await test('Support des zones de sécurité iOS (safe-area-inset) et prévention du débordement horizontal', () => {
    assert.ok(mainCss.includes('overflow-x: hidden'), 'Prévention du débordement horizontal active');
    assert.ok(mainCss.includes('env(safe-area-inset-bottom'), 'Support iOS safe-area-inset-bottom actif');
  });

  await test('Points de rupture responsive présents pour Tablette (768px) et iPhone (480px / 375px)', () => {
    assert.ok(mainCss.includes('@media (max-width: 768px)'), 'Media query 768px dans main.css');
    assert.ok(mainCss.includes('@media (max-width: 375px)'), 'Media query 375px dans main.css');
    assert.ok(viewsCss.includes('@media (max-width: 768px)'), 'Media query 768px dans views.css');
    assert.ok(authCss.includes('@media (max-width: 480px)'), 'Media query 480px dans auth.css');
  });

  console.log('\n===============================================================================');
  console.log(`RÉSULTAT DE L'AUDIT UI PROFESSIONNELLE : ${passed} PASSÉS SUR ${total}`);
  console.log('===============================================================================');

  if (passed < total) {
    process.exit(1);
  }
}

runTests();

