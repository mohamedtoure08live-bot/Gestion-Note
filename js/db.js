/**
 * EPS Database Manager (js/db.js)
 * Manages persistence for Eleves, Baremes, Evaluations and Disciplines in LocalStorage.
 */

const DB_KEYS = {
  BAREMES: 'eps_baremes_v10',
  ELEVES: 'eps_eleves_v1',
  EVALUATIONS: 'eps_evaluations_v1',
  INITIALIZED: 'eps_init_status_v10'
};

class EPSDatabase {
  constructor() {
    this.baremes = [];
    this.eleves = [];
    this.evaluations = [];
  }

  async init() {
    try {
      const isInit = localStorage.getItem(DB_KEYS.INITIALIZED);
      if (!isInit) {
        // Keep existing eleves / evaluations if present from previous versions
        const savedEleves = localStorage.getItem('eps_eleves_v1');
        const savedEvals = localStorage.getItem('eps_evaluations_v1');
        await this.seedDefaults();
        if (savedEleves) this.eleves = JSON.parse(savedEleves);
        if (savedEvals) this.evaluations = JSON.parse(savedEvals);
        this.saveAll();
      } else {
        this.loadAll();
      }
    } catch (err) {
      console.error("DB Initialization Error:", err);
      await this.seedDefaults();
    }
  }

  async seedDefaults() {
    try {
      // Load official baremes from JSON
      const res = await fetch('data/default_baremes.json');
      const defaultBaremes = await res.json();
      this.baremes = defaultBaremes;
    } catch (e) {
      console.warn("Fallback baremes loading:", e);
      this.baremes = [];
    }

    // Seed default demo students
    this.eleves = [
      { id: "el-1", nom: "KOUASSI", prenom: "Marc", classe: "Troisième", genre: "Garçon" },
      { id: "el-2", nom: "DIARRASSOUBA", prenom: "Awa", classe: "Quatrième", genre: "Fille" },
      { id: "el-3", nom: "KONAN", prenom: "Yao Emmanuel", classe: "Seconde", genre: "Garçon" },
      { id: "el-4", nom: "TRAORE", prenom: "Fatou", classe: "Sixième", genre: "Fille" },
      { id: "el-5", nom: "BAMBA", prenom: "Sikafê", classe: "Cinquième", genre: "Garçon" },
      { id: "el-6", nom: "N'GUESSAN", prenom: "Marie-Louise", classe: "Seconde", genre: "Fille" },
      { id: "el-7", nom: "YAPO", prenom: "Jean-Baptiste", classe: "Terminale", genre: "Garçon" }
    ];

    // Seed default sample evaluations
    this.evaluations = [
      {
        id: "eval-01",
        eleveId: "el-1",
        eleveNom: "KOUASSI Marc",
        discipline: "Lancer de poids",
        engin: "4kg",
        classe: "Troisième",
        genre: "Garçon",
        distance: 11.70,
        note: 18.0,
        date: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "eval-02",
        eleveId: "el-2",
        eleveNom: "DIARRASSOUBA Awa",
        discipline: "Lancer de poids",
        engin: "3kg",
        classe: "Quatrième",
        genre: "Fille",
        distance: 7.20,
        note: 15.0,
        date: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: "eval-03",
        eleveId: "el-3",
        eleveNom: "KONAN Yao Emmanuel",
        discipline: "Lancer de poids",
        engin: "5kg",
        classe: "Seconde",
        genre: "Garçon",
        distance: 9.65,
        note: 15.0,
        date: new Date().toISOString()
      }
    ];

    this.saveAll();
    localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
  }

  loadAll() {
    this.baremes = JSON.parse(localStorage.getItem(DB_KEYS.BAREMES) || '[]');
    this.eleves = JSON.parse(localStorage.getItem(DB_KEYS.ELEVES) || '[]');
    this.evaluations = JSON.parse(localStorage.getItem(DB_KEYS.EVALUATIONS) || '[]');
  }

  saveAll() {
    localStorage.setItem(DB_KEYS.BAREMES, JSON.stringify(this.baremes));
    localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
  }

  // Dynamic discovery of disciplines from active baremes (No invented disciplines)
  getDisciplines() {
    const list = [];
    const seen = new Map();

    (this.baremes || []).forEach(b => {
      if (!b.discipline) return;
      if (!seen.has(b.discipline)) {
        seen.set(b.discipline, new Set());
      }
      if (b.engin) {
        seen.get(b.discipline).add(b.engin);
      }
    });

    seen.forEach((enginsSet, nom) => {
      list.push({
        id: nom.toLowerCase().replace(/\s+/g, '_'),
        nom: nom,
        engins: Array.from(enginsSet)
      });
    });

    return list;
  }

  get disciplines() {
    return this.getDisciplines();
  }

  // --- BAREMES CRUD ---
  getBaremes() { return this.baremes; }
  
  findBareme(discipline, classe, genre, engin = null) {
    if (!discipline || !classe || !genre) return null;
    const disc = discipline.trim().toLowerCase();
    const cls = classe.trim().toLowerCase();
    const gnr = genre.trim().toLowerCase();
    const eng = engin ? engin.trim().toLowerCase() : null;

    if (eng) {
      // 1. Try exact match with engin
      const exact = this.baremes.find(b =>
        b.discipline.trim().toLowerCase() === disc &&
        b.classe.trim().toLowerCase() === cls &&
        b.genre.trim().toLowerCase() === gnr &&
        b.engin && b.engin.trim().toLowerCase() === eng
      );
      if (exact) return exact;
    }

    // 2. Try match where engin is null/empty
    const noEngin = this.baremes.find(b =>
      b.discipline.trim().toLowerCase() === disc &&
      b.classe.trim().toLowerCase() === cls &&
      b.genre.trim().toLowerCase() === gnr &&
      !b.engin
    );
    if (noEngin) return noEngin;

    // 3. Fallback: match discipline, classe, genre regardless of engin
    return this.baremes.find(b =>
      b.discipline.trim().toLowerCase() === disc &&
      b.classe.trim().toLowerCase() === cls &&
      b.genre.trim().toLowerCase() === gnr
    ) || null;
  }

  saveBareme(baremeData) {
    const idx = this.baremes.findIndex(b => b.id === baremeData.id);
    if (idx >= 0) {
      this.baremes[idx] = baremeData;
    } else {
      if (!baremeData.id) {
        baremeData.id = 'bar_' + Date.now();
      }
      this.baremes.push(baremeData);
    }
    this.saveAll();
    return baremeData;
  }

  // --- ELEVES CRUD ---
  getEleves(filterClasse = null) {
    if (!filterClasse || filterClasse === 'ALL') return this.eleves;
    return this.eleves.filter(e => e.classe === filterClasse);
  }

  addEleve(eleve) {
    eleve.id = 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    this.eleves.push(eleve);
    this.saveAll();
    return eleve;
  }

  updateEleve(id, updatedData) {
    const idx = this.eleves.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.eleves[idx] = { ...this.eleves[idx], ...updatedData };
      this.saveAll();
      return this.eleves[idx];
    }
    return null;
  }

  deleteEleve(id) {
    this.eleves = this.eleves.filter(e => e.id !== id);
    this.saveAll();
  }

  // --- EVALUATIONS CRUD ---
  getEvaluations() {
    return this.evaluations.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addEvaluation(evaluation) {
    evaluation.id = 'eval_' + Date.now();
    evaluation.date = new Date().toISOString();
    this.evaluations.unshift(evaluation);
    this.saveAll();
    return evaluation;
  }

  deleteEvaluation(id) {
    this.evaluations = this.evaluations.filter(ev => ev.id !== id);
    this.saveAll();
  }

  // --- EXPORT & IMPORT ---
  exportDatabase() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      baremes: this.baremes,
      eleves: this.eleves,
      evaluations: this.evaluations
    }, null, 2);
  }

  importDatabase(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.baremes) this.baremes = data.baremes;
      if (data.eleves) this.eleves = data.eleves;
      if (data.evaluations) this.evaluations = data.evaluations;
      this.saveAll();
      return true;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }

  async resetToDefaults() {
    localStorage.removeItem(DB_KEYS.INITIALIZED);
    localStorage.removeItem(DB_KEYS.BAREMES);
    await this.seedDefaults();
  }
}

export const db = new EPSDatabase();
