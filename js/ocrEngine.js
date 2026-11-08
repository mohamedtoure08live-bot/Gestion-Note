/**
 * GHIM PRO — OCREngine (js/ocrEngine.js)
 * Moteur de traitement d'images, de reconnaissance optique de caractères (OCR)
 * et d'extraction intelligente de listes de classes (imprimées ou manuscrites).
 *
 * Respecte strictement la confidentialité des données scolaires :
 * - Traitement local (aucune clé API exposée, aucun envoi vers un serveur tiers d'entraînement).
 * - Nettoyage automatique des images temporaires en mémoire après validation ou annulation.
 */

import { ImportEngine } from './importEngine.js';

export const OCREngine = {
  // Formats d'image réellement pris en charge et testés
  SUPPORTED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
  SUPPORTED_MIMES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ],

  // Dimension maximale pour protéger la mémoire sur iPhone / Safari iOS tout en gardant la finesse du texte
  MAX_IMAGE_DIMENSION: 2200,

  // Registre des URLs d'aperçu temporaires pour révocation stricte (confidentialité)
  _activeObjectUrls: new Set(),

  /**
   * Vérifie si un fichier image est pris en charge
   * @param {File|Object|string} fileOrName
   * @returns {boolean}
   */
  isSupportedImage(fileOrName) {
    if (!fileOrName) return false;
    if (typeof fileOrName === 'string') {
      const ext = fileOrName.split('.').pop().toLowerCase().trim();
      return this.SUPPORTED_EXTENSIONS.includes(ext);
    }
    const name = fileOrName.name || '';
    const mime = (fileOrName.type || '').toLowerCase().trim();
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase().trim() : '';

    if (ext && this.SUPPORTED_EXTENSIONS.includes(ext)) return true;
    if (mime && this.SUPPORTED_MIMES.includes(mime)) return true;
    return false;
  },

  /**
   * Retourne le libellé lisible du format d'image
   * @param {string} fileName
   * @returns {string}
   */
  getFormatLabel(fileName) {
    if (!fileName) return 'Image';
    const ext = fileName.split('.').pop().toLowerCase().trim();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'Photo JPEG (.jpg)';
      case 'png':
        return 'Image PNG (.png)';
      case 'webp':
        return 'Image WebP (.webp)';
      case 'heic':
      case 'heif':
        return 'Photo iPhone HEIC (.heic)';
      default:
        return ext.toUpperCase();
    }
  },

  /**
   * Crée une ObjectURL suivie pour prévisualisation et garantit sa suppression ultérieure
   * @param {Blob|File} blob
   * @returns {string}
   */
  createTrackedObjectUrl(blob) {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(blob);
      this._activeObjectUrls.add(url);
      return url;
    }
    return '';
  },

  /**
   * Supprime toutes les photos temporaires de la mémoire du navigateur (Section 8 — Confidentialité)
   */
  cleanupImageResources() {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      for (const url of this._activeObjectUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }
    }
    this._activeObjectUrls.clear();
  },

  /**
   * Convertit un fichier HEIC/HEIF (iPhone) en Blob JPEG standard si nécessaire
   * @param {File|Blob} file
   * @returns {Promise<Blob>}
   */
  async ensureStandardImageBlob(file) {
    if (!file) throw new Error("Aucune image sélectionnée.");
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    const isHeic = name.endsWith('.heic') || name.endsWith('.heif') || type.includes('heic') || type.includes('heif');

    if (!isHeic) return file;

    const heicConverter = (typeof window !== 'undefined' && window.heic2any) ? window.heic2any : null;
    if (heicConverter) {
      try {
        const converted = await heicConverter({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.92
        });
        return Array.isArray(converted) ? converted[0] : converted;
      } catch (e) {
        throw new Error("Impossible de convertir la photo iPhone (HEIC). Veuillez utiliser une photo au format JPG ou PNG.");
      }
    }

    return file;
  },

  /**
   * Analyse la qualité optique d'une image (luminosité, contraste, netteté/flou)
   * à partir de ses pixels RGBA (ImageData)
   * @param {Uint8ClampedArray|Array<number>} rgbaData
   * @param {number} width
   * @param {number} height
   * @returns {{ meanBrightness: number, contrastStdDev: number, sharpnessScore: number, isTooDark: boolean, isTooBright: boolean, isLowContrast: boolean, isBlurry: boolean, isUnreadable: boolean, warnings: Array<string> }}
   */
  analyzeImageQuality(rgbaData, width, height) {
    if (!rgbaData || !width || !height || rgbaData.length < 4) {
      return {
        meanBrightness: 0,
        contrastStdDev: 0,
        sharpnessScore: 0,
        isTooDark: true,
        isTooBright: false,
        isLowContrast: true,
        isBlurry: true,
        isUnreadable: true,
        warnings: ["L'image fournie est vide ou illisible."]
      };
    }

    const totalPixels = Math.floor(rgbaData.length / 4);
    const gray = new Float32Array(totalPixels);
    let sumLum = 0;

    for (let i = 0, p = 0; i < rgbaData.length; i += 4, p++) {
      const lum = 0.299 * rgbaData[i] + 0.587 * rgbaData[i + 1] + 0.114 * rgbaData[i + 2];
      gray[p] = lum;
      sumLum += lum;
    }

    const meanBrightness = sumLum / totalPixels;

    // Calcul de l'écart-type du contraste
    let sumSqDiff = 0;
    for (let p = 0; p < totalPixels; p++) {
      const diff = gray[p] - meanBrightness;
      sumSqDiff += diff * diff;
    }
    const contrastStdDev = Math.sqrt(sumSqDiff / totalPixels);

    // Calcul de la variance du Laplacien (mesure de netteté / détection de flou)
    let lapSum = 0;
    let lapSqSum = 0;
    let countLap = 0;
    const step = width > 800 ? 2 : 1;

    for (let y = 1; y < height - 1; y += step) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x += step) {
        const idx = rowOffset + x;
        const lap =
          -4 * gray[idx] +
          gray[idx - 1] +
          gray[idx + 1] +
          gray[idx - width] +
          gray[idx + width];
        lapSum += lap;
        lapSqSum += lap * lap;
        countLap++;
      }
    }

    const lapMean = countLap > 0 ? lapSum / countLap : 0;
    const sharpnessScore = countLap > 0 ? (lapSqSum / countLap) - (lapMean * lapMean) : 0;

    const isTooDark = meanBrightness < 45;
    const isTooBright = meanBrightness > 248 && contrastStdDev < 12;
    const isLowContrast = contrastStdDev < 18;
    const isBlurry = sharpnessScore < 35;
    const isUnreadable = (meanBrightness < 18 || contrastStdDev < 5 || sharpnessScore < 6);

    const warnings = [];
    if (isTooDark) {
      warnings.push("La photo est sombre. Vérifiez l'éclairage ou activez l'amélioration du contraste.");
    }
    if (isTooBright) {
      warnings.push("La photo semble surexposée. Évitez le flash direct sur la feuille.");
    }
    if (isBlurry) {
      warnings.push("La photo semble légèrement floue. Vérifiez attentivement l'aperçu des élèves ou reprenez la photo.");
    }
    if (isLowContrast && !isTooDark && !isTooBright) {
      warnings.push("Le contraste entre l'encre et le papier est faible. Le rehaussement automatique a été activé.");
    }

    return {
      meanBrightness: Math.round(meanBrightness * 10) / 10,
      contrastStdDev: Math.round(contrastStdDev * 10) / 10,
      sharpnessScore: Math.round(sharpnessScore * 10) / 10,
      isTooDark,
      isTooBright,
      isLowContrast,
      isBlurry,
      isUnreadable,
      warnings
    };
  },

  /**
   * Améliore les pixels RGBA d'une image pour maximiser la précision OCR :
   * - Conversion en niveaux de gris haute fidélité
   * - Normalisation adaptative de l'histogramme (étirement du contraste)
   * - Réduction du bruit de fond du papier (seuillage doux)
   * @param {Uint8ClampedArray} rgbaData
   * @param {number} width
   * @param {number} height
   * @returns {Uint8ClampedArray}
   */
  enhanceImagePixelsForOcr(rgbaData, width, height) {
    const out = new Uint8ClampedArray(rgbaData.length);
    const totalPixels = Math.floor(rgbaData.length / 4);
    const gray = new Float32Array(totalPixels);

    let minLum = 255;
    let maxLum = 0;

    // 1. Niveaux de gris et recherche des bornes d'intensité
    for (let i = 0, p = 0; i < rgbaData.length; i += 4, p++) {
      const lum = 0.299 * rgbaData[i] + 0.587 * rgbaData[i + 1] + 0.114 * rgbaData[i + 2];
      gray[p] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const range = Math.max(maxLum - minLum, 1);

    // 2. Étirement du contraste et nettoyage du fond papier
    for (let p = 0, i = 0; p < totalPixels; p++, i += 4) {
      let normalized = ((gray[p] - minLum) / range) * 255;

      // Courbe en S pour renforcer l'encre sombre et blanchir le papier grisâtre
      if (normalized > 195) {
        normalized = 255;
      } else if (normalized < 75) {
        normalized = Math.max(0, normalized * 0.55);
      } else {
        normalized = ((normalized - 75) / 120) * 210 + 40;
      }

      const val = Math.max(0, Math.min(255, Math.round(normalized)));
      out[i] = val;
      out[i + 1] = val;
      out[i + 2] = val;
      out[i + 3] = 255;
    }

    return out;
  },

  /**
   * Prépare une image dans le navigateur (redimensionnement iPhone, rotation, redressement, recadrage, contraste)
   * @param {HTMLImageElement|HTMLCanvasElement} imgSource
   * @param {Object} options
   * @returns {{ canvas: HTMLCanvasElement, qualityReport: Object }}
   */
  preprocessImageInBrowser(imgSource, options = {}) {
    const {
      rotationDeg = 0,
      skewDeg = 0,
      crop = { x: 0, y: 0, w: 1, h: 1 },
      enhanceContrast = true
    } = options;

    const srcW = imgSource.naturalWidth || imgSource.width || 800;
    const srcH = imgSource.naturalHeight || imgSource.height || 600;

    // Zone de recadrage normalisée [0..1]
    const cx = Math.max(0, Math.min(0.9, crop.x || 0));
    const cy = Math.max(0, Math.min(0.9, crop.y || 0));
    const cw = Math.max(0.1, Math.min(1 - cx, crop.w || 1));
    const ch = Math.max(0.1, Math.min(1 - cy, crop.h || 1));

    const cropPxX = Math.round(cx * srcW);
    const cropPxY = Math.round(cy * srcH);
    const cropPxW = Math.round(cw * srcW);
    const cropPxH = Math.round(ch * srcH);

    // Calcul de la mise à l'échelle pour éviter la saturation mémoire sur iPhone
    const isRotated90 = Math.abs(rotationDeg % 180) === 90;
    const baseW = isRotated90 ? cropPxH : cropPxW;
    const baseH = isRotated90 ? cropPxW : cropPxH;

    const scale = Math.min(1, this.MAX_IMAGE_DIMENSION / Math.max(baseW, baseH, 1));
    const targetW = Math.max(1, Math.round(baseW * scale));
    const targetH = Math.max(1, Math.round(baseH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Fond blanc propre pour éviter les bordures noires lors d'un redressement d'inclinaison
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    const totalAngleRad = ((rotationDeg + skewDeg) * Math.PI) / 180;
    ctx.rotate(totalAngleRad);

    const drawW = Math.round(cropPxW * scale);
    const drawH = Math.round(cropPxH * scale);
    ctx.drawImage(
      imgSource,
      cropPxX,
      cropPxY,
      cropPxW,
      cropPxH,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const qualityReport = this.analyzeImageQuality(imgData.data, targetW, targetH);

    if (enhanceContrast) {
      const enhancedPixels = this.enhanceImagePixelsForOcr(imgData.data, targetW, targetH);
      const enhancedImgData = new ImageData(enhancedPixels, targetW, targetH);
      ctx.putImageData(enhancedImgData, 0, 0);
    }

    return {
      canvas,
      qualityReport
    };
  },

  /**
   * Obtient l'instance de Tesseract (navigateur ou Node.js)
   */
  async getTesseractLib() {
    if (typeof window !== 'undefined' && window.Tesseract) {
      return window.Tesseract;
    }
    if (typeof Tesseract !== 'undefined') {
      return Tesseract;
    }
    try {
      const mod = await import('tesseract.js');
      return mod.default || mod;
    } catch (e) {
      throw new Error("Le service de reconnaissance optique est temporairement indisponible.");
    }
  },

  /**
   * Exécute la reconnaissance OCR sur une ou plusieurs pages (images/canvas/buffers)
   * @param {Array<any>} imageSources Liste des images (Canvas, Blob, Buffer ou chemins)
   * @param {Function} onProgress Callback de progression ({ step, message, percent, pageIndex, totalPages })
   * @returns {Promise<{ pages: Array<{ pageNumber: number, text: string, confidence: number, lines: Array<Object> }>, combinedStudents: Array<Object> }>}
   */
  async recognizePages(imageSources, onProgress = () => {}) {
    if (!imageSources || imageSources.length === 0) {
      throw new Error("Aucune photo sélectionnée pour l'analyse.");
    }

    const TesseractLib = await this.getTesseractLib();
    const totalPages = imageSources.length;
    const pagesResult = [];

    onProgress({
      step: 'prepare',
      message: 'Préparation de l\'image...',
      percent: 10,
      pageIndex: 0,
      totalPages
    });

    let worker = null;
    try {
      worker = await TesseractLib.createWorker('fra', 1, {
        logger: (m) => {
          if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
            const p = Math.round(25 + m.progress * 55);
            onProgress({
              step: 'recognize',
              message: 'Reconnaissance des élèves...',
              percent: Math.min(85, p),
              pageIndex: 0,
              totalPages
            });
          }
        }
      });

      for (let i = 0; i < totalPages; i++) {
        const pageNum = i + 1;
        onProgress({
          step: 'analyze',
          message: totalPages > 1
            ? `Analyse du document (Page ${pageNum}/${totalPages})...`
            : 'Analyse du document...',
          percent: Math.round(20 + (i / totalPages) * 60),
          pageIndex: i,
          totalPages
        });

        const { data } = await worker.recognize(imageSources[i]);

        const pageLines = this.extractLinesFromTesseractData(data);
        pagesResult.push({
          pageNumber: pageNum,
          text: (data && data.text) ? data.text : '',
          confidence: (data && typeof data.confidence === 'number') ? Math.round(data.confidence) : 75,
          lines: pageLines
        });
      }
    } catch (err) {
      if (worker) {
        try { await worker.terminate(); } catch (e) {}
      }
      throw new Error("Impossible d'analyser cette photographie. Vérifiez que l'image est lisible et réessayez.");
    }

    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }

    onProgress({
      step: 'preview',
      message: 'Préparation de l\'aperçu...',
      percent: 92,
      pageIndex: totalPages - 1,
      totalPages
    });

    const combinedStudents = this.extractStudentsFromPages(pagesResult);

    onProgress({
      step: 'done',
      message: 'Analyse terminée.',
      percent: 100,
      pageIndex: totalPages - 1,
      totalPages
    });

    return {
      pages: pagesResult,
      combinedStudents
    };
  },

  /**
   * Extrait les lignes structurées avec leur score de confiance à partir du résultat Tesseract
   * @param {Object} data
   * @returns {Array<{ text: string, confidence: number }>}
   */
  extractLinesFromTesseractData(data) {
    if (!data) return [];

    // Si Tesseract fournit les lignes avec leurs confiances individuelles
    if (Array.isArray(data.lines) && data.lines.length > 0) {
      return data.lines
        .map(l => ({
          text: (l.text || '').trim(),
          confidence: typeof l.confidence === 'number' ? Math.round(l.confidence) : (data.confidence || 75)
        }))
        .filter(l => l.text.length > 0);
    }

    // Sinon découpage à partir de data.text
    const rawText = data.text || '';
    const defaultConf = typeof data.confidence === 'number' ? Math.round(data.confidence) : 80;
    return rawText
      .split(/\r?\n/)
      .map(line => ({
        text: line.trim(),
        confidence: defaultConf
      }))
      .filter(l => l.text.length > 0);
  },

  /**
   * Extrait la liste structurée des élèves à partir d'une ou plusieurs pages OCR
   * (ou directement à partir d'un texte OCR / tableau de lignes)
   * @param {Array<{ pageNumber?: number, text?: string, confidence?: number, lines?: Array<{ text: string, confidence?: number }> }>|string} pagesOrText
   * @returns {Array<Object>}
   */
  extractStudentsFromPages(pagesOrText) {
    let pages = [];
    if (typeof pagesOrText === 'string') {
      pages = [{
        pageNumber: 1,
        text: pagesOrText,
        confidence: 85,
        lines: pagesOrText.split(/\r?\n/).map(t => ({ text: t.trim(), confidence: 85 })).filter(l => l.text.length > 0)
      }];
    } else if (Array.isArray(pagesOrText)) {
      pages = pagesOrText;
    }

    const extracted = [];
    let globalOrder = 0;

    for (const page of pages) {
      const pageNum = page.pageNumber || 1;
      const lines = page.lines && page.lines.length > 0
        ? page.lines
        : (page.text || '').split(/\r?\n/).map(t => ({ text: t.trim(), confidence: page.confidence ?? 80 }));

      // Détecter l'ordre des colonnes si une ligne d'en-tête est présente sur la page
      const columnHint = this.detectTableHeaderHint(lines.map(l => l.text));

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineObj = lines[lineIdx];
        const rawLine = (lineObj.text || '').trim();
        if (!rawLine) continue;

        // Ignorer les lignes d'en-tête, titres administratifs ou pieds de page
        if (this.isNonStudentLine(rawLine)) continue;

        const parsed = this.parseStudentRosterLine(rawLine, lineObj.confidence ?? page.confidence ?? 80, columnHint);
        if (!parsed) continue;

        globalOrder++;
        extracted.push({
          rowId: `ocr_row_${pageNum}_${lineIdx}_${globalOrder}`,
          numero: parsed.numero || globalOrder,
          pageNumber: pageNum,
          matricule: parsed.matricule || '',
          nom: parsed.nom || '',
          prenom: parsed.prenom || '',
          genre: parsed.genre || '',
          dateNaissance: parsed.dateNaissance || '',
          confidence: parsed.confidence,
          uncertainFields: parsed.uncertainFields || [],
          warnings: parsed.warnings || [],
          selected: parsed.selected !== false,
          rawText: rawLine
        });
      }
    }

    return extracted;
  },

  /**
   * Détecte si une page contient une ligne d'en-tête indiquant l'ordre des colonnes
   * (ex: Prénom avant Nom, ou Matricule en fin de ligne)
   * @param {Array<string>} textLines
   * @returns {{ prenomBeforeNom: boolean }}
   */
  detectTableHeaderHint(textLines) {
    const hint = { prenomBeforeNom: false };
    const limit = Math.min(textLines.length, 8);
    for (let i = 0; i < limit; i++) {
      const norm = (textLines[i] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const idxPrenom = norm.indexOf('prenom');
      // Chercher "nom" qui ne fait pas partie de "prenom"
      const withoutPrenom = norm.replace(/prenoms?/g, '______');
      const idxNom = withoutPrenom.indexOf('nom');
      if (idxPrenom !== -1 && idxNom !== -1 && idxPrenom < idxNom) {
        hint.prenomBeforeNom = true;
        break;
      }
    }
    return hint;
  },

  /**
   * Identifie si une ligne OCR est un titre de document, un en-tête de tableau ou un pied de page
   * @param {string} line
   * @returns {boolean}
   */
  isNonStudentLine(line) {
    const clean = line.trim();
    if (clean.length < 2) return true;

    // Ligne constituée uniquement de tirets, bordures de tableau ou ponctuation
    if (/^[\s\-_=|+.,:;*#\/\\]+$/.test(clean)) return true;

    const norm = clean
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!norm) return true;

    // En-têtes de colonnes typiques
    const headerPatterns = [
      /^(n|no|num|numero)?\s*(matricule|mat|id|ine)?\s*(nom|noms)\s*(et|&)?\s*(prenom|prenoms)/,
      /^(n|no|num|numero)?\s*(prenom|prenoms)\s*(nom|noms)/,
      /^nom\s+prenoms?\s*(sexe|genre)?/,
      /^liste\s+des\s+eleves/,
      /^liste\s+nominative/,
      /^liste\s+de\s+classe/,
      /^republique\s+de/,
      /^ministere\s+de/,
      /^annee\s+scolaire/,
      /^etablissement\s*:/,
      /^classe\s*:\s*[a-z0-9\s]+$/,
      /^effectif\s+total/,
      /^total\s+(eleves|garcons|filles)/,
      /^page\s+[0-9]+\s*(sur|\/)\s*[0-9]+$/,
      /^signature\s+du/,
      /^professeur\s+principal/
    ];

    for (const pat of headerPatterns) {
      if (pat.test(norm)) return true;
    }

    // Si la ligne contient exactement les mots d'en-tête "nom" et "prenom" et ("sexe" ou "genre" ou "matricule")
    const words = norm.split(' ');
    const hasHeaderNom = words.includes('nom') || words.includes('noms');
    const hasHeaderPrenom = words.includes('prenom') || words.includes('prenoms');
    const hasHeaderMeta = words.includes('sexe') || words.includes('genre') || words.includes('matricule') || words.includes('naissance') || words.includes('observation') || words.includes('observations');
    if (hasHeaderNom && (hasHeaderPrenom || hasHeaderMeta) && words.length <= 9) {
      return true;
    }

    return false;
  },

  /**
   * Analyse une ligne de liste de classe (avec colonnes séparées par |, ;, tabulation ou espaces)
   * et extrait : N°, Matricule, Nom, Prénom(s), Sexe, Date de naissance et les alertes d'incertitude.
   * @param {string} rawLine
   * @param {number} baseConfidence
   * @param {Object} columnHint
   * @returns {Object|null}
   */
  parseStudentRosterLine(rawLine, baseConfidence = 85, columnHint = {}) {
    if (!rawLine || !rawLine.trim()) return null;

    let confidence = typeof baseConfidence === 'number' ? baseConfidence : 80;
    const warnings = [];
    const uncertainFields = [];

    // Détection de caractères parasites ou illisibles (ex: ?, ~, §, @, #, %, $, £, !)
    const hasNoiseChars = /[?~§@#$%£¤*<>\\^]/.test(rawLine);
    if (hasNoiseChars) {
      confidence = Math.min(confidence, 62);
      warnings.push("Caractères incertains détectés sur cette ligne");
    }

    // Normalisation des apostrophes typographiques et tirets cadratins
    let working = rawLine
      .replace(/[’‘`´]/g, "'")
      .replace(/[–—]/g, '-')
      .trim();

    // 1. Extraction éventuelle d'une date de naissance (ex: 12/04/2011, 12-04-2011, 12.04.2011)
    let dateNaissance = '';
    const dateRegex = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/g;
    const dateMatch = working.match(dateRegex);
    if (dateMatch && dateMatch.length > 0) {
      dateNaissance = dateMatch[0];
      working = working.replace(dateRegex, ' | ');
    }

    // 2. Découpage en cellules si des séparateurs de tableau explicites existent (|, ;, tabulation, ou >= 2 espaces)
    let cells = [];
    if (working.includes('|') || working.includes(';') || working.includes('\t')) {
      cells = working
        .split(/[|;\t]+/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    } else if (/\s{2,}/.test(working)) {
      cells = working
        .split(/\s{2,}/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    let numero = null;
    let matricule = '';
    let genre = '';
    let nameTokens = [];

    // Fonction auxiliaire pour tester si un jeton est un numéro d'ordre en début de ligne (ex: "1", "01", "1.", "1)", "N°12")
    const parseLeadingNumero = (token) => {
      const m = token.match(/^(?:n[°o]?\s*)?0*(\d{1,3})[.):\-]?$/i);
      return m ? parseInt(m[1], 10) : null;
    };

    // Fonction auxiliaire pour tester si un jeton est un matricule d'élève (ex: "MAT-001", "24015892A", "18045210", "M0045")
    const isMatriculeToken = (token) => {
      const cleanTok = token.replace(/^[(\[]|[)\]]$/g, '').trim();
      if (cleanTok.length < 3 || cleanTok.length > 18) return false;
      // Doit contenir au moins 2 chiffres et être composé de lettres/chiffres/tirets/slash
      const digitCount = (cleanTok.match(/\d/g) || []).length;
      if (digitCount < 2) return false;
      return /^[A-Z0-9][A-Z0-9\-\/_]*$/i.test(cleanTok);
    };

    // Fonction auxiliaire pour tester si un jeton isolé est une indication de sexe/genre
    const parseGenreToken = (token) => {
      const cleanTok = token.replace(/[().:;,\[\]]/g, '').trim();
      if (!cleanTok) return '';
      const norm = cleanTok.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (['m', 'g', 'h', 'garcon', 'masculin', 'masc', 'homme', 'boy'].includes(norm)) {
        return 'Garçon';
      }
      if (['f', 'fille', 'feminin', 'fem', 'femme', 'girl'].includes(norm)) {
        return 'Fille';
      }
      // Cas OCR courant où 'M' ou 'F' est entouré de parenthèses ou slash ex: "(M)" ou "M/G"
      return '';
    };

    if (cells.length >= 2) {
      // Analyse cellule par cellule (tableau structuré)
      const remainingNameCells = [];

      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        let cell = cells[cIdx].replace(/^[•·\-*]+/, '').trim();
        if (!cell) continue;

        // Numéro de ligne en première cellule
        if (cIdx === 0 && numero === null) {
          const numVal = parseLeadingNumero(cell);
          if (numVal !== null) {
            numero = numVal;
            continue;
          }
          // Cas où le numéro est collé au début de la première cellule ex: "1. KOUASSI" ou "01 MAT001"
          const leadingMatch = cell.match(/^0*(\d{1,3})[.):\-]\s+(.+)$/);
          if (leadingMatch) {
            numero = parseInt(leadingMatch[1], 10);
            cell = leadingMatch[2].trim();
          }
        }

        // Cellule de Sexe / Genre
        const gVal = parseGenreToken(cell);
        if (gVal && !genre) {
          genre = gVal;
          continue;
        }

        // Cellule de Matricule
        if (!matricule && isMatriculeToken(cell)) {
          matricule = cell.toUpperCase();
          continue;
        }

        remainingNameCells.push(cell);
      }

      // Si le genre ou le matricule était collé dans la dernière ou première cellule de nom
      if (remainingNameCells.length > 0) {
        const allWords = remainingNameCells.join(' ').split(/\s+/).filter(Boolean);
        // Vérifier le premier mot (numéro ou matricule)
        if (allWords.length > 1 && numero === null) {
          const nVal = parseLeadingNumero(allWords[0]);
          if (nVal !== null) {
            numero = nVal;
            allWords.shift();
          }
        }
        if (allWords.length > 1 && !matricule && isMatriculeToken(allWords[0])) {
          matricule = allWords.shift().toUpperCase();
        }
        // Vérifier le dernier mot (genre ou matricule)
        if (allWords.length > 1 && !genre) {
          const gLast = parseGenreToken(allWords[allWords.length - 1]);
          if (gLast) {
            genre = gLast;
            allWords.pop();
          }
        }
        if (allWords.length > 1 && !matricule && isMatriculeToken(allWords[allWords.length - 1])) {
          matricule = allWords.pop().toUpperCase();
        }
        if (allWords.length > 1 && !genre) {
          const gLast2 = parseGenreToken(allWords[allWords.length - 1]);
          if (gLast2) {
            genre = gLast2;
            allWords.pop();
          }
        }

        // Si nous avions 2 cellules de noms distinctes (ex: Cellule 1 = NOM, Cellule 2 = Prénoms)
        if (remainingNameCells.length >= 2 && !genre) {
          // Re-vérifier si la dernière cellule contenait "Jean Marc M"
          const lastCellParts = remainingNameCells[remainingNameCells.length - 1].split(/\s+/);
          if (lastCellParts.length > 1) {
            const gEnd = parseGenreToken(lastCellParts[lastCellParts.length - 1]);
            if (gEnd) {
              genre = gEnd;
              lastCellParts.pop();
              remainingNameCells[remainingNameCells.length - 1] = lastCellParts.join(' ');
            }
          }
        }
      }

      // Extraction Nom & Prénom à partir des cellules de nom restantes
      const cleanNameCells = remainingNameCells
        .map(c => c.replace(/[?~§@#$%£¤*<>\\^]/g, '').trim())
        .filter(c => c.length > 0 && !parseGenreToken(c) && !isMatriculeToken(c));

      if (cleanNameCells.length >= 2) {
        let firstCell = cleanNameCells[0].replace(/^0*\d{1,3}[.):\-]?\s+/, '').trim();
        let secondCell = cleanNameCells.slice(1).join(' ').trim();
        // Retirer un éventuel token de genre en fin de secondCell
        const secParts = secondCell.split(/\s+/);
        if (secParts.length > 1 && parseGenreToken(secParts[secParts.length - 1])) {
          if (!genre) genre = parseGenreToken(secParts[secParts.length - 1]);
          secParts.pop();
          secondCell = secParts.join(' ');
        }

        if (columnHint && columnHint.prenomBeforeNom) {
          const temp = firstCell;
          firstCell = secondCell;
          secondCell = temp;
        }

        return this.finalizeParsedStudent({
          numero,
          matricule,
          nom: firstCell.toUpperCase(),
          prenom: secondCell,
          genre,
          dateNaissance,
          confidence,
          warnings,
          uncertainFields
        });
      } else if (cleanNameCells.length === 1) {
        nameTokens = cleanNameCells[0].split(/\s+/).filter(Boolean);
      }
    } else {
      // Ligne séparée par des espaces simples
      nameTokens = working.split(/\s+/).filter(Boolean);
    }

    if (nameTokens.length === 0) return null;

    // Nettoyage séquentiel des tokens (N° en tête, Matricule, Genre en fin ou début)
    if (nameTokens.length > 1 && numero === null) {
      const nVal = parseLeadingNumero(nameTokens[0]);
      if (nVal !== null) {
        numero = nVal;
        nameTokens.shift();
      }
    }

    if (nameTokens.length > 1 && !matricule && isMatriculeToken(nameTokens[0])) {
      matricule = nameTokens.shift().toUpperCase();
    }

    // Vérifier la fin de ligne pour Genre et Matricule
    for (let pass = 0; pass < 2; pass++) {
      if (nameTokens.length > 1 && !genre) {
        const gEnd = parseGenreToken(nameTokens[nameTokens.length - 1]);
        if (gEnd) {
          genre = gEnd;
          nameTokens.pop();
        }
      }
      if (nameTokens.length > 1 && !matricule && isMatriculeToken(nameTokens[nameTokens.length - 1])) {
        matricule = nameTokens.pop().toUpperCase();
      }
    }

    // Nettoyage des caractères parasites sur les tokens de nom
    const cleanWordTokens = nameTokens
      .map(t => t.replace(/[?~§@#$%£¤*<>\\^,;:|]/g, '').trim())
      .filter(t => t.length > 0 && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(t));

    if (cleanWordTokens.length === 0) return null;

    const fullNameStr = cleanWordTokens.join(' ');
    let nom = '';
    let prenom = '';

    if (columnHint && columnHint.prenomBeforeNom && cleanWordTokens.length >= 2) {
      nom = cleanWordTokens[cleanWordTokens.length - 1].toUpperCase();
      prenom = cleanWordTokens.slice(0, -1).join(' ');
    } else {
      const split = ImportEngine.splitFullName(fullNameStr);
      nom = split.nom;
      prenom = split.prenom;
    }

    return this.finalizeParsedStudent({
      numero,
      matricule,
      nom,
      prenom,
      genre,
      dateNaissance,
      confidence,
      warnings,
      uncertainFields
    });
  },

  /**
   * Finalise et qualifie la ligne d'élève extraite par OCR (détection des champs incertains ou incomplets)
   */
  finalizeParsedStudent(student) {
    let {
      numero,
      matricule,
      nom,
      prenom,
      genre,
      dateNaissance,
      confidence,
      warnings,
      uncertainFields
    } = student;

    nom = (nom || '').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' \-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
    prenom = (prenom || '').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' \-]/g, '').replace(/\s+/g, ' ').trim();
    matricule = (matricule || '').trim();
    genre = ImportEngine.normalizeGenre(genre);

    // Si la ligne ne contient ni nom ni prénom exploitable (ex: bruit de fond), on l'ignore
    if (!nom && !prenom) return null;
    if (nom.length < 2 && prenom.length < 2) return null;

    if (!nom || nom.length < 2) {
      uncertainFields.push('nom');
      warnings.push('Nom à vérifier ou manquant');
      confidence = Math.min(confidence, 55);
    }

    if (!prenom || prenom.length < 2) {
      uncertainFields.push('prenom');
      warnings.push('Prénom manquant ou incomplet');
      confidence = Math.min(confidence, 60);
    }

    if (!genre) {
      uncertainFields.push('genre');
      warnings.push('Sexe non détecté (sélectionnez Garçon ou Fille)');
      confidence = Math.min(confidence, 65);
    }

    if (confidence < 78 && warnings.length === 0) {
      warnings.push(`Lecture OCR incertaine (${confidence}%) — vérifiez l'orthographe`);
      uncertainFields.push('ocr');
    }

    return {
      numero,
      matricule,
      nom,
      prenom,
      genre,
      dateNaissance,
      confidence,
      uncertainFields,
      warnings,
      selected: true
    };
  },

  /**
   * Valide toutes les lignes de l'aperçu photo et détecte les doublons (dans la photo et dans la classe)
   * en réutilisant les règles strictes de GHIM PRO (sans jamais fusionner deux homonymes automatiquement)
   * @param {Array<Object>} rows Lignes actuelles de l'aperçu photo
   * @param {Array<Object>} existingStudentsInClass Élèves déjà enregistrés dans la classe cible
   * @param {Object} [options={}] Options supplémentaires (ex: defaultGenre, allowSingleNameFallback)
   * @returns {{ rows: Array<Object>, stats: { detectedCount: number, selectedCount: number, validCount: number, toVerifyCount: number, duplicateCount: number, incompleteCount: number }, validStudentsToSave: Array<Object> }}
   */
  validatePhotoRosterRows(rows, existingStudentsInClass = [], options = {}) {
    const validatedRows = [];
    const validStudentsToSave = [];
    const seenInPhoto = [];
    const fallbackGenre = options && options.defaultGenre ? ImportEngine.normalizeGenre(options.defaultGenre) : '';
    const allowSingleNameFallback = Boolean(options && options.allowSingleNameFallback);

    let validCount = 0;
    let toVerifyCount = 0;
    let duplicateCount = 0;
    let incompleteCount = 0;
    let selectedCount = 0;

    (rows || []).forEach((row, idx) => {
      let nom = String(row.nom || '').trim().toUpperCase();
      let prenom = String(row.prenom || '').trim();
      const matricule = String(row.matricule || '').trim();
      let genreNorm = ImportEngine.normalizeGenre(row.genre);
      const confidence = typeof row.confidence === 'number' ? row.confidence : 85;
      const verifiedByTeacher = Boolean(row.verifiedByTeacher);
      const isSelected = row.selected !== false;

      if (isSelected) selectedCount++;

      // Si le nom complet a été saisi dans la colonne Nom et que Prénom est vide, découper proprement
      if (nom && (!prenom || prenom.length < 2) && nom.includes(' ')) {
        const split = ImportEngine.splitFullName(nom);
        if (split.nom && split.prenom && split.prenom.length >= 2) {
          nom = split.nom.toUpperCase();
          prenom = split.prenom;
        }
      }

      if (allowSingleNameFallback && nom && nom.length >= 2 && !prenom) {
        prenom = '-';
      }

      if (!genreNorm && fallbackGenre) {
        genreNorm = fallbackGenre;
      }

      const issues = [];
      let status = 'valid'; // 'valid' | 'verify' | 'incomplete' | 'duplicate'
      let verificationLabel = 'Correct';

      // 1. Vérification des champs obligatoires (Nom, Prénom, Sexe)
      if (!nom || nom.length < 2) {
        issues.push('Nom manquant ou trop court');
      }
      if (!prenom || (prenom !== '-' && prenom.length < 2)) {
        issues.push('Prénom manquant');
      }
      if (!genreNorm) {
        issues.push('Sexe à préciser (M/F)');
      }

      if (issues.length > 0) {
        status = 'incomplete';
        verificationLabel = 'À vérifier';
        incompleteCount++;
        toVerifyCount++;
      } else {
        // 2. Détection des doublons avec la classe existante
        // Règle Section 6 : Ne jamais fusionner deux élèves uniquement parce qu'ils ont le même nom.
        // Il faut soit le même matricule non vide, soit le couple exact (Nom + Prénom).
        const isExistingDup = existingStudentsInClass.some(e => {
          if (matricule && e.matricule && e.matricule.trim().toLowerCase() === matricule.toLowerCase()) {
            return true;
          }
          // Si les deux ont des matricules différents non vides, ce sont deux homonymes distincts
          if (matricule && e.matricule && e.matricule.trim().toLowerCase() !== matricule.toLowerCase()) {
            return false;
          }
          return (
            (e.nom || '').trim().toUpperCase() === nom &&
            (e.prenom || '').trim().toLowerCase() === prenom.toLowerCase()
          );
        });

        // 3. Détection des doublons au sein de la photo elle-même
        const isPhotoDup = seenInPhoto.some(s => {
          if (matricule && s.matricule && s.matricule.trim().toLowerCase() === matricule.toLowerCase()) {
            return true;
          }
          if (matricule && s.matricule && s.matricule.trim().toLowerCase() !== matricule.toLowerCase()) {
            return false;
          }
          return (
            s.nom.toUpperCase() === nom &&
            s.prenom.toLowerCase() === prenom.toLowerCase()
          );
        });

        if (isExistingDup) {
          status = 'duplicate';
          verificationLabel = 'Doublon (Classe)';
          issues.push('Élève déjà présent dans cette classe');
          duplicateCount++;
        } else if (isPhotoDup) {
          status = 'duplicate';
          verificationLabel = 'Doublon (Photo)';
          issues.push('Élève présent plusieurs fois sur la liste photographiée');
          duplicateCount++;
        } else {
          seenInPhoto.push({ nom, prenom, matricule });

          // 4. Vérification du niveau de confiance OCR (si non encore corrigé/validé manuellement par le professeur)
          if (!verifiedByTeacher && confidence < 78) {
            status = 'verify';
            verificationLabel = 'À vérifier';
            issues.push(`Lecture incertaine (${confidence}%) — vérifiez l'orthographe`);
            toVerifyCount++;
          } else {
            status = 'valid';
            verificationLabel = 'Correct';
            validCount++;
          }

          // L'élève possède toutes les informations requises et n'est pas un doublon : il peut être importé s'il est sélectionné
          if (isSelected) {
            validStudentsToSave.push({
              rowId: row.rowId || `row_${idx + 1}`,
              numero: row.numero || idx + 1,
              nom,
              prenom,
              genre: genreNorm,
              matricule
            });
          }
        }
      }

      validatedRows.push({
        ...row,
        rowId: row.rowId || `row_${idx + 1}`,
        numero: row.numero || idx + 1,
        nom,
        prenom,
        genre: genreNorm || row.genre || '',
        matricule,
        confidence,
        verifiedByTeacher,
        selected: isSelected,
        status,
        verificationLabel,
        issues
      });
    });

    return {
      rows: validatedRows,
      stats: {
        detectedCount: validatedRows.length,
        selectedCount,
        validCount: validStudentsToSave.length,
        toVerifyCount,
        duplicateCount,
        incompleteCount
      },
      validStudentsToSave
    };
  }
};

