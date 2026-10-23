/**
 * EPS Rating Engine (js/engine.js)
 * Computes official grade over 20 based on barèmes officiels & performance (Distance/Hauteur or Temps).
 * Supports both Linear Interpolation (Exact Proportional Grade) and Strict Palier.
 */

import { db } from './db.js';

export class EPSEngine {
  /**
   * Helper to parse performance strings (ex: "3'09", "8''2", "11.70", or raw number) into numeric value
   * @param {string|number} raw 
   * @returns {number}
   */
  /**
   * Helper to parse performance strings into numeric value
   * Supports:
   * - Minutes'Seconds'' (ex: 3'7'', 3'07'', 3'7, 3:07, 3'07.5) -> convert to total seconds
   * - Sprint formats (ex: 8''2, 8"2) -> convert to 8.2 seconds
   * - French decimals (ex: 11,70 -> 11.70)
   * - Raw numbers (ex: 189 -> 189)
   * @param {string|number} raw 
   * @returns {number}
   */
  static parsePerformance(raw) {
    if (typeof raw === 'number') return raw;
    if (!raw) return NaN;

    let str = String(raw).trim();
    if (!str) return NaN;

    // Normalize unicode single quotes, acute accents, apostrophes (´, ’, ′, `) -> '
    // Normalize unicode double quotes, double acute accents (´´, ″, ”, “) -> "
    str = str.replace(/´´/g, '"')
             .replace(/''/g, '"')
             .replace(/[’′´`]/g, "'")
             .replace(/[″”“]/g, '"');

    // Format 1: Minutes + Seconds (e.g. 3'7", 3'07", 3’7´´, 3'7, 3:07, 3:7, 3'07.5)
    const minSecMatch = str.match(/^(\d+)\s*[':]\s*(\d+(?:[\.,]\d+)?)\s*["']?$/);
    if (minSecMatch) {
      const mins = parseFloat(minSecMatch[1]) || 0;
      const secs = parseFloat(minSecMatch[2].replace(',', '.')) || 0;
      return mins * 60 + secs;
    }

    // Format 2: Sprint notation with double quotes or apostrophes (e.g. 8"2, 8''2)
    const sprintMatch = str.match(/^(\d+)["']+(\d+)$/);
    if (sprintMatch) {
      return parseFloat(`${sprintMatch[1]}.${sprintMatch[2]}`);
    }

    // Fallback: raw numeric string (e.g. 187, 11.70, 11,70)
    return parseFloat(str.replace(',', '.'));
  }

  /**
   * Helper to format numeric performance into human-readable representation
   * (e.g. 187s -> 3'07'', 8.2s -> 8''2, 11.70 -> 11.70m)
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
      const mins = Math.floor(perfNum / 60);
      const secs = perfNum % 60;
      const secFormatted = secs % 1 === 0 ? secs.toFixed(0) : secs.toFixed(1);
      const secStr = secs < 10 ? `0${secFormatted}` : `${secFormatted}`;
      return `${mins}'${secStr}''`;
    }

    return `${perfNum.toString().replace('.', "''")}s`;
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
   * @returns {Object} { valid, note, noteExacte, notePalier, appreciation, baremeFound, engin, detail, error }
   */
  static calculateGrade(discipline, classe, genre, performance, engin = null, mode = "interpolation") {
    // 1. Mandatory Input Validation against official scale
    const validation = EPSEngine.validateInput(discipline, classe, genre, engin);
    if (!validation.valid) {
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

    // 2. Performance Parsing
    const perfNum = EPSEngine.parsePerformance(performance);
    if (isNaN(perfNum) || perfNum <= 0) {
      return {
        valid: true,
        note: null,
        noteExacte: null,
        notePalier: null,
        appreciation: "Performance non valide",
        baremeFound: true,
        baremeId: validation.bareme ? validation.bareme.id : null,
        engin: validation.bareme ? validation.bareme.engin : engin,
        detail: "Veuillez saisir une valeur de performance valide (ex: 3'07'' ou 11.70)."
      };
    }

    const bareme = validation.bareme;
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
