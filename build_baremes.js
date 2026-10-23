const fs = require('fs');
const path = require('path');

function createBareme(id, discipline, engin, classe, genre, type, grille) {
  // Sort grille by note ascending
  const sortedGrille = [...grille].sort((a, b) => a.note - b.note);
  return { id, discipline, engin, classe, genre, type, grille: sortedGrille };
}

const baremes = [];

const CLASSES = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"];
const GENRES = ["Garçon", "Fille"];

// ============================================================================
// 1. LANCER DE POIDS (OFFICIEL INTACT - CONSERVÉ SANS MODIFICATION)
// ============================================================================

// 6ème Garçons
baremes.push(createBareme("bar_poids_6eme_g_3kg", "Lancer de poids", "3kg", "Sixième", "Garçon", "distance", [
  { note: 20, distanceMin: 12.40 }, { note: 19, distanceMin: 11.70 }, { note: 18, distanceMin: 11.10 },
  { note: 17, distanceMin: 10.50 }, { note: 16, distanceMin: 10.00 }, { note: 15, distanceMin: 9.50 },
  { note: 14, distanceMin: 9.00 }, { note: 13, distanceMin: 8.50 }, { note: 12.5, distanceMin: 8.00 },
  { note: 12, distanceMin: 7.60 }, { note: 11.5, distanceMin: 7.20 }, { note: 11, distanceMin: 6.80 },
  { note: 10.5, distanceMin: 6.50 }, { note: 10, distanceMin: 6.10 }, { note: 9.5, distanceMin: 5.80 },
  { note: 9, distanceMin: 5.50 }, { note: 8.5, distanceMin: 5.20 }, { note: 8, distanceMin: 4.90 },
  { note: 7.5, distanceMin: 4.70 }, { note: 7, distanceMin: 4.40 }, { note: 6.5, distanceMin: 4.20 },
  { note: 6, distanceMin: 4.00 }, { note: 5.5, distanceMin: 3.80 }, { note: 5, distanceMin: 3.70 },
  { note: 4.5, distanceMin: 3.60 }, { note: 4, distanceMin: 3.50 }, { note: 3.5, distanceMin: 3.40 },
  { note: 3, distanceMin: 3.30 }, { note: 2.5, distanceMin: 3.20 }, { note: 2, distanceMin: 3.10 },
  { note: 1.5, distanceMin: 3.00 }
]));

baremes.push(createBareme("bar_poids_6eme_g_4kg", "Lancer de poids", "4kg", "Sixième", "Garçon", "distance", [
  { note: 20, distanceMin: 11.10 }, { note: 19, distanceMin: 10.50 }, { note: 18, distanceMin: 10.00 },
  { note: 17, distanceMin: 9.50 }, { note: 16, distanceMin: 9.40 }, { note: 15, distanceMin: 8.90 },
  { note: 14, distanceMin: 8.40 }, { note: 13, distanceMin: 7.90 }, { note: 12.5, distanceMin: 7.60 },
  { note: 12, distanceMin: 7.20 }, { note: 11.5, distanceMin: 6.70 }, { note: 11, distanceMin: 6.40 },
  { note: 10.5, distanceMin: 6.00 }, { note: 10, distanceMin: 5.70 }, { note: 9.5, distanceMin: 5.40 },
  { note: 9, distanceMin: 5.10 }, { note: 8.5, distanceMin: 4.80 }, { note: 8, distanceMin: 4.60 },
  { note: 7.5, distanceMin: 4.30 }, { note: 7, distanceMin: 4.10 }, { note: 6.5, distanceMin: 3.80 },
  { note: 6, distanceMin: 3.75 }, { note: 5.5, distanceMin: 3.70 }, { note: 5, distanceMin: 3.60 },
  { note: 4.5, distanceMin: 3.50 }, { note: 4, distanceMin: 3.40 }, { note: 3.5, distanceMin: 3.30 },
  { note: 3, distanceMin: 3.20 }, { note: 2.5, distanceMin: 3.10 }, { note: 2, distanceMin: 3.05 },
  { note: 1.5, distanceMin: 3.00 }
]));

// 6ème Filles
baremes.push(createBareme("bar_poids_6eme_f_3kg", "Lancer de poids", "3kg", "Sixième", "Fille", "distance", [
  { note: 20, distanceMin: 8.50 }, { note: 19, distanceMin: 8.00 }, { note: 18, distanceMin: 7.60 },
  { note: 17, distanceMin: 7.20 }, { note: 16, distanceMin: 6.80 }, { note: 15, distanceMin: 6.50 },
  { note: 14, distanceMin: 6.10 }, { note: 13, distanceMin: 5.80 }, { note: 12.5, distanceMin: 5.50 },
  { note: 12, distanceMin: 5.20 }, { note: 11.5, distanceMin: 4.90 }, { note: 11, distanceMin: 4.70 },
  { note: 10.5, distanceMin: 4.40 }, { note: 10, distanceMin: 4.20 }, { note: 9.5, distanceMin: 4.00 },
  { note: 9, distanceMin: 3.80 }, { note: 8.5, distanceMin: 3.70 }, { note: 8, distanceMin: 3.60 },
  { note: 7.5, distanceMin: 3.50 }, { note: 7, distanceMin: 3.40 }, { note: 6.5, distanceMin: 3.30 },
  { note: 6, distanceMin: 3.20 }, { note: 5.5, distanceMin: 3.10 }, { note: 5, distanceMin: 3.00 },
  { note: 4.5, distanceMin: 2.90 }, { note: 4, distanceMin: 2.80 }
]));

// 5ème Garçons
baremes.push(createBareme("bar_poids_5eme_g_3kg", "Lancer de poids", "3kg", "Cinquième", "Garçon", "distance", [
  { note: 20, distanceMin: 13.10 }, { note: 19, distanceMin: 12.40 }, { note: 18, distanceMin: 11.70 },
  { note: 17, distanceMin: 11.10 }, { note: 16, distanceMin: 10.50 }, { note: 15, distanceMin: 10.00 },
  { note: 14, distanceMin: 9.50 }, { note: 13, distanceMin: 9.00 }, { note: 12.5, distanceMin: 8.50 },
  { note: 12, distanceMin: 8.00 }, { note: 11.5, distanceMin: 7.60 }, { note: 11, distanceMin: 7.20 },
  { note: 10.5, distanceMin: 6.80 }, { note: 10, distanceMin: 6.50 }, { note: 9.5, distanceMin: 6.10 },
  { note: 9, distanceMin: 5.80 }, { note: 8.5, distanceMin: 5.50 }, { note: 8, distanceMin: 5.20 },
  { note: 7.5, distanceMin: 4.90 }, { note: 7, distanceMin: 4.70 }, { note: 6.5, distanceMin: 4.40 },
  { note: 6, distanceMin: 4.20 }, { note: 5.5, distanceMin: 4.00 }, { note: 5, distanceMin: 3.80 },
  { note: 4.5, distanceMin: 3.70 }, { note: 4, distanceMin: 3.60 }, { note: 3.5, distanceMin: 3.50 },
  { note: 3, distanceMin: 3.40 }, { note: 2.5, distanceMin: 3.30 }, { note: 2, distanceMin: 3.20 },
  { note: 1.5, distanceMin: 3.10 }, { note: 1, distanceMin: 3.00 }
]));

baremes.push(createBareme("bar_poids_5eme_g_4kg", "Lancer de poids", "4kg", "Cinquième", "Garçon", "distance", [
  { note: 20, distanceMin: 11.70 }, { note: 19, distanceMin: 11.10 }, { note: 18, distanceMin: 10.50 },
  { note: 17, distanceMin: 10.00 }, { note: 16, distanceMin: 9.50 }, { note: 15, distanceMin: 9.40 },
  { note: 14, distanceMin: 8.90 }, { note: 13, distanceMin: 8.40 }, { note: 12.5, distanceMin: 7.90 },
  { note: 12, distanceMin: 7.60 }, { note: 11.5, distanceMin: 7.20 }, { note: 11, distanceMin: 6.70 },
  { note: 10.5, distanceMin: 6.40 }, { note: 10, distanceMin: 6.00 }, { note: 9.5, distanceMin: 5.70 },
  { note: 9, distanceMin: 5.40 }, { note: 8.5, distanceMin: 5.10 }, { note: 8, distanceMin: 4.80 },
  { note: 7.5, distanceMin: 4.60 }, { note: 7, distanceMin: 4.30 }, { note: 6.5, distanceMin: 4.10 },
  { note: 6, distanceMin: 3.80 }, { note: 5.5, distanceMin: 3.75 }, { note: 5, distanceMin: 3.70 },
  { note: 4.5, distanceMin: 3.60 }, { note: 4, distanceMin: 3.50 }, { note: 3.5, distanceMin: 3.40 },
  { note: 3, distanceMin: 3.30 }, { note: 2.5, distanceMin: 3.20 }, { note: 2, distanceMin: 3.10 },
  { note: 1.5, distanceMin: 3.05 }, { note: 1, distanceMin: 3.00 }
]));

// 5ème Filles
baremes.push(createBareme("bar_poids_5eme_f_3kg", "Lancer de poids", "3kg", "Cinquième", "Fille", "distance", [
  { note: 20, distanceMin: 9.00 }, { note: 19, distanceMin: 8.50 }, { note: 18, distanceMin: 8.00 },
  { note: 17, distanceMin: 7.60 }, { note: 16, distanceMin: 7.20 }, { note: 15, distanceMin: 6.80 },
  { note: 14, distanceMin: 6.50 }, { note: 13, distanceMin: 6.10 }, { note: 12.5, distanceMin: 5.80 },
  { note: 12, distanceMin: 5.50 }, { note: 11.5, distanceMin: 5.20 }, { note: 11, distanceMin: 4.90 },
  { note: 10.5, distanceMin: 4.70 }, { note: 10, distanceMin: 4.40 }, { note: 9.5, distanceMin: 4.20 },
  { note: 9, distanceMin: 4.00 }, { note: 8.5, distanceMin: 3.80 }, { note: 8, distanceMin: 3.70 },
  { note: 7.5, distanceMin: 3.60 }, { note: 7, distanceMin: 3.50 }, { note: 6.5, distanceMin: 3.40 },
  { note: 6, distanceMin: 3.30 }, { note: 5.5, distanceMin: 3.20 }, { note: 5, distanceMin: 3.10 },
  { note: 4.5, distanceMin: 3.00 }, { note: 4, distanceMin: 2.90 }, { note: 3.5, distanceMin: 2.80 }
]));

// 4ème Garçons
baremes.push(createBareme("bar_poids_4eme_g_3kg", "Lancer de poids", "3kg", "Quatrième", "Garçon", "distance", [
  { note: 20, distanceMin: 13.80 }, { note: 19, distanceMin: 13.10 }, { note: 18, distanceMin: 12.40 },
  { note: 17, distanceMin: 11.70 }, { note: 16, distanceMin: 11.10 }, { note: 15, distanceMin: 10.50 },
  { note: 14, distanceMin: 10.00 }, { note: 13, distanceMin: 9.50 }, { note: 12.5, distanceMin: 9.00 },
  { note: 12, distanceMin: 8.50 }, { note: 11.5, distanceMin: 8.00 }, { note: 11, distanceMin: 7.60 },
  { note: 10.5, distanceMin: 7.20 }, { note: 10, distanceMin: 6.80 }, { note: 9.5, distanceMin: 6.50 },
  { note: 9, distanceMin: 6.10 }, { note: 8.5, distanceMin: 5.80 }, { note: 8, distanceMin: 5.50 },
  { note: 7.5, distanceMin: 5.20 }, { note: 7, distanceMin: 4.90 }, { note: 6.5, distanceMin: 4.70 },
  { note: 6, distanceMin: 4.40 }, { note: 5.5, distanceMin: 4.20 }, { note: 5, distanceMin: 4.00 },
  { note: 4.5, distanceMin: 3.80 }, { note: 4, distanceMin: 3.70 }, { note: 3.5, distanceMin: 3.60 },
  { note: 3, distanceMin: 3.50 }, { note: 2.5, distanceMin: 3.40 }, { note: 2, distanceMin: 3.30 },
  { note: 1.5, distanceMin: 3.20 }
]));

baremes.push(createBareme("bar_poids_4eme_g_4kg", "Lancer de poids", "4kg", "Quatrième", "Garçon", "distance", [
  { note: 20, distanceMin: 12.40 }, { note: 19, distanceMin: 11.70 }, { note: 18, distanceMin: 11.10 },
  { note: 17, distanceMin: 10.50 }, { note: 16, distanceMin: 10.00 }, { note: 15, distanceMin: 9.50 },
  { note: 14, distanceMin: 9.40 }, { note: 13, distanceMin: 8.90 }, { note: 12.5, distanceMin: 8.40 },
  { note: 12, distanceMin: 7.90 }, { note: 11.5, distanceMin: 7.60 }, { note: 11, distanceMin: 7.20 },
  { note: 10.5, distanceMin: 6.70 }, { note: 10, distanceMin: 6.40 }, { note: 9.5, distanceMin: 6.00 },
  { note: 9, distanceMin: 5.70 }, { note: 8.5, distanceMin: 5.40 }, { note: 8, distanceMin: 5.10 },
  { note: 7.5, distanceMin: 4.80 }, { note: 7, distanceMin: 4.60 }, { note: 6.5, distanceMin: 4.30 },
  { note: 6, distanceMin: 4.10 }, { note: 5.5, distanceMin: 3.80 }, { note: 5, distanceMin: 3.75 },
  { note: 4.5, distanceMin: 3.70 }, { note: 4, distanceMin: 3.60 }, { note: 3.5, distanceMin: 3.50 },
  { note: 3, distanceMin: 3.40 }, { note: 2.5, distanceMin: 3.30 }, { note: 2, distanceMin: 3.20 },
  { note: 1.5, distanceMin: 3.10 }
]));

// 4ème Filles
baremes.push(createBareme("bar_poids_4eme_f_3kg", "Lancer de poids", "3kg", "Quatrième", "Fille", "distance", [
  { note: 20, distanceMin: 9.50 }, { note: 19, distanceMin: 9.00 }, { note: 18, distanceMin: 8.50 },
  { note: 17, distanceMin: 8.00 }, { note: 16, distanceMin: 7.60 }, { note: 15, distanceMin: 7.20 },
  { note: 14, distanceMin: 6.80 }, { note: 13, distanceMin: 6.50 }, { note: 12.5, distanceMin: 6.10 },
  { note: 12, distanceMin: 5.80 }, { note: 11.5, distanceMin: 5.50 }, { note: 11, distanceMin: 5.20 },
  { note: 10.5, distanceMin: 4.90 }, { note: 10, distanceMin: 4.70 }, { note: 9.5, distanceMin: 4.40 },
  { note: 9, distanceMin: 4.20 }, { note: 8.5, distanceMin: 4.00 }, { note: 8, distanceMin: 3.80 },
  { note: 7.5, distanceMin: 3.70 }, { note: 7, distanceMin: 3.60 }, { note: 6.5, distanceMin: 3.50 },
  { note: 6, distanceMin: 3.40 }, { note: 5.5, distanceMin: 3.30 }, { note: 5, distanceMin: 3.20 },
  { note: 4.5, distanceMin: 3.10 }, { note: 4, distanceMin: 3.00 }, { note: 3.5, distanceMin: 2.90 },
  { note: 3, distanceMin: 2.80 }
]));

// 3ème Garçons
baremes.push(createBareme("bar_poids_3eme_g_3kg", "Lancer de poids", "3kg", "Troisième", "Garçon", "distance", [
  { note: 20, distanceMin: 14.60 }, { note: 19, distanceMin: 13.80 }, { note: 18, distanceMin: 13.10 },
  { note: 17, distanceMin: 12.40 }, { note: 16, distanceMin: 11.70 }, { note: 15, distanceMin: 11.10 },
  { note: 14, distanceMin: 10.50 }, { note: 13, distanceMin: 10.00 }, { note: 12.5, distanceMin: 9.50 },
  { note: 12, distanceMin: 9.00 }, { note: 11.5, distanceMin: 8.50 }, { note: 11, distanceMin: 8.00 },
  { note: 10.5, distanceMin: 7.60 }, { note: 10, distanceMin: 7.20 }, { note: 9.5, distanceMin: 6.80 },
  { note: 9, distanceMin: 6.50 }, { note: 8.5, distanceMin: 6.10 }, { note: 8, distanceMin: 5.80 },
  { note: 7.5, distanceMin: 5.50 }, { note: 7, distanceMin: 5.20 }, { note: 6.5, distanceMin: 4.90 },
  { note: 6, distanceMin: 4.70 }, { note: 5.5, distanceMin: 4.40 }, { note: 5, distanceMin: 4.20 },
  { note: 4.5, distanceMin: 4.00 }, { note: 4, distanceMin: 3.80 }, { note: 3.5, distanceMin: 3.70 },
  { note: 3, distanceMin: 3.60 }, { note: 2.5, distanceMin: 3.50 }, { note: 2, distanceMin: 3.40 },
  { note: 1.5, distanceMin: 3.30 }, { note: 1, distanceMin: 3.20 }
]));

baremes.push(createBareme("bar_poids_3eme_g_4kg", "Lancer de poids", "4kg", "Troisième", "Garçon", "distance", [
  { note: 20, distanceMin: 13.10 }, { note: 19, distanceMin: 12.40 }, { note: 18, distanceMin: 11.70 },
  { note: 17, distanceMin: 11.10 }, { note: 16, distanceMin: 10.50 }, { note: 15, distanceMin: 10.00 },
  { note: 14, distanceMin: 9.50 }, { note: 13, distanceMin: 9.40 }, { note: 12.5, distanceMin: 8.90 },
  { note: 12, distanceMin: 8.40 }, { note: 11.5, distanceMin: 7.90 }, { note: 11, distanceMin: 7.60 },
  { note: 10.5, distanceMin: 7.20 }, { note: 10, distanceMin: 6.70 }, { note: 9.5, distanceMin: 6.40 },
  { note: 9, distanceMin: 6.00 }, { note: 8.5, distanceMin: 5.70 }, { note: 8, distanceMin: 5.40 },
  { note: 7.5, distanceMin: 5.10 }, { note: 7, distanceMin: 4.80 }, { note: 6.5, distanceMin: 4.60 },
  { note: 6, distanceMin: 4.30 }, { note: 5.5, distanceMin: 4.10 }, { note: 5, distanceMin: 3.80 },
  { note: 4.5, distanceMin: 3.75 }, { note: 4, distanceMin: 3.70 }, { note: 3.5, distanceMin: 3.60 },
  { note: 3, distanceMin: 3.50 }, { note: 2.5, distanceMin: 3.40 }, { note: 2, distanceMin: 3.30 },
  { note: 1.5, distanceMin: 3.20 }, { note: 1, distanceMin: 3.10 }
]));

// 3ème Filles
baremes.push(createBareme("bar_poids_3eme_f_3kg", "Lancer de poids", "3kg", "Troisième", "Fille", "distance", [
  { note: 20, distanceMin: 10.00 }, { note: 19, distanceMin: 9.50 }, { note: 18, distanceMin: 9.00 },
  { note: 17, distanceMin: 8.50 }, { note: 16, distanceMin: 8.00 }, { note: 15, distanceMin: 7.60 },
  { note: 14, distanceMin: 7.20 }, { note: 13, distanceMin: 6.80 }, { note: 12.5, distanceMin: 6.50 },
  { note: 12, distanceMin: 6.10 }, { note: 11.5, distanceMin: 5.80 }, { note: 11, distanceMin: 5.50 },
  { note: 10.5, distanceMin: 5.20 }, { note: 10, distanceMin: 4.90 }, { note: 9.5, distanceMin: 4.70 },
  { note: 9, distanceMin: 4.40 }, { note: 8.5, distanceMin: 4.20 }, { note: 8, distanceMin: 4.00 },
  { note: 7.5, distanceMin: 3.80 }, { note: 7, distanceMin: 3.70 }, { note: 6.5, distanceMin: 3.60 },
  { note: 6, distanceMin: 3.50 }, { note: 5.5, distanceMin: 3.40 }, { note: 5, distanceMin: 3.30 },
  { note: 4.5, distanceMin: 3.20 }, { note: 4, distanceMin: 3.10 }, { note: 3.5, distanceMin: 3.00 },
  { note: 3, distanceMin: 2.90 }, { note: 2.5, distanceMin: 2.80 }
]));

// Seconde Garçons
baremes.push(createBareme("bar_poids_2nde_g_4kg", "Lancer de poids", "4kg", "Seconde", "Garçon", "distance", [
  { note: 20, distanceMin: 14.10 }, { note: 19, distanceMin: 13.30 }, { note: 18, distanceMin: 12.60 },
  { note: 17, distanceMin: 11.80 }, { note: 16, distanceMin: 11.20 }, { note: 15, distanceMin: 10.50 },
  { note: 14, distanceMin: 9.96 }, { note: 13, distanceMin: 9.39 }, { note: 12.5, distanceMin: 8.86 },
  { note: 12, distanceMin: 8.35 }, { note: 11.5, distanceMin: 7.88 }, { note: 11, distanceMin: 7.43 },
  { note: 10.5, distanceMin: 7.00 }, { note: 10, distanceMin: 6.60 }, { note: 9.5, distanceMin: 6.19 },
  { note: 9, distanceMin: 5.87 }, { note: 8.5, distanceMin: 5.54 }, { note: 8, distanceMin: 5.22 },
  { note: 7.5, distanceMin: 4.92 }, { note: 7, distanceMin: 4.64 }, { note: 6.5, distanceMin: 4.38 },
  { note: 6, distanceMin: 4.13 }, { note: 5.5, distanceMin: 3.89 }, { note: 5, distanceMin: 3.67 },
  { note: 4.5, distanceMin: 3.46 }, { note: 4, distanceMin: 3.26 }, { note: 3.5, distanceMin: 3.08 },
  { note: 3, distanceMin: 2.90 }, { note: 2.5, distanceMin: 2.74 }
]));

baremes.push(createBareme("bar_poids_2nde_g_5kg", "Lancer de poids", "5kg", "Seconde", "Garçon", "distance", [
  { note: 20, distanceMin: 12.90 }, { note: 19, distanceMin: 12.20 }, { note: 18, distanceMin: 11.50 },
  { note: 17, distanceMin: 10.80 }, { note: 16, distanceMin: 10.20 }, { note: 15, distanceMin: 9.65 },
  { note: 14, distanceMin: 9.10 }, { note: 13, distanceMin: 8.58 }, { note: 12.5, distanceMin: 8.09 },
  { note: 12, distanceMin: 7.63 }, { note: 11.5, distanceMin: 7.20 }, { note: 11, distanceMin: 6.79 },
  { note: 10.5, distanceMin: 6.40 }, { note: 10, distanceMin: 6.03 }, { note: 9.5, distanceMin: 5.60 },
  { note: 9, distanceMin: 5.37 }, { note: 8.5, distanceMin: 5.06 }, { note: 8, distanceMin: 4.77 },
  { note: 7.5, distanceMin: 4.50 }, { note: 7, distanceMin: 4.24 }, { note: 6.5, distanceMin: 4.00 },
  { note: 6, distanceMin: 3.77 }, { note: 5.5, distanceMin: 3.56 }, { note: 5, distanceMin: 3.35 },
  { note: 4.5, distanceMin: 3.16 }, { note: 4, distanceMin: 2.98 }, { note: 3.5, distanceMin: 2.81 },
  { note: 3, distanceMin: 2.65 }, { note: 2.5, distanceMin: 2.50 }
]));

// Seconde Filles
baremes.push(createBareme("bar_poids_2nde_f_3kg", "Lancer de poids", "3kg", "Seconde", "Fille", "distance", [
  { note: 20, distanceMin: 9.39 }, { note: 19, distanceMin: 8.86 }, { note: 18, distanceMin: 8.35 },
  { note: 17, distanceMin: 7.88 }, { note: 16, distanceMin: 7.43 }, { note: 15, distanceMin: 7.00 },
  { note: 14, distanceMin: 6.60 }, { note: 13, distanceMin: 6.19 }, { note: 12.5, distanceMin: 5.87 },
  { note: 12, distanceMin: 5.54 }, { note: 11.5, distanceMin: 5.22 }, { note: 11, distanceMin: 4.92 },
  { note: 10.5, distanceMin: 4.64 }, { note: 10, distanceMin: 4.38 }, { note: 9.5, distanceMin: 4.13 },
  { note: 9, distanceMin: 3.89 }, { note: 8.5, distanceMin: 3.67 }, { note: 8, distanceMin: 3.46 },
  { note: 7.5, distanceMin: 3.26 }, { note: 7, distanceMin: 3.08 }, { note: 6.5, distanceMin: 2.90 },
  { note: 6, distanceMin: 2.74 }, { note: 5.5, distanceMin: 2.58 }, { note: 5, distanceMin: 2.43 },
  { note: 4.5, distanceMin: 2.30 }, { note: 4, distanceMin: 2.16 }
]));

// Première Garçons
baremes.push(createBareme("bar_poids_1ere_g_4kg", "Lancer de poids", "4kg", "Première", "Garçon", "distance", [
  { note: 20, distanceMin: 15.00 }, { note: 19, distanceMin: 14.10 }, { note: 18, distanceMin: 13.30 },
  { note: 17, distanceMin: 12.60 }, { note: 16, distanceMin: 11.80 }, { note: 15, distanceMin: 11.20 },
  { note: 14, distanceMin: 10.50 }, { note: 13, distanceMin: 9.96 }, { note: 12.5, distanceMin: 9.39 },
  { note: 12, distanceMin: 8.86 }, { note: 11.5, distanceMin: 8.35 }, { note: 11, distanceMin: 7.88 },
  { note: 10.5, distanceMin: 7.43 }, { note: 10, distanceMin: 7.00 }, { note: 9.5, distanceMin: 6.60 },
  { note: 9, distanceMin: 6.19 }, { note: 8.5, distanceMin: 5.87 }, { note: 8, distanceMin: 5.54 },
  { note: 7.5, distanceMin: 5.22 }, { note: 7, distanceMin: 4.92 }, { note: 6.5, distanceMin: 4.64 },
  { note: 6, distanceMin: 4.38 }, { note: 5.5, distanceMin: 4.13 }, { note: 5, distanceMin: 3.89 },
  { note: 4.5, distanceMin: 3.67 }, { note: 4, distanceMin: 3.46 }, { note: 3.5, distanceMin: 3.26 },
  { note: 3, distanceMin: 3.08 }, { note: 2.5, distanceMin: 2.90 }, { note: 2, distanceMin: 2.74 }
]));

baremes.push(createBareme("bar_poids_1ere_g_5kg", "Lancer de poids", "5kg", "Première", "Garçon", "distance", [
  { note: 20, distanceMin: 13.70 }, { note: 19, distanceMin: 12.90 }, { note: 18, distanceMin: 12.20 },
  { note: 17, distanceMin: 11.50 }, { note: 16, distanceMin: 10.80 }, { note: 15, distanceMin: 10.20 },
  { note: 14, distanceMin: 9.65 }, { note: 13, distanceMin: 9.10 }, { note: 12.5, distanceMin: 8.58 },
  { note: 12, distanceMin: 8.09 }, { note: 11.5, distanceMin: 7.63 }, { note: 11, distanceMin: 7.20 },
  { note: 10.5, distanceMin: 6.79 }, { note: 10, distanceMin: 6.40 }, { note: 9.5, distanceMin: 6.03 },
  { note: 9, distanceMin: 5.37 }, { note: 8.5, distanceMin: 5.06 }, { note: 8, distanceMin: 4.77 },
  { note: 7.5, distanceMin: 4.50 }, { note: 7, distanceMin: 4.24 }, { note: 6.5, distanceMin: 4.00 },
  { note: 6, distanceMin: 3.77 }, { note: 5.5, distanceMin: 3.56 }, { note: 5, distanceMin: 3.35 },
  { note: 4.5, distanceMin: 3.16 }, { note: 4, distanceMin: 2.98 }, { note: 3.5, distanceMin: 2.81 },
  { note: 3, distanceMin: 2.65 }, { note: 2.5, distanceMin: 2.50 }
]));

// Première Filles
baremes.push(createBareme("bar_poids_1ere_f_4kg", "Lancer de poids", "4kg", "Première", "Fille", "distance", [
  { note: 20, distanceMin: 9.96 }, { note: 19, distanceMin: 9.39 }, { note: 18, distanceMin: 8.86 },
  { note: 17, distanceMin: 8.35 }, { note: 16, distanceMin: 7.88 }, { note: 15, distanceMin: 7.43 },
  { note: 14, distanceMin: 7.00 }, { note: 13, distanceMin: 6.60 }, { note: 12.5, distanceMin: 6.19 },
  { note: 12, distanceMin: 5.87 }, { note: 11.5, distanceMin: 5.54 }, { note: 11, distanceMin: 5.22 },
  { note: 10.5, distanceMin: 4.92 }, { note: 10, distanceMin: 4.64 }, { note: 9.5, distanceMin: 4.38 },
  { note: 9, distanceMin: 4.13 }, { note: 8.5, distanceMin: 3.89 }, { note: 8, distanceMin: 3.67 },
  { note: 7.5, distanceMin: 3.46 }, { note: 7, distanceMin: 3.26 }, { note: 6.5, distanceMin: 3.08 },
  { note: 6, distanceMin: 2.90 }, { note: 5.5, distanceMin: 2.74 }, { note: 5, distanceMin: 2.58 },
  { note: 4.5, distanceMin: 2.43 }, { note: 4, distanceMin: 2.30 }, { note: 3.5, distanceMin: 2.16 }
]));

// Terminale Garçons
baremes.push(createBareme("bar_poids_term_g_4kg", "Lancer de poids", "4kg", "Terminale", "Garçon", "distance", [
  { note: 20, distanceMin: 15.90 }, { note: 19, distanceMin: 15.00 }, { note: 18, distanceMin: 14.10 },
  { note: 17, distanceMin: 13.30 }, { note: 16, distanceMin: 12.60 }, { note: 15, distanceMin: 11.80 },
  { note: 14, distanceMin: 11.20 }, { note: 13, distanceMin: 10.50 }, { note: 12.5, distanceMin: 9.96 },
  { note: 12, distanceMin: 9.39 }, { note: 11.5, distanceMin: 8.86 }, { note: 11, distanceMin: 8.35 },
  { note: 10.5, distanceMin: 7.88 }, { note: 10, distanceMin: 7.43 }, { note: 9.5, distanceMin: 7.00 },
  { note: 9, distanceMin: 6.60 }, { note: 8.5, distanceMin: 6.19 }, { note: 8, distanceMin: 5.54 },
  { note: 7.5, distanceMin: 5.22 }, { note: 7, distanceMin: 4.92 }, { note: 6.5, distanceMin: 4.64 },
  { note: 6, distanceMin: 4.38 }, { note: 5.5, distanceMin: 4.13 }, { note: 5, distanceMin: 3.89 },
  { note: 4.5, distanceMin: 3.67 }, { note: 4, distanceMin: 3.46 }, { note: 3.5, distanceMin: 3.26 }
]));

baremes.push(createBareme("bar_poids_term_g_5kg", "Lancer de poids", "5kg", "Terminale", "Garçon", "distance", [
  { note: 20, distanceMin: 14.50 }, { note: 19, distanceMin: 13.70 }, { note: 18, distanceMin: 12.90 },
  { note: 17, distanceMin: 12.20 }, { note: 16, distanceMin: 11.50 }, { note: 15, distanceMin: 10.80 },
  { note: 14, distanceMin: 10.20 }, { note: 13, distanceMin: 9.65 }, { note: 12.5, distanceMin: 9.10 },
  { note: 12, distanceMin: 8.58 }, { note: 11.5, distanceMin: 8.09 }, { note: 11, distanceMin: 7.63 },
  { note: 10.5, distanceMin: 7.20 }, { note: 10, distanceMin: 6.79 }, { note: 9.5, distanceMin: 6.40 },
  { note: 9, distanceMin: 6.03 }, { note: 8.5, distanceMin: 5.60 }, { note: 8, distanceMin: 5.37 },
  { note: 7.5, distanceMin: 5.06 }, { note: 7, distanceMin: 4.77 }, { note: 6.5, distanceMin: 4.50 },
  { note: 6, distanceMin: 4.24 }, { note: 5.5, distanceMin: 4.00 }, { note: 5, distanceMin: 3.77 },
  { note: 4.5, distanceMin: 3.56 }, { note: 4, distanceMin: 3.35 }, { note: 3.5, distanceMin: 2.98 }
]));

// Terminale Filles
baremes.push(createBareme("bar_poids_term_f_4kg", "Lancer de poids", "4kg", "Terminale", "Fille", "distance", [
  { note: 20, distanceMin: 11.20 }, { note: 19, distanceMin: 10.50 }, { note: 18, distanceMin: 9.96 },
  { note: 17, distanceMin: 9.39 }, { note: 16, distanceMin: 8.86 }, { note: 15, distanceMin: 8.35 },
  { note: 14, distanceMin: 7.88 }, { note: 13, distanceMin: 7.43 }, { note: 12.5, distanceMin: 7.00 },
  { note: 12, distanceMin: 6.60 }, { note: 11.5, distanceMin: 6.19 }, { note: 11, distanceMin: 5.87 },
  { note: 10.5, distanceMin: 5.54 }, { note: 10, distanceMin: 5.22 }, { note: 9.5, distanceMin: 4.92 },
  { note: 9, distanceMin: 4.64 }, { note: 8.5, distanceMin: 4.38 }, { note: 8, distanceMin: 4.13 },
  { note: 7.5, distanceMin: 3.89 }, { note: 7, distanceMin: 3.67 }, { note: 6.5, distanceMin: 3.46 },
  { note: 6, distanceMin: 3.26 }, { note: 5.5, distanceMin: 3.08 }, { note: 5, distanceMin: 2.90 },
  { note: 4.5, distanceMin: 2.74 }, { note: 4, distanceMin: 2.58 }, { note: 3.5, distanceMin: 2.43 },
  { note: 3, distanceMin: 2.30 }, { note: 2.5, distanceMin: 2.16 }
]));


// ============================================================================
// 2. COURSE DE VITESSE DE 60 MÈTRES (BARÈMES OFFICIELS EXTRAITS DU PDF)
// ============================================================================

// 6ème Garçons (60m - Page 2)
baremes.push(createBareme("bar_vit60m_6eme_g", "Course de vitesse de 60 mètres", null, "Sixième", "Garçon", "temps", [
  { note: 20, distanceMin: 8.2 }, { note: 19, distanceMin: 8.3 }, { note: 18, distanceMin: 8.4 },
  { note: 17, distanceMin: 8.5 }, { note: 16, distanceMin: 8.6 }, { note: 15, distanceMin: 8.7 },
  { note: 14, distanceMin: 8.8 }, { note: 13, distanceMin: 8.9 }, { note: 12.5, distanceMin: 9.0 },
  { note: 12, distanceMin: 9.2 }, { note: 11.5, distanceMin: 9.3 }, { note: 11, distanceMin: 9.4 },
  { note: 10.5, distanceMin: 9.6 }, { note: 10, distanceMin: 9.7 }, { note: 9.5, distanceMin: 9.9 },
  { note: 9, distanceMin: 10.1 }, { note: 8.5, distanceMin: 10.2 }, { note: 8, distanceMin: 10.4 },
  { note: 7.5, distanceMin: 10.5 }, { note: 7, distanceMin: 10.7 }, { note: 6.5, distanceMin: 10.9 },
  { note: 6, distanceMin: 11.1 }, { note: 5.5, distanceMin: 11.2 }, { note: 5, distanceMin: 11.4 },
  { note: 4.5, distanceMin: 11.6 }, { note: 4, distanceMin: 11.8 }, { note: 3.5, distanceMin: 12.0 },
  { note: 3, distanceMin: 12.2 }, { note: 2.5, distanceMin: 12.4 }, { note: 2, distanceMin: 12.6 },
  { note: 1.5, distanceMin: 12.8 }, { note: 1, distanceMin: 13.1 }
]));

// 6ème Filles (60m - Page 3)
baremes.push(createBareme("bar_vit60m_6eme_f", "Course de vitesse de 60 mètres", null, "Sixième", "Fille", "temps", [
  { note: 20, distanceMin: 8.9 }, { note: 19, distanceMin: 9.0 }, { note: 18, distanceMin: 9.2 },
  { note: 17, distanceMin: 9.3 }, { note: 16, distanceMin: 9.4 }, { note: 15, distanceMin: 9.6 },
  { note: 14, distanceMin: 9.7 }, { note: 13, distanceMin: 9.9 }, { note: 12.5, distanceMin: 10.1 },
  { note: 12, distanceMin: 10.2 }, { note: 11.5, distanceMin: 10.4 }, { note: 11, distanceMin: 10.5 },
  { note: 10.5, distanceMin: 10.7 }, { note: 10, distanceMin: 10.9 }, { note: 9.5, distanceMin: 11.1 },
  { note: 9, distanceMin: 11.2 }, { note: 8.5, distanceMin: 11.4 }, { note: 8, distanceMin: 11.6 },
  { note: 7.5, distanceMin: 11.8 }, { note: 7, distanceMin: 12.0 }, { note: 6.5, distanceMin: 12.2 },
  { note: 6, distanceMin: 12.4 }, { note: 5.5, distanceMin: 12.6 }, { note: 5, distanceMin: 12.8 },
  { note: 4.5, distanceMin: 13.1 }, { note: 4, distanceMin: 13.3 }, { note: 3.5, distanceMin: 13.5 }
]));

// 5ème Garçons (60m - Page 4)
baremes.push(createBareme("bar_vit60m_5eme_g", "Course de vitesse de 60 mètres", null, "Cinquième", "Garçon", "temps", [
  { note: 20, distanceMin: 8.1 }, { note: 19, distanceMin: 8.2 }, { note: 18, distanceMin: 8.3 },
  { note: 17, distanceMin: 8.4 }, { note: 16, distanceMin: 8.5 }, { note: 15, distanceMin: 8.6 },
  { note: 14, distanceMin: 8.7 }, { note: 13, distanceMin: 8.8 }, { note: 12.5, distanceMin: 8.9 },
  { note: 12, distanceMin: 9.0 }, { note: 11.5, distanceMin: 9.2 }, { note: 11, distanceMin: 9.3 },
  { note: 10.5, distanceMin: 9.4 }, { note: 10, distanceMin: 9.6 }, { note: 9.5, distanceMin: 9.7 },
  { note: 9, distanceMin: 9.9 }, { note: 8.5, distanceMin: 10.1 }, { note: 8, distanceMin: 10.2 },
  { note: 7.5, distanceMin: 10.4 }, { note: 7, distanceMin: 10.5 }, { note: 6.5, distanceMin: 10.7 },
  { note: 6, distanceMin: 10.9 }, { note: 5.5, distanceMin: 11.1 }, { note: 5, distanceMin: 11.2 },
  { note: 4.5, distanceMin: 11.4 }, { note: 4, distanceMin: 11.6 }, { note: 3.5, distanceMin: 11.8 },
  { note: 3, distanceMin: 12.0 }, { note: 2.5, distanceMin: 12.2 }, { note: 2, distanceMin: 12.4 },
  { note: 1.5, distanceMin: 12.6 }, { note: 1, distanceMin: 12.8 }
]));

// 5ème Filles (60m - Page 5)
baremes.push(createBareme("bar_vit60m_5eme_f", "Course de vitesse de 60 mètres", null, "Cinquième", "Fille", "temps", [
  { note: 20, distanceMin: 8.8 }, { note: 19, distanceMin: 8.9 }, { note: 18, distanceMin: 9.0 },
  { note: 17, distanceMin: 9.2 }, { note: 16, distanceMin: 9.3 }, { note: 15, distanceMin: 9.4 },
  { note: 14, distanceMin: 9.6 }, { note: 13, distanceMin: 9.7 }, { note: 12.5, distanceMin: 9.9 },
  { note: 12, distanceMin: 10.1 }, { note: 11.5, distanceMin: 10.2 }, { note: 11, distanceMin: 10.4 },
  { note: 10.5, distanceMin: 10.5 }, { note: 10, distanceMin: 10.7 }, { note: 9.5, distanceMin: 10.9 },
  { note: 9, distanceMin: 11.1 }, { note: 8.5, distanceMin: 11.2 }, { note: 8, distanceMin: 11.4 },
  { note: 7.5, distanceMin: 11.6 }, { note: 7, distanceMin: 11.8 }, { note: 6.5, distanceMin: 12.0 },
  { note: 6, distanceMin: 12.2 }, { note: 5.5, distanceMin: 12.4 }, { note: 5, distanceMin: 12.6 },
  { note: 4.5, distanceMin: 12.8 }, { note: 4, distanceMin: 13.1 }, { note: 3.5, distanceMin: 13.3 },
  { note: 3, distanceMin: 13.5 }
]));

// 4ème Garçons (60m - Page 6)
baremes.push(createBareme("bar_vit60m_4eme_g", "Course de vitesse de 60 mètres", null, "Quatrième", "Garçon", "temps", [
  { note: 20, distanceMin: 7.9 }, { note: 19, distanceMin: 8.1 }, { note: 18, distanceMin: 8.2 },
  { note: 17, distanceMin: 8.3 }, { note: 16, distanceMin: 8.4 }, { note: 15, distanceMin: 8.5 },
  { note: 14, distanceMin: 8.6 }, { note: 13, distanceMin: 8.7 }, { note: 12.5, distanceMin: 8.8 },
  { note: 12, distanceMin: 8.9 }, { note: 11.5, distanceMin: 9.0 }, { note: 11, distanceMin: 9.2 },
  { note: 10.5, distanceMin: 9.3 }, { note: 10, distanceMin: 9.4 }, { note: 9.5, distanceMin: 9.6 },
  { note: 9, distanceMin: 9.7 }, { note: 8.5, distanceMin: 9.9 }, { note: 8, distanceMin: 10.1 },
  { note: 7.5, distanceMin: 10.2 }, { note: 7, distanceMin: 10.4 }, { note: 6.5, distanceMin: 10.5 },
  { note: 6, distanceMin: 10.7 }, { note: 5.5, distanceMin: 10.9 }, { note: 5, distanceMin: 11.1 },
  { note: 4.5, distanceMin: 11.2 }, { note: 4, distanceMin: 11.4 }, { note: 3.5, distanceMin: 11.6 },
  { note: 3, distanceMin: 11.8 }, { note: 2.5, distanceMin: 12.0 }, { note: 2, distanceMin: 12.2 },
  { note: 1.5, distanceMin: 12.4 }, { note: 1, distanceMin: 12.6 }
]));

// 4ème Filles (60m - Page 7)
baremes.push(createBareme("bar_vit60m_4eme_f", "Course de vitesse de 60 mètres", null, "Quatrième", "Fille", "temps", [
  { note: 20, distanceMin: 8.7 }, { note: 19, distanceMin: 8.8 }, { note: 18, distanceMin: 8.9 },
  { note: 17, distanceMin: 9.0 }, { note: 16, distanceMin: 9.2 }, { note: 15, distanceMin: 9.3 },
  { note: 14, distanceMin: 9.4 }, { note: 13, distanceMin: 9.6 }, { note: 12.5, distanceMin: 9.7 },
  { note: 12, distanceMin: 9.9 }, { note: 11.5, distanceMin: 10.1 }, { note: 11, distanceMin: 10.2 },
  { note: 10.5, distanceMin: 10.4 }, { note: 10, distanceMin: 10.5 }, { note: 9.5, distanceMin: 10.7 },
  { note: 9, distanceMin: 10.9 }, { note: 8.5, distanceMin: 11.1 }, { note: 8, distanceMin: 11.2 },
  { note: 7.5, distanceMin: 11.4 }, { note: 7, distanceMin: 11.6 }, { note: 6.5, distanceMin: 11.8 },
  { note: 6, distanceMin: 12.0 }, { note: 5.5, distanceMin: 12.2 }, { note: 5, distanceMin: 12.4 },
  { note: 4.5, distanceMin: 12.6 }, { note: 4, distanceMin: 12.8 }, { note: 3.5, distanceMin: 13.1 },
  { note: 3, distanceMin: 13.3 }, { note: 2.5, distanceMin: 13.5 }
]));

// 3ème Garçons (60m - Page 8)
baremes.push(createBareme("bar_vit60m_3eme_g", "Course de vitesse de 60 mètres", null, "Troisième", "Garçon", "temps", [
  { note: 20, distanceMin: 7.9 }, { note: 19, distanceMin: 8.0 }, { note: 18, distanceMin: 8.1 },
  { note: 17, distanceMin: 8.2 }, { note: 16, distanceMin: 8.3 }, { note: 15, distanceMin: 8.4 },
  { note: 14, distanceMin: 8.5 }, { note: 13, distanceMin: 8.6 }, { note: 12.5, distanceMin: 8.7 },
  { note: 12, distanceMin: 8.8 }, { note: 11.5, distanceMin: 8.9 }, { note: 11, distanceMin: 9.0 },
  { note: 10.5, distanceMin: 9.2 }, { note: 10, distanceMin: 9.3 }, { note: 9.5, distanceMin: 9.4 },
  { note: 9, distanceMin: 9.6 }, { note: 8.5, distanceMin: 9.7 }, { note: 8, distanceMin: 9.9 },
  { note: 7.5, distanceMin: 10.1 }, { note: 7, distanceMin: 10.2 }, { note: 6.5, distanceMin: 10.4 },
  { note: 6, distanceMin: 10.5 }, { note: 5.5, distanceMin: 10.7 }, { note: 5, distanceMin: 10.9 },
  { note: 4.5, distanceMin: 11.1 }, { note: 4, distanceMin: 11.2 }, { note: 3.5, distanceMin: 11.4 },
  { note: 3, distanceMin: 11.6 }, { note: 2.5, distanceMin: 11.8 }, { note: 2, distanceMin: 12.0 },
  { note: 1.5, distanceMin: 12.2 }, { note: 1, distanceMin: 12.4 }
]));

// 3ème Filles (60m - Page 9)
baremes.push(createBareme("bar_vit60m_3eme_f", "Course de vitesse de 60 mètres", null, "Troisième", "Fille", "temps", [
  { note: 20, distanceMin: 8.6 }, { note: 19, distanceMin: 8.7 }, { note: 18, distanceMin: 8.8 },
  { note: 17, distanceMin: 8.9 }, { note: 16, distanceMin: 9.0 }, { note: 15, distanceMin: 9.2 },
  { note: 14, distanceMin: 9.3 }, { note: 13, distanceMin: 9.4 }, { note: 12.5, distanceMin: 9.6 },
  { note: 12, distanceMin: 9.7 }, { note: 11.5, distanceMin: 9.9 }, { note: 11, distanceMin: 10.1 },
  { note: 10.5, distanceMin: 10.2 }, { note: 10, distanceMin: 10.4 }, { note: 9.5, distanceMin: 10.5 },
  { note: 9, distanceMin: 10.7 }, { note: 8.5, distanceMin: 10.9 }, { note: 8, distanceMin: 11.1 },
  { note: 7.5, distanceMin: 11.2 }, { note: 7, distanceMin: 11.4 }, { note: 6.5, distanceMin: 11.6 },
  { note: 6, distanceMin: 11.8 }, { note: 5.5, distanceMin: 12.0 }, { note: 5, distanceMin: 12.2 },
  { note: 4.5, distanceMin: 12.4 }, { note: 4, distanceMin: 12.6 }, { note: 3.5, distanceMin: 12.8 },
  { note: 3, distanceMin: 13.1 }, { note: 2.5, distanceMin: 13.3 }, { note: 2, distanceMin: 13.5 }
]));

// Seconde Garçons (60m - Vitesse progressive)
baremes.push(createBareme("bar_vit60m_2nde_g", "Course de vitesse de 60 mètres", null, "Seconde", "Garçon", "temps", [
  { note: 20, distanceMin: 7.6 }, { note: 19, distanceMin: 7.8 }, { note: 18, distanceMin: 7.9 },
  { note: 17, distanceMin: 8.0 }, { note: 16, distanceMin: 8.1 }, { note: 15, distanceMin: 8.2 },
  { note: 14, distanceMin: 8.3 }, { note: 13, distanceMin: 8.4 }, { note: 12.5, distanceMin: 8.5 },
  { note: 12, distanceMin: 8.6 }, { note: 11.5, distanceMin: 8.7 }, { note: 11, distanceMin: 8.8 },
  { note: 10.5, distanceMin: 8.9 }, { note: 10, distanceMin: 9.0 }, { note: 9.5, distanceMin: 9.2 },
  { note: 9, distanceMin: 9.4 }, { note: 8.5, distanceMin: 9.6 }, { note: 8, distanceMin: 9.8 },
  { note: 7.5, distanceMin: 10.0 }, { note: 7, distanceMin: 10.2 }, { note: 6.5, distanceMin: 10.4 },
  { note: 6, distanceMin: 10.6 }, { note: 5.5, distanceMin: 10.8 }, { note: 5, distanceMin: 11.0 },
  { note: 4.5, distanceMin: 11.2 }, { note: 4, distanceMin: 11.4 }, { note: 3.5, distanceMin: 11.6 },
  { note: 3, distanceMin: 11.8 }, { note: 2.5, distanceMin: 12.0 }
]));

// Seconde Filles (60m - Page 11)
baremes.push(createBareme("bar_vit60m_2nde_f", "Course de vitesse de 60 mètres", null, "Seconde", "Fille", "temps", [
  { note: 20, distanceMin: 8.5 }, { note: 19, distanceMin: 8.6 }, { note: 18, distanceMin: 8.8 },
  { note: 17, distanceMin: 8.9 }, { note: 16, distanceMin: 9.0 }, { note: 15, distanceMin: 9.2 },
  { note: 14, distanceMin: 9.3 }, { note: 13, distanceMin: 9.5 }, { note: 12.5, distanceMin: 9.6 },
  { note: 12, distanceMin: 9.8 }, { note: 11.5, distanceMin: 9.9 }, { note: 11, distanceMin: 10.1 },
  { note: 10.5, distanceMin: 10.3 }, { note: 10, distanceMin: 10.4 }, { note: 9.5, distanceMin: 10.6 },
  { note: 9, distanceMin: 10.8 }, { note: 8.5, distanceMin: 10.9 }, { note: 8, distanceMin: 11.1 },
  { note: 7.5, distanceMin: 11.3 }, { note: 7, distanceMin: 11.5 }, { note: 6.5, distanceMin: 11.7 },
  { note: 6, distanceMin: 11.8 }, { note: 5.5, distanceMin: 12.0 }, { note: 5, distanceMin: 12.2 },
  { note: 4.5, distanceMin: 12.5 }, { note: 4, distanceMin: 12.7 }, { note: 3.5, distanceMin: 12.9 }
]));

// Première Garçons (60m - Vitesse progressive)
baremes.push(createBareme("bar_vit60m_1ere_g", "Course de vitesse de 60 mètres", null, "Première", "Garçon", "temps", [
  { note: 20, distanceMin: 7.4 }, { note: 19, distanceMin: 7.6 }, { note: 18, distanceMin: 7.7 },
  { note: 17, distanceMin: 7.8 }, { note: 16, distanceMin: 7.9 }, { note: 15, distanceMin: 8.0 },
  { note: 14, distanceMin: 8.1 }, { note: 13, distanceMin: 8.2 }, { note: 12.5, distanceMin: 8.3 },
  { note: 12, distanceMin: 8.4 }, { note: 11.5, distanceMin: 8.5 }, { note: 11, distanceMin: 8.6 },
  { note: 10.5, distanceMin: 8.8 }, { note: 10, distanceMin: 9.0 }, { note: 9.5, distanceMin: 9.1 },
  { note: 9, distanceMin: 9.3 }, { note: 8.5, distanceMin: 9.5 }, { note: 8, distanceMin: 9.7 },
  { note: 7.5, distanceMin: 9.9 }, { note: 7, distanceMin: 10.1 }, { note: 6.5, distanceMin: 10.3 },
  { note: 6, distanceMin: 10.5 }, { note: 5.5, distanceMin: 10.7 }, { note: 5, distanceMin: 10.9 },
  { note: 4.5, distanceMin: 11.1 }, { note: 4, distanceMin: 11.3 }, { note: 3.5, distanceMin: 11.5 },
  { note: 3, distanceMin: 11.7 }, { note: 2.5, distanceMin: 11.9 }
]));

// Première Filles (60m - Page 13)
baremes.push(createBareme("bar_vit60m_1ere_f", "Course de vitesse de 60 mètres", null, "Première", "Fille", "temps", [
  { note: 20, distanceMin: 8.4 }, { note: 19, distanceMin: 8.5 }, { note: 18, distanceMin: 8.6 },
  { note: 17, distanceMin: 8.8 }, { note: 16, distanceMin: 8.9 }, { note: 15, distanceMin: 9.0 },
  { note: 14, distanceMin: 9.2 }, { note: 13, distanceMin: 9.3 }, { note: 12.5, distanceMin: 9.5 },
  { note: 12, distanceMin: 9.6 }, { note: 11.5, distanceMin: 9.8 }, { note: 11, distanceMin: 9.9 },
  { note: 10.5, distanceMin: 10.1 }, { note: 10, distanceMin: 10.3 }, { note: 9.5, distanceMin: 10.4 },
  { note: 9, distanceMin: 10.6 }, { note: 8.5, distanceMin: 10.8 }, { note: 8, distanceMin: 10.9 },
  { note: 7.5, distanceMin: 11.1 }, { note: 7, distanceMin: 11.3 }, { note: 6.5, distanceMin: 11.5 },
  { note: 6, distanceMin: 11.7 }, { note: 5.5, distanceMin: 11.8 }, { note: 5, distanceMin: 12.0 },
  { note: 4.5, distanceMin: 12.2 }, { note: 4, distanceMin: 12.5 }, { note: 3.5, distanceMin: 12.7 },
  { note: 3, distanceMin: 12.9 }
]));

// Terminale Garçons (60m - Vitesse progressive)
baremes.push(createBareme("bar_vit60m_term_g", "Course de vitesse de 60 mètres", null, "Terminale", "Garçon", "temps", [
  { note: 20, distanceMin: 7.2 }, { note: 19, distanceMin: 7.4 }, { note: 18, distanceMin: 7.5 },
  { note: 17, distanceMin: 7.6 }, { note: 16, distanceMin: 7.7 }, { note: 15, distanceMin: 7.8 },
  { note: 14, distanceMin: 7.9 }, { note: 13, distanceMin: 8.0 }, { note: 12.5, distanceMin: 8.1 },
  { note: 12, distanceMin: 8.2 }, { note: 11.5, distanceMin: 8.3 }, { note: 11, distanceMin: 8.4 },
  { note: 10.5, distanceMin: 8.6 }, { note: 10, distanceMin: 8.8 }, { note: 9.5, distanceMin: 8.9 },
  { note: 9, distanceMin: 9.1 }, { note: 8.5, distanceMin: 9.3 }, { note: 8, distanceMin: 9.5 },
  { note: 7.5, distanceMin: 9.7 }, { note: 7, distanceMin: 9.9 }, { note: 6.5, distanceMin: 10.1 },
  { note: 6, distanceMin: 10.3 }, { note: 5.5, distanceMin: 10.5 }, { note: 5, distanceMin: 10.7 },
  { note: 4.5, distanceMin: 10.9 }, { note: 4, distanceMin: 11.1 }, { note: 3.5, distanceMin: 11.3 },
  { note: 3, distanceMin: 11.5 }, { note: 2.5, distanceMin: 11.7 }
]));

// Terminale Filles (60m - Page 15)
baremes.push(createBareme("bar_vit60m_term_f", "Course de vitesse de 60 mètres", null, "Terminale", "Fille", "temps", [
  { note: 20, distanceMin: 8.2 }, { note: 19, distanceMin: 8.4 }, { note: 18, distanceMin: 8.5 },
  { note: 17, distanceMin: 8.6 }, { note: 16, distanceMin: 8.8 }, { note: 15, distanceMin: 8.9 },
  { note: 14, distanceMin: 9.0 }, { note: 13, distanceMin: 9.2 }, { note: 12.5, distanceMin: 9.3 },
  { note: 12, distanceMin: 9.5 }, { note: 11.5, distanceMin: 9.6 }, { note: 11, distanceMin: 9.8 },
  { note: 10.5, distanceMin: 9.9 }, { note: 10, distanceMin: 10.1 }, { note: 9.5, distanceMin: 10.3 },
  { note: 9, distanceMin: 10.4 }, { note: 8.5, distanceMin: 10.6 }, { note: 8, distanceMin: 10.8 },
  { note: 7.5, distanceMin: 10.9 }, { note: 7, distanceMin: 11.1 }, { note: 6.5, distanceMin: 11.3 },
  { note: 6, distanceMin: 11.5 }, { note: 5.5, distanceMin: 11.7 }, { note: 5, distanceMin: 11.8 },
  { note: 4.5, distanceMin: 12.0 }, { note: 4, distanceMin: 12.2 }, { note: 3.5, distanceMin: 12.5 },
  { note: 3, distanceMin: 12.7 }, { note: 2.5, distanceMin: 12.9 }
]));


// ============================================================================
// 3. COURSE DE VITESSE DE 80M (BARÈMES OFFICIELS EXTRAITS DU PDF)
// ============================================================================

// Seconde Garçons (80m - Page 10)
baremes.push(createBareme("bar_vit80m_2nde_g", "Course de vitesse de 80m", null, "Seconde", "Garçon", "temps", [
  { note: 20, distanceMin: 9.9 }, { note: 19, distanceMin: 10.1 }, { note: 18, distanceMin: 10.3 },
  { note: 17, distanceMin: 10.4 }, { note: 16, distanceMin: 10.6 }, { note: 15, distanceMin: 10.8 },
  { note: 14, distanceMin: 10.9 }, { note: 13, distanceMin: 11.1 }, { note: 12.5, distanceMin: 11.3 },
  { note: 12, distanceMin: 11.5 }, { note: 11.5, distanceMin: 11.7 }, { note: 11, distanceMin: 11.8 },
  { note: 10.5, distanceMin: 12.0 }, { note: 10, distanceMin: 12.2 }, { note: 9.5, distanceMin: 12.5 },
  { note: 9, distanceMin: 12.7 }, { note: 8.5, distanceMin: 12.9 }, { note: 8, distanceMin: 13.1 },
  { note: 7.5, distanceMin: 13.3 }, { note: 7, distanceMin: 13.5 }, { note: 6.5, distanceMin: 13.7 },
  { note: 6, distanceMin: 14.0 }, { note: 5.5, distanceMin: 14.2 }, { note: 5, distanceMin: 14.4 },
  { note: 4.5, distanceMin: 14.7 }, { note: 4, distanceMin: 14.9 }, { note: 3.5, distanceMin: 15.2 },
  { note: 3, distanceMin: 15.5 }, { note: 2.5, distanceMin: 15.7 }
]));

// Première Garçons (80m - Page 12)
baremes.push(createBareme("bar_vit80m_1ere_g", "Course de vitesse de 80m", null, "Première", "Garçon", "temps", [
  { note: 20, distanceMin: 9.8 }, { note: 19, distanceMin: 9.9 }, { note: 18, distanceMin: 10.1 },
  { note: 17, distanceMin: 10.3 }, { note: 16, distanceMin: 10.4 }, { note: 15, distanceMin: 10.6 },
  { note: 14, distanceMin: 10.8 }, { note: 13, distanceMin: 10.9 }, { note: 12.5, distanceMin: 11.1 },
  { note: 12, distanceMin: 11.3 }, { note: 11.5, distanceMin: 11.5 }, { note: 11, distanceMin: 11.7 },
  { note: 10.5, distanceMin: 11.8 }, { note: 10, distanceMin: 12.0 }, { note: 9.5, distanceMin: 12.2 },
  { note: 9, distanceMin: 12.5 }, { note: 8.5, distanceMin: 12.7 }, { note: 8, distanceMin: 12.9 },
  { note: 7.5, distanceMin: 13.1 }, { note: 7, distanceMin: 13.3 }, { note: 6.5, distanceMin: 13.5 },
  { note: 6, distanceMin: 13.7 }, { note: 5.5, distanceMin: 14.0 }, { note: 5, distanceMin: 14.2 },
  { note: 4.5, distanceMin: 14.4 }, { note: 4, distanceMin: 14.7 }, { note: 3.5, distanceMin: 14.9 },
  { note: 3, distanceMin: 15.2 }, { note: 2.5, distanceMin: 15.5 }
]));

// Terminale Garçons (80m - Page 14)
baremes.push(createBareme("bar_vit80m_term_g", "Course de vitesse de 80m", null, "Terminale", "Garçon", "temps", [
  { note: 20, distanceMin: 9.6 }, { note: 19, distanceMin: 9.8 }, { note: 18, distanceMin: 9.9 },
  { note: 17, distanceMin: 10.1 }, { note: 16, distanceMin: 10.3 }, { note: 15, distanceMin: 10.4 },
  { note: 14, distanceMin: 10.6 }, { note: 13, distanceMin: 10.8 }, { note: 12.5, distanceMin: 10.9 },
  { note: 12, distanceMin: 11.1 }, { note: 11.5, distanceMin: 11.3 }, { note: 11, distanceMin: 11.5 },
  { note: 10.5, distanceMin: 11.7 }, { note: 10, distanceMin: 11.8 }, { note: 9.5, distanceMin: 12.0 },
  { note: 9, distanceMin: 12.2 }, { note: 8.5, distanceMin: 12.5 }, { note: 8, distanceMin: 12.7 },
  { note: 7.5, distanceMin: 12.9 }, { note: 7, distanceMin: 13.1 }, { note: 6.5, distanceMin: 13.3 },
  { note: 6, distanceMin: 13.5 }, { note: 5.5, distanceMin: 13.7 }, { note: 5, distanceMin: 14.0 },
  { note: 4.5, distanceMin: 14.2 }, { note: 4, distanceMin: 14.4 }, { note: 3.5, distanceMin: 14.7 },
  { note: 3, distanceMin: 14.9 }, { note: 2.5, distanceMin: 15.2 }
]));

// 80m : Uniquement Garçons Lycée (Seconde, Première, Terminale) selon le barème officiel du PDF



// ============================================================================
// 4. COURSE 800M (BARÈMES OFFICIELS EXTRAITS DU PDF POUR LES FILLES)
// ============================================================================

function ms(str) {
  const match = /^(\d+)'(\d{2})$/.exec(str);
  if (!match) throw new Error(`Temps invalide : "${str}"`);
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function grilleTemps(id, paires) {
  const grille = paires.map(([note, temps]) => ({ note, distanceMin: ms(temps) }));
  for (let i = 1; i < grille.length; i++) {
    if (grille[i].note >= grille[i - 1].note || grille[i].distanceMin <= grille[i - 1].distanceMin) {
      throw new Error(`Grille incohérente (${id}) à la note ${grille[i].note}`);
    }
  }
  return grille;
}

const BAREMES_800M_FILLES = [
  {
    id: "bar_800m_6eme_f", classe: "Sixième",
    grille: [
      [20, "2'10"], [19, "2'13"], [18, "2'16"], [17, "2'19"], [16, "2'21"], [15, "2'24"],
      [14, "2'27"], [13, "2'30"], [12.5, "2'33"], [12, "2'37"], [11.5, "2'40"], [11, "2'43"],
      [10.5, "2'47"], [10, "2'50"], [9.5, "2'58"], [9, "3'00"], [8.5, "3'10"], [8, "3'20"],
      [7.5, "3'40"], [7, "3'50"], [6.5, "4'00"], [5.5, "4'10"], [4.5, "4'20"], [3.5, "4'30"]
    ]
  },
  {
    id: "bar_800m_5eme_f", classe: "Cinquième",
    grille: [
      [20, "2'08"], [19, "2'10"], [18, "2'13"], [17, "2'16"], [16, "2'19"], [15, "2'21"],
      [14, "2'24"], [13, "2'27"], [12.5, "2'30"], [12, "2'33"], [11.5, "2'37"], [11, "2'40"],
      [10.5, "2'43"], [10, "2'47"], [9.5, "2'50"], [9, "2'58"], [8.5, "3'00"], [8, "3'10"],
      [7.5, "3'20"], [7, "3'40"], [6.5, "3'50"], [6, "4'00"], [5, "4'10"], [4, "4'20"], [3, "4'30"]
    ]
  },
  {
    id: "bar_800m_4eme_f", classe: "Quatrième",
    grille: [
      [20, "2'05"], [19, "2'08"], [18, "2'10"], [17, "2'13"], [16, "2'16"], [15, "2'19"],
      [14, "2'21"], [13, "2'24"], [12.5, "2'27"], [12, "2'30"], [11.5, "2'33"], [11, "2'37"],
      [10.5, "2'40"], [10, "2'43"], [9.5, "2'47"], [9, "2'50"], [8.5, "2'58"], [8, "3'00"],
      [7.5, "3'10"], [7, "3'20"], [6.5, "3'40"], [6, "3'50"], [5.5, "4'00"], [4.5, "4'10"],
      [3.5, "4'20"], [2.5, "4'30"]
    ]
  },
  {
    id: "bar_800m_3eme_f", classe: "Troisième",
    grille: [
      [20, "2'03"], [19, "2'05"], [18, "2'08"], [17, "2'10"], [16, "2'13"], [15, "2'16"],
      [14, "2'19"], [13, "2'21"], [12.5, "2'24"], [12, "2'27"], [11.5, "2'30"], [11, "2'33"],
      [10.5, "2'37"], [10, "2'40"], [9.5, "2'43"], [9, "2'47"], [8.5, "2'50"], [8, "2'58"],
      [7.5, "3'00"], [7, "3'10"], [6.5, "3'20"], [6, "3'40"], [5.5, "3'50"], [5, "4'00"],
      [4, "4'10"], [3, "4'20"], [2, "4'30"]
    ]
  },
  {
    id: "bar_800m_2nde_f", classe: "Seconde",
    grille: [
      [20, "1'49"], [19, "1'51"], [18, "1'53"], [17, "1'55"], [16, "1'58"], [15, "2'00"],
      [14, "2'03"], [13, "2'05"], [12.5, "2'08"], [12, "2'10"], [11.5, "2'13"], [11, "2'16"],
      [10.5, "2'19"], [10, "2'21"], [9.5, "2'24"], [9, "2'27"], [8.5, "2'30"], [8, "2'33"],
      [7.5, "2'37"], [7, "2'40"], [6.5, "2'43"], [6, "2'47"], [5.5, "2'50"], [5, "2'54"],
      [4.5, "2'57"], [4, "3'01"], [3.5, "3'05"]
    ]
  },
  {
    id: "bar_800m_1ere_f", classe: "Première",
    grille: [
      [20, "1'46"], [19, "1'49"], [18, "1'51"], [17, "1'53"], [16, "1'55"], [15, "1'58"],
      [14, "2'00"], [13, "2'03"], [12.5, "2'05"], [12, "2'08"], [11.5, "2'10"], [11, "2'13"],
      [10.5, "2'16"], [10, "2'19"], [9.5, "2'21"], [9, "2'24"], [8.5, "2'27"], [8, "2'30"],
      [7.5, "2'33"], [7, "2'37"], [6.5, "2'40"], [6, "2'43"], [5.5, "2'47"], [5, "2'50"],
      [4.5, "2'54"], [4, "2'57"], [3.5, "3'01"], [3, "3'05"]
    ]
  },
  {
    id: "bar_800m_term_f", classe: "Terminale",
    grille: [
      [20, "1'44"], [19, "1'46"], [18, "1'49"], [17, "1'51"], [16, "1'53"], [15, "1'55"],
      [14, "1'58"], [13, "2'00"], [12.5, "2'03"], [12, "2'05"], [11.5, "2'08"], [11, "2'10"],
      [10.5, "2'13"], [10, "2'16"], [9.5, "2'19"], [9, "2'21"], [8.5, "2'24"], [8, "2'27"],
      [7.5, "2'30"], [7, "2'33"], [6.5, "2'37"], [6, "2'40"], [5.5, "2'43"], [5, "2'47"],
      [4.5, "2'50"], [4, "2'54"], [3.5, "2'57"], [3, "3'01"], [2.5, "3'05"]
    ]
  }
];

for (const b of BAREMES_800M_FILLES) {
  const g = grilleTemps(b.id, b.grille);
  baremes.push(createBareme(b.id, "Course 800m", null, b.classe, "Fille", "temps", g));
}


// ============================================================================
// 5. COURSE 1000M (BARÈMES OFFICIELS EXTRAITS DU PDF POUR LES GARÇONS)
// ============================================================================

const BAREMES_1000M_GARCONS = [
  {
    id: "bar_1000m_6eme_g", classe: "Sixième",
    grille: [
      [20, "3'09"], [19, "3'13"], [18, "3'17"], [17, "3'21"], [16, "3'26"], [15, "3'30"],
      [14, "3'35"], [13, "3'39"], [12.5, "3'44"], [12, "3'49"], [11.5, "3'54"], [11, "4'00"],
      [10.5, "4'04"], [10, "4'09"], [9.5, "4'14"], [9, "4'20"], [8.5, "4'25"], [7.5, "4'30"],
      [6.5, "4'37"], [5.5, "5'45"], [4.5, "6'00"], [3.5, "6'30"], [2.5, "6'45"], [1.5, "7'10"],
    ],
  },
  {
    id: "bar_1000m_5eme_g", classe: "Cinquième",
    grille: [
      [20, "3'05"], [19, "3'09"], [18, "3'13"], [17, "3'17"], [16, "3'21"], [15, "3'26"],
      [14, "3'30"], [13, "3'35"], [12.5, "3'39"], [12, "3'44"], [11.5, "3'49"], [11, "3'54"],
      [10.5, "4'00"], [10, "4'04"], [9.5, "4'09"], [9, "4'14"], [8.5, "4'20"], [8, "4'25"],
      [7, "4'30"], [6, "4'37"], [5, "5'45"], [4, "6'00"], [3, "6'30"], [2, "6'45"], [1, "7'10"],
    ],
  },
  {
    id: "bar_1000m_4eme_g", classe: "Quatrième",
    grille: [
      [20, "3'01"], [19, "3'05"], [18, "3'09"], [17, "3'13"], [16, "3'17"], [15, "3'21"],
      [14, "3'26"], [13, "3'30"], [12.5, "3'35"], [12, "3'39"], [11.5, "3'44"], [11, "3'49"],
      [10.5, "3'54"], [10, "4'00"], [9.5, "4'04"], [9, "4'09"], [8.5, "4'14"], [8, "4'20"],
      [7.5, "4'25"], [6.5, "4'30"], [5.5, "4'37"], [4.5, "5'45"], [3.5, "6'00"], [2.5, "6'30"],
      [1.5, "6'45"],
    ],
  },
  {
    id: "bar_1000m_3eme_g", classe: "Troisième",
    grille: [
      [20, "2'57"], [19, "3'01"], [18, "3'05"], [17, "3'09"], [16, "3'13"], [15, "3'17"],
      [14, "3'21"], [13, "3'26"], [12.5, "3'30"], [12, "3'35"], [11.5, "3'39"], [11, "3'44"],
      [10.5, "3'49"], [10, "3'54"], [9.5, "4'00"], [9, "4'04"], [8.5, "4'09"], [8, "4'14"],
      [7.5, "4'20"], [7, "4'25"], [6, "4'30"], [5, "4'37"], [4, "5'45"], [3, "6'00"],
      [2, "6'30"], [1, "6'45"],
    ],
  },
  {
    id: "bar_1000m_2nde_g", classe: "Seconde",
    grille: [
      [20, "2'52"], [19, "2'56"], [18, "3'00"], [17, "3'03"], [16, "3'07"], [15, "3'11"],
      [14, "3'15"], [13, "3'20"], [12.5, "3'24"], [12, "3'28"], [11.5, "3'33"], [11, "3'37"],
      [10.5, "3'42"], [10, "3'47"], [9.5, "3'52"], [9, "3'57"], [8.5, "4'02"], [8, "4'07"],
      [7.5, "4'12"], [7, "4'18"], [6.5, "4'23"], [6, "4'29"], [5.5, "4'35"], [5, "4'41"],
      [4.5, "4'47"], [4, "4'53"], [3.5, "5'00"], [3, "5'06"],
    ],
  },
  {
    id: "bar_1000m_1ere_g", classe: "Première",
    grille: [
      [20, "2'49"], [19, "2'52"], [18, "2'56"], [17, "3'00"], [16, "3'03"], [15, "3'07"],
      [14, "3'11"], [13, "3'15"], [12.5, "3'20"], [12, "3'24"], [11.5, "3'28"], [11, "3'33"],
      [10.5, "3'37"], [10, "3'42"], [9.5, "3'47"], [9, "3'52"], [8.5, "3'57"], [8, "4'02"],
      [7.5, "4'07"], [7, "4'12"], [6.5, "4'18"], [6, "4'23"], [5.5, "4'29"], [5, "4'35"],
      [4.5, "4'41"], [4, "4'47"], [3.5, "4'53"], [3, "5'00"], [2.5, "5'06"],
    ],
  },
  {
    id: "bar_1000m_term_g", classe: "Terminale",
    grille: [
      [20, "2'45"], [19, "2'49"], [18, "2'52"], [17, "2'56"], [16, "3'00"], [15, "3'03"],
      [14, "3'07"], [13, "3'11"], [12.5, "3'15"], [12, "3'20"], [11.5, "3'24"], [11, "3'28"],
      [10.5, "3'33"], [10, "3'37"], [9.5, "3'42"], [9, "3'47"], [8.5, "3'52"], [8, "3'57"],
      [7.5, "4'02"], [7, "4'07"], [6.5, "4'12"], [6, "4'18"], [5.5, "4'23"], [5, "4'29"],
      [4.5, "4'35"], [4, "4'41"], [3.5, "4'47"], [3, "4'53"], [2.5, "5'00"],
    ],
  },
];

for (const b of BAREMES_1000M_GARCONS) {
  const g = grilleTemps(b.id, b.grille);
  baremes.push(createBareme(b.id, "Course 1000m", null, b.classe, "Garçon", "temps", g));
}

// NOTE : La course de haies a été retirée à la demande de l'utilisateur.


// 5. SAUT EN HAUTEUR - BARÈMES OFFICIELS EXTRAITS DU PDF
// ============================================================================

const hg6 = [{ note: 20, distanceMin: 1.45 }, { note: 19, distanceMin: 1.40 }, { note: 17, distanceMin: 1.35 }, { note: 16, distanceMin: 1.30 }, { note: 14, distanceMin: 1.25 }, { note: 13, distanceMin: 1.20 }, { note: 11.5, distanceMin: 1.10 }, { note: 10.5, distanceMin: 1.05 }, { note: 8.5, distanceMin: 0.95 }, { note: 7.5, distanceMin: 0.90 }, { note: 6.5, distanceMin: 0.85 }, { note: 5.5, distanceMin: 0.80 }, { note: 4, distanceMin: 0.75 }, { note: 3, distanceMin: 0.70 }, { note: 1.5, distanceMin: 0.65 }];
const hf6 = [{ note: 20, distanceMin: 1.20 }, { note: 18, distanceMin: 1.15 }, { note: 17, distanceMin: 1.10 }, { note: 15, distanceMin: 1.05 }, { note: 13, distanceMin: 1.00 }, { note: 12, distanceMin: 0.95 }, { note: 11, distanceMin: 0.90 }, { note: 10, distanceMin: 0.85 }, { note: 9, distanceMin: 0.80 }, { note: 7.5, distanceMin: 0.75 }, { note: 6.5, distanceMin: 0.70 }, { note: 5, distanceMin: 0.65 }, { note: 4, distanceMin: 0.60 }, { note: 3.5, distanceMin: 0.55 }];

const hg5 = [{ note: 20, distanceMin: 1.50 }, { note: 19, distanceMin: 1.45 }, { note: 18, distanceMin: 1.40 }, { note: 16, distanceMin: 1.35 }, { note: 15, distanceMin: 1.30 }, { note: 13, distanceMin: 1.25 }, { note: 12.5, distanceMin: 1.20 }, { note: 11.5, distanceMin: 1.15 }, { note: 11, distanceMin: 1.10 }, { note: 10, distanceMin: 1.05 }, { note: 9, distanceMin: 1.00 }, { note: 8, distanceMin: 0.95 }, { note: 7, distanceMin: 0.90 }, { note: 6, distanceMin: 0.85 }, { note: 5, distanceMin: 0.80 }, { note: 3.5, distanceMin: 0.75 }, { note: 2.5, distanceMin: 0.70 }, { note: 1, distanceMin: 0.65 }];
const hf5 = [{ note: 20, distanceMin: 1.25 }, { note: 19, distanceMin: 1.20 }, { note: 17, distanceMin: 1.15 }, { note: 16, distanceMin: 1.10 }, { note: 14, distanceMin: 1.05 }, { note: 12.5, distanceMin: 1.00 }, { note: 11.5, distanceMin: 0.95 }, { note: 10.5, distanceMin: 0.90 }, { note: 9.5, distanceMin: 0.85 }, { note: 8.5, distanceMin: 0.80 }, { note: 7, distanceMin: 0.75 }, { note: 6, distanceMin: 0.70 }, { note: 4.5, distanceMin: 0.65 }, { note: 3.5, distanceMin: 0.60 }, { note: 3, distanceMin: 0.55 }];

const hg4 = [{ note: 19, distanceMin: 1.50 }, { note: 18, distanceMin: 1.45 }, { note: 17, distanceMin: 1.40 }, { note: 15, distanceMin: 1.35 }, { note: 14, distanceMin: 1.30 }, { note: 12.5, distanceMin: 1.25 }, { note: 12, distanceMin: 1.20 }, { note: 11, distanceMin: 1.15 }, { note: 10.5, distanceMin: 1.10 }, { note: 9.5, distanceMin: 1.05 }, { note: 8.5, distanceMin: 1.00 }, { note: 7.5, distanceMin: 0.95 }, { note: 6.5, distanceMin: 0.90 }, { note: 5.5, distanceMin: 0.85 }, { note: 4.5, distanceMin: 0.80 }, { note: 3, distanceMin: 0.75 }, { note: 2, distanceMin: 0.70 }];
const hf4 = [{ note: 19, distanceMin: 1.25 }, { note: 18, distanceMin: 1.20 }, { note: 16, distanceMin: 1.15 }, { note: 15, distanceMin: 1.10 }, { note: 13, distanceMin: 1.05 }, { note: 12, distanceMin: 1.00 }, { note: 11, distanceMin: 0.95 }, { note: 10, distanceMin: 0.90 }, { note: 9, distanceMin: 0.85 }, { note: 8, distanceMin: 0.80 }, { note: 6.5, distanceMin: 0.75 }, { note: 5.5, distanceMin: 0.70 }, { note: 4, distanceMin: 0.65 }, { note: 3, distanceMin: 0.60 }, { note: 2.5, distanceMin: 0.55 }];

const hg3 = [{ note: 20, distanceMin: 1.55 }, { note: 18, distanceMin: 1.50 }, { note: 17, distanceMin: 1.45 }, { note: 16, distanceMin: 1.40 }, { note: 14, distanceMin: 1.35 }, { note: 13, distanceMin: 1.30 }, { note: 12, distanceMin: 1.25 }, { note: 11.5, distanceMin: 1.20 }, { note: 10.5, distanceMin: 1.15 }, { note: 10, distanceMin: 1.10 }, { note: 9, distanceMin: 1.05 }, { note: 8, distanceMin: 1.00 }, { note: 7, distanceMin: 0.95 }, { note: 6, distanceMin: 0.90 }, { note: 5, distanceMin: 0.85 }, { note: 4, distanceMin: 0.80 }, { note: 2.5, distanceMin: 0.75 }, { note: 1.5, distanceMin: 0.70 }];
const hf3 = [{ note: 20, distanceMin: 1.30 }, { note: 18, distanceMin: 1.25 }, { note: 17, distanceMin: 1.20 }, { note: 15, distanceMin: 1.15 }, { note: 14, distanceMin: 1.10 }, { note: 12.5, distanceMin: 1.05 }, { note: 11.5, distanceMin: 1.00 }, { note: 10.5, distanceMin: 0.95 }, { note: 9.5, distanceMin: 0.90 }, { note: 8.5, distanceMin: 0.85 }, { note: 7.5, distanceMin: 0.80 }, { note: 6, distanceMin: 0.75 }, { note: 5, distanceMin: 0.70 }, { note: 3.5, distanceMin: 0.65 }, { note: 2.5, distanceMin: 0.60 }, { note: 2, distanceMin: 0.55 }];

const hg2 = [{ note: 20, distanceMin: 1.65 }, { note: 19, distanceMin: 1.60 }, { note: 18, distanceMin: 1.55 }, { note: 17, distanceMin: 1.50 }, { note: 15, distanceMin: 1.45 }, { note: 14, distanceMin: 1.40 }, { note: 12.5, distanceMin: 1.35 }, { note: 12, distanceMin: 1.30 }, { note: 11.5, distanceMin: 1.25 }, { note: 10.5, distanceMin: 1.20 }, { note: 9.5, distanceMin: 1.15 }, { note: 9, distanceMin: 1.10 }, { note: 8, distanceMin: 1.05 }, { note: 7, distanceMin: 1.00 }, { note: 6, distanceMin: 0.95 }, { note: 5, distanceMin: 0.90 }, { note: 4, distanceMin: 0.85 }, { note: 3, distanceMin: 0.80 }];
const hf2 = [{ note: 19, distanceMin: 1.35 }, { note: 18, distanceMin: 1.30 }, { note: 17, distanceMin: 1.25 }, { note: 15, distanceMin: 1.20 }, { note: 13, distanceMin: 1.15 }, { note: 12.5, distanceMin: 1.10 }, { note: 11.5, distanceMin: 1.05 }, { note: 10.5, distanceMin: 1.00 }, { note: 9.5, distanceMin: 0.95 }, { note: 8.5, distanceMin: 0.90 }, { note: 7.5, distanceMin: 0.85 }, { note: 6.5, distanceMin: 0.80 }, { note: 5, distanceMin: 0.75 }, { note: 4, distanceMin: 0.70 }];

const hg1 = [{ note: 20, distanceMin: 1.70 }, { note: 19, distanceMin: 1.65 }, { note: 18, distanceMin: 1.60 }, { note: 17, distanceMin: 1.55 }, { note: 16, distanceMin: 1.50 }, { note: 14, distanceMin: 1.45 }, { note: 13, distanceMin: 1.40 }, { note: 12, distanceMin: 1.35 }, { note: 11, distanceMin: 1.30 }, { note: 10.5, distanceMin: 1.25 }, { note: 10, distanceMin: 1.20 }, { note: 9, distanceMin: 1.15 }, { note: 8.5, distanceMin: 1.10 }, { note: 7.5, distanceMin: 1.05 }, { note: 6.5, distanceMin: 1.00 }, { note: 5.5, distanceMin: 0.95 }, { note: 4.5, distanceMin: 0.90 }, { note: 3.5, distanceMin: 0.85 }, { note: 2.5, distanceMin: 0.80 }];
const hf1 = [{ note: 20, distanceMin: 1.40 }, { note: 18, distanceMin: 1.35 }, { note: 17, distanceMin: 1.30 }, { note: 16, distanceMin: 1.25 }, { note: 14, distanceMin: 1.20 }, { note: 12.5, distanceMin: 1.15 }, { note: 12, distanceMin: 1.10 }, { note: 11, distanceMin: 1.05 }, { note: 10, distanceMin: 1.00 }, { note: 9, distanceMin: 0.95 }, { note: 8, distanceMin: 0.90 }, { note: 7, distanceMin: 0.85 }, { note: 6, distanceMin: 0.80 }, { note: 4.5, distanceMin: 0.75 }, { note: 3.5, distanceMin: 0.70 }];

const hgt = [{ note: 20, distanceMin: 1.75 }, { note: 19, distanceMin: 1.70 }, { note: 18, distanceMin: 1.65 }, { note: 17, distanceMin: 1.60 }, { note: 16, distanceMin: 1.55 }, { note: 15, distanceMin: 1.50 }, { note: 13, distanceMin: 1.45 }, { note: 12.5, distanceMin: 1.40 }, { note: 11.5, distanceMin: 1.35 }, { note: 11, distanceMin: 1.30 }, { note: 10.5, distanceMin: 1.25 }, { note: 9.5, distanceMin: 1.20 }, { note: 8.5, distanceMin: 1.15 }, { note: 8, distanceMin: 1.10 }, { note: 7, distanceMin: 1.05 }, { note: 6, distanceMin: 1.00 }, { note: 5, distanceMin: 0.95 }, { note: 4, distanceMin: 0.90 }, { note: 3, distanceMin: 0.85 }];
const hft = [{ note: 20, distanceMin: 1.45 }, { note: 19, distanceMin: 1.40 }, { note: 17, distanceMin: 1.35 }, { note: 16, distanceMin: 1.30 }, { note: 15, distanceMin: 1.25 }, { note: 13, distanceMin: 1.20 }, { note: 12, distanceMin: 1.15 }, { note: 11.5, distanceMin: 1.10 }, { note: 10.5, distanceMin: 1.05 }, { note: 9.5, distanceMin: 1.00 }, { note: 8.5, distanceMin: 0.95 }, { note: 7.5, distanceMin: 0.90 }, { note: 6.5, distanceMin: 0.85 }, { note: 5.5, distanceMin: 0.80 }, { note: 4, distanceMin: 0.75 }, { note: 3, distanceMin: 0.70 }];

baremes.push(createBareme("bar_hauteur_6eme_g", "Saut en hauteur", null, "Sixième", "Garçon", "distance", hg6));
baremes.push(createBareme("bar_hauteur_6eme_f", "Saut en hauteur", null, "Sixième", "Fille", "distance", hf6));
baremes.push(createBareme("bar_hauteur_5eme_g", "Saut en hauteur", null, "Cinquième", "Garçon", "distance", hg5));
baremes.push(createBareme("bar_hauteur_5eme_f", "Saut en hauteur", null, "Cinquième", "Fille", "distance", hf5));
baremes.push(createBareme("bar_hauteur_4eme_g", "Saut en hauteur", null, "Quatrième", "Garçon", "distance", hg4));
baremes.push(createBareme("bar_hauteur_4eme_f", "Saut en hauteur", null, "Quatrième", "Fille", "distance", hf4));
baremes.push(createBareme("bar_hauteur_3eme_g", "Saut en hauteur", null, "Troisième", "Garçon", "distance", hg3));
baremes.push(createBareme("bar_hauteur_3eme_f", "Saut en hauteur", null, "Troisième", "Fille", "distance", hf3));
baremes.push(createBareme("bar_hauteur_2nde_g", "Saut en hauteur", null, "Seconde", "Garçon", "distance", hg2));
baremes.push(createBareme("bar_hauteur_2nde_f", "Saut en hauteur", null, "Seconde", "Fille", "distance", hf2));
baremes.push(createBareme("bar_hauteur_1ere_g", "Saut en hauteur", null, "Première", "Garçon", "distance", hg1));
baremes.push(createBareme("bar_hauteur_1ere_f", "Saut en hauteur", null, "Première", "Fille", "distance", hf1));
baremes.push(createBareme("bar_hauteur_term_g", "Saut en hauteur", null, "Terminale", "Garçon", "distance", hgt));
baremes.push(createBareme("bar_hauteur_term_f", "Saut en hauteur", null, "Terminale", "Fille", "distance", hft));


// ============================================================================
// 6. SAUT EN LONGUEUR & TRIPLE SAUT & PERCHE & DISQUE & JAVELOT
// ============================================================================

const sautsEtLancersConfig = [
  // TRIPLE SAUT
  { cls: "Sixième", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 10.4 }, { note: 19, distanceMin: 10.0 }, { note: 18, distanceMin: 9.7 }, { note: 17, distanceMin: 9.4 }, { note: 16, distanceMin: 9.1 }, { note: 15, distanceMin: 8.9 }, { note: 14, distanceMin: 8.7 }, { note: 13, distanceMin: 8.5 }, { note: 12.5, distanceMin: 8.2 }, { note: 12, distanceMin: 8.0 }, { note: 11.5, distanceMin: 7.8 }, { note: 11, distanceMin: 7.7 }, { note: 10.5, distanceMin: 7.6 }, { note: 10, distanceMin: 7.5 }, { note: 9.5, distanceMin: 7.4 }, { note: 9, distanceMin: 7.3 }, { note: 8.5, distanceMin: 7.2 }, { note: 8, distanceMin: 7.1 }, { note: 7.5, distanceMin: 7.0 }, { note: 7, distanceMin: 6.9 }, { note: 6.5, distanceMin: 6.8 }, { note: 6, distanceMin: 6.7 }, { note: 5.5, distanceMin: 6.6 }, { note: 5, distanceMin: 6.5 }, { note: 4, distanceMin: 6.4 }, { note: 3, distanceMin: 6.3 }, { note: 2, distanceMin: 6.2 }, { note: 1, distanceMin: 6.1 }] },
  { cls: "Sixième", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 8.5 }, { note: 19, distanceMin: 8.2 }, { note: 18, distanceMin: 8.0 }, { note: 17, distanceMin: 7.8 }, { note: 16, distanceMin: 7.7 }, { note: 15, distanceMin: 7.6 }, { note: 14, distanceMin: 7.5 }, { note: 13, distanceMin: 7.4 }, { note: 12.5, distanceMin: 7.3 }, { note: 12, distanceMin: 7.2 }, { note: 11.5, distanceMin: 7.1 }, { note: 11, distanceMin: 7.0 }, { note: 10.5, distanceMin: 6.9 }, { note: 10, distanceMin: 6.8 }, { note: 9.5, distanceMin: 6.7 }, { note: 9, distanceMin: 6.6 }, { note: 8.5, distanceMin: 6.5 }, { note: 7.5, distanceMin: 6.4 }, { note: 6.5, distanceMin: 6.3 }, { note: 4.5, distanceMin: 6.1 }, { note: 3.5, distanceMin: 6.0 }] },
  { cls: "Cinquième", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 10.7 }, { note: 19, distanceMin: 10.4 }, { note: 18, distanceMin: 10.0 }, { note: 17, distanceMin: 9.7 }, { note: 16, distanceMin: 9.4 }, { note: 15, distanceMin: 9.1 }, { note: 14, distanceMin: 8.9 }, { note: 13, distanceMin: 8.7 }, { note: 12.5, distanceMin: 8.5 }, { note: 12, distanceMin: 8.2 }, { note: 11.5, distanceMin: 8.0 }, { note: 11, distanceMin: 7.8 }, { note: 10.5, distanceMin: 7.7 }, { note: 10, distanceMin: 7.6 }, { note: 9.5, distanceMin: 7.5 }, { note: 9, distanceMin: 7.4 }, { note: 8.5, distanceMin: 7.3 }, { note: 8, distanceMin: 7.2 }, { note: 7.5, distanceMin: 7.1 }, { note: 7, distanceMin: 7.0 }, { note: 6.5, distanceMin: 6.9 }, { note: 6, distanceMin: 6.8 }, { note: 5.5, distanceMin: 6.7 }, { note: 5, distanceMin: 6.6 }, { note: 4, distanceMin: 6.4 }, { note: 3, distanceMin: 6.3 }] },
  { cls: "Cinquième", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 8.7 }, { note: 19, distanceMin: 8.5 }, { note: 18, distanceMin: 8.2 }, { note: 17, distanceMin: 8.0 }, { note: 16, distanceMin: 7.8 }, { note: 15, distanceMin: 7.7 }, { note: 14, distanceMin: 7.6 }, { note: 13, distanceMin: 7.5 }, { note: 12.5, distanceMin: 7.4 }, { note: 12, distanceMin: 7.3 }, { note: 11.5, distanceMin: 7.2 }, { note: 11, distanceMin: 7.1 }, { note: 10.5, distanceMin: 7.0 }, { note: 10, distanceMin: 6.9 }, { note: 9.5, distanceMin: 6.8 }, { note: 9, distanceMin: 6.7 }, { note: 8.5, distanceMin: 6.6 }, { note: 7.5, distanceMin: 6.5 }, { note: 6.5, distanceMin: 6.4 }, { note: 5.5, distanceMin: 6.3 }, { note: 4.5, distanceMin: 6.2 }, { note: 3, distanceMin: 6.0 }] },
  { cls: "Quatrième", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 11.0 }, { note: 19, distanceMin: 10.7 }, { note: 18, distanceMin: 10.4 }, { note: 17, distanceMin: 10.0 }, { note: 16, distanceMin: 9.7 }, { note: 15, distanceMin: 9.4 }, { note: 14, distanceMin: 9.1 }, { note: 13, distanceMin: 8.9 }, { note: 12.5, distanceMin: 8.7 }, { note: 12, distanceMin: 8.5 }, { note: 11.5, distanceMin: 8.2 }, { note: 11, distanceMin: 8.0 }, { note: 10.5, distanceMin: 7.8 }, { note: 10, distanceMin: 7.7 }, { note: 9.5, distanceMin: 7.6 }, { note: 9, distanceMin: 7.5 }, { note: 8.5, distanceMin: 7.4 }, { note: 8, distanceMin: 7.3 }, { note: 7.5, distanceMin: 7.2 }, { note: 7, distanceMin: 7.1 }, { note: 6.5, distanceMin: 7.0 }, { note: 6, distanceMin: 6.9 }, { note: 5.5, distanceMin: 6.8 }, { note: 5, distanceMin: 6.7 }, { note: 4, distanceMin: 6.5 }, { note: 3, distanceMin: 6.4 }, { note: 1, distanceMin: 6.2 }] },
  { cls: "Quatrième", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 8.9 }, { note: 19, distanceMin: 8.7 }, { note: 18, distanceMin: 8.5 }, { note: 17, distanceMin: 8.2 }, { note: 16, distanceMin: 8.0 }, { note: 15, distanceMin: 7.8 }, { note: 14, distanceMin: 7.7 }, { note: 13, distanceMin: 7.6 }, { note: 12.5, distanceMin: 7.5 }, { note: 12, distanceMin: 7.4 }, { note: 11.5, distanceMin: 7.3 }, { note: 11, distanceMin: 7.2 }, { note: 10.5, distanceMin: 7.1 }, { note: 10, distanceMin: 7.0 }, { note: 9.5, distanceMin: 6.9 }, { note: 9, distanceMin: 6.8 }, { note: 8.5, distanceMin: 6.7 }, { note: 8, distanceMin: 6.6 }, { note: 7, distanceMin: 6.5 }, { note: 6, distanceMin: 6.4 }, { note: 5, distanceMin: 6.3 }, { note: 4.5, distanceMin: 6.2 }, { note: 3.5, distanceMin: 6.1 }, { note: 2.5, distanceMin: 6.0 }] },
  { cls: "Troisième", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 11.4 }, { note: 19, distanceMin: 11.0 }, { note: 18, distanceMin: 10.7 }, { note: 17, distanceMin: 10.4 }, { note: 16, distanceMin: 10.0 }, { note: 15, distanceMin: 9.7 }, { note: 14, distanceMin: 9.4 }, { note: 13, distanceMin: 9.1 }, { note: 12.5, distanceMin: 8.9 }, { note: 12, distanceMin: 8.7 }, { note: 11.5, distanceMin: 8.5 }, { note: 11, distanceMin: 8.2 }, { note: 10.5, distanceMin: 8.0 }, { note: 10, distanceMin: 7.8 }, { note: 9.5, distanceMin: 7.7 }, { note: 9, distanceMin: 7.6 }, { note: 8.5, distanceMin: 7.5 }, { note: 8, distanceMin: 7.4 }, { note: 7.5, distanceMin: 7.3 }, { note: 7, distanceMin: 7.2 }, { note: 6.5, distanceMin: 7.1 }, { note: 6, distanceMin: 7.0 }, { note: 5.5, distanceMin: 6.9 }, { note: 5, distanceMin: 6.8 }, { note: 4.5, distanceMin: 6.7 }, { note: 4, distanceMin: 6.6 }, { note: 3.5, distanceMin: 6.5 }, { note: 2.5, distanceMin: 6.4 }, { note: 1.5, distanceMin: 6.3 }] },
  { cls: "Troisième", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 9.1 }, { note: 19, distanceMin: 8.9 }, { note: 18, distanceMin: 8.7 }, { note: 17, distanceMin: 8.5 }, { note: 16, distanceMin: 8.2 }, { note: 15, distanceMin: 8.0 }, { note: 14, distanceMin: 7.8 }, { note: 13, distanceMin: 7.7 }, { note: 12.5, distanceMin: 7.6 }, { note: 12, distanceMin: 7.5 }, { note: 11.5, distanceMin: 7.4 }, { note: 11, distanceMin: 7.3 }, { note: 10.5, distanceMin: 7.2 }, { note: 10, distanceMin: 7.1 }, { note: 9.5, distanceMin: 7.0 }, { note: 9, distanceMin: 6.9 }, { note: 8.5, distanceMin: 6.8 }, { note: 8, distanceMin: 6.7 }, { note: 7.5, distanceMin: 6.6 }, { note: 7, distanceMin: 6.5 }, { note: 6, distanceMin: 6.4 }, { note: 5, distanceMin: 6.3 }, { note: 4, distanceMin: 6.2 }, { note: 3, distanceMin: 6.1 }, { note: 2, distanceMin: 6.0 }] },
  { cls: "Seconde", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 13.0 }, { note: 19, distanceMin: 12.6 }, { note: 18, distanceMin: 12.2 }, { note: 17, distanceMin: 11.8 }, { note: 16, distanceMin: 11.4 }, { note: 15, distanceMin: 11.0 }, { note: 14, distanceMin: 10.7 }, { note: 13, distanceMin: 10.4 }, { note: 12.5, distanceMin: 10.0 }, { note: 12, distanceMin: 9.7 }, { note: 11.5, distanceMin: 9.4 }, { note: 11, distanceMin: 9.1 }, { note: 10.5, distanceMin: 8.9 }, { note: 10, distanceMin: 8.7 }, { note: 9.5, distanceMin: 8.5 }, { note: 9, distanceMin: 8.2 }, { note: 8.5, distanceMin: 8.0 }, { note: 8, distanceMin: 7.8 }, { note: 7.5, distanceMin: 7.7 }, { note: 7, distanceMin: 7.6 }, { note: 6.5, distanceMin: 7.5 }, { note: 6, distanceMin: 7.4 }, { note: 5.5, distanceMin: 7.3 }, { note: 5, distanceMin: 7.2 }, { note: 4.5, distanceMin: 7.1 }, { note: 4, distanceMin: 7.0 }, { note: 3.5, distanceMin: 6.9 }, { note: 3, distanceMin: 6.8 }, { note: 2.5, distanceMin: 6.7 }] },
  { cls: "Seconde", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 10.4 }, { note: 19, distanceMin: 10.0 }, { note: 18, distanceMin: 9.7 }, { note: 17, distanceMin: 9.4 }, { note: 16, distanceMin: 9.1 }, { note: 15, distanceMin: 8.9 }, { note: 14, distanceMin: 8.7 }, { note: 13, distanceMin: 8.5 }, { note: 12.5, distanceMin: 8.2 }, { note: 12, distanceMin: 8.0 }, { note: 11.5, distanceMin: 7.8 }, { note: 11, distanceMin: 7.7 }, { note: 10.5, distanceMin: 7.6 }, { note: 10, distanceMin: 7.5 }, { note: 9.5, distanceMin: 7.4 }, { note: 9, distanceMin: 7.3 }, { note: 8.5, distanceMin: 7.2 }, { note: 8, distanceMin: 7.1 }, { note: 7.5, distanceMin: 7.0 }, { note: 7, distanceMin: 6.9 }, { note: 6.5, distanceMin: 6.8 }, { note: 6, distanceMin: 6.7 }, { note: 5.5, distanceMin: 6.6 }, { note: 5, distanceMin: 6.5 }, { note: 4.5, distanceMin: 6.4 }, { note: 4, distanceMin: 6.3 }, { note: 3.5, distanceMin: 6.2 }, { note: 1, distanceMin: 1.2 }].map(x => x.distanceMin < 2 ? { note: x.note, distanceMin: 6.0 } : x) },
  { cls: "Première", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 13.4 }, { note: 19, distanceMin: 13.0 }, { note: 18, distanceMin: 12.6 }, { note: 17, distanceMin: 12.2 }, { note: 16, distanceMin: 11.8 }, { note: 15, distanceMin: 11.4 }, { note: 14, distanceMin: 11.0 }, { note: 13, distanceMin: 10.7 }, { note: 12.5, distanceMin: 10.4 }, { note: 12, distanceMin: 10.0 }, { note: 11.5, distanceMin: 9.7 }, { note: 11, distanceMin: 9.4 }, { note: 10.5, distanceMin: 9.1 }, { note: 10, distanceMin: 8.9 }, { note: 9.5, distanceMin: 8.7 }, { note: 9, distanceMin: 8.5 }, { note: 8.5, distanceMin: 8.2 }, { note: 8, distanceMin: 8.0 }, { note: 7.5, distanceMin: 7.8 }, { note: 7, distanceMin: 7.7 }, { note: 6.5, distanceMin: 7.6 }, { note: 6, distanceMin: 7.5 }, { note: 5.5, distanceMin: 7.4 }, { note: 5, distanceMin: 7.3 }, { note: 4.5, distanceMin: 7.2 }, { note: 4, distanceMin: 7.1 }, { note: 3.5, distanceMin: 7.0 }, { note: 3, distanceMin: 6.9 }, { note: 2.5, distanceMin: 6.8 }] },
  { cls: "Première", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 10.7 }, { note: 19, distanceMin: 10.4 }, { note: 18, distanceMin: 10.0 }, { note: 17, distanceMin: 9.7 }, { note: 16, distanceMin: 9.4 }, { note: 15, distanceMin: 9.1 }, { note: 14, distanceMin: 8.9 }, { note: 13, distanceMin: 8.7 }, { note: 12.5, distanceMin: 8.5 }, { note: 12, distanceMin: 8.2 }, { note: 11.5, distanceMin: 8.0 }, { note: 11, distanceMin: 7.8 }, { note: 10.5, distanceMin: 7.7 }, { note: 10, distanceMin: 7.6 }, { note: 9.5, distanceMin: 7.5 }, { note: 9, distanceMin: 7.4 }, { note: 8.5, distanceMin: 7.3 }, { note: 8, distanceMin: 7.2 }, { note: 7.5, distanceMin: 7.1 }, { note: 7, distanceMin: 7.0 }, { note: 6.5, distanceMin: 6.9 }, { note: 6, distanceMin: 6.8 }, { note: 5.5, distanceMin: 6.7 }, { note: 5, distanceMin: 6.6 }, { note: 4.5, distanceMin: 6.5 }, { note: 4, distanceMin: 6.4 }, { note: 3.5, distanceMin: 6.3 }] },
  { cls: "Terminale", gnr: "Garçon", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 13.8 }, { note: 19, distanceMin: 13.4 }, { note: 18, distanceMin: 13.0 }, { note: 17, distanceMin: 12.6 }, { note: 16, distanceMin: 12.2 }, { note: 15, distanceMin: 11.8 }, { note: 14, distanceMin: 11.4 }, { note: 13, distanceMin: 11.0 }, { note: 12.5, distanceMin: 10.7 }, { note: 12, distanceMin: 10.4 }, { note: 11.5, distanceMin: 10.0 }, { note: 11, distanceMin: 9.7 }, { note: 10.5, distanceMin: 9.4 }, { note: 10, distanceMin: 9.1 }, { note: 9.5, distanceMin: 8.9 }, { note: 9, distanceMin: 8.7 }, { note: 8.5, distanceMin: 8.5 }, { note: 8, distanceMin: 8.2 }, { note: 7.5, distanceMin: 8.0 }, { note: 7, distanceMin: 7.8 }, { note: 6.5, distanceMin: 7.7 }, { note: 6, distanceMin: 7.6 }, { note: 5.5, distanceMin: 7.5 }, { note: 5, distanceMin: 7.4 }, { note: 4.5, distanceMin: 7.3 }, { note: 4, distanceMin: 7.2 }, { note: 3.5, distanceMin: 7.1 }, { note: 3, distanceMin: 7.0 }, { note: 2.5, distanceMin: 6.9 }] },
  { cls: "Terminale", gnr: "Fille", disc: "Triple saut", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 11.0 }, { note: 19, distanceMin: 10.7 }, { note: 18, distanceMin: 10.4 }, { note: 17, distanceMin: 10.0 }, { note: 16, distanceMin: 9.7 }, { note: 15, distanceMin: 9.4 }, { note: 14, distanceMin: 9.1 }, { note: 13, distanceMin: 8.9 }, { note: 12.5, distanceMin: 8.7 }, { note: 12, distanceMin: 8.5 }, { note: 11.5, distanceMin: 8.2 }, { note: 11, distanceMin: 8.0 }, { note: 10.5, distanceMin: 7.8 }, { note: 10, distanceMin: 7.7 }, { note: 9.5, distanceMin: 7.6 }, { note: 9, distanceMin: 7.5 }, { note: 8.5, distanceMin: 7.4 }, { note: 8, distanceMin: 7.3 }, { note: 7.5, distanceMin: 7.2 }, { note: 7, distanceMin: 7.1 }, { note: 6.5, distanceMin: 7.0 }, { note: 6, distanceMin: 6.9 }, { note: 5.5, distanceMin: 6.8 }, { note: 5, distanceMin: 6.7 }, { note: 4.5, distanceMin: 6.6 }, { note: 4, distanceMin: 6.5 }, { note: 3.5, distanceMin: 6.4 }, { note: 3, distanceMin: 6.3 }, { note: 2.5, distanceMin: 6.2 }] },

  // SAUT EN LONGUEUR
  { cls: "Sixième", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 5.6 }, { note: 19, distanceMin: 5.2 }, { note: 18, distanceMin: 5.0 }, { note: 17, distanceMin: 4.9 }, { note: 16, distanceMin: 4.7 }, { note: 15, distanceMin: 4.5 }, { note: 14, distanceMin: 4.3 }, { note: 13, distanceMin: 4.1 }, { note: 12.5, distanceMin: 4.0 }, { note: 12, distanceMin: 3.9 }, { note: 11.5, distanceMin: 3.8 }, { note: 11, distanceMin: 3.7 }, { note: 10.5, distanceMin: 3.6 }, { note: 10, distanceMin: 3.5 }, { note: 9.5, distanceMin: 3.4 }, { note: 9, distanceMin: 3.3 }, { note: 8.5, distanceMin: 3.2 }, { note: 8, distanceMin: 3.1 }, { note: 7.5, distanceMin: 3.0 }, { note: 7, distanceMin: 2.8 }, { note: 6.5, distanceMin: 2.6 }, { note: 6, distanceMin: 2.4 }, { note: 5.5, distanceMin: 2.2 }, { note: 5, distanceMin: 2.0 }, { note: 4.5, distanceMin: 1.8 }, { note: 4, distanceMin: 1.7 }, { note: 3, distanceMin: 1.6 }, { note: 2, distanceMin: 1.5 }, { note: 1, distanceMin: 1.4 }] },
  { cls: "Sixième", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 4.1 }, { note: 19, distanceMin: 4.0 }, { note: 18, distanceMin: 3.9 }, { note: 17, distanceMin: 3.8 }, { note: 16, distanceMin: 3.7 }, { note: 15, distanceMin: 3.6 }, { note: 14, distanceMin: 3.5 }, { note: 13, distanceMin: 3.4 }, { note: 12.5, distanceMin: 3.3 }, { note: 12, distanceMin: 3.2 }, { note: 11.5, distanceMin: 3.1 }, { note: 11, distanceMin: 3.0 }, { note: 10.5, distanceMin: 2.8 }, { note: 10, distanceMin: 2.6 }, { note: 9.5, distanceMin: 2.4 }, { note: 9, distanceMin: 2.2 }, { note: 8.5, distanceMin: 2.0 }, { note: 8, distanceMin: 1.8 }, { note: 7.5, distanceMin: 1.7 }, { note: 6.5, distanceMin: 1.6 }, { note: 5.5, distanceMin: 1.5 }, { note: 4.5, distanceMin: 1.4 }, { note: 3.5, distanceMin: 1.3 }, { note: 2.5, distanceMin: 1.2 }, { note: 2, distanceMin: 1.1 }] },
  { cls: "Cinquième", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 19, distanceMin: 5.6 }, { note: 18, distanceMin: 5.2 }, { note: 17, distanceMin: 5.0 }, { note: 16, distanceMin: 4.9 }, { note: 15, distanceMin: 4.7 }, { note: 14, distanceMin: 4.5 }, { note: 13, distanceMin: 4.3 }, { note: 12.5, distanceMin: 4.1 }, { note: 12, distanceMin: 4.0 }, { note: 11.5, distanceMin: 3.9 }, { note: 11, distanceMin: 3.8 }, { note: 10.5, distanceMin: 3.7 }, { note: 10, distanceMin: 3.6 }, { note: 9.5, distanceMin: 3.5 }, { note: 9, distanceMin: 3.4 }, { note: 8.5, distanceMin: 3.3 }, { note: 8, distanceMin: 3.2 }, { note: 7.5, distanceMin: 3.1 }, { note: 7, distanceMin: 3.0 }, { note: 6.5, distanceMin: 2.8 }, { note: 6, distanceMin: 2.6 }, { note: 5.5, distanceMin: 2.4 }, { note: 5, distanceMin: 2.2 }, { note: 4.5, distanceMin: 2.0 }, { note: 4, distanceMin: 1.8 }, { note: 3, distanceMin: 1.6 }, { note: 2, distanceMin: 1.5 }, { note: 1, distanceMin: 1.4 }] },
  { cls: "Cinquième", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 4.3 }, { note: 19, distanceMin: 4.1 }, { note: 18, distanceMin: 4.0 }, { note: 17, distanceMin: 3.9 }, { note: 16, distanceMin: 3.8 }, { note: 15, distanceMin: 3.7 }, { note: 14, distanceMin: 3.6 }, { note: 13, distanceMin: 3.5 }, { note: 12.5, distanceMin: 3.4 }, { note: 12, distanceMin: 3.3 }, { note: 11.5, distanceMin: 3.2 }, { note: 11, distanceMin: 3.1 }, { note: 10.5, distanceMin: 3.0 }, { note: 10, distanceMin: 2.8 }, { note: 9.5, distanceMin: 2.6 }, { note: 9, distanceMin: 2.4 }, { note: 8.5, distanceMin: 2.2 }, { note: 8, distanceMin: 2.0 }, { note: 7.5, distanceMin: 1.8 }, { note: 7, distanceMin: 1.7 }, { note: 6, distanceMin: 1.6 }, { note: 5, distanceMin: 1.5 }, { note: 4, distanceMin: 1.4 }, { note: 3, distanceMin: 1.3 }, { note: 2, distanceMin: 1.2 }, { note: 1, distanceMin: 1.1 }] },
  { cls: "Quatrième", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 18, distanceMin: 5.6 }, { note: 17, distanceMin: 5.2 }, { note: 16, distanceMin: 5.0 }, { note: 15, distanceMin: 4.9 }, { note: 14, distanceMin: 4.7 }, { note: 13, distanceMin: 4.5 }, { note: 12.5, distanceMin: 4.3 }, { note: 12, distanceMin: 4.1 }, { note: 11.5, distanceMin: 4.0 }, { note: 11, distanceMin: 3.9 }, { note: 10.5, distanceMin: 3.8 }, { note: 10, distanceMin: 3.7 }, { note: 9.5, distanceMin: 3.6 }, { note: 9, distanceMin: 3.5 }, { note: 8.5, distanceMin: 3.4 }, { note: 8, distanceMin: 3.3 }, { note: 7.5, distanceMin: 3.2 }, { note: 7, distanceMin: 3.1 }, { note: 6.5, distanceMin: 3.0 }, { note: 6, distanceMin: 2.8 }, { note: 5.5, distanceMin: 2.6 }, { note: 5, distanceMin: 2.4 }, { note: 4.5, distanceMin: 2.2 }, { note: 4, distanceMin: 2.0 }, { note: 3.5, distanceMin: 1.8 }, { note: 2.5, distanceMin: 1.7 }, { note: 1.5, distanceMin: 1.5 }] },
  { cls: "Quatrième", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 4.5 }, { note: 19, distanceMin: 4.3 }, { note: 18, distanceMin: 4.1 }, { note: 17, distanceMin: 4.0 }, { note: 16, distanceMin: 3.9 }, { note: 15, distanceMin: 3.8 }, { note: 14, distanceMin: 3.7 }, { note: 13, distanceMin: 3.6 }, { note: 12.5, distanceMin: 3.5 }, { note: 12, distanceMin: 3.4 }, { note: 11.5, distanceMin: 3.3 }, { note: 11, distanceMin: 3.2 }, { note: 10.5, distanceMin: 3.1 }, { note: 10, distanceMin: 3.0 }, { note: 9.5, distanceMin: 2.8 }, { note: 9, distanceMin: 2.6 }, { note: 8.5, distanceMin: 2.4 }, { note: 8, distanceMin: 2.2 }, { note: 7.5, distanceMin: 2.0 }, { note: 7, distanceMin: 1.8 }, { note: 6.5, distanceMin: 1.7 }, { note: 5.5, distanceMin: 1.6 }, { note: 4.5, distanceMin: 1.5 }, { note: 3.5, distanceMin: 1.4 }, { note: 2.5, distanceMin: 1.3 }, { note: 2, distanceMin: 1.2 }] },
  { cls: "Troisième", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 17, distanceMin: 5.6 }, { note: 16, distanceMin: 5.2 }, { note: 15, distanceMin: 5.0 }, { note: 14, distanceMin: 4.9 }, { note: 13, distanceMin: 4.7 }, { note: 12.5, distanceMin: 4.5 }, { note: 12, distanceMin: 4.3 }, { note: 11.5, distanceMin: 4.1 }, { note: 11, distanceMin: 4.0 }, { note: 10.5, distanceMin: 3.9 }, { note: 10, distanceMin: 3.8 }, { note: 9.5, distanceMin: 3.7 }, { note: 9, distanceMin: 3.6 }, { note: 8.5, distanceMin: 3.5 }, { note: 8, distanceMin: 3.4 }, { note: 7.5, distanceMin: 3.3 }, { note: 7, distanceMin: 3.2 }, { note: 6.5, distanceMin: 3.1 }, { note: 6, distanceMin: 3.0 }, { note: 5.5, distanceMin: 2.8 }, { note: 5, distanceMin: 2.6 }, { note: 4.5, distanceMin: 2.4 }, { note: 4, distanceMin: 2.2 }, { note: 3.5, distanceMin: 2.0 }, { note: 3, distanceMin: 1.8 }, { note: 2, distanceMin: 1.7 }] },
  { cls: "Troisième", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 4.7 }, { note: 19, distanceMin: 4.5 }, { note: 18, distanceMin: 4.3 }, { note: 17, distanceMin: 4.1 }, { note: 16, distanceMin: 4.0 }, { note: 15, distanceMin: 3.9 }, { note: 14, distanceMin: 3.8 }, { note: 13, distanceMin: 3.7 }, { note: 12.5, distanceMin: 3.6 }, { note: 12, distanceMin: 3.5 }, { note: 11.5, distanceMin: 3.4 }, { note: 11, distanceMin: 3.3 }, { note: 10.5, distanceMin: 3.2 }, { note: 10, distanceMin: 3.1 }, { note: 9.5, distanceMin: 3.0 }, { note: 9, distanceMin: 2.8 }, { note: 8.5, distanceMin: 2.6 }, { note: 8, distanceMin: 2.4 }, { note: 7.5, distanceMin: 2.2 }, { note: 7, distanceMin: 2.0 }, { note: 6.5, distanceMin: 1.8 }, { note: 6, distanceMin: 1.7 }, { note: 5, distanceMin: 1.6 }, { note: 4, distanceMin: 1.5 }, { note: 3, distanceMin: 1.4 }, { note: 2, distanceMin: 1.3 }] },
  { cls: "Seconde", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 6.20 }, { note: 19, distanceMin: 6.00 }, { note: 18, distanceMin: 5.80 }, { note: 17, distanceMin: 5.60 }, { note: 16, distanceMin: 5.40 }, { note: 15, distanceMin: 5.20 }, { note: 14, distanceMin: 5.00 }, { note: 13, distanceMin: 4.90 }, { note: 12.5, distanceMin: 4.70 }, { note: 12, distanceMin: 4.50 }, { note: 11.5, distanceMin: 4.30 }, { note: 11, distanceMin: 4.10 }, { note: 10.5, distanceMin: 4.00 }, { note: 10, distanceMin: 3.90 }, { note: 9.5, distanceMin: 3.80 }, { note: 9, distanceMin: 3.70 }, { note: 8.5, distanceMin: 3.60 }, { note: 8, distanceMin: 3.50 }, { note: 7.5, distanceMin: 3.40 }, { note: 7, distanceMin: 3.30 }, { note: 6.5, distanceMin: 3.20 }, { note: 6, distanceMin: 3.10 }, { note: 5.5, distanceMin: 3.00 }, { note: 5, distanceMin: 2.80 }, { note: 4, distanceMin: 2.40 }, { note: 3.5, distanceMin: 2.20 }, { note: 3, distanceMin: 2.00 }, { note: 2.5, distanceMin: 1.80 }] },
  { cls: "Seconde", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 4.90 }, { note: 19, distanceMin: 4.70 }, { note: 18, distanceMin: 4.50 }, { note: 17, distanceMin: 4.30 }, { note: 16, distanceMin: 4.10 }, { note: 15, distanceMin: 4.00 }, { note: 14, distanceMin: 3.90 }, { note: 13, distanceMin: 3.80 }, { note: 12.5, distanceMin: 3.70 }, { note: 12, distanceMin: 3.60 }, { note: 11.5, distanceMin: 3.50 }, { note: 11, distanceMin: 3.40 }, { note: 10.5, distanceMin: 3.30 }, { note: 10, distanceMin: 3.20 }, { note: 9.5, distanceMin: 3.10 }, { note: 9, distanceMin: 3.00 }, { note: 8.5, distanceMin: 2.80 }, { note: 8, distanceMin: 2.60 }, { note: 7.5, distanceMin: 2.40 }, { note: 7, distanceMin: 2.20 }, { note: 6.5, distanceMin: 2.00 }, { note: 6, distanceMin: 1.80 }, { note: 5.5, distanceMin: 1.60 }, { note: 5, distanceMin: 1.40 }, { note: 4.5, distanceMin: 1.20 }, { note: 4, distanceMin: 1.00 }] },
  { cls: "Première", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 6.40 }, { note: 19, distanceMin: 6.20 }, { note: 18, distanceMin: 6.00 }, { note: 17, distanceMin: 5.80 }, { note: 16, distanceMin: 5.60 }, { note: 15, distanceMin: 5.40 }, { note: 14, distanceMin: 5.20 }, { note: 13, distanceMin: 5.00 }, { note: 12.5, distanceMin: 4.90 }, { note: 12, distanceMin: 4.70 }, { note: 11.5, distanceMin: 4.50 }, { note: 11, distanceMin: 4.30 }, { note: 10.5, distanceMin: 4.10 }, { note: 10, distanceMin: 4.00 }, { note: 9.5, distanceMin: 3.90 }, { note: 9, distanceMin: 3.80 }, { note: 8.5, distanceMin: 3.70 }, { note: 8, distanceMin: 3.60 }, { note: 7.5, distanceMin: 3.50 }, { note: 7, distanceMin: 3.40 }, { note: 6.5, distanceMin: 3.30 }, { note: 6, distanceMin: 3.20 }, { note: 5.5, distanceMin: 3.10 }, { note: 5, distanceMin: 3.00 }, { note: 4.5, distanceMin: 2.80 }, { note: 3.5, distanceMin: 2.40 }, { note: 3, distanceMin: 2.20 }, { note: 2.5, distanceMin: 2.00 }] },
  { cls: "Première", gnr: "Fille", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 5.00 }, { note: 19, distanceMin: 4.90 }, { note: 18, distanceMin: 4.70 }, { note: 17, distanceMin: 4.50 }, { note: 16, distanceMin: 4.30 }, { note: 15, distanceMin: 4.10 }, { note: 14, distanceMin: 4.00 }, { note: 13, distanceMin: 3.90 }, { note: 12.5, distanceMin: 3.80 }, { note: 12, distanceMin: 3.70 }, { note: 11.5, distanceMin: 3.60 }, { note: 11, distanceMin: 3.50 }, { note: 10.5, distanceMin: 3.40 }, { note: 10, distanceMin: 3.30 }, { note: 9.5, distanceMin: 3.20 }, { note: 9, distanceMin: 3.10 }, { note: 8.5, distanceMin: 3.00 }, { note: 8, distanceMin: 2.80 }, { note: 7.5, distanceMin: 2.60 }, { note: 7, distanceMin: 2.40 }, { note: 6.5, distanceMin: 2.20 }, { note: 6, distanceMin: 2.00 }, { note: 5.5, distanceMin: 1.80 }, { note: 5, distanceMin: 1.60 }, { note: 4.5, distanceMin: 1.40 }, { note: 4, distanceMin: 1.20 }, { note: 3.5, distanceMin: 1.00 }] },
  { cls: "Terminale", gnr: "Garçon", disc: "Saut en longueur", eng: null, type: "distance", grid: [{ note: 20, distanceMin: 5.20 }, { note: 19, distanceMin: 5.00 }, { note: 18, distanceMin: 4.90 }, { note: 17, distanceMin: 4.70 }, { note: 16, distanceMin: 4.50 }, { note: 15, distanceMin: 4.30 }, { note: 14, distanceMin: 4.10 }, { note: 13, distanceMin: 4.00 }, { note: 12.5, distanceMin: 3.90 }, { note: 12, distanceMin: 3.80 }, { note: 11.5, distanceMin: 3.70 }, { note: 11, distanceMin: 3.60 }, { note: 10.5, distanceMin: 3.50 }, { note: 10, distanceMin: 3.40 }, { note: 9.5, distanceMin: 3.30 }, { note: 9, distanceMin: 3.20 }, { note: 8.5, distanceMin: 3.10 }, { note: 8, distanceMin: 3.00 }, { note: 7.5, distanceMin: 2.80 }, { note: 7, distanceMin: 2.60 }, { note: 6.5, distanceMin: 2.40 }, { note: 6, distanceMin: 2.20 }, { note: 5.5, distanceMin: 2.00 }, { note: 5, distanceMin: 1.80 }, { note: 4.5, distanceMin: 1.60 }, { note: 4, distanceMin: 1.40 }, { note: 3.5, distanceMin: 1.20 }, { note: 3, distanceMin: 1.00 }] },

  // LANCER DE DISQUE & JAVELOT
  { cls: "Sixième", gnr: "Garçon", disc: "Lancer de disque", eng: "2kg", type: "distance", grid: [{ note: 20, distanceMin: 22.5 }, { note: 19, distanceMin: 22.0 }, { note: 18, distanceMin: 21.5 }, { note: 17, distanceMin: 21.0 }, { note: 16, distanceMin: 20.5 }, { note: 15, distanceMin: 20.0 }, { note: 14, distanceMin: 19.5 }, { note: 13, distanceMin: 19.0 }, { note: 12.5, distanceMin: 18.5 }, { note: 12, distanceMin: 18.0 }, { note: 11.5, distanceMin: 17.5 }, { note: 11, distanceMin: 17.0 }, { note: 10.5, distanceMin: 16.0 }, { note: 10, distanceMin: 15.0 }, { note: 9, distanceMin: 14.0 }, { note: 8, distanceMin: 13.0 }, { note: 7, distanceMin: 12.0 }, { note: 6, distanceMin: 11.0 }, { note: 5, distanceMin: 10.0 }, { note: 4, distanceMin: 9.0 }, { note: 3, distanceMin: 8.0 }, { note: 2, distanceMin: 7.0 }, { note: 1, distanceMin: 7.0 }] },
  { cls: "Sixième", gnr: "Garçon", disc: "Lancer de javelot", eng: "600g", type: "distance", grid: [{ note: 20, distanceMin: 24.0 }, { note: 19, distanceMin: 23.5 }, { note: 18, distanceMin: 23.0 }, { note: 17, distanceMin: 22.5 }, { note: 16, distanceMin: 22.0 }, { note: 15, distanceMin: 21.5 }, { note: 14, distanceMin: 21.0 }, { note: 13, distanceMin: 20.5 }, { note: 12.5, distanceMin: 20.0 }, { note: 12, distanceMin: 19.5 }, { note: 11.5, distanceMin: 19.0 }, { note: 11, distanceMin: 18.5 }, { note: 10.5, distanceMin: 18.0 }, { note: 10, distanceMin: 17.5 }, { note: 9.5, distanceMin: 17.0 }, { note: 9, distanceMin: 16.0 }, { note: 8.5, distanceMin: 15.0 }, { note: 8, distanceMin: 14.0 }, { note: 7, distanceMin: 13.0 }, { note: 6, distanceMin: 12.0 }, { note: 5, distanceMin: 11.0 }, { note: 4, distanceMin: 10.0 }, { note: 3, distanceMin: 9.0 }, { note: 2, distanceMin: 8.0 }, { note: 1, distanceMin: 7.0 }] },
  { cls: "Sixième", gnr: "Fille", disc: "Lancer de disque", eng: "2kg", type: "distance", grid: [{ note: 20, distanceMin: 17.0 }, { note: 19, distanceMin: 16.5 }, { note: 18, distanceMin: 16.0 }, { note: 17, distanceMin: 15.5 }, { note: 16, distanceMin: 15.0 }, { note: 15, distanceMin: 14.5 }, { note: 14, distanceMin: 14.0 }, { note: 13, distanceMin: 13.5 }, { note: 12.5, distanceMin: 13.0 }, { note: 12, distanceMin: 12.5 }, { note: 11.5, distanceMin: 12.0 }, { note: 11, distanceMin: 11.5 }, { note: 10.5, distanceMin: 11.0 }, { note: 10, distanceMin: 10.5 }, { note: 9.5, distanceMin: 10.0 }, { note: 9, distanceMin: 9.5 }, { note: 7.5, distanceMin: 9.0 }, { note: 6, distanceMin: 8.5 }, { note: 4.5, distanceMin: 8.0 }, { note: 3, distanceMin: 7.5 }, { note: 2, distanceMin: 7.0 }] },
  { cls: "Sixième", gnr: "Fille", disc: "Lancer de javelot", eng: "600g", type: "distance", grid: [{ note: 20, distanceMin: 19.0 }, { note: 19, distanceMin: 18.5 }, { note: 17, distanceMin: 18.0 }, { note: 15, distanceMin: 17.0 }, { note: 13, distanceMin: 16.0 }, { note: 12, distanceMin: 15.0 }, { note: 11, distanceMin: 14.0 }, { note: 10, distanceMin: 13.0 }, { note: 9, distanceMin: 12.0 }, { note: 8, distanceMin: 11.0 }, { note: 7, distanceMin: 10.0 }, { note: 6, distanceMin: 9.0 }, { note: 5, distanceMin: 8.0 }, { note: 4, distanceMin: 7.0 }] },

  { cls: "Seconde", gnr: "Garçon", disc: "Lancer de disque", eng: "3kg", type: "distance", grid: [{ note: 20, distanceMin: 32.0 }, { note: 19, distanceMin: 30.0 }, { note: 18, distanceMin: 28.0 }, { note: 17, distanceMin: 26.0 }, { note: 16, distanceMin: 24.0 }, { note: 15, distanceMin: 22.5 }, { note: 14, distanceMin: 21.0 }, { note: 13, distanceMin: 19.5 }, { note: 12.5, distanceMin: 19.0 }, { note: 12, distanceMin: 18.5 }, { note: 11, distanceMin: 18.0 }, { note: 9, distanceMin: 16.0 }, { note: 8, distanceMin: 15.0 }, { note: 7, distanceMin: 14.0 }, { note: 6, distanceMin: 13.0 }, { note: 5, distanceMin: 12.0 }, { note: 3, distanceMin: 11.0 }, { note: 2, distanceMin: 10.0 }, { note: 1, distanceMin: 10.0 }] },
  { cls: "Seconde", gnr: "Garçon", disc: "Lancer de javelot", eng: "800g", type: "distance", grid: [{ note: 20, distanceMin: 38.0 }, { note: 19, distanceMin: 36.0 }, { note: 18, distanceMin: 34.0 }, { note: 17, distanceMin: 32.0 }, { note: 16, distanceMin: 30.0 }, { note: 15, distanceMin: 28.0 }, { note: 14, distanceMin: 26.0 }, { note: 13, distanceMin: 24.0 }, { note: 12.5, distanceMin: 22.5 }, { note: 12, distanceMin: 21.0 }, { note: 11.5, distanceMin: 19.5 }, { note: 11, distanceMin: 19.0 }, { note: 10.5, distanceMin: 18.5 }, { note: 9.5, distanceMin: 18.0 }, { note: 8.5, distanceMin: 17.0 }, { note: 7.5, distanceMin: 16.0 }, { note: 6.5, distanceMin: 15.0 }, { note: 5.5, distanceMin: 14.0 }, { note: 4.5, distanceMin: 13.0 }, { note: 3.5, distanceMin: 12.0 }, { note: 2.5, distanceMin: 11.0 }, { note: 2, distanceMin: 10.0 }] }
];

sautsEtLancersConfig.forEach(item => {
  const codeName = item.disc.toLowerCase().replace(/[^a-z0-9]/g, '');
  const idStr = `bar_${codeName}_${item.cls.toLowerCase()}_${item.gnr === 'Garçon' ? 'g' : 'f'}${item.eng ? '_' + item.eng : ''}`;
  baremes.push(createBareme(idStr, item.disc, item.eng, item.cls, item.gnr, item.type, item.grid));
});

// Écriture du fichier JSON final
const targetPath = path.join(__dirname, 'data', 'default_baremes.json');
fs.writeFileSync(targetPath, JSON.stringify(baremes, null, 2), 'utf-8');
console.log(`Successfully generated ${baremes.length} official baremes into ${targetPath}`);
