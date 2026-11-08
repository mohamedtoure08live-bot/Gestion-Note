/**
 * EPS Rating Engine (js/engine.js)
 * Computes official grade over 20 based on barèmes officiels & performance (Distance/Hauteur or Temps).
 * Supports both Linear Interpolation (Exact Proportional Grade) and Strict Palier.
 */

import { db } from './db.js';

export class EPSEngine {
  static OFFICIAL_LEVELS = [
    "Sixième",
    "Cinquième",
    "Quatrième",
    "Troisième",
    "Seconde",
    "Première",
    "Terminale"
  ];

  static OFFICIAL_DISCIPLINES = [
    "Lancer de poids",
    "Course 1000m",
    "Course 800m",
    "Course de vitesse de 60 mètres",
    "Saut en hauteur",
    "Saut en longueur"
  ];

  static normalizeNiveau(input) {
    if (!input) return "Troisième";
    const s = String(input).trim().toLowerCase();
    if (s.includes("6") || s.includes("six")) return "Sixième";
    if (s.includes("5") || s.includes("cinq")) return "Cinquième";
    if (s.includes("4") || s.includes("quat")) return "Quatrième";
    if (s.includes("3") || s.includes("trois")) return "Troisième";
    if (s.includes("2") || s.includes("sec")) return "Seconde";
    if (s.includes("1") || s.includes("prem")) return "Première";
    if (s.includes("term") || s.includes("tle")) return "Terminale";
    const match = EPSEngine.OFFICIAL_LEVELS.find(l => l.toLowerCase() === s);
    return match || "Troisième";
  }
  /**
   * Helper to parse performance strings (ex: "3'09", "8''2", "11.70", or raw number) into numeric value
   * @param {string|number} raw 
   * @returns {number}
   */
  /**
   * Valide et analyse une performance saisie (temps chronométré ou distance/hauteur).
   * Refuse les formats malformés et les secondes >= 60 dans un format min:sec (ex: 1:75,30).
   * @param {string|number} raw
   * @param {string} [discipline=""]
   * @returns {{ valid: boolean, isEmpty?: boolean, value: number, error?: string }}
   */
  static validatePerformanceFormat(raw, discipline = "") {
    const isTime = EPSEngine.isTimeDiscipline(discipline);

    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return {
        valid: false,
        isEmpty: true,
        value: NaN,
        error: isTime
          ? "Veuillez saisir un temps chronométré (ex: 45,32 ou 1:25,48)."
          : "Veuillez saisir une distance ou hauteur (ex: 11,70)."
      };
    }

    if (typeof raw === 'number') {
      if (isNaN(raw) || raw <= 0 || !isFinite(raw)) {
        return {
          valid: false,
          value: NaN,
          error: "La valeur saisie doit être supérieure à zéro."
        };
      }
      return { valid: true, value: Math.round(raw * 10000) / 10000 };
    }

    // Nettoyage des espaces en début/fin et autour des séparateurs
    let str = String(raw).trim();
    if (!str) {
      return {
        valid: false,
        isEmpty: true,
        value: NaN,
        error: "Veuillez saisir une performance valide."
      };
    }

    // Normalisation des apostrophes et guillemets unicode
    str = str
      .replace(/´´/g, '"')
      .replace(/''/g, '"')
      .replace(/[’′´`]/g, "'")
      .replace(/[″”“]/g, '"');

    // Cas 1 : Format Minutes : Secondes (,Centièmes) ou Minutes ' Secondes '' (Centièmes)
    // Exemples : 1:25,48 | 12:05,30 | 1:25.48 | 3'09'' | 3'09"15 | 2'35''
    if (str.includes(':') || str.includes("'")) {
      // Vérifier le format exact min:sec(,cc) ou min'sec''(cc)
      const minSecColonMatch = str.match(/^(\d+)\s*:\s*(\d{1,2}(?:[.,]\d{1,3})?)$/);
      const minSecQuoteMatch = str.match(/^(\d+)\s*'\s*(\d{1,2}(?:[.,]\d{1,3})?)\s*(?:"\s*(\d{1,3})?)?$/);

      const match = minSecColonMatch || minSecQuoteMatch;
      if (!match) {
        // Détecter spécifiquement si les secondes comportent plus de 2 chiffres ou sont >= 60 (ex: 1:120)
        return {
          valid: false,
          value: NaN,
          error: "Format de temps incorrect. Utilisez le format min:sec,centièmes (ex: 1:25,48 ou 12:05,30)."
        };
      }

      const mins = parseInt(match[1], 10);
      let secsStr = match[2].replace(',', '.');
      if (minSecQuoteMatch && match[3] && !secsStr.includes('.')) {
        secsStr = `${secsStr}.${match[3]}`;
      }
      const secs = parseFloat(secsStr);

      if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0) {
        return {
          valid: false,
          value: NaN,
          error: "Format de temps non valide."
        };
      }

      // Règle stricte Section 4 : les secondes doivent être comprises entre 00 et 59.99 (refuser 1:75,30)
      if (secs >= 60) {
        return {
          valid: false,
          value: NaN,
          error: "Format de temps invalide : les secondes doivent être comprises entre 00 et 59 (ex: 1:25,48)."
        };
      }

      const totalSeconds = Math.round((mins * 60 + secs) * 10000) / 10000;
      if (totalSeconds <= 0) {
        return {
          valid: false,
          value: NaN,
          error: "La durée saisie doit être supérieure à zéro."
        };
      }

      return {
        valid: true,
        value: totalSeconds
      };
    }

    // Cas 2 : Format Sprint avec guillemets (ex: 8"2 ou 8''20)
    if (str.includes('"')) {
      const sprintMatch = str.match(/^(\d+)\s*"\s*(\d{1,3})$/);
      if (!sprintMatch) {
        return {
          valid: false,
          value: NaN,
          error: "Format de temps incorrect (ex: 45,32 ou 1:25,48)."
        };
      }
      const val = parseFloat(`${sprintMatch[1]}.${sprintMatch[2]}`);
      if (isNaN(val) || val <= 0) {
        return { valid: false, value: NaN, error: "La performance doit être supérieure à zéro." };
      }
      return { valid: true, value: val };
    }

    // Cas 3 : Format décimal standard avec virgule ou point (ex: 45,32 | 45.32 | 11,70 | 189)
    // Rejeter strictement tout caractère parasite (ex: "45,32abc", "abc", "12,3,4")
    const cleanNumStr = str.replace(/\s+/g, '');
    if (!/^\d+(?:[.,]\d+)?$/.test(cleanNumStr)) {
      return {
        valid: false,
        value: NaN,
        error: isTime
          ? "Format de temps incorrect. Utilisez des chiffres avec virgule ou deux-points (ex: 45,32 ou 1:25,48)."
          : "Format de performance incorrect. Saisissez une valeur numérique valide (ex: 11,70)."
      };
    }

    const numVal = parseFloat(cleanNumStr.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      return {
        valid: false,
        value: NaN,
        error: "La performance saisie doit être supérieure à zéro."
      };
    }

    return {
      valid: true,
      value: Math.round(numVal * 10000) / 10000
    };
  }

  /**
   * Helper to parse performance strings into numeric value
   * Supports:
   * - Minutes:Seconds,Hundredths (ex: 1:25,48 -> 85.48, 12:05,30 -> 725.30)
   * - Minutes'Seconds'' (ex: 3'7'', 3'07'', 3'7, 3:07, 3'07.5) -> convert to total seconds
   * - Sprint formats (ex: 8''2, 8"2) -> convert to 8.2 seconds
   * - French decimals (ex: 45,32 -> 45.32, 11,70 -> 11.70)
   * - Raw numbers (ex: 189 -> 189)
   * Rejects invalid formats (such as 1:75,30 or abc) by returning NaN.
   * @param {string|number} raw 
   * @returns {number}
   */
  static parsePerformance(raw) {
    const validated = EPSEngine.validatePerformanceFormat(raw);
    return validated.valid ? validated.value : NaN;
  }

  /**
   * Helper to format numeric performance into human-readable representation
   * (e.g. 187s -> 3'07'', 85.48s -> 1'25''48, 8.2s -> 8''2s, 11.70 -> 11.70m)
   * @param {number} perfNum 
   * @param {boolean} isTime 
   * @param {string} [discipline=""]
   * @returns {string}
   */
  static formatPerformance(perfNum, isTime, discipline = "") {
    if (isNaN(perfNum) || perfNum <= 0) return "-";
    
    if (!isTime) {
      return `${perfNum.toFixed(2).replace(/\.00$/, '')}m`;
    }

    const discLower = (discipline || "").toLowerCase();
    const isLongDistance = discLower.includes("1000m") || discLower.includes("800m") || perfNum >= 60;

    if (isLongDistance) {
      const mins = Math.floor((perfNum + 1e-7) / 60);
      const secs = Math.max(0, perfNum - mins * 60);
      const isIntSec = Math.abs(secs - Math.round(secs)) < 1e-4;
      let secFormatted;
      if (isIntSec) {
        secFormatted = String(Math.round(secs));
      } else {
        secFormatted = secs.toFixed(2).replace(/0$/, '');
      }
      const secStr = secs < 10 ? `0${secFormatted}` : `${secFormatted}`;
      return `${mins}'${secStr}''`;
    }

    return `${perfNum.toString().replace('.', "''")}s`;
  }

  /**
   * Determine whether an activity is timed (running/swimming) or distance/height
   * @param {string} discipline 
   * @returns {boolean}
   */
  static isTimeDiscipline(discipline) {
    if (!discipline) return false;
    const d = discipline.toLowerCase();
    return d.includes("course") || d.includes("vitesse") || d.includes("natation") || d.includes("chrono") || d.includes("1000m") || d.includes("800m") || d.includes("60m") || d.includes("80m") || d.includes("50m");
  }

  /**
   * Get the measurement unit of a discipline
   * @param {string} discipline 
   * @param {boolean} short - whether to return abbreviated unit (e.g. 'm', 's', 'min:sec')
   * @returns {string}
   */
  static getDisciplineUnit(discipline, short = false) {
    if (!discipline) return short ? "m" : "mètres";
    const d = discipline.toLowerCase();
    if (d.includes("1000m") || d.includes("800m")) return short ? "min:sec" : "min'sec''";
    if (EPSEngine.isTimeDiscipline(discipline)) return short ? "s" : "secondes";
    return short ? "m" : "mètres";
  }

  /**
   * Compares two performance values for a given discipline.
   * Returns:
   *  > 0 if candidate is strictly BETTER than reference
   *  < 0 if candidate is strictly WORSE than reference
   *  = 0 if identical
   * @param {string} discipline 
   * @param {number} candidate 
   * @param {number} reference 
   * @returns {number}
   */
  static comparePerformances(discipline, candidate, reference) {
    const isTime = EPSEngine.isTimeDiscipline(discipline);
    if (isTime) {
      // In timed races, smaller time is better: candidate < reference => reference - candidate > 0
      return reference - candidate;
    } else {
      // In throws / jumps, greater distance/height is better: candidate > reference => candidate - reference > 0
      return candidate - reference;
    }
  }

  /**
   * Returns true if candidate performance is strictly better than reference
   */
  static isBetterPerformance(discipline, candidate, reference) {
    return EPSEngine.comparePerformances(discipline, candidate, reference) > 0;
  }

  /**
   * Validate that the activity and apparatus weight match the official reference scale
   * @param {string} discipline 
   * @param {string} classe 
   * @param {string} genre 
   * @param {string} [engin=null]
   * @returns {Object} { valid, errorType, message, allowedEngins, bareme }
   */
  static validateInput(discipline, classe, genre, engin = null) {
    if (!discipline || !classe || !genre) {
      return {
        valid: false,
        errorType: 'missing_fields',
        message: "Veuillez renseigner l'activité, la classe et le genre de l'élève.",
        allowedEngins: []
      };
    }

    const baremesCategory = db.getBaremesForCategory(discipline, classe, genre);
    if (!baremesCategory || baremesCategory.length === 0) {
      return {
        valid: false,
        errorType: 'activity_incompatible',
        message: "Erreur de saisie : cette activité n’est pas autorisée pour le sexe et la classe sélectionnés selon le barème officiel. Veuillez vérifier votre sélection.",
        allowedEngins: []
      };
    }

    const allowedEngins = [...new Set(baremesCategory.map(b => b.engin).filter(Boolean))];
    if (allowedEngins.length > 0) {
      if (!engin || typeof engin !== 'string' || engin.trim() === '') {
        const enginsFormatted = allowedEngins.map(e => e.replace(/(\d+)\s*(k?g)/i, '$1 $2')).join(' ou ');
        return {
          valid: false,
          errorType: 'engin_required',
          message: `Veuillez sélectionner un engin réglementaire pour cette catégorie (${enginsFormatted}).`,
          allowedEngins: allowedEngins
        };
      }

      const cleanEng = engin.trim().toLowerCase();
      const match = allowedEngins.find(e => e.trim().toLowerCase() === cleanEng);
      if (!match) {
        const enginsFormatted = allowedEngins.map(e => e.replace(/(\d+)\s*(k?g)/i, '$1 $2')).join(' ou ');
        return {
          valid: false,
          errorType: 'engin_incompatible',
          message: `Erreur de saisie : le poids de l’engin sélectionné ne correspond pas au barème de cette classe et de ce sexe. Pour cette catégorie, utilisez un engin de ${enginsFormatted}.`,
          allowedEngins: allowedEngins
        };
      }

      const bareme = baremesCategory.find(b => b.engin && b.engin.trim().toLowerCase() === cleanEng);
      return {
        valid: true,
        bareme: bareme,
        allowedEngins: allowedEngins
      };
    }

    return {
      valid: true,
      bareme: baremesCategory[0],
      allowedEngins: []
    };
  }

  /**
   * Calculate grade for a given performance
   * @param {string} discipline 
   * @param {string} classe 
   * @param {string} genre 
   * @param {number|string} performance 
   * @param {string} [engin=null]
   * @param {string} [mode="interpolation"] - 'interpolation' (exact proportional) or 'palier' (lower tier)
   * @param {Object} [customBareme=null] - Optional teacher custom scale
   * @returns {Object} { valid, note, noteExacte, notePalier, appreciation, baremeFound, engin, detail, error }
   */
  static calculateGrade(discipline, classe, genre, performance, engin = null, mode = "interpolation", customBareme = null) {
    // 1. Mandatory Input Validation against official scale
    const validation = EPSEngine.validateInput(discipline, classe, genre, engin);
    if (!validation.valid && !customBareme) {
      return {
        valid: false,
        note: null,
        noteExacte: null,
        notePalier: null,
        appreciation: "Saisie Invalide",
        baremeFound: false,
        errorType: validation.errorType,
        error: validation.message,
        detail: validation.message,
        allowedEngins: validation.allowedEngins || []
      };
    }

    // 2. Performance Parsing & Format Validation
    const formatValidation = EPSEngine.validatePerformanceFormat(performance, discipline);
    const perfNum = formatValidation.value;
    if (!formatValidation.valid || isNaN(perfNum) || perfNum <= 0) {
      const activeBaremeRef = customBareme || validation.bareme;
      const errDetail = formatValidation.error || "Veuillez saisir une valeur de performance valide (ex: 1:25,48 ou 11,70).";
      return {
        valid: true,
        formatValid: false,
        note: null,
        noteExacte: null,
        notePalier: null,
        appreciation: "Format non valide",
        baremeFound: true,
        baremeId: activeBaremeRef ? activeBaremeRef.id : null,
        engin: activeBaremeRef ? activeBaremeRef.engin : engin,
        error: errDetail,
        detail: errDetail
      };
    }

    const bareme = customBareme || validation.bareme;
    if (!bareme || !bareme.grille || bareme.grille.length === 0) {
      return {
        valid: false,
        note: null,
        noteExacte: null,
        notePalier: null,
        appreciation: "Barème introuvable",
        baremeFound: false,
        detail: `Aucun barème trouvé pour ${discipline} (${classe} - ${genre}${engin ? ' - ' + engin : ''}).`
      };
    }

    const isTime = bareme.type === "temps" || discipline.toLowerCase().includes("course") || discipline.toLowerCase().includes("natation");
    const formattedPerf = EPSEngine.formatPerformance(perfNum, isTime, discipline);
    const unit = isTime ? "s" : "m";

    // Sort grid by note ascending
    const sortedGrid = [...bareme.grille].sort((a, b) => a.note - b.note);
    const lowestTier = sortedGrid[0];                     // Minimum note tier (ex: 1/20)
    const highestTier = sortedGrid[sortedGrid.length - 1]; // Maximum note tier (ex: 20/20)

    let exactNote = 0;
    let palierNote = 0;
    let detailText = "";

    if (!isTime) {
      // --- DISTANCE / HAUTEUR (Higher performance = Better grade) ---
      if (perfNum >= highestTier.distanceMin) {
        exactNote = highestTier.note;
        palierNote = highestTier.note;
        detailText = `Performance maximale atteinte (≥ ${EPSEngine.formatPerformance(highestTier.distanceMin, false, discipline)}).`;
      } else if (perfNum < lowestTier.distanceMin) {
        exactNote = Math.max(0, lowestTier.note - 1);
        palierNote = Math.max(0, lowestTier.note - 1);
        detailText = `Performance en-dessous du seuil minimal (${EPSEngine.formatPerformance(lowestTier.distanceMin, false, discipline)}).`;
      } else {
        for (let i = 0; i < sortedGrid.length - 1; i++) {
          const lower = sortedGrid[i];
          const upper = sortedGrid[i + 1];

          if (perfNum >= lower.distanceMin && perfNum <= upper.distanceMin) {
            palierNote = lower.note;

            if (perfNum === lower.distanceMin) {
              exactNote = lower.note;
            } else if (perfNum === upper.distanceMin) {
              exactNote = upper.note;
            } else {
              const distSpan = upper.distanceMin - lower.distanceMin;
              const noteSpan = upper.note - lower.note;
              const distOffset = perfNum - lower.distanceMin;

              const interpolated = lower.note + (distOffset / distSpan) * noteSpan;
              exactNote = Math.round(interpolated * 100) / 100;
            }

            detailText = `Performance entre ${EPSEngine.formatPerformance(lower.distanceMin, false, discipline)} (${lower.note}/20) et ${EPSEngine.formatPerformance(upper.distanceMin, false, discipline)} (${upper.note}/20).`;
            break;
          }
        }
      }
    } else {
      // --- TEMPS / CHRONO (Lower time = Better grade) ---
      if (perfNum <= highestTier.distanceMin) {
        exactNote = highestTier.note;
        palierNote = highestTier.note;
        detailText = `Temps maximal atteint (≤ ${EPSEngine.formatPerformance(highestTier.distanceMin, true, discipline)}).`;
      } else if (perfNum > lowestTier.distanceMin) {
        exactNote = Math.max(0, lowestTier.note - 1);
        palierNote = Math.max(0, lowestTier.note - 1);
        detailText = `Temps au-delà du seuil minimal (${EPSEngine.formatPerformance(lowestTier.distanceMin, true, discipline)}).`;
      } else {
        // Search adjacent tiers where upper note has shorter (lower) time
        for (let i = 0; i < sortedGrid.length - 1; i++) {
          const lowerNoteTier = sortedGrid[i];     // e.g. 10/20 with time 12.0s
          const upperNoteTier = sortedGrid[i + 1]; // e.g. 11/20 with time 11.5s

          const timeSlow = lowerNoteTier.distanceMin;
          const timeFast = upperNoteTier.distanceMin;

          if (perfNum <= timeSlow && perfNum >= timeFast) {
            palierNote = lowerNoteTier.note;

            if (perfNum === timeSlow) {
              exactNote = lowerNoteTier.note;
            } else if (perfNum === timeFast) {
              exactNote = upperNoteTier.note;
            } else {
              const timeSpan = timeSlow - timeFast;
              const noteSpan = upperNoteTier.note - lowerNoteTier.note;
              const timeOffset = timeSlow - perfNum;

              const interpolated = lowerNoteTier.note + (timeOffset / timeSpan) * noteSpan;
              exactNote = Math.round(interpolated * 100) / 100;
            }

            detailText = `Chrono entre ${EPSEngine.formatPerformance(timeSlow, true, discipline)} (${lowerNoteTier.note}/20) et ${EPSEngine.formatPerformance(timeFast, true, discipline)} (${upperNoteTier.note}/20).`;
            break;
          }
        }
      }
    }

    const finalNote = mode === "palier" ? palierNote : exactNote;

    return {
      valid: true,
      note: finalNote,
      noteExacte: exactNote,
      notePalier: palierNote,
      appreciation: EPSEngine.getAppreciation(finalNote),
      baremeFound: true,
      baremeId: bareme.id,
      engin: bareme.engin,
      type: bareme.type || (isTime ? "temps" : "distance"),
      unit: unit,
      detail: detailText
    };
  }

  static getAppreciation(note) {
    if (note >= 18) return "Excellent";
    if (note >= 15) return "Très Bien";
    if (note >= 12) return "Bien";
    if (note >= 10) return "Moyen (Acquis)";
    if (note >= 8)  return "Insuffisant";
    return "Très Insuffisant";
  }
}
