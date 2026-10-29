/**
 * GHIM PRO — ImportEngine
 * Module universel d'analyse et d'importation de listes d'élèves
 * Formats supportés : CSV (.csv), Excel (.xlsx, .xls), OpenDocument (.ods), Texte délimité (.txt)
 */

export const ImportEngine = {
  // Extensions reconnues
  SUPPORTED_EXTENSIONS: ['csv', 'xlsx', 'xls', 'txt', 'ods'],

  /**
   * Vérifie si le fichier est supporté
   * @param {string} fileName 
   * @returns {boolean}
   */
  isSupported(fileName) {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return this.SUPPORTED_EXTENSIONS.includes(ext);
  },

  /**
   * Obtient le format lisible d'un fichier
   * @param {string} fileName 
   * @returns {string}
   */
  getFormatLabel(fileName) {
    if (!fileName) return 'Inconnu';
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'xlsx': return 'Excel Classeur (.xlsx)';
      case 'xls': return 'Excel 97-2004 (.xls)';
      case 'ods': return 'OpenDocument (.ods)';
      case 'csv': return 'Texte Délimité (.csv)';
      case 'txt': return 'Fichier Texte (.txt)';
      default: return ext.toUpperCase();
    }
  },

  /**
   * Lit un fichier (File ou Blob ou ArrayBuffer) et renvoie les métadonnées et feuilles
   * @param {File|Blob|ArrayBuffer} fileInput
   * @param {string} fileName
   * @returns {Promise<{ format: string, sheets: Array<{ name: string, rows: Array<Array<any>> }> }>}
   */
  async readWorkbook(fileInput, fileName = '') {
    const ext = (fileName || (fileInput.name || '')).split('.').pop().toLowerCase();

    // 1. Fichiers binaires Excel / ODS
    if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') {
      const buffer = fileInput instanceof ArrayBuffer ? fileInput : await this.fileToArrayBuffer(fileInput);
      return this.parseSpreadsheetBuffer(buffer, ext);
    }

    // 2. Fichiers texte / CSV
    const text = typeof fileInput === 'string' ? fileInput : await this.fileToText(fileInput);
    return this.parseTextContent(text, ext || 'csv');
  },

  /**
   * Convertit un File/Blob/Buffer en ArrayBuffer
   */
  fileToArrayBuffer(file) {
    if (file instanceof ArrayBuffer) return Promise.resolve(file);
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(file)) {
      const ab = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
      return Promise.resolve(ab);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(new Error("Impossible de lire le fichier binaire : " + err));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Convertit un File/Blob/Buffer en texte (gère BOM et encodage UTF-8)
   */
  fileToText(file) {
    if (typeof file === 'string') {
      return Promise.resolve(file.charCodeAt(0) === 0xFEFF ? file.slice(1) : file);
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(file)) {
      let str = file.toString('utf8');
      if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
      return Promise.resolve(str);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        // Nettoyage BOM UTF-8
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        resolve(content);
      };
      reader.onerror = (err) => reject(new Error("Impossible de lire le fichier texte : " + err));
      reader.readAsText(file, 'UTF-8');
    });
  },

  /**
   * Analyse un classeur binaire avec SheetJS (XLSX)
   */
  parseSpreadsheetBuffer(arrayBuffer, ext) {
    let XLSXLib = typeof window !== 'undefined' && window.XLSX ? window.XLSX : (typeof XLSX !== 'undefined' ? XLSX : null);
    if (!XLSXLib && typeof require !== 'undefined') {
      try {
        XLSXLib = require('xlsx');
      } catch (e) {}
    }
    if (!XLSXLib) {
      throw new Error("La bibliothèque de lecture Excel/ODS n'est pas chargée. Veuillez vérifier votre connexion.");
    }

    const workbook = XLSXLib.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      raw: false,
      defval: ''
    });

    const sheets = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      // Convertir en tableau 2D de cellules brutes
      const rawMatrix = XLSXLib.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
        raw: false
      });

      // Normaliser chaque cellule en chaîne de caractères nettoyée
      const rows = rawMatrix
        .map(row => (Array.isArray(row) ? row.map(cell => (cell !== null && cell !== undefined ? String(cell).trim() : '')) : []))
        .filter(row => row.some(cell => cell.length > 0)); // Exclure lignes totalement vides

      sheets.push({
        name: sheetName,
        rowCount: rows.length,
        rows
      });
    }

    return {
      format: ext.toUpperCase(),
      sheets
    };
  },

  /**
   * Analyse le contenu texte d'un fichier CSV ou TXT
   */
  parseTextContent(text, ext = 'csv') {
    if (!text || !text.trim()) {
      return {
        format: ext.toUpperCase(),
        sheets: [{ name: 'Données', rowCount: 0, rows: [] }]
      };
    }

    // Détection automatique du délimiteur sur l'ensemble du fichier
    const delimiter = this.detectDelimiter(text);

    // Découpage propre respectant les guillemets et retours à la ligne
    const rows = this.parseCsvWithQuotes(text, delimiter)
      .map(row => row.map(cell => (cell !== null && cell !== undefined ? String(cell).trim() : '')))
      .filter(row => row.some(cell => cell.length > 0));

    return {
      format: ext.toUpperCase(),
      delimiter,
      sheets: [{
        name: 'Données ' + ext.toUpperCase(),
        rowCount: rows.length,
        rows
      }]
    };
  },

  /**
   * Détecte le meilleur délimiteur pour un texte CSV/TXT
   * @param {string} text 
   * @returns {string} ';' | ',' | '\t' | '|'
   */
  detectDelimiter(text) {
    const lines = text.split(/\r?\n/).slice(0, 20).filter(l => l.trim().length > 0);
    if (lines.length === 0) return ';';

    const counts = { ';': 0, ',': 0, '\t': 0, '|': 0 };

    for (const line of lines) {
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (!inQuotes && counts[char] !== undefined) {
          counts[char]++;
        }
      }
    }

    // Le séparateur le plus représenté
    let best = ';';
    let max = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = delim;
      }
    }

    return max > 0 ? best : ';';
  },

  /**
   * Analyseur CSV robuste gérant les guillemets, retours chariots et échappements
   */
  parseCsvWithQuotes(text, delimiter = ';') {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    // Normalisation des fins de lignes
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double guillemet échappé ""
          currentCell += '"';
          i++;
        } else {
          // Bascule état guillemet
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' && !inQuotes) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    return rows;
  },

  /**
   * Détecte intelligemment l'en-tête et les colonnes dans un tableau 2D
   * @param {Array<Array<string>>} rows 
   * @returns {{ headerRowIndex: number, headers: Array<string>, mapping: Object }}
   */
  detectColumns(rows) {
    if (!rows || rows.length === 0) {
      return {
        headerRowIndex: 0,
        headers: [],
        mapping: { colNom: -1, colPrenom: -1, colNomComplet: -1, colGenre: -1, colMatricule: -1 }
      };
    }

    let headerRowIndex = 0;
    let maxKeywordScore = -1;

    // Inspecter les 10 premières lignes pour trouver la véritable ligne d'en-têtes
    const searchDepth = Math.min(rows.length, 10);
    for (let i = 0; i < searchDepth; i++) {
      const row = rows[i];
      let score = 0;
      for (const cell of row) {
        const c = (cell || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (c.includes('nom') || c.includes('prenom') || c.includes('eleve') || c.includes('student')) score += 3;
        if (c.includes('genre') || c.includes('sexe') || c.includes('sex') || c === 'g/f' || c === 'm/f') score += 3;
        if (c.includes('matricule') || c.includes('matr') || c.includes('num') || c.includes('code') || c === 'id') score += 2;
        if (c.includes('classe') || c.includes('division') || c.includes('niveau')) score += 1;
      }
      if (score > maxKeywordScore) {
        maxKeywordScore = score;
        headerRowIndex = i;
      }
    }

    // Si aucun en-tête évident n'est détecté avec des mots clés, on prend la ligne 0 si elle contient du texte
    const rawHeaders = rows[headerRowIndex] || [];
    const headers = rawHeaders.map((h, idx) => (h && h.trim().length > 0 ? h.trim() : `Colonne ${idx + 1}`));

    const mapping = {
      colNom: -1,
      colPrenom: -1,
      colNomComplet: -1,
      colGenre: -1,
      colMatricule: -1
    };

    // Détection des colonnes par mots-clés
    headers.forEach((h, idx) => {
      const norm = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      // 1. Nom complet (ex: "Nom et Prénoms", "Nom Prénom", "Élève")
      const isNomComplet = (
        norm.includes('nom et prenom') ||
        norm.includes('nom & prenom') ||
        norm.includes('nom et prenoms') ||
        norm.includes('nom prenom') ||
        norm === 'nom complet' ||
        norm === 'eleve' ||
        norm === 'student' ||
        norm === 'eleves'
      );
      if (isNomComplet) {
        if (mapping.colNomComplet === -1) mapping.colNomComplet = idx;
        return;
      }

      // 2. Prénom seul (doit être testé AVANT "nom" car "prenom" contient la sous-chaîne "nom" !)
      if (norm.includes('prenom') || norm === 'first name' || norm === 'prenoms' || norm.includes('given name')) {
        if (mapping.colPrenom === -1) mapping.colPrenom = idx;
        return;
      }

      // 3. Nom seul
      if (
        norm === 'nom' ||
        norm === 'noms' ||
        norm.includes('nom de famille') ||
        norm.includes("nom de l'eleve") ||
        norm.includes("nom eleve") ||
        norm === 'last name' ||
        norm === 'surname' ||
        /(^|\s)nom(\s|$)/.test(norm)
      ) {
        if (mapping.colNom === -1) mapping.colNom = idx;
        return;
      }

      // 4. Genre / Sexe
      if (norm.includes('genre') || norm.includes('sexe') || norm === 'sex' || norm === 'gender' || norm === 'g/f' || norm === 'm/f') {
        if (mapping.colGenre === -1) mapping.colGenre = idx;
        return;
      }

      // 5. Matricule / ID
      if (norm.includes('matricule') || norm === 'mat' || norm === 'n° matricule' || norm === 'numero' || norm === 'n°' || norm === 'id' || norm === 'ine') {
        if (mapping.colMatricule === -1) mapping.colMatricule = idx;
        return;
      }
    });

    // Fallback par défaut si aucune colonne n'a été trouvée (format standard 0:Nom, 1:Prénom, 2:Genre, 3:Matricule)
    if (mapping.colNom === -1 && mapping.colNomComplet === -1 && headers.length > 0) {
      mapping.colNom = 0;
    }
    if (mapping.colPrenom === -1 && mapping.colNomComplet === -1 && headers.length > 1) {
      mapping.colPrenom = 1;
    }
    if (mapping.colGenre === -1 && headers.length > 2) {
      mapping.colGenre = 2;
    }
    if (mapping.colMatricule === -1 && headers.length > 3) {
      mapping.colMatricule = 3;
    }

    return {
      headerRowIndex,
      headers,
      mapping
    };
  },

  /**
   * Normalisation exhaustive du genre (Garçon / Fille)
   * Résout définitivement l'erreur où 'G' ou 'H' rejetait les garçons !
   * @param {string|any} rawGenre 
   * @returns {'Garçon'|'Fille'|''}
   */
  normalizeGenre(rawGenre) {
    if (!rawGenre) return '';
    const clean = String(rawGenre).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Garçon : G, Garçon, Garcon, M, Masculin, Masc, Homme, H, Boy, Male, 1
    if (
      clean === 'g' ||
      clean.startsWith('garc') ||
      clean === 'm' ||
      clean.startsWith('masc') ||
      clean === 'h' ||
      clean.startsWith('homm') ||
      clean === 'boy' ||
      clean === 'male' ||
      clean === '1'
    ) {
      return 'Garçon';
    }

    // Fille : F, Fille, Féminin, Feminin, Femme, Fem, Girl, Female, 2
    if (
      clean === 'f' ||
      clean.startsWith('fill') ||
      clean.startsWith('fem') ||
      clean === 'girl' ||
      clean === 'female' ||
      clean === '2'
    ) {
      return 'Fille';
    }

    return '';
  },

  /**
   * Sépare un nom complet "Nom et Prénoms" en Nom et Prénom
   * @param {string} fullName 
   * @returns {{ nom: string, prenom: string }}
   */
  splitFullName(fullName) {
    if (!fullName) return { nom: '', prenom: '' };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { nom: parts[0].toUpperCase(), prenom: '' };
    }

    // Détection si les premiers mots sont en MAJUSCULES (ex: KOUASSI Jean-Yves)
    const upperParts = [];
    const lowerParts = [];

    let isUpperPhase = true;
    for (const p of parts) {
      const isWordUpper = p === p.toUpperCase() && /[A-Z]/.test(p);
      if (isUpperPhase && isWordUpper) {
        upperParts.push(p);
      } else {
        isUpperPhase = false;
        lowerParts.push(p);
      }
    }

    if (upperParts.length > 0 && lowerParts.length > 0) {
      return {
        nom: upperParts.join(' ').toUpperCase(),
        prenom: lowerParts.join(' ')
      };
    }

    // Sinon, le premier mot est le Nom, et le reste le Prénom
    return {
      nom: parts[0].toUpperCase(),
      prenom: parts.slice(1).join(' ')
    };
  },

  /**
   * Analyse toutes les lignes du fichier et produit la liste détaillée
   * @param {Array<Array<string>>} rows 
   * @param {number} headerRowIndex 
   * @param {Object} mapping 
   * @param {Array<Object>} existingStudentsInClass 
   * @returns {{ validStudents: Array, invalidRows: Array, duplicateRows: Array, allProcessedRows: Array, totalDataRows: number }}
   */
  processRows(rows, headerRowIndex, mapping, existingStudentsInClass = []) {
    const validStudents = [];
    const invalidRows = [];
    const duplicateRows = [];
    const allProcessedRows = [];

    // Données à partir de la ligne qui suit l'en-tête
    const dataStartIndex = headerRowIndex + 1;
    let dataRowCounter = 0;

    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some(cell => cell && String(cell).trim().length > 0)) {
        continue; // Ligne vide sautée silencieusement sans casser la suite
      }

      dataRowCounter++;
      const fileLineNumber = i + 1; // 1-indexé pour l'utilisateur

      let nom = '';
      let prenom = '';
      let genreRaw = '';
      let matricule = '';

      // Extraction Nom et Prénom
      if (mapping.colNomComplet !== -1 && mapping.colNomComplet < row.length && row[mapping.colNomComplet]) {
        const split = this.splitFullName(row[mapping.colNomComplet]);
        nom = split.nom;
        prenom = split.prenom;
      }

      if (mapping.colNom !== -1 && mapping.colNom < row.length && row[mapping.colNom]) {
        nom = String(row[mapping.colNom]).trim().toUpperCase();
      }

      if (mapping.colPrenom !== -1 && mapping.colPrenom < row.length && row[mapping.colPrenom]) {
        prenom = String(row[mapping.colPrenom]).trim();
      }

      if (mapping.colGenre !== -1 && mapping.colGenre < row.length) {
        genreRaw = String(row[mapping.colGenre] || '').trim();
      }

      if (mapping.colMatricule !== -1 && mapping.colMatricule < row.length) {
        // Préserver le matricule comme texte pour ne pas perdre les zéros initiaux
        matricule = String(row[mapping.colMatricule] || '').trim();
      }

      const genre = this.normalizeGenre(genreRaw);

      // Validation
      let status = 'valid';
      let message = 'Prêt à être importé';

      if (!nom || !prenom) {
        status = 'invalid';
        message = !nom && !prenom ? 'Nom et prénom manquants' : (!nom ? 'Nom manquant' : 'Prénom manquant');
      } else if (!genre) {
        status = 'invalid';
        message = `Genre non reconnu ("${genreRaw || 'vide'}"). Indiquez Garçon/Fille, G/F, M/F ou H/F.`;
      } else {
        // Vérification des doublons dans la classe existante
        const normNom = nom.toUpperCase();
        const normPrenom = prenom.toLowerCase();

        const isExistingDup = existingStudentsInClass.some(e => {
          if (matricule && e.matricule && e.matricule.trim().toLowerCase() === matricule.toLowerCase()) {
            return true;
          }
          return e.nom.toUpperCase() === normNom && e.prenom.toLowerCase() === normPrenom;
        });

        // Vérification des doublons au sein du fichier lui-même
        const isFileDup = validStudents.some(s => {
          if (matricule && s.matricule && s.matricule.toLowerCase() === matricule.toLowerCase()) {
            return true;
          }
          return s.nom.toUpperCase() === normNom && s.prenom.toLowerCase() === normPrenom;
        });

        if (isExistingDup) {
          status = 'duplicate';
          message = 'Élève déjà présent dans cette classe';
        } else if (isFileDup) {
          status = 'duplicate';
          message = 'Élève présent plusieurs fois dans le même fichier';
        }
      }

      const item = {
        fileLineNumber,
        nom,
        prenom,
        genre: genre || genreRaw,
        genreNormalized: genre,
        matricule,
        status,
        message,
        rawCells: row
      };

      allProcessedRows.push(item);

      if (status === 'valid') {
        validStudents.push(item);
      } else if (status === 'duplicate') {
        duplicateRows.push(item);
      } else {
        invalidRows.push(item);
      }
    }

    return {
      totalDataRows: dataRowCounter,
      validStudents,
      invalidRows,
      duplicateRows,
      allProcessedRows
    };
  }
};
