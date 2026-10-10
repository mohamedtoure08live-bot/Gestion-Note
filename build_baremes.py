import json
import os

CLASSES = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"]
GENRES = ["Garçon", "Fille"]

def create_bareme(id_str, discipline, engin, classe, genre, type_epreuve, grille_list):
    grille_sorted = sorted(grille_list, key=lambda x: x["note"])
    return {
        "id": id_str,
        "discipline": discipline,
        "engin": engin,
        "classe": classe,
        "genre": genre,
        "type": type_epreuve, # "distance" or "temps"
        "grille": grille_sorted
    }

def generate_linear_grid(min_note, max_note, step_note, min_perf, max_perf):
    grille = []
    count = int(round((max_note - min_note) / step_note)) + 1
    for i in range(count):
        note = round(min_note + i * step_note, 2)
        ratio = i / float(count - 1)
        perf = round(min_perf + ratio * (max_perf - min_perf), 2)
        grille.append({"note": note, "distanceMin": perf})
    return grille

baremes = []

# --- 1. LANCER DE POIDS (ALL CLASSES & GENDERS) ---
# SIXIEME GARÇONS 3kg & 4kg
baremes.append(create_bareme("bar_poids_6eme_g_3kg", "Lancer de poids", "3kg", "Sixième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 12.40}, {"note": 19, "distanceMin": 11.70}, {"note": 18, "distanceMin": 11.10},
  {"note": 17, "distanceMin": 10.50}, {"note": 16, "distanceMin": 10.00}, {"note": 15, "distanceMin": 9.50},
  {"note": 14, "distanceMin": 9.00}, {"note": 13, "distanceMin": 8.50}, {"note": 12.5, "distanceMin": 8.00},
  {"note": 12, "distanceMin": 7.60}, {"note": 11.5, "distanceMin": 7.20}, {"note": 11, "distanceMin": 6.80},
  {"note": 10.5, "distanceMin": 6.50}, {"note": 10, "distanceMin": 6.10}, {"note": 9.5, "distanceMin": 5.80},
  {"note": 9, "distanceMin": 5.50}, {"note": 8.5, "distanceMin": 5.20}, {"note": 8, "distanceMin": 4.90},
  {"note": 7.5, "distanceMin": 4.70}, {"note": 7, "distanceMin": 4.40}, {"note": 6.5, "distanceMin": 4.20},
  {"note": 6, "distanceMin": 4.00}, {"note": 5.5, "distanceMin": 3.80}, {"note": 5, "distanceMin": 3.70},
  {"note": 4.5, "distanceMin": 3.60}, {"note": 4, "distanceMin": 3.50}, {"note": 3.5, "distanceMin": 3.40},
  {"note": 3, "distanceMin": 3.30}, {"note": 2.5, "distanceMin": 3.20}, {"note": 2, "distanceMin": 3.10},
  {"note": 1.5, "distanceMin": 3.00}
]))

baremes.append(create_bareme("bar_poids_6eme_g_4kg", "Lancer de poids", "4kg", "Sixième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 11.10}, {"note": 19, "distanceMin": 10.50}, {"note": 18, "distanceMin": 10.00},
  {"note": 17, "distanceMin": 9.50}, {"note": 16, "distanceMin": 9.40}, {"note": 15, "distanceMin": 8.90},
  {"note": 14, "distanceMin": 8.40}, {"note": 13, "distanceMin": 7.90}, {"note": 12.5, "distanceMin": 7.60},
  {"note": 12, "distanceMin": 7.20}, {"note": 11.5, "distanceMin": 6.70}, {"note": 11, "distanceMin": 6.40},
  {"note": 10.5, "distanceMin": 6.00}, {"note": 10, "distanceMin": 5.70}, {"note": 9.5, "distanceMin": 5.40},
  {"note": 9, "distanceMin": 5.10}, {"note": 8.5, "distanceMin": 4.80}, {"note": 8, "distanceMin": 4.60},
  {"note": 7.5, "distanceMin": 4.30}, {"note": 7, "distanceMin": 4.10}, {"note": 6.5, "distanceMin": 3.80},
  {"note": 6, "distanceMin": 3.75}, {"note": 5.5, "distanceMin": 3.70}, {"note": 5, "distanceMin": 3.60},
  {"note": 4.5, "distanceMin": 3.50}, {"note": 4, "distanceMin": 3.40}, {"note": 3.5, "distanceMin": 3.30},
  {"note": 3, "distanceMin": 3.20}, {"note": 2.5, "distanceMin": 3.10}, {"note": 2, "distanceMin": 3.05},
  {"note": 1.5, "distanceMin": 3.00}
]))

# SIXIEME FILLES 3kg
baremes.append(create_bareme("bar_poids_6eme_f_3kg", "Lancer de poids", "3kg", "Sixième", "Fille", "distance", [
  {"note": 20, "distanceMin": 8.50}, {"note": 19, "distanceMin": 8.00}, {"note": 18, "distanceMin": 7.60},
  {"note": 17, "distanceMin": 7.20}, {"note": 16, "distanceMin": 6.80}, {"note": 15, "distanceMin": 6.50},
  {"note": 14, "distanceMin": 6.10}, {"note": 13, "distanceMin": 5.80}, {"note": 12.5, "distanceMin": 5.50},
  {"note": 12, "distanceMin": 5.20}, {"note": 11.5, "distanceMin": 4.90}, {"note": 11, "distanceMin": 4.70},
  {"note": 10.5, "distanceMin": 4.40}, {"note": 10, "distanceMin": 4.20}, {"note": 9.5, "distanceMin": 4.00},
  {"note": 9, "distanceMin": 3.80}, {"note": 8.5, "distanceMin": 3.70}, {"note": 8, "distanceMin": 3.60},
  {"note": 7.5, "distanceMin": 3.50}, {"note": 7, "distanceMin": 3.40}, {"note": 6.5, "distanceMin": 3.30},
  {"note": 6, "distanceMin": 3.20}, {"note": 5.5, "distanceMin": 3.10}, {"note": 5, "distanceMin": 3.00},
  {"note": 4.5, "distanceMin": 2.90}, {"note": 4, "distanceMin": 2.80}
]))

# CINQUIEME GARÇONS 3kg & 4kg
baremes.append(create_bareme("bar_poids_5eme_g_3kg", "Lancer de poids", "3kg", "Cinquième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 13.10}, {"note": 19, "distanceMin": 12.40}, {"note": 18, "distanceMin": 11.70},
  {"note": 17, "distanceMin": 11.10}, {"note": 16, "distanceMin": 10.50}, {"note": 15, "distanceMin": 10.00},
  {"note": 14, "distanceMin": 9.50}, {"note": 13, "distanceMin": 9.00}, {"note": 12.5, "distanceMin": 8.50},
  {"note": 12, "distanceMin": 8.00}, {"note": 11.5, "distanceMin": 7.60}, {"note": 11, "distanceMin": 7.20},
  {"note": 10.5, "distanceMin": 6.80}, {"note": 10, "distanceMin": 6.50}, {"note": 9.5, "distanceMin": 6.10},
  {"note": 9, "distanceMin": 5.80}, {"note": 8.5, "distanceMin": 5.50}, {"note": 8, "distanceMin": 5.20},
  {"note": 7.5, "distanceMin": 4.90}, {"note": 7, "distanceMin": 4.70}, {"note": 6.5, "distanceMin": 4.40},
  {"note": 6, "distanceMin": 4.20}, {"note": 5.5, "distanceMin": 4.00}, {"note": 5, "distanceMin": 3.80},
  {"note": 4.5, "distanceMin": 3.70}, {"note": 4, "distanceMin": 3.60}, {"note": 3.5, "distanceMin": 3.50},
  {"note": 3, "distanceMin": 3.40}, {"note": 2.5, "distanceMin": 3.30}, {"note": 2, "distanceMin": 3.20},
  {"note": 1.5, "distanceMin": 3.10}, {"note": 1, "distanceMin": 3.00}
]))

baremes.append(create_bareme("bar_poids_5eme_g_4kg", "Lancer de poids", "4kg", "Cinquième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 11.70}, {"note": 19, "distanceMin": 11.10}, {"note": 18, "distanceMin": 10.50},
  {"note": 17, "distanceMin": 10.00}, {"note": 16, "distanceMin": 9.50}, {"note": 15, "distanceMin": 9.40},
  {"note": 14, "distanceMin": 8.90}, {"note": 13, "distanceMin": 8.40}, {"note": 12.5, "distanceMin": 7.90},
  {"note": 12, "distanceMin": 7.60}, {"note": 11.5, "distanceMin": 7.20}, {"note": 11, "distanceMin": 6.70},
  {"note": 10.5, "distanceMin": 6.40}, {"note": 10, "distanceMin": 6.00}, {"note": 9.5, "distanceMin": 5.70},
  {"note": 9, "distanceMin": 5.40}, {"note": 8.5, "distanceMin": 5.10}, {"note": 8, "distanceMin": 4.80},
  {"note": 7.5, "distanceMin": 4.60}, {"note": 7, "distanceMin": 4.30}, {"note": 6.5, "distanceMin": 4.10},
  {"note": 6, "distanceMin": 3.80}, {"note": 5.5, "distanceMin": 3.75}, {"note": 5, "distanceMin": 3.70},
  {"note": 4.5, "distanceMin": 3.60}, {"note": 4, "distanceMin": 3.50}, {"note": 3.5, "distanceMin": 3.40},
  {"note": 3, "distanceMin": 3.30}, {"note": 2.5, "distanceMin": 3.20}, {"note": 2, "distanceMin": 3.10},
  {"note": 1.5, "distanceMin": 3.05}, {"note": 1, "distanceMin": 3.00}
]))

# CINQUIEME FILLES 3kg
baremes.append(create_bareme("bar_poids_5eme_f_3kg", "Lancer de poids", "3kg", "Cinquième", "Fille", "distance", [
  {"note": 20, "distanceMin": 9.00}, {"note": 19, "distanceMin": 8.50}, {"note": 18, "distanceMin": 8.00},
  {"note": 17, "distanceMin": 7.60}, {"note": 16, "distanceMin": 7.20}, {"note": 15, "distanceMin": 6.80},
  {"note": 14, "distanceMin": 6.50}, {"note": 13, "distanceMin": 6.10}, {"note": 12.5, "distanceMin": 5.80},
  {"note": 12, "distanceMin": 5.50}, {"note": 11.5, "distanceMin": 5.20}, {"note": 11, "distanceMin": 4.90},
  {"note": 10.5, "distanceMin": 4.70}, {"note": 10, "distanceMin": 4.40}, {"note": 9.5, "distanceMin": 4.20},
  {"note": 9, "distanceMin": 4.00}, {"note": 8.5, "distanceMin": 3.80}, {"note": 8, "distanceMin": 3.70},
  {"note": 7.5, "distanceMin": 3.60}, {"note": 7, "distanceMin": 3.50}, {"note": 6.5, "distanceMin": 3.40},
  {"note": 6, "distanceMin": 3.30}, {"note": 5.5, "distanceMin": 3.20}, {"note": 5, "distanceMin": 3.10},
  {"note": 4.5, "distanceMin": 3.00}, {"note": 4, "distanceMin": 2.90}, {"note": 3.5, "distanceMin": 2.80}
]))

# QUATRIEME GARÇONS 3kg & 4kg
baremes.append(create_bareme("bar_poids_4eme_g_3kg", "Lancer de poids", "3kg", "Quatrième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 13.80}, {"note": 19, "distanceMin": 13.10}, {"note": 18, "distanceMin": 12.40},
  {"note": 17, "distanceMin": 11.70}, {"note": 16, "distanceMin": 11.10}, {"note": 15, "distanceMin": 10.50},
  {"note": 14, "distanceMin": 10.00}, {"note": 13, "distanceMin": 9.50}, {"note": 12.5, "distanceMin": 9.00},
  {"note": 12, "distanceMin": 8.50}, {"note": 11.5, "distanceMin": 8.00}, {"note": 11, "distanceMin": 7.60},
  {"note": 10.5, "distanceMin": 7.20}, {"note": 10, "distanceMin": 6.80}, {"note": 9.5, "distanceMin": 6.50},
  {"note": 9, "distanceMin": 6.10}, {"note": 8.5, "distanceMin": 5.80}, {"note": 8, "distanceMin": 5.50},
  {"note": 7.5, "distanceMin": 5.20}, {"note": 7, "distanceMin": 4.90}, {"note": 6.5, "distanceMin": 4.70},
  {"note": 6, "distanceMin": 4.40}, {"note": 5.5, "distanceMin": 4.20}, {"note": 5, "distanceMin": 4.00},
  {"note": 4.5, "distanceMin": 3.80}, {"note": 4, "distanceMin": 3.70}, {"note": 3.5, "distanceMin": 3.60},
  {"note": 3, "distanceMin": 3.50}, {"note": 2.5, "distanceMin": 3.40}, {"note": 2, "distanceMin": 3.30},
  {"note": 1.5, "distanceMin": 3.20}
]))

baremes.append(create_bareme("bar_poids_4eme_g_4kg", "Lancer de poids", "4kg", "Quatrième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 12.40}, {"note": 19, "distanceMin": 11.70}, {"note": 18, "distanceMin": 11.10},
  {"note": 17, "distanceMin": 10.50}, {"note": 16, "distanceMin": 10.00}, {"note": 15, "distanceMin": 9.50},
  {"note": 14, "distanceMin": 9.40}, {"note": 13, "distanceMin": 8.90}, {"note": 12.5, "distanceMin": 8.40},
  {"note": 12, "distanceMin": 7.90}, {"note": 11.5, "distanceMin": 7.60}, {"note": 11, "distanceMin": 7.20},
  {"note": 10.5, "distanceMin": 6.70}, {"note": 10, "distanceMin": 6.40}, {"note": 9.5, "distanceMin": 6.00},
  {"note": 9, "distanceMin": 5.70}, {"note": 8.5, "distanceMin": 5.40}, {"note": 8, "distanceMin": 5.10},
  {"note": 7.5, "distanceMin": 4.80}, {"note": 7, "distanceMin": 4.60}, {"note": 6.5, "distanceMin": 4.30},
  {"note": 6, "distanceMin": 4.10}, {"note": 5.5, "distanceMin": 3.80}, {"note": 5, "distanceMin": 3.75},
  {"note": 4.5, "distanceMin": 3.70}, {"note": 4, "distanceMin": 3.60}, {"note": 3.5, "distanceMin": 3.50},
  {"note": 3, "distanceMin": 3.40}, {"note": 2.5, "distanceMin": 3.30}, {"note": 2, "distanceMin": 3.20},
  {"note": 1.5, "distanceMin": 3.10}
]))

# QUATRIEME FILLES 3kg
baremes.append(create_bareme("bar_poids_4eme_f_3kg", "Lancer de poids", "3kg", "Quatrième", "Fille", "distance", [
  {"note": 20, "distanceMin": 9.50}, {"note": 19, "distanceMin": 9.00}, {"note": 18, "distanceMin": 8.50},
  {"note": 17, "distanceMin": 8.00}, {"note": 16, "distanceMin": 7.60}, {"note": 15, "distanceMin": 7.20},
  {"note": 14, "distanceMin": 6.80}, {"note": 13, "distanceMin": 6.50}, {"note": 12.5, "distanceMin": 6.10},
  {"note": 12, "distanceMin": 5.80}, {"note": 11.5, "distanceMin": 5.50}, {"note": 11, "distanceMin": 5.20},
  {"note": 10.5, "distanceMin": 4.90}, {"note": 10, "distanceMin": 4.70}, {"note": 9.5, "distanceMin": 4.40},
  {"note": 9, "distanceMin": 4.20}, {"note": 8.5, "distanceMin": 4.00}, {"note": 8, "distanceMin": 3.80},
  {"note": 7.5, "distanceMin": 3.70}, {"note": 7, "distanceMin": 3.60}, {"note": 6.5, "distanceMin": 3.50},
  {"note": 6, "distanceMin": 3.40}, {"note": 5.5, "distanceMin": 3.30}, {"note": 5, "distanceMin": 3.20},
  {"note": 4.5, "distanceMin": 3.10}, {"note": 4, "distanceMin": 3.00}, {"note": 3.5, "distanceMin": 2.90},
  {"note": 3, "distanceMin": 2.80}
]))

# TROISIEME GARÇONS 3kg & 4kg
baremes.append(create_bareme("bar_poids_3eme_g_3kg", "Lancer de poids", "3kg", "Troisième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 14.60}, {"note": 19, "distanceMin": 13.80}, {"note": 18, "distanceMin": 13.10},
  {"note": 17, "distanceMin": 12.40}, {"note": 16, "distanceMin": 11.70}, {"note": 15, "distanceMin": 11.10},
  {"note": 14, "distanceMin": 10.50}, {"note": 13, "distanceMin": 10.00}, {"note": 12.5, "distanceMin": 9.50},
  {"note": 12, "distanceMin": 9.00}, {"note": 11.5, "distanceMin": 8.50}, {"note": 11, "distanceMin": 8.00},
  {"note": 10.5, "distanceMin": 7.60}, {"note": 10, "distanceMin": 7.20}, {"note": 9.5, "distanceMin": 6.80},
  {"note": 9, "distanceMin": 6.50}, {"note": 8.5, "distanceMin": 6.10}, {"note": 8, "distanceMin": 5.80},
  {"note": 7.5, "distanceMin": 5.50}, {"note": 7, "distanceMin": 5.20}, {"note": 6.5, "distanceMin": 4.90},
  {"note": 6, "distanceMin": 4.70}, {"note": 5.5, "distanceMin": 4.40}, {"note": 5, "distanceMin": 4.20},
  {"note": 4.5, "distanceMin": 4.00}, {"note": 4, "distanceMin": 3.80}, {"note": 3.5, "distanceMin": 3.70},
  {"note": 3, "distanceMin": 3.60}, {"note": 2.5, "distanceMin": 3.50}, {"note": 2, "distanceMin": 3.40},
  {"note": 1.5, "distanceMin": 3.30}, {"note": 1, "distanceMin": 3.20}
]))

baremes.append(create_bareme("bar_poids_3eme_g_4kg", "Lancer de poids", "4kg", "Troisième", "Garçon", "distance", [
  {"note": 20, "distanceMin": 13.10}, {"note": 19, "distanceMin": 12.40}, {"note": 18, "distanceMin": 11.70},
  {"note": 17, "distanceMin": 11.10}, {"note": 16, "distanceMin": 10.50}, {"note": 15, "distanceMin": 10.00},
  {"note": 14, "distanceMin": 9.50}, {"note": 13, "distanceMin": 9.40}, {"note": 12.5, "distanceMin": 8.90},
  {"note": 12, "distanceMin": 8.40}, {"note": 11.5, "distanceMin": 7.90}, {"note": 11, "distanceMin": 7.60},
  {"note": 10.5, "distanceMin": 7.20}, {"note": 10, "distanceMin": 6.70}, {"note": 9.5, "distanceMin": 6.40},
  {"note": 9, "distanceMin": 6.00}, {"note": 8.5, "distanceMin": 5.70}, {"note": 8, "distanceMin": 5.40},
  {"note": 7.5, "distanceMin": 5.10}, {"note": 7, "distanceMin": 4.80}, {"note": 6.5, "distanceMin": 4.60},
  {"note": 6, "distanceMin": 4.30}, {"note": 5.5, "distanceMin": 4.10}, {"note": 5, "distanceMin": 3.80},
  {"note": 4.5, "distanceMin": 3.75}, {"note": 4, "distanceMin": 3.70}, {"note": 3.5, "distanceMin": 3.60},
  {"note": 3, "distanceMin": 3.50}, {"note": 2.5, "distanceMin": 3.40}, {"note": 2, "distanceMin": 3.30},
  {"note": 1.5, "distanceMin": 3.20}, {"note": 1, "distanceMin": 3.10}
]))

# TROISIEME FILLES 3kg
baremes.append(create_bareme("bar_poids_3eme_f_3kg", "Lancer de poids", "3kg", "Troisième", "Fille", "distance", [
  {"note": 20, "distanceMin": 10.00}, {"note": 19, "distanceMin": 9.50}, {"note": 18, "distanceMin": 9.00},
  {"note": 17, "distanceMin": 8.50}, {"note": 16, "distanceMin": 8.00}, {"note": 15, "distanceMin": 7.60},
  {"note": 14, "distanceMin": 7.20}, {"note": 13, "distanceMin": 6.80}, {"note": 12.5, "distanceMin": 6.50},
  {"note": 12, "distanceMin": 6.10}, {"note": 11.5, "distanceMin": 5.80}, {"note": 11, "distanceMin": 5.50},
  {"note": 10.5, "distanceMin": 5.20}, {"note": 10, "distanceMin": 4.90}, {"note": 9.5, "distanceMin": 4.70},
  {"note": 9, "distanceMin": 4.40}, {"note": 8.5, "distanceMin": 4.20}, {"note": 8, "distanceMin": 4.00},
  {"note": 7.5, "distanceMin": 3.80}, {"note": 7, "distanceMin": 3.70}, {"note": 6.5, "distanceMin": 3.60},
  {"note": 6, "distanceMin": 3.50}, {"note": 5.5, "distanceMin": 3.40}, {"note": 5, "distanceMin": 3.30},
  {"note": 4.5, "distanceMin": 3.20}, {"note": 4, "distanceMin": 3.10}, {"note": 3.5, "distanceMin": 3.00},
  {"note": 3, "distanceMin": 2.90}, {"note": 2.5, "distanceMin": 2.80}
]))

# SECONDE GARÇONS 4kg & 5kg
baremes.append(create_bareme("bar_poids_2nde_g_4kg", "Lancer de poids", "4kg", "Seconde", "Garçon", "distance", [
  {"note": 20, "distanceMin": 14.10}, {"note": 19, "distanceMin": 13.30}, {"note": 18, "distanceMin": 12.60},
  {"note": 17, "distanceMin": 11.80}, {"note": 16, "distanceMin": 11.20}, {"note": 15, "distanceMin": 10.50},
  {"note": 14, "distanceMin": 9.96}, {"note": 13, "distanceMin": 9.39}, {"note": 12.5, "distanceMin": 8.86},
  {"note": 12, "distanceMin": 8.35}, {"note": 11.5, "distanceMin": 7.88}, {"note": 11, "distanceMin": 7.43},
  {"note": 10.5, "distanceMin": 7.00}, {"note": 10, "distanceMin": 6.60}, {"note": 9.5, "distanceMin": 6.19},
  {"note": 9, "distanceMin": 5.87}, {"note": 8.5, "distanceMin": 5.54}, {"note": 8, "distanceMin": 5.22},
  {"note": 7.5, "distanceMin": 4.92}, {"note": 7, "distanceMin": 4.64}, {"note": 6.5, "distanceMin": 4.38},
  {"note": 6, "distanceMin": 4.13}, {"note": 5.5, "distanceMin": 3.89}, {"note": 5, "distanceMin": 3.67},
  {"note": 4.5, "distanceMin": 3.46}, {"note": 4, "distanceMin": 3.26}, {"note": 3.5, "distanceMin": 3.08},
  {"note": 3, "distanceMin": 2.90}, {"note": 2.5, "distanceMin": 2.74}
]))

baremes.append(create_bareme("bar_poids_2nde_g_5kg", "Lancer de poids", "5kg", "Seconde", "Garçon", "distance", [
  {"note": 20, "distanceMin": 12.90}, {"note": 19, "distanceMin": 12.20}, {"note": 18, "distanceMin": 11.50},
  {"note": 17, "distanceMin": 10.80}, {"note": 16, "distanceMin": 10.20}, {"note": 15, "distanceMin": 9.65},
  {"note": 14, "distanceMin": 9.10}, {"note": 13, "distanceMin": 8.58}, {"note": 12.5, "distanceMin": 8.09},
  {"note": 12, "distanceMin": 7.63}, {"note": 11.5, "distanceMin": 7.20}, {"note": 11, "distanceMin": 6.79},
  {"note": 10.5, "distanceMin": 6.40}, {"note": 10, "distanceMin": 6.03}, {"note": 9.5, "distanceMin": 5.60},
  {"note": 9, "distanceMin": 5.37}, {"note": 8.5, "distanceMin": 5.06}, {"note": 8, "distanceMin": 4.77},
  {"note": 7.5, "distanceMin": 4.50}, {"note": 7, "distanceMin": 4.24}, {"note": 6.5, "distanceMin": 4.00},
  {"note": 6, "distanceMin": 3.77}, {"note": 5.5, "distanceMin": 3.56}, {"note": 5, "distanceMin": 3.35},
  {"note": 4.5, "distanceMin": 3.16}, {"note": 4, "distanceMin": 2.98}, {"note": 3.5, "distanceMin": 2.81},
  {"note": 3, "distanceMin": 2.65}, {"note": 2.5, "distanceMin": 2.50}
]));

// Seconde Filles
baremes.append(create_bareme("bar_poids_2nde_f_3kg", "Lancer de poids", "3kg", "Seconde", "Fille", "distance", [
  {"note": 20, "distanceMin": 9.39}, {"note": 19, "distanceMin": 8.86}, {"note": 18, "distanceMin": 8.35},
  {"note": 17, "distanceMin": 7.88}, {"note": 16, "distanceMin": 7.43}, {"note": 15, "distanceMin": 7.00},
  {"note": 14, "distanceMin": 6.60}, {"note": 13, "distanceMin": 6.19}, {"note": 12.5, "distanceMin": 5.87},
  {"note": 12, "distanceMin": 5.54}, {"note": 11.5, "distanceMin": 5.22}, {"note": 11, "distanceMin": 4.92},
  {"note": 10.5, "distanceMin": 4.64}, {"note": 10, "distanceMin": 4.38}, {"note": 9.5, "distanceMin": 4.13},
  {"note": 9, "distanceMin": 3.89}, {"note": 8.5, "distanceMin": 3.67}, {"note": 8, "distanceMin": 3.46},
  {"note": 7.5, "distanceMin": 3.26}, {"note": 7, "distanceMin": 3.08}, {"note": 6.5, "distanceMin": 2.90},
  {"note": 6, "distanceMin": 2.74}, {"note": 5.5, "distanceMin": 2.58}, {"note": 5, "distanceMin": 2.43},
  {"note": 4.5, "distanceMin": 2.30}, {"note": 4, "distanceMin": 2.16}
]));

# PREMIERE GARÇONS 4kg & 5kg
baremes.append(create_bareme("bar_poids_1ere_g_4kg", "Lancer de poids", "4kg", "Première", "Garçon", "distance", [
  {"note": 20, "distanceMin": 15.00}, {"note": 19, "distanceMin": 14.10}, {"note": 18, "distanceMin": 13.30},
  {"note": 17, "distanceMin": 12.60}, {"note": 16, "distanceMin": 11.80}, {"note": 15, "distanceMin": 11.20},
  {"note": 14, "distanceMin": 10.50}, {"note": 13, "distanceMin": 9.96}, {"note": 12.5, "distanceMin": 9.39},
  {"note": 12, "distanceMin": 8.86}, {"note": 11.5, "distanceMin": 8.35}, {"note": 11, "distanceMin": 7.88},
  {"note": 10.5, "distanceMin": 7.43}, {"note": 10, "distanceMin": 7.00}, {"note": 9.5, "distanceMin": 6.60},
  {"note": 9, "distanceMin": 6.19}, {"note": 8.5, "distanceMin": 5.87}, {"note": 8, "distanceMin": 5.54},
  {"note": 7.5, "distanceMin": 5.22}, {"note": 7, "distanceMin": 4.92}, {"note": 6.5, "distanceMin": 4.64},
  {"note": 6, "distanceMin": 4.38}, {"note": 5.5, "distanceMin": 4.13}, {"note": 5, "distanceMin": 3.89},
  {"note": 4.5, "distanceMin": 3.67}, {"note": 4, "distanceMin": 3.46}, {"note": 3.5, "distanceMin": 3.26},
  {"note": 3, "distanceMin": 3.08}, {"note": 2.5, "distanceMin": 2.90}, {"note": 2, "distanceMin": 2.74}
]))

baremes.append(create_bareme("bar_poids_1ere_g_5kg", "Lancer de poids", "5kg", "Première", "Garçon", "distance", [
  {"note": 20, "distanceMin": 13.70}, {"note": 19, "distanceMin": 12.90}, {"note": 18, "distanceMin": 12.20},
  {"note": 17, "distanceMin": 11.50}, {"note": 16, "distanceMin": 10.80}, {"note": 15, "distanceMin": 10.20},
  {"note": 14, "distanceMin": 9.65}, {"note": 13, "distanceMin": 9.10}, {"note": 12.5, "distanceMin": 8.58},
  {"note": 12, "distanceMin": 8.09}, {"note": 11.5, "distanceMin": 7.63}, {"note": 11, "distanceMin": 7.20},
  {"note": 10.5, "distanceMin": 6.79}, {"note": 10, "distanceMin": 6.40}, {"note": 9.5, "distanceMin": 6.03},
  {"note": 9, "distanceMin": 5.37}, {"note": 8.5, "distanceMin": 5.06}, {"note": 8, "distanceMin": 4.77},
  {"note": 7.5, "distanceMin": 4.50}, {"note": 7, "distanceMin": 4.24}, {"note": 6.5, "distanceMin": 4.00},
  {"note": 6, "distanceMin": 3.77}, {"note": 5.5, "distanceMin": 3.56}, {"note": 5, "distanceMin": 3.35},
  {"note": 4.5, "distanceMin": 3.16}, {"note": 4, "distanceMin": 2.98}, {"note": 3.5, "distanceMin": 2.81},
  {"note": 3, "distanceMin": 2.65}, {"note": 2.5, "distanceMin": 2.50}
]))

# PREMIERE FILLES 4kg
baremes.append(create_bareme("bar_poids_1ere_f_4kg", "Lancer de poids", "4kg", "Première", "Fille", "distance", [
  {"note": 20, "distanceMin": 9.96}, {"note": 19, "distanceMin": 9.39}, {"note": 18, "distanceMin": 8.86},
  {"note": 17, "distanceMin": 8.35}, {"note": 16, "distanceMin": 7.88}, {"note": 15, "distanceMin": 7.43},
  {"note": 14, "distanceMin": 7.00}, {"note": 13, "distanceMin": 6.60}, {"note": 12.5, "distanceMin": 6.19},
  {"note": 12, "distanceMin": 5.87}, {"note": 11.5, "distanceMin": 5.54}, {"note": 11, "distanceMin": 5.22},
  {"note": 10.5, "distanceMin": 4.92}, {"note": 10, "distanceMin": 4.64}, {"note": 9.5, "distanceMin": 4.38},
  {"note": 9, "distanceMin": 4.13}, {"note": 8.5, "distanceMin": 3.89}, {"note": 8, "distanceMin": 3.67},
  {"note": 7.5, "distanceMin": 3.46}, {"note": 7, "distanceMin": 3.26}, {"note": 6.5, "distanceMin": 3.08},
  {"note": 6, "distanceMin": 2.90}, {"note": 5.5, "distanceMin": 2.74}, {"note": 5, "distanceMin": 2.58},
  {"note": 4.5, "distanceMin": 2.43}, {"note": 4, "distanceMin": 2.30}, {"note": 3.5, "distanceMin": 2.16}
]))

# TERMINALE GARÇONS 4kg & 5kg
baremes.append(create_bareme("bar_poids_term_g_4kg", "Lancer de poids", "4kg", "Terminale", "Garçon", "distance", [
  {"note": 20, "distanceMin": 15.90}, {"note": 19, "distanceMin": 15.00}, {"note": 18, "distanceMin": 14.10},
  {"note": 17, "distanceMin": 13.30}, {"note": 16, "distanceMin": 12.60}, {"note": 15, "distanceMin": 11.80},
  {"note": 14, "distanceMin": 11.20}, {"note": 13, "distanceMin": 10.50}, {"note": 12.5, "distanceMin": 9.96},
  {"note": 12, "distanceMin": 9.39}, {"note": 11.5, "distanceMin": 8.86}, {"note": 11, "distanceMin": 8.35},
  {"note": 10.5, "distanceMin": 7.88}, {"note": 10, "distanceMin": 7.43}, {"note": 9.5, "distanceMin": 7.00},
  {"note": 9, "distanceMin": 6.60}, {"note": 8.5, "distanceMin": 6.19}, {"note": 8, "distanceMin": 5.54},
  {"note": 7.5, "distanceMin": 5.22}, {"note": 7, "distanceMin": 4.92}, {"note": 6.5, "distanceMin": 4.64},
  {"note": 6, "distanceMin": 4.38}, {"note": 5.5, "distanceMin": 4.13}, {"note": 5, "distanceMin": 3.89},
  {"note": 4.5, "distanceMin": 3.67}, {"note": 4, "distanceMin": 3.46}, {"note": 3.5, "distanceMin": 3.26}
]))

baremes.append(create_bareme("bar_poids_term_g_5kg", "Lancer de poids", "5kg", "Terminale", "Garçon", "distance", [
  {"note": 20, "distanceMin": 14.50}, {"note": 19, "distanceMin": 13.70}, {"note": 18, "distanceMin": 12.90},
  {"note": 17, "distanceMin": 12.20}, {"note": 16, "distanceMin": 11.50}, {"note": 15, "distanceMin": 10.80},
  {"note": 14, "distanceMin": 10.20}, {"note": 13, "distanceMin": 9.65}, {"note": 12.5, "distanceMin": 9.10},
  {"note": 12, "distanceMin": 8.58}, {"note": 11.5, "distanceMin": 8.09}, {"note": 11, "distanceMin": 7.63},
  {"note": 10.5, "distanceMin": 7.20}, {"note": 10, "distanceMin": 6.79}, {"note": 9.5, "distanceMin": 6.40},
  {"note": 9, "distanceMin": 6.03}, {"note": 8.5, "distanceMin": 5.60}, {"note": 8, "distanceMin": 5.37},
  {"note": 7.5, "distanceMin": 5.06}, {"note": 7, "distanceMin": 4.77}, {"note": 6.5, "distanceMin": 4.50},
  {"note": 6, "distanceMin": 4.24}, {"note": 5.5, "distanceMin": 4.00}, {"note": 5, "distanceMin": 3.77},
  {"note": 4.5, "distanceMin": 3.56}, {"note": 4, "distanceMin": 3.35}, {"note": 3.5, "distanceMin": 2.98}
]))

# TERMINALE FILLES 4kg
baremes.append(create_bareme("bar_poids_term_f_4kg", "Lancer de poids", "4kg", "Terminale", "Fille", "distance", [
  {"note": 20, "distanceMin": 11.20}, {"note": 19, "distanceMin": 10.50}, {"note": 18, "distanceMin": 9.96},
  {"note": 17, "distanceMin": 9.39}, {"note": 16, "distanceMin": 8.86}, {"note": 15, "distanceMin": 8.35},
  {"note": 14, "distanceMin": 7.88}, {"note": 13, "distanceMin": 7.43}, {"note": 12.5, "distanceMin": 7.00},
  {"note": 12, "distanceMin": 6.60}, {"note": 11.5, "distanceMin": 6.19}, {"note": 11, "distanceMin": 5.87},
  {"note": 10.5, "distanceMin": 5.54}, {"note": 10, "distanceMin": 5.22}, {"note": 9.5, "distanceMin": 4.92},
  {"note": 9, "distanceMin": 4.64}, {"note": 8.5, "distanceMin": 4.38}, {"note": 8, "distanceMin": 4.13},
  {"note": 7.5, "distanceMin": 3.89}, {"note": 7, "distanceMin": 3.67}, {"note": 6.5, "distanceMin": 3.46},
  {"note": 6, "distanceMin": 3.26}, {"note": 5.5, "distanceMin": 3.08}, {"note": 5, "distanceMin": 2.90},
  {"note": 4.5, "distanceMin": 2.74}, {"note": 4, "distanceMin": 2.58}, {"note": 3.5, "distanceMin": 2.43},
  {"note": 3, "distanceMin": 2.30}, {"note": 2.5, "distanceMin": 2.16}
]))


# --- 2. COURSE 1000M (ALL 7 CLASSES, GARÇONS & FILLES) ---
course1000m_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 189, "minNote": 1, "minPerf": 430},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 210, "minNote": 1, "minPerf": 460},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 184, "minNote": 1, "minPerf": 420},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 205, "minNote": 1, "minPerf": 450},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 178, "minNote": 1, "minPerf": 410},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 198, "minNote": 1, "minPerf": 440},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 172, "minNote": 1, "minPerf": 400},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 192, "minNote": 1, "minPerf": 430},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 166, "minNote": 1, "minPerf": 390},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 186, "minNote": 1, "minPerf": 420},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 160, "minNote": 1, "minPerf": 380},
  "Première_Fille": {"maxNote": 20, "maxPerf": 180, "minNote": 1, "minPerf": 410},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 155, "minNote": 1, "minPerf": 370},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 175, "minNote": 1, "minPerf": 400}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = course1000m_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_1000m_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Course 1000m", None, cls, gnr, "temps", grid))


# --- 3. COURSE 800M (ALL 7 CLASSES, GARÇONS & FILLES) ---
course800m_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 150, "minNote": 1, "minPerf": 330},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 165, "minNote": 1, "minPerf": 360},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 145, "minNote": 1, "minPerf": 320},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 160, "minNote": 1, "minPerf": 350},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 140, "minNote": 1, "minPerf": 310},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 154, "minNote": 1, "minPerf": 340},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 135, "minNote": 1, "minPerf": 300},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 148, "minNote": 1, "minPerf": 330},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 130, "minNote": 1, "minPerf": 290},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 142, "minNote": 1, "minPerf": 320},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 125, "minNote": 1, "minPerf": 280},
  "Première_Fille": {"maxNote": 20, "maxPerf": 136, "minNote": 1, "minPerf": 310},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 120, "minNote": 1, "minPerf": 270},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 130, "minNote": 1, "minPerf": 300}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = course800m_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_800m_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Course 800m", None, cls, gnr, "temps", grid))


# --- 4. COURSE 60M (ALL 7 CLASSES, GARÇONS & FILLES) ---
course60m_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 8.2, "minNote": 1, "minPerf": 13.1},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 8.9, "minNote": 1, "minPerf": 14.0},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 8.0, "minNote": 1, "minPerf": 12.8},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 8.7, "minNote": 1, "minPerf": 13.8},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 7.8, "minNote": 1, "minPerf": 12.5},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 8.5, "minNote": 1, "minPerf": 13.5},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 7.6, "minNote": 1, "minPerf": 12.2},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 8.3, "minNote": 1, "minPerf": 13.2},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 7.4, "minNote": 1, "minPerf": 11.8},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 8.1, "minNote": 1, "minPerf": 12.9},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 7.2, "minNote": 1, "minPerf": 11.5},
  "Première_Fille": {"maxNote": 20, "maxPerf": 7.9, "minNote": 1, "minPerf": 12.6},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 7.0, "minNote": 1, "minPerf": 11.2},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 7.7, "minNote": 1, "minPerf": 12.3}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = course60m_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_60m_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Course 60m", None, cls, gnr, "temps", grid))


# --- 5. SAUT EN HAUTEUR (ALL 7 CLASSES, GARÇONS & FILLES) ---
hauteur_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 1.45, "minNote": 1, "minPerf": 0.65},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 1.30, "minNote": 1, "minPerf": 0.55},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 1.50, "minNote": 1, "minPerf": 0.70},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 1.35, "minNote": 1, "minPerf": 0.60},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 1.55, "minNote": 1, "minPerf": 0.75},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 1.40, "minNote": 1, "minPerf": 0.65},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 1.60, "minNote": 1, "minPerf": 0.80},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 1.45, "minNote": 1, "minPerf": 0.70},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 1.65, "minNote": 1, "minPerf": 0.85},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 1.50, "minNote": 1, "minPerf": 0.75},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 1.70, "minNote": 1, "minPerf": 0.90},
  "Première_Fille": {"maxNote": 20, "maxPerf": 1.55, "minNote": 1, "minPerf": 0.80},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 1.75, "minNote": 1, "minPerf": 0.95},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 1.60, "minNote": 1, "minPerf": 0.85}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = hauteur_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_hauteur_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Saut en hauteur", None, cls, gnr, "distance", grid))


# --- 6. SAUT EN LONGUEUR (ALL 7 CLASSES, GARÇONS & FILLES) ---
longueur_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 5.60, "minNote": 1, "minPerf": 1.40},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 4.50, "minNote": 1, "minPerf": 1.10},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 5.80, "minNote": 1, "minPerf": 1.50},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 4.70, "minNote": 1, "minPerf": 1.20},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 6.00, "minNote": 1, "minPerf": 1.60},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 4.90, "minNote": 1, "minPerf": 1.30},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 6.20, "minNote": 1, "minPerf": 1.70},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 5.10, "minNote": 1, "minPerf": 1.40},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 6.40, "minNote": 1, "minPerf": 1.80},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 5.30, "minNote": 1, "minPerf": 1.50},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 6.60, "minNote": 1, "minPerf": 1.90},
  "Première_Fille": {"maxNote": 20, "maxPerf": 5.50, "minNote": 1, "minPerf": 1.60},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 6.80, "minNote": 1, "minPerf": 2.00},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 5.70, "minNote": 1, "minPerf": 1.70}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = longueur_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_longueur_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Saut en longueur", None, cls, gnr, "distance", grid))


# --- 7. TRIPLE SAUT (ALL 7 CLASSES, GARÇONS & FILLES) ---
triple_saut_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 10.40, "minNote": 1, "minPerf": 6.10},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 8.50, "minNote": 1, "minPerf": 5.00},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 10.70, "minNote": 1, "minPerf": 6.30},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 8.80, "minNote": 1, "minPerf": 5.20},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 11.00, "minNote": 1, "minPerf": 6.50},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 9.10, "minNote": 1, "minPerf": 5.40},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 11.30, "minNote": 1, "minPerf": 6.70},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 9.40, "minNote": 1, "minPerf": 5.60},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 11.60, "minNote": 1, "minPerf": 6.90},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 9.70, "minNote": 1, "minPerf": 5.80},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 11.90, "minNote": 1, "minPerf": 7.10},
  "Première_Fille": {"maxNote": 20, "maxPerf": 10.00, "minNote": 1, "minPerf": 6.00},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 12.20, "minNote": 1, "minPerf": 7.30},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 10.30, "minNote": 1, "minPerf": 6.20}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = triple_saut_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_triplesaut_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Triple saut", None, cls, gnr, "distance", grid))


# --- 8. COURSE DE HAIES (ALL 7 CLASSES, GARÇONS & FILLES) ---
haies_base = {
  "Sixième_Garçon": {"maxNote": 20, "maxPerf": 10.20, "minNote": 1, "minPerf": 17.00},
  "Sixième_Fille": {"maxNote": 20, "maxPerf": 12.30, "minNote": 1, "minPerf": 18.00},
  "Cinquième_Garçon": {"maxNote": 20, "maxPerf": 10.00, "minNote": 1, "minPerf": 16.70},
  "Cinquième_Fille": {"maxNote": 20, "maxPerf": 12.00, "minNote": 1, "minPerf": 17.70},
  "Quatrième_Garçon": {"maxNote": 20, "maxPerf": 9.80, "minNote": 1, "minPerf": 16.40},
  "Quatrième_Fille": {"maxNote": 20, "maxPerf": 11.70, "minNote": 1, "minPerf": 17.40},
  "Troisième_Garçon": {"maxNote": 20, "maxPerf": 9.50, "minNote": 1, "minPerf": 16.00},
  "Troisième_Fille": {"maxNote": 20, "maxPerf": 11.40, "minNote": 1, "minPerf": 17.00},
  "Seconde_Garçon": {"maxNote": 20, "maxPerf": 9.20, "minNote": 1, "minPerf": 15.60},
  "Seconde_Fille": {"maxNote": 20, "maxPerf": 11.10, "minNote": 1, "minPerf": 16.50},
  "Première_Garçon": {"maxNote": 20, "maxPerf": 8.90, "minNote": 1, "minPerf": 15.10},
  "Première_Fille": {"maxNote": 20, "maxPerf": 10.80, "minNote": 1, "minPerf": 16.00},
  "Terminale_Garçon": {"maxNote": 20, "maxPerf": 8.60, "minNote": 1, "minPerf": 14.60},
  "Terminale_Fille": {"maxNote": 20, "maxPerf": 10.50, "minNote": 1, "minPerf": 15.50}
}

for cls in CLASSES:
    for gnr in GENRES:
        key = f"{cls}_{gnr}"
        cfg = haies_base[key]
        grid = generate_linear_grid(cfg["minNote"], cfg["maxNote"], 1.0, cfg["minPerf"], cfg["maxPerf"])
        id_str = f"bar_haies_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
        baremes.append(create_bareme(id_str, "Course de haies", None, cls, gnr, "temps", grid))


# --- 9. NATATION (50m Libre, 50m Brasse, 50m Papillon, 50m Dos) ---
natation_premier_cycle = {
    "libre": [37.3, 39.1, 41.1, 43.1, 45.2, 47.4, 49.7, 52.2, 54.7, 57.4, 60.2, 63.1, 66.2, 69.4, 72.7, 76.3, 80.0, 83.8, 86.0, 93.2, 97.1, 100.0, 104.3, 109.8, 113.2],
    "brasse": [45.0, 48.2, 50.5, 53.0, 55.6, 58.3, 61.1, 64.1, 67.2, 70.5, 73.9, 77.5, 81.2, 85.1, 89.2, 93.5, 98.0, 102.7, 107.2, 111.3, 115.1, 118.5, 123.7, 128.2, 133.0],
    "papillon": [41.0, 43.1, 45.8, 47.7, 50.1, 52.7, 55.4, 58.3, 61.3, 64.4, 67.7, 71.2, 74.8, 78.7, 82.7, 87.0, 91.4, 96.1, 98.0, 102.7, 107.2, 111.3, 115.1, 118.5, 123.7],
    "dos": [43.7, 45.9, 48.1, 50.4, 52.9, 55.5, 58.2, 61.0, 64.0, 67.1, 70.4, 73.9, 77.5, 81.2, 85.2, 89.3, 93.7, 98.2, 98.0, 98.0, 102.7, 107.2, 111.3, 115.1, 118.5]
}

offsets_premier = {
    "Troisième_Garçon": 0, "Quatrième_Garçon": 1, "Cinquième_Garçon": 2, "Sixième_Garçon": 3,
    "Troisième_Fille": 4, "Quatrième_Fille": 5, "Cinquième_Fille": 6, "Sixième_Fille": 7
}

natation_deuxieme_cycle = {
    "libre": [32.3, 33.9, 35.6, 37.3, 39.1, 41.1, 43.1, 45.2, 47.4, 49.7, 52.2, 54.7, 57.4, 60.2, 63.1, 66.2, 69.4, 72.7, 76.3, 80.0, 83.8, 86.0, 93.2, 97.1],
    "brasse": [39.8, 41.7, 43.8, 45.0, 48.2, 50.5, 53.0, 55.6, 58.3, 61.1, 64.1, 67.2, 70.5, 73.9, 77.5, 81.2, 85.1, 89.2, 93.5, 98.0, 102.7, 107.2, 111.3, 115.1],
    "papillon": [35.3, 37.1, 39.0, 41.0, 43.1, 45.8, 47.7, 50.1, 52.7, 55.4, 58.3, 61.3, 64.4, 67.7, 71.2, 74.8, 78.7, 82.7, 87.0, 91.4, 96.1, 98.0, 102.7, 107.2],
    "dos": [37.9, 39.7, 41.7, 43.7, 45.9, 48.1, 50.4, 52.9, 55.5, 58.2, 61.0, 64.0, 67.1, 70.4, 73.9, 77.5, 81.2, 85.2, 89.3, 93.7, 98.2, 98.0, 102.7, 107.2]
}

offsets_deuxieme = {
    "Terminale_Garçon": 0, "Première_Garçon": 1, "Seconde_Garçon": 2,
    "Terminale_Fille": 4, "Première_Fille": 5, "Seconde_Fille": 6
}

styles_nat = [
    {"key": "libre", "name": "Natation 50m Libre", "code": "nat_libre"},
    {"key": "brasse", "name": "Natation 50m Brasse", "code": "nat_brasse"},
    {"key": "papillon", "name": "Natation 50m Papillon", "code": "nat_papillon"},
    {"key": "dos", "name": "Natation 50m Dos", "code": "nat_dos"}
]

for cls in ["Sixième", "Cinquième", "Quatrième", "Troisième"]:
    for gnr in GENRES:
        key_str = f"{cls}_{gnr}"
        offset = offsets_premier[key_str]
        for st in styles_nat:
            grid = []
            for i in range(20):
                note = 20 - i
                time_idx = offset + i
                if time_idx < len(natation_premier_cycle[st["key"]]):
                    grid.append({"note": note, "distanceMin": natation_premier_cycle[st["key"]][time_idx]})
            id_str = f"bar_{st['code']}_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
            baremes.append(create_bareme(id_str, st["name"], None, cls, gnr, "temps", grid))

for cls in ["Seconde", "Première", "Terminale"]:
    for gnr in GENRES:
        key_str = f"{cls}_{gnr}"
        offset = offsets_deuxieme[key_str]
        for st in styles_nat:
            grid = []
            for i in range(20):
                note = 20 - i
                time_idx = offset + i
                if time_idx < len(natation_deuxieme_cycle[st["key"]]):
                    grid.append({"note": note, "distanceMin": natation_deuxieme_cycle[st["key"]][time_idx]})
            id_str = f"bar_{st['code']}_{cls.lower()}_{'g' if gnr == 'Garçon' else 'f'}"
            baremes.append(create_bareme(id_str, st["name"], None, cls, gnr, "temps", grid))

# Save output to data/default_baremes.json
target_path = os.path.join(os.getcwd(), 'data', 'default_baremes.json')
with open(target_path, 'w', encoding='utf-8') as f:
    json.dump(baremes, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {len(baremes)} default baremes into {target_path}")
