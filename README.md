# 🏃‍♂️ EPS PRO - Gestion & Notation EPS (Lancer de Poids)

Application web moderne, intuitive et responsive conçue pour les professeurs d'Éducation Physique et Sportive (EPS) afin de faciliter et fiabiliser la notation des élèves lors de l'épreuve du **lancer de poids** selon les barèmes officiels.

---

## 🎯 Fonctionnalités Clés

- **⚡ Notation Rapide & Automatique :**
  - Sélection de la discipline (*Lancer de poids* et extensible à d'autres disciplines), de la classe et du genre.
  - Saisie de la distance réalisée avec calcul instantané et sans erreur de la note sur 20.
  - Enregistrement immédiat dans l'historique d'évaluation.

- **📊 Tableau de Bord Analytique :**
  - Vue synthétique : nombre d'élèves, nombre d'évaluations, moyenne générale et par classe, meilleur lanceur.
  - Taux de réussite et taux d'échec calculés en temps réel.

- **📋 Gestion Complète des Élèves :**
  - Ajout, modification, suppression et recherche d'élèves par nom, prénom, classe et genre.
  - Les classes prises en compte : *Sixième, Cinquième, Quatrième, Troisième, Seconde, Première, Terminale*.

- **⚙️ Gestion Personnalisable des Barèmes :**
  - Barèmes officiels pré-intégrés pour chaque niveau et genre.
  - Barèmes stockés sous format modifiable (aucun barème en dur dans le code).
  - Outil complet pour ajouter, éditer et personnaliser chaque intervalle de note (distance min, max, note).

- **📜 Historique & Export :**
  - Suivi chronologique de toutes les évaluations.
  - Filtres par classe, discipline et date.

- **💾 Sauvegarde Locale (Offline-first) :**
  - Données stockées localement (LocalStorage / IndexedDB) garantissant un fonctionnement fluide même sans connexion Internet sur le terrain de sport.

---

## 🛠️ Technologies Utilisées

- **Frontend :** HTML5 sémantique, CSS3 moderne (Variables CSS, Flexbox/Grid, Glassmorphism, animations douces), JavaScript ES6+ modulaire.
- **Polices & Icônes :** Google Fonts (Outfit & Inter), FontAwesome.
- **Compatibilité :** Responsive sur PC, tablette et smartphone.

---

## 🚀 Démarrage Rapide

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/mohamedtoure08live-bot/Gestion-Note.git
   cd Gestion-Note
   ```

2. **Lancer l'application :**
   - Ouvrez simplement `index.html` dans n'importe quel navigateur moderne, **OU**
   - Lancez un serveur local léger (par exemple avec PowerShell) :
     ```powershell
     powershell -ExecutionPolicy Bypass -File server.ps1
     ```

---

## 📂 Structure du Projet

```text
├── css/
│   ├── main.css           # Styles globaux, variables & reset
│   ├── components.css     # Composants UI (boutons, formulaires, cartes)
│   └── views.css          # Styles des vues
├── data/
│   └── default_baremes.json # Données initiales des barèmes officiels
├── js/
│   ├── app.js             # Routeur et initialisation de l'application
│   ├── components.js      # Composants réutilisables (modales, toasts)
│   ├── db.js              # Couche d'accès aux données locales
│   ├── engine.js          # Moteur de calcul de note
│   └── views/             # Contrôleurs de vues (dashboard, notation, etc.)
├── index.html             # Point d'entrée principal
├── server.ps1             # Serveur de test local
└── README.md
```
