# 🏃‍♂️ GHIM PRO - Gestion & Notation EPS (Athlétisme & Natation de la 6e à la Terminale)

Application SaaS moderne, intuitive et responsive conçue pour les professeurs d'Éducation Physique et Sportive (EPS) afin d'automatiser, fiabiliser et faciliter la notation des élèves selon les **barèmes officiels ministériels**.

---

## 🎯 Fonctionnalités Clés

- **⚡ Calcul Autonome & Notation Rapide Directe :**
  - **Calcul immédiat sans prérequis :** Le professeur peut calculer instantanément une note sur 20 sans avoir besoin de créer au préalable une classe ou d'importer une liste d'élèves.
  - Sélection de la discipline (*Lancer de poids, Saut en longueur, Saut en hauteur, Course de vitesse 60m, Course 800m, Course 1000m, etc.*), de la classe standard (*Sixième, Cinquième, Quatrième, Troisième, Seconde, Première, Terminale*) et du genre (*Garçon / Fille*).
  - **🛡️ Contrôle d'incompatibilité de l'activité :** vérification dynamique que l'épreuve choisie est autorisée pour le sexe et la classe selon le barème officiel (ex. le 1000m est réservé aux garçons, les filles effectuant le 800m).
  - **⚖️ Contrôle réglementaire du poids de l'engin :** vérification stricte du poids d'engin (ex. 3 kg, 4 kg, 5 kg au lancer de poids). Si un engin non réglementaire est sélectionné, l'application bloque le calcul et indique l'engin officiel requis.
  - **📏 Calcul en temps réel de la note sur 20 :** support de l'**Interpolation Linéaire Exacte** (proportionnelle au centième) et du **Palier Strict** (note inférieure).
  - Enregistrement immédiat dans l'historique d'évaluation (avec ou sans élève attribué) et synchronisation cloud temps réel.

- **🌐 Landing Page Premium Sport-Tech :**
  - Vitrine SaaS moderne avec navigation fluide, proposition de valeur, démonstration interactive, calculateur en direct, grille de fonctionnalités, statistiques et FAQ.

- **📊 Tableau de Bord Analytique Multi-Activités :**
  - Statistiques consolidées et filtrables par discipline ou classe : effectif, évaluations enregistrées, moyenne générale, taux de réussite (≥10/20) et taux d'échec (<10/20).
  - **Records par activité sportive :** affichage différencié selon les unités physiques réelles (mètres pour les lancers et sauts, secondes pour la vitesse, minutes'secondes'' pour la demi-fond).

- **👥 Gestion « Mes Classes » & Importation d'Élèves :**
  - Espace dédié à chaque enseignant pour créer ses classes (`3e A`, `6e 1`, `2nde B`, etc.).
  - Importation par lot de listes d'élèves (format CSV ou saisie manuelle) avec détection automatique des doublons.
  - Isolation multi-utilisateurs garantissant la confidentialité des données entre enseignants.

- **📱 Expérience Mobile & iOS Native :**
  - Conception responsive poussée pour iPhone, iPad et smartphones Android.
  - **Barre de navigation tactile en bas d'écran (Bottom Navigation Bar)** avec icônes ergonomiques.
  - Bandeau de note flottant en temps réel pour un retour visuel immédiat sur le terrain de sport.

- **⚙️ Gestion Personnalisable des Barèmes Officiels :**
  - Plus de 100 grilles officielles d'athlétisme et de natation ministérielles.
  - **Correction de l'inversion au saut en longueur :** barème rectifié pour les classes de la 6e à la 3e (filles) pour une progression rigoureusement croissante.
  - Outil complet pour ajouter, éditer et personnaliser chaque intervalle de note.

- **☁️ Architecture Full Stack & Cloud Supabase :**
  - Base de données cloud relationnelle **PostgreSQL 17** hébergée sur Supabase (`classes`, `eleves`, `baremes`, `evaluations`).
  - Row Level Security (RLS) & synchronisation temps réel (Realtime).
  - Mode hybride avec **résilience hors-ligne (Offline-first)** : cache local persistant et réconciliation automatique dès reconnexion.

---

## 🛠️ Technologies Utilisées

- **Backend / BaaS :** Supabase (PostgreSQL 17, PostgREST API, Realtime engine, Row Level Security).
- **Frontend :** HTML5 sémantique, CSS3 moderne (Variables CSS, Flexbox/Grid, animations douces), JavaScript ES6+ modulaire, Supabase JS Client SDK.
- **Moteur de Calcul :** `EPSEngine` (parseur multi-formats chrono/distance, interpolation linéaire, validation des contraintes réglementaires).
- **Polices & Icônes :** Google Fonts (Outfit & Inter), FontAwesome 6.
- **Compatibilité :** Interface 100% responsive adaptée aux ordinateurs, tablettes et smartphones sur le terrain de sport.

---

## 🚀 Démarrage Rapide

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/mohamedtoure08live-bot/Gestion-Note.git
   cd Gestion-Note
   ```

2. **Lancer l'application :**
   - Avec npm :
     ```bash
     npm run dev
     ```
   - Ou avec le script PowerShell :
     ```powershell
     powershell -ExecutionPolicy Bypass -File server.ps1
     ```
   - Accédez à l'application sur `http://localhost:3000/` (ou `http://localhost:8085/`).

3. **Exécuter la suite complète de tests automatisés (72 tests) :**
   ```bash
   npm test
   ```

---

## 📂 Structure du Projet

```text
├── css/
│   ├── main.css                    # Styles globaux, variables CSS, typographie & reset
│   ├── components.css              # Composants UI (boutons, formulaires, alertes, cartes)
│   ├── views.css                   # Styles dédiés aux vues (dashboard, notation, grilles)
│   └── landing.css                 # Styles de la landing page premium Sport-Tech
├── data/
│   └── default_baremes.json        # Base des 100 barèmes officiels vérifiés
├── js/
│   ├── app.js                      # Routeur SPA, gestionnaire mobile et synchronisation
│   ├── supabaseClient.js           # Connexion et gestionnaire de connectivité Supabase
│   ├── components.js               # Composants réutilisables (modales, toasts, badges)
│   ├── db.js                       # Couche d'accès aux données (Supabase + Cache localStorage)
│   ├── engine.js                   # Moteur de notation & validations réglementaires
│   └── views/                      # Contrôleurs de vues
│       ├── landing.js              # Vitrine publique interactive
│       ├── dashboard.js            # Tableau de bord analytique multi-activités
│       ├── notation.js             # Notation autonome directe & avec liste
│       ├── eleves.js               # Gestion des classes (« Mes classes ») & élèves
│       ├── baremes.js              # Gestion et édition des barèmes
│       └── historique.js           # Historique des évaluations
├── tests_verification.cjs          # Suite de tests : contrôles réglementaires et barèmes (45 tests)
├── tests_mission_amelioration.cjs  # Suite de tests : statistiques multi-sports & classes (11 tests)
├── tests_coherence_multiactivite.cjs # Suite de tests : conformité cloud Supabase (9 tests)
├── tests_notation_autonome.cjs     # Suite de tests : calcul autonome sans prérequis (7 tests)
├── index.html                      # Point d'entrée principal de l'application
├── package.json                    # Configuration du projet & scripts de test
├── server.ps1                      # Serveur HTTP local léger
└── README.md                       # Documentation du projet
```
