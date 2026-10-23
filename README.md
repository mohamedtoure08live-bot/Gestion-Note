# 🏃‍♂️ EPS PRO - Gestion & Notation EPS (Athlétisme & Natation de la 6e à la Terminale)

Application web moderne, intuitive et responsive conçue pour les professeurs d'Éducation Physique et Sportive (EPS) afin d'automatiser, fiabiliser et faciliter la notation des élèves selon les **barèmes officiels ministériels**.

---

## 🎯 Fonctionnalités Clés

- **⚡ Notation Rapide avec Contrôles Réglementaires Intégrés :**
  - Sélection de la discipline (*Lancer de poids, Saut en longueur, Saut en hauteur, Triple saut, Courses de vitesse 60m / 80m, Courses 800m / 1000m, Natation, etc.*), de la classe (*de la 6e à la Terminale*) et du genre (*Garçon / Fille*).
  - **🛡️ Contrôle d'incompatibilité de l'activité :** vérification dynamique que l'épreuve choisie est bien autorisée pour le sexe et la classe de l'élève selon le barème officiel (ex. le 1000m est réservé aux garçons, les filles effectuant le 800m). En cas d'incompatibilité, le calcul est immédiatement bloqué et un message d'erreur explicite s'affiche sans attribuer de note.
  - **⚖️ Contrôle réglementaire du poids de l'engin :** vérification que le poids sélectionné (ex. 3 kg, 4 kg, 5 kg au lancer de poids) correspond scrupuleusement au barème officiel de la classe et du sexe concernés (ex. une fille de 3e utilise obligatoirement un engin de 3 kg). Si un engin non réglementaire est sélectionné, l'application bloque le calcul et indique l'engin à utiliser.
  - **📏 Calcul en temps réel de la note sur 20 :** support de l'**Interpolation Linéaire Exacte** (note proportionnelle arrondie au centième) et du **Palier Strict** (note inférieure).
  - Enregistrement immédiat dans l'historique d'évaluation et synchronisation cloud temps réel.

- **📊 Tableau de Bord Analytique :**
  - Vue synthétique : nombre d'élèves, nombre d'évaluations, moyenne générale et par classe, meilleur lanceur/performeur.
  - Taux de réussite et taux d'échec calculés en temps réel.

- **📋 Gestion Complète des Élèves :**
  - Ajout, modification, suppression et recherche d'élèves par nom, prénom, classe et genre.
  - Prise en compte de tous les niveaux : *Sixième, Cinquième, Quatrième, Troisième, Seconde, Première, Terminale*.

- **⚙️ Gestion Personnalisable des Barèmes Officiels :**
  - 100 grilles officielles issues des barèmes d'athlétisme et de natation ministériels.
  - **Correction de l'inversion des distances au saut en longueur :** correction du barème officiel pour les classes de la 6e à la 3e (filles) où 1,60 m et 1,70 m étaient inversés, garantissant une progression rigoureusement croissante et des interpolations linéaires justes.
  - Barèmes stockés sous format modifiable (aucun barème en dur dans le code).
  - Outil complet pour ajouter, éditer et personnaliser chaque intervalle de note (seuil min, note).

- **📜 Historique & Suivi des Performances :**
  - Suivi chronologique de toutes les évaluations enregistrées.
  - Filtres par classe, discipline et date avec calcul automatique des moyennes.

- **☁️ Architecture Full Stack & Cloud Supabase :**
  - Base de données cloud relationnelle **PostgreSQL** hébergée sur Supabase (`classes`, `disciplines`, `eleves`, `baremes`, `evaluations`).
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
   - Ouvrez simplement `index.html` dans n'importe quel navigateur moderne, **OU**
   - Lancez le serveur local léger avec PowerShell :
     ```powershell
     powershell -ExecutionPolicy Bypass -File server.ps1
     ```
   - Accédez à l'application sur `http://localhost:8085/`.

3. **Exécuter la suite de tests automatisée :**
   ```bash
   node tests_verification.cjs
   ```

---

## 📂 Structure du Projet

```text
├── css/
│   ├── main.css              # Styles globaux, variables CSS, typographie & reset
│   ├── components.css        # Composants UI (boutons, formulaires, alertes, cartes)
│   └── views.css             # Styles dédiés aux vues (dashboard, notation, grilles)
├── data/
│   └── default_baremes.json  # Base des 100 barèmes officiels vérifiés
├── js/
│   ├── app.js                # Routeur SPA et initialisation de l'application
│   ├── supabaseClient.js     # Connexion et gestionnaire de connectivité Supabase
│   ├── components.js         # Composants réutilisables (modales, toasts)
│   ├── db.js                 # Couche d'accès aux données (Supabase + Cache localStorage)
│   ├── engine.js             # Moteur de notation & validations réglementaires
│   └── views/                # Contrôleurs de vues
│       ├── dashboard.js      # Tableau de bord analytique
│       ├── notation.js       # Notation rapide & contrôles de conformité
│       ├── eleves.js         # Gestion des élèves
│       ├── baremes.js        # Gestion et édition des barèmes
│       └── historique.js     # Historique des évaluations
├── tests_verification.cjs    # Suite de tests automatisée des contrôles et barèmes
├── index.html                # Point d'entrée principal de l'application
├── server.ps1                # Serveur HTTP local léger
└── README.md                 # Documentation du projet
```

