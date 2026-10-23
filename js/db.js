/**
 * EPS Database Manager (js/db.js)
 * Full Stack Supabase integration with PostgreSQL cloud persistence,
 * optimistic local caching, and offline resiliency.
 */

import { SupabaseManager } from './supabaseClient.js';

const DB_KEYS = {
  BAREMES: 'eps_baremes_v12',
  ELEVES: 'eps_eleves_v1',
  EVALUATIONS: 'eps_evaluations_v1',
  DISCIPLINES: 'eps_disciplines_v2',
  INITIALIZED: 'eps_init_status_v12'
};

class EPSDatabase {
  constructor() {
    this.baremes = [];
    this.eleves = [];
    this.evaluations = [];
    this.cachedDisciplines = [];
    this.isOnline = false;
    this.realtimeSubscribed = false;
  }

  async init() {
    console.log("Initializing EPS Full Stack Database...");
    
    // 1. Load local cache first for instant rendering
    this.loadFromLocal();

    // 2. Check connection to Supabase
    try {
      const connected = await SupabaseManager.checkConnection();
      this.isOnline = connected;

      if (connected) {
        console.log("Connected to Supabase PostgreSQL. Syncing latest data...");
        await this.syncFromSupabase();
        this.setupRealtime();
      } else {
        console.warn("Operating in offline cache mode.");
        if (this.baremes.length === 0) {
          await this.seedDefaultsLocally();
        }
      }
    } catch (err) {
      console.error("Database initialization error:", err);
      if (this.baremes.length === 0) {
        await this.seedDefaultsLocally();
      }
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eps:db-ready', { detail: { baremesCount: this.baremes.length } }));
      }
    } catch (e) {}
  }

  /**
   * Sync all tables from Supabase PostgreSQL
   */
  async syncFromSupabase() {
    const sb = SupabaseManager.getClient();
    if (!sb) return;

    try {
      // 1. Fetch Disciplines
      const { data: discData, error: discErr } = await sb
        .from('disciplines')
        .select('*')
        .order('nom');

      if (!discErr && discData && discData.length > 0) {
        this.cachedDisciplines = discData.filter(d => !d.nom.toLowerCase().includes("haies") && d.nom !== "Course 60m / 80m");
        localStorage.setItem(DB_KEYS.DISCIPLINES, JSON.stringify(this.cachedDisciplines));
      }

      // 2. Fetch Eleves
      const { data: elData, error: elErr } = await sb
        .from('eleves')
        .select('*')
        .order('nom');

      if (!elErr && elData) {
        this.eleves = elData;
        localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
      }

      // 3. Fetch Evaluations
      const { data: evData, error: evErr } = await sb
        .from('evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });

      if (!evErr && evData) {
        this.evaluations = evData.map(row => ({
          id: row.id,
          eleveId: row.eleve_id,
          eleveNom: row.eleve_nom,
          discipline: row.discipline,
          engin: row.engin,
          classe: row.classe,
          genre: row.genre,
          distance: parseFloat(row.distance),
          note: parseFloat(row.note),
          date: row.evaluation_date
        }));
        localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
      }

      // 4. Fetch Baremes
      const { data: barData, error: barErr } = await sb
        .from('baremes')
        .select('*');

      if (!barErr && barData && barData.length > 0) {
        this.baremes = barData.filter(b => !b.discipline.toLowerCase().includes("haies") && b.discipline !== "Course 60m / 80m");
        localStorage.setItem(DB_KEYS.BAREMES, JSON.stringify(this.baremes));
      }

      this.saveLocalAll();
      console.log(`Supabase Sync complete: ${this.eleves.length} élèves, ${this.evaluations.length} évaluations, ${this.baremes.length} barèmes.`);
    } catch (e) {
      console.warn("Failed to complete full sync from Supabase:", e);
    }
  }

  /**
   * Realtime subscriptions for multi-user collaboration
   */
  setupRealtime() {
    if (this.realtimeSubscribed) return;
    const sb = SupabaseManager.getClient();
    if (!sb || !sb.channel) return;

    try {
      sb.channel('public_eps_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, payload => {
          console.log("Realtime evaluation update received:", payload);
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            const item = {
              id: row.id,
              eleveId: row.eleve_id,
              eleveNom: row.eleve_nom,
              discipline: row.discipline,
              engin: row.engin,
              classe: row.classe,
              genre: row.genre,
              distance: parseFloat(row.distance),
              note: parseFloat(row.note),
              date: row.evaluation_date
            };
            if (!this.evaluations.find(e => e.id === item.id)) {
              this.evaluations.unshift(item);
              this.saveLocalAll();
            }
          } else if (payload.eventType === 'DELETE') {
            this.evaluations = this.evaluations.filter(e => e.id !== payload.old.id);
            this.saveLocalAll();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eleves' }, payload => {
          console.log("Realtime élève update received:", payload);
          if (payload.eventType === 'INSERT') {
            if (!this.eleves.find(e => e.id === payload.new.id)) {
              this.eleves.push(payload.new);
              this.saveLocalAll();
            }
          } else if (payload.eventType === 'DELETE') {
            this.eleves = this.eleves.filter(e => e.id !== payload.old.id);
            this.saveLocalAll();
          }
        })
        .subscribe();

      this.realtimeSubscribed = true;
    } catch (err) {
      console.warn("Realtime subscription error:", err);
    }
  }

  loadFromLocal() {
    try {
      this.baremes = (JSON.parse(localStorage.getItem(DB_KEYS.BAREMES) || '[]'))
        .filter(b => !b.discipline.toLowerCase().includes("haies") && b.discipline !== "Course 60m / 80m");
      this.eleves = JSON.parse(localStorage.getItem(DB_KEYS.ELEVES) || '[]');
      this.evaluations = JSON.parse(localStorage.getItem(DB_KEYS.EVALUATIONS) || '[]');
      this.cachedDisciplines = (JSON.parse(localStorage.getItem(DB_KEYS.DISCIPLINES) || '[]'))
        .filter(d => !d.nom.toLowerCase().includes("haies") && d.nom !== "Course 60m / 80m");
    } catch (e) {
      console.warn("Local storage parse error:", e);
    }
  }

  saveLocalAll() {
    try {
      localStorage.setItem(DB_KEYS.BAREMES, JSON.stringify(this.baremes));
      localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
      localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
      localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
    } catch (e) {
      console.warn("Local storage write error:", e);
    }
  }

  async seedDefaultsLocally() {
    try {
      const res = await fetch('data/default_baremes.json');
      const defaultBaremes = await res.json();
      this.baremes = defaultBaremes;
    } catch (e) {
      console.warn("Fallback baremes loading error:", e);
    }
    this.saveLocalAll();
  }

  // --- DISCIPLINES / ACTIVITÉS ---
  getDisciplines() {
    let raw = (this.cachedDisciplines && this.cachedDisciplines.length > 0) ? this.cachedDisciplines : null;

    if (!raw) {
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
          id: nom.toLowerCase().replace(/\s+/g, '_').replace('/', '_'),
          nom: nom,
          engins: Array.from(enginsSet)
        });
      });
      raw = list;
    }

    const cleaned = (raw || []).filter(d => {
      const n = (d.nom || '').toLowerCase();
      return !n.includes("haies") && d.nom !== "Course 60m / 80m";
    });

    return cleaned.length > 0 ? cleaned : [{ id: "poids", nom: "Lancer de poids", engins: ["3kg", "4kg", "5kg"] }];
  }

  get disciplines() {
    return this.getDisciplines();
  }

  // --- BAREMES CRUD ---
  getBaremes() {
    return this.baremes;
  }

  getBaremesForCategory(discipline, classe, genre) {
    if (!discipline || !classe || !genre) return [];
    let disc = discipline.trim().toLowerCase();
    const cls = classe.trim().toLowerCase();
    const gnr = genre.trim().toLowerCase();

    if (disc.includes("haies")) return [];

    // Harmonisation des alias d'activités
    if (disc.includes("80m") || disc.includes("80 mètres") || disc.includes("80 metres")) {
      disc = "course de vitesse de 80m";
    } else if (disc.includes("60m") || disc.includes("60 mètres") || disc.includes("60 metres")) {
      disc = "course de vitesse de 60 mètres";
    } else if (disc.includes("800m") || disc.includes("800 mètres") || disc.includes("800 metres")) {
      disc = "course 800m";
    } else if (disc.includes("1000m") || disc.includes("1000 mètres") || disc.includes("1000 metres")) {
      disc = "course 1000m";
    }

    const matchesDisc = (bDisc) => {
      const bd = (bDisc || '').trim().toLowerCase();
      if (bd === disc) return true;
      if (disc === "course de vitesse de 80m" && (bd.includes("80m") || bd.includes("80 mètres"))) return true;
      if (disc === "course de vitesse de 60 mètres" && (bd.includes("60m") || bd.includes("60 mètres"))) return true;
      if (disc === "course 800m" && (bd.includes("800m") || bd.includes("800 mètres"))) return true;
      if (disc === "course 1000m" && (bd.includes("1000m") || bd.includes("1000 mètres"))) return true;
      return false;
    };

    return (this.baremes || []).filter(b =>
      matchesDisc(b.discipline) &&
      (b.classe || '').trim().toLowerCase() === cls &&
      (b.genre || '').trim().toLowerCase() === gnr
    );
  }

  findBareme(discipline, classe, genre, engin = null) {
    const list = this.getBaremesForCategory(discipline, classe, genre);
    if (!list || list.length === 0) return null;

    if (engin) {
      const eng = engin.trim().toLowerCase();
      const exact = list.find(b => b.engin && b.engin.trim().toLowerCase() === eng);
      return exact || null;
    }

    // No engin specified: return bareme without engin if available
    const noEngin = list.find(b => !b.engin);
    if (noEngin) return noEngin;

    // If an activity requires engins, but none was passed, return null
    return null;
  }

  async saveBareme(baremeData) {
    if (!baremeData.id) {
      baremeData.id = 'bar_' + Date.now();
    }

    // Optimistic local update
    const idx = this.baremes.findIndex(b => b.id === baremeData.id);
    if (idx >= 0) {
      this.baremes[idx] = baremeData;
    } else {
      this.baremes.push(baremeData);
    }
    this.saveLocalAll();

    // Supabase persist
    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        const { error } = await sb.from('baremes').upsert({
          id: baremeData.id,
          discipline: baremeData.discipline,
          engin: baremeData.engin || null,
          classe: baremeData.classe,
          genre: baremeData.genre,
          type: baremeData.type || 'distance',
          grille: baremeData.grille || []
        });
        if (error) console.error("Supabase bareme upsert error:", error);
      } catch (e) {
        console.warn("Offline fallback for bareme upsert:", e);
      }
    }

    return baremeData;
  }

  // --- ELEVES CRUD ---
  getEleves(filterClasse = null) {
    if (!filterClasse || filterClasse === 'ALL') return this.eleves;
    return this.eleves.filter(e => e.classe === filterClasse);
  }

  async addEleve(eleve) {
    if (!eleve.id) {
      eleve.id = 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    }

    // Optimistic local update
    this.eleves.push(eleve);
    this.saveLocalAll();

    // Supabase persist
    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        const { error } = await sb.from('eleves').insert({
          id: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          classe: eleve.classe,
          genre: eleve.genre
        });
        if (error) console.error("Supabase insert eleve error:", error);
      } catch (e) {
        console.warn("Offline fallback for eleve insert:", e);
      }
    }

    return eleve;
  }

  async updateEleve(id, updatedData) {
    const idx = this.eleves.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.eleves[idx] = { ...this.eleves[idx], ...updatedData };
      this.saveLocalAll();

      const sb = SupabaseManager.getClient();
      if (sb) {
        try {
          await sb.from('eleves').update({
            nom: updatedData.nom,
            prenom: updatedData.prenom,
            classe: updatedData.classe,
            genre: updatedData.genre
          }).eq('id', id);
        } catch (e) {
          console.warn("Offline update error:", e);
        }
      }

      return this.eleves[idx];
    }
    return null;
  }

  async deleteEleve(id) {
    this.eleves = this.eleves.filter(e => e.id !== id);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('eleves').delete().eq('id', id);
      } catch (e) {
        console.warn("Offline delete error:", e);
      }
    }
  }

  // --- EVALUATIONS CRUD ---
  getEvaluations() {
    return this.evaluations.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async addEvaluation(evaluation) {
    if (!evaluation.id) {
      evaluation.id = 'eval_' + Date.now();
    }
    if (!evaluation.date) {
      evaluation.date = new Date().toISOString();
    }

    // Optimistic local update
    this.evaluations.unshift(evaluation);
    this.saveLocalAll();

    // Supabase persist
    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        const { error } = await sb.from('evaluations').insert({
          id: evaluation.id,
          eleve_id: evaluation.eleveId || null,
          eleve_nom: evaluation.eleveNom,
          discipline: evaluation.discipline,
          engin: evaluation.engin || null,
          classe: evaluation.classe,
          genre: evaluation.genre,
          distance: evaluation.distance,
          note: evaluation.note,
          evaluation_date: evaluation.date
        });
        if (error) console.error("Supabase insert evaluation error:", error);
      } catch (e) {
        console.warn("Offline fallback for evaluation insert:", e);
      }
    }

    return evaluation;
  }

  async deleteEvaluation(id) {
    this.evaluations = this.evaluations.filter(ev => ev.id !== id);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('evaluations').delete().eq('id', id);
      } catch (e) {
        console.warn("Offline delete error:", e);
      }
    }
  }

  // --- EXPORT & IMPORT ---
  exportDatabase() {
    return JSON.stringify({
      version: '2.0-fullstack',
      exportedAt: new Date().toISOString(),
      baremes: this.baremes,
      eleves: this.eleves,
      evaluations: this.evaluations
    }, null, 2);
  }

  async resetToDefaults() {
    try {
      await this.seedDefaultsLocally();
      await this.syncFromSupabase();
    } catch (e) {
      console.error("Reset error:", e);
    }
  }
}

export const db = new EPSDatabase();
