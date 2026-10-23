/**
 * EPS Database Manager (js/db.js)
 * Full Stack Supabase integration with PostgreSQL cloud persistence,
 * optimistic local caching, multi-professeur data isolation, and classes management.
 */

import { SupabaseManager } from './supabaseClient.js';
import { EPSEngine } from './engine.js';

const DB_KEYS = {
  BAREMES: 'eps_baremes_v12',
  ELEVES: 'eps_eleves_v2',
  CLASSES: 'eps_classes_v2',
  EVALUATIONS: 'eps_evaluations_v2',
  DISCIPLINES: 'eps_disciplines_v2',
  PROFESSEURS: 'eps_professeurs_v2',
  CURRENT_PROF: 'eps_current_prof_id_v2',
  INITIALIZED: 'eps_init_status_v13'
};

class EPSDatabase {
  constructor() {
    this.baremes = [];
    this.classes = [];
    this.eleves = [];
    this.evaluations = [];
    this.professeurs = [];
    this.currentProfesseurId = 'prof_default';
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
      // 1. Fetch Classes
      const { data: clsData, error: clsErr } = await sb
        .from('classes')
        .select('*');

      if (!clsErr && clsData && clsData.length > 0) {
        this.classes = clsData.map(row => ({
          id: row.id,
          nom: row.nom,
          niveau: row.niveau || row.cycle || (EPSEngine.OFFICIAL_LEVELS.includes(row.nom) ? row.nom : 'Troisième'),
          anneeScolaire: row.annee_scolaire || '2026-2027',
          description: row.description || '',
          professeurId: row.professeur_id || 'prof_default',
          createdAt: row.created_at || new Date().toISOString()
        }));
        localStorage.setItem(DB_KEYS.CLASSES, JSON.stringify(this.classes));
      }

      // 2. Fetch Eleves
      const { data: elData, error: elErr } = await sb
        .from('eleves')
        .select('*');

      if (!elErr && elData && elData.length > 0) {
        this.eleves = elData.map(row => ({
          id: row.id,
          nom: row.nom,
          prenom: row.prenom,
          genre: row.genre,
          classe: row.classe,
          classeId: row.classe_id || null,
          matricule: row.matricule || '',
          professeurId: row.professeur_id || 'prof_default'
        }));
        localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
      }

      // 3. Fetch Evaluations
      const { data: evData, error: evErr } = await sb
        .from('evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });

      if (!evErr && evData && evData.length > 0) {
        this.evaluations = evData.map(row => ({
          id: row.id,
          eleveId: row.eleve_id,
          eleveNom: row.eleve_nom,
          discipline: row.discipline,
          engin: row.engin,
          classe: row.classe,
          classeId: row.classe_id || null,
          genre: row.genre,
          distance: parseFloat(row.distance),
          note: parseFloat(row.note),
          date: row.evaluation_date,
          professeurId: row.professeur_id || 'prof_default'
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
      console.log(`Supabase Sync complete: ${this.classes.length} classes, ${this.eleves.length} élèves, ${this.evaluations.length} évaluations, ${this.baremes.length} barèmes.`);
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
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            const item = {
              id: row.id,
              eleveId: row.eleve_id,
              eleveNom: row.eleve_nom,
              discipline: row.discipline,
              engin: row.engin,
              classe: row.classe,
              classeId: row.classe_id || null,
              genre: row.genre,
              distance: parseFloat(row.distance),
              note: parseFloat(row.note),
              date: row.evaluation_date,
              professeurId: row.professeur_id || 'prof_default'
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, payload => {
          if (payload.eventType === 'INSERT') {
            if (!this.classes.find(c => c.id === payload.new.id)) {
              this.classes.push(payload.new);
              this.saveLocalAll();
            }
          } else if (payload.eventType === 'DELETE') {
            this.classes = this.classes.filter(c => c.id !== payload.old.id);
            this.saveLocalAll();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eleves' }, payload => {
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
      
      this.cachedDisciplines = (JSON.parse(localStorage.getItem(DB_KEYS.DISCIPLINES) || '[]'))
        .filter(d => !d.nom.toLowerCase().includes("haies") && d.nom !== "Course 60m / 80m");

      // Load Professeurs
      this.professeurs = JSON.parse(localStorage.getItem(DB_KEYS.PROFESSEURS) || '[]');
      if (this.professeurs.length === 0) {
        this.professeurs = [
          { id: 'prof_default', nom: 'M. Soro', prenom: 'Abdoulaye', email: 'soro.eps@education.ci', etablissement: 'Lycée Moderne', role: 'Enseignant EPS' },
          { id: 'prof_toure', nom: 'Mme Touré', prenom: 'Aminata', email: 'toure.eps@education.ci', etablissement: 'Collège de Cocody', role: 'Enseignante EPS' }
        ];
      }
      this.currentProfesseurId = localStorage.getItem(DB_KEYS.CURRENT_PROF) || 'prof_default';

      // Load Classes
      this.classes = JSON.parse(localStorage.getItem(DB_KEYS.CLASSES) || '[]');
      if (this.classes.length === 0) {
        // Seed initial teacher classes
        this.classes = [
          { id: 'cls_3eA', nom: '3e A', niveau: 'Troisième', anneeScolaire: '2026-2027', description: 'Classe de 3ème section A', professeurId: 'prof_default', createdAt: new Date().toISOString() },
          { id: 'cls_6e1', nom: '6e 1', niveau: 'Sixième', anneeScolaire: '2026-2027', description: 'Classe de 6ème groupe 1', professeurId: 'prof_default', createdAt: new Date().toISOString() },
          { id: 'cls_2ndeB', nom: '2nde B', niveau: 'Seconde', anneeScolaire: '2026-2027', description: 'Seconde scientifique B', professeurId: 'prof_default', createdAt: new Date().toISOString() }
        ];
      }

      // Load Eleves (with backward compatibility)
      let storedEleves = JSON.parse(localStorage.getItem(DB_KEYS.ELEVES) || '[]');
      if (storedEleves.length === 0) {
        // Try fallback from v1 key
        storedEleves = JSON.parse(localStorage.getItem('eps_eleves_v1') || '[]');
      }
      
      this.eleves = storedEleves.map(el => {
        let cid = el.classeId;
        let cNom = el.classeNom;
        if (!cid) {
          const matchCls = this.classes.find(c => c.niveau === el.classe);
          if (matchCls) {
            cid = matchCls.id;
            cNom = matchCls.nom;
          }
        }
        return {
          id: el.id,
          nom: el.nom,
          prenom: el.prenom,
          genre: el.genre,
          classe: el.classe,
          classeId: cid || null,
          classeNom: cNom || el.classe,
          matricule: el.matricule || '',
          professeurId: el.professeurId || 'prof_default'
        };
      });

      // Load Evaluations (with backward compatibility)
      let storedEvals = JSON.parse(localStorage.getItem(DB_KEYS.EVALUATIONS) || '[]');
      if (storedEvals.length === 0) {
        storedEvals = JSON.parse(localStorage.getItem('eps_evaluations_v1') || '[]');
      }
      this.evaluations = storedEvals.map(ev => ({
        ...ev,
        professeurId: ev.professeurId || 'prof_default'
      }));

    } catch (e) {
      console.warn("Local storage parse error:", e);
    }
  }

  saveLocalAll() {
    try {
      localStorage.setItem(DB_KEYS.BAREMES, JSON.stringify(this.baremes));
      localStorage.setItem(DB_KEYS.CLASSES, JSON.stringify(this.classes));
      localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
      localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
      localStorage.setItem(DB_KEYS.PROFESSEURS, JSON.stringify(this.professeurs));
      localStorage.setItem(DB_KEYS.CURRENT_PROF, this.currentProfesseurId);
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

  // --- PROFESSEURS / MULTI-UTILISATEUR ---
  getProfesseurs() {
    return this.professeurs;
  }

  getCurrentProfesseur() {
    const prof = this.professeurs.find(p => p.id === this.currentProfesseurId);
    return prof || this.professeurs[0] || { id: 'prof_default', nom: 'M. Soro', prenom: 'Abdoulaye' };
  }

  setCurrentProfesseur(id) {
    const p = this.professeurs.find(prof => prof.id === id);
    if (p) {
      this.currentProfesseurId = p.id;
      localStorage.setItem(DB_KEYS.CURRENT_PROF, p.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eps:prof-changed', { detail: { prof: p } }));
      }
      return p;
    }
    return null;
  }

  addProfesseur(data) {
    const newProf = {
      id: 'prof_' + Date.now(),
      nom: (data.nom || '').trim(),
      prenom: (data.prenom || '').trim(),
      email: (data.email || '').trim(),
      etablissement: (data.etablissement || 'Établissement Scolaire').trim(),
      role: 'Enseignant EPS',
      createdAt: new Date().toISOString()
    };
    this.professeurs.push(newProf);
    this.saveLocalAll();
    return newProf;
  }

  // --- CLASSES CRUD (« Mes classes ») ---
  getClasses(profId = null) {
    const targetProf = profId || this.currentProfesseurId;
    return this.classes.filter(c => c.professeurId === targetProf || (!c.professeurId && targetProf === 'prof_default'));
  }

  getClassById(id) {
    return this.classes.find(c => c.id === id) || null;
  }

  async addClass(classeData) {
    const activeProfId = classeData.professeurId || this.currentProfesseurId;
    const newClass = {
      id: classeData.id || 'cls_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      nom: (classeData.nom || '').trim(),
      niveau: classeData.niveau || 'Troisième',
      anneeScolaire: classeData.anneeScolaire || '2026-2027',
      description: classeData.description || '',
      professeurId: activeProfId,
      createdAt: new Date().toISOString()
    };

    this.classes.push(newClass);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('classes').insert({
          id: newClass.id,
          nom: newClass.nom,
          niveau: newClass.niveau,
          annee_scolaire: newClass.anneeScolaire,
          description: newClass.description,
          professeur_id: newClass.professeurId
        });
      } catch (e) {
        console.warn("Supabase insert classe notice:", e);
      }
    }

    return newClass;
  }

  async updateClass(id, updatedData) {
    const idx = this.classes.findIndex(c => c.id === id);
    if (idx < 0) return null;

    // Security check: teacher authorization
    const cls = this.classes[idx];
    if (cls.professeurId && cls.professeurId !== this.currentProfesseurId) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à modifier cette classe.");
    }

    this.classes[idx] = { ...this.classes[idx], ...updatedData };
    
    // Propagate class name / niveau to attached students
    if (updatedData.nom || updatedData.niveau) {
      this.eleves.forEach(el => {
        if (el.classeId === id) {
          if (updatedData.nom) el.classeNom = updatedData.nom;
          if (updatedData.niveau) el.classe = updatedData.niveau;
        }
      });
    }

    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('classes').update({
          nom: this.classes[idx].nom,
          niveau: this.classes[idx].niveau,
          annee_scolaire: this.classes[idx].anneeScolaire,
          description: this.classes[idx].description
        }).eq('id', id);
      } catch (e) {
        console.warn("Supabase update classe notice:", e);
      }
    }

    return this.classes[idx];
  }

  async deleteClass(id) {
    const idx = this.classes.findIndex(c => c.id === id);
    if (idx < 0) return false;

    // Security check
    if (this.classes[idx].professeurId && this.classes[idx].professeurId !== this.currentProfesseurId) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à supprimer cette classe.");
    }

    // Safely delete class; unbind students without deleting them or historical evaluations
    this.classes.splice(idx, 1);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('classes').delete().eq('id', id);
      } catch (e) {
        console.warn("Supabase delete classe notice:", e);
      }
    }

    return true;
  }

  // --- ELEVES CRUD ---
  getEleves(filterClasse = null, profId = null) {
    const targetProf = profId || this.currentProfesseurId;
    let list = this.eleves.filter(e => e.professeurId === targetProf || (!e.professeurId && targetProf === 'prof_default'));

    if (filterClasse && filterClasse !== 'ALL') {
      list = list.filter(e =>
        e.classeId === filterClasse ||
        e.classeNom === filterClasse ||
        e.classe === filterClasse
      );
    }
    return list;
  }

  getEleveById(id) {
    return this.eleves.find(e => e.id === id) || null;
  }

  async addEleve(eleve) {
    if (!eleve.id) {
      eleve.id = 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    }
    if (!eleve.professeurId) {
      eleve.professeurId = this.currentProfesseurId;
    }
    
    // Resolve official niveau and classeNom if classeId provided
    if (eleve.classeId) {
      const cls = this.getClassById(eleve.classeId);
      if (cls) {
        eleve.classeNom = cls.nom;
        eleve.classe = cls.niveau;
      }
    }

    this.eleves.push(eleve);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('eleves').insert({
          id: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          classe: eleve.classe,
          genre: eleve.genre,
          classe_id: eleve.classeId || null,
          professeur_id: eleve.professeurId,
          matricule: eleve.matricule || null
        });
      } catch (e) {
        console.warn("Supabase insert eleve notice:", e);
      }
    }

    return eleve;
  }

  /**
   * Batch insert students with duplicate checking
   * @param {Array} elevesList 
   * @param {string} classeId 
   * @returns {Object} { added, duplicates, errors }
   */
  async addElevesBatch(elevesList, classeId) {
    const targetClass = this.getClassById(classeId);
    if (!targetClass) {
      throw new Error("Classe introuvable pour l'importation.");
    }

    const added = [];
    const duplicates = [];
    const errors = [];

    const existingInClass = this.getEleves(classeId, targetClass.professeurId);

    for (const raw of elevesList) {
      const nom = (raw.nom || '').trim().toUpperCase();
      const prenom = (raw.prenom || '').trim();
      let genre = (raw.genre || '').trim();

      // Normalize gender (Garçon / Fille / M / F)
      const gLower = genre.toLowerCase();
      if (gLower.startsWith('m') || gLower === 'garcon' || gLower === 'garçon') {
        genre = 'Garçon';
      } else if (gLower.startsWith('f') || gLower === 'fille') {
        genre = 'Fille';
      }

      if (!nom || !prenom) {
        errors.push({ raw, reason: "Nom ou prénom manquant." });
        continue;
      }

      if (genre !== 'Garçon' && genre !== 'Fille') {
        errors.push({ raw, reason: `Genre invalide (${raw.genre || 'non renseigné'}). Utilisez 'Garçon' ou 'Fille'.` });
        continue;
      }

      // Duplicate check: matching matricule (if provided) OR matching Nom and Prénom in this class
      const isDup = existingInClass.some(e => {
        if (raw.matricule && e.matricule && e.matricule.trim().toLowerCase() === raw.matricule.trim().toLowerCase()) {
          return true;
        }
        return e.nom.toUpperCase() === nom && e.prenom.toLowerCase() === prenom.toLowerCase();
      });

      if (isDup) {
        duplicates.push({ nom, prenom, matricule: raw.matricule || '', reason: "Déjà inscrit dans cette classe ou matricule identique." });
        continue;
      }

      const newStudent = {
        id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        nom: nom,
        prenom: prenom,
        genre: genre,
        matricule: (raw.matricule || '').trim(),
        classeId: targetClass.id,
        classeNom: targetClass.nom,
        classe: targetClass.niveau,
        professeurId: targetClass.professeurId || this.currentProfesseurId,
        createdAt: new Date().toISOString()
      };

      this.eleves.push(newStudent);
      added.push(newStudent);
      existingInClass.push(newStudent);
    }

    this.saveLocalAll();

    // Supabase batch insert
    const sb = SupabaseManager.getClient();
    if (sb && added.length > 0) {
      try {
        await sb.from('eleves').insert(added.map(e => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          classe: e.classe,
          genre: e.genre,
          classe_id: e.classeId,
          professeur_id: e.professeurId,
          matricule: e.matricule || null
        })));
      } catch (e) {
        console.warn("Supabase batch insert notice:", e);
      }
    }

    return { added, duplicates, errors };
  }

  async updateEleve(id, updatedData) {
    const idx = this.eleves.findIndex(e => e.id === id);
    if (idx < 0) return null;

    // Security check
    if (this.eleves[idx].professeurId && this.eleves[idx].professeurId !== this.currentProfesseurId) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à modifier cet élève.");
    }

    if (updatedData.classeId && updatedData.classeId !== this.eleves[idx].classeId) {
      const cls = this.getClassById(updatedData.classeId);
      if (cls) {
        updatedData.classeNom = cls.nom;
        updatedData.classe = cls.niveau;
      }
    }

    this.eleves[idx] = { ...this.eleves[idx], ...updatedData };
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('eleves').update({
          nom: this.eleves[idx].nom,
          prenom: this.eleves[idx].prenom,
          classe: this.eleves[idx].classe,
          genre: this.eleves[idx].genre,
          classe_id: this.eleves[idx].classeId || null,
          matricule: this.eleves[idx].matricule || null
        }).eq('id', id);
      } catch (e) {
        console.warn("Supabase update eleve notice:", e);
      }
    }

    return this.eleves[idx];
  }

  async deleteEleve(id) {
    const idx = this.eleves.findIndex(e => e.id === id);
    if (idx < 0) return false;

    // Security check
    if (this.eleves[idx].professeurId && this.eleves[idx].professeurId !== this.currentProfesseurId) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à supprimer cet élève.");
    }

    // Safely remove student from class roster while keeping historical evaluation records intact
    this.eleves.splice(idx, 1);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('eleves').delete().eq('id', id);
      } catch (e) {
        console.warn("Supabase delete eleve notice:", e);
      }
    }
    return true;
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

    const noEngin = list.find(b => !b.engin);
    if (noEngin) return noEngin;

    return null;
  }

  async saveBareme(baremeData) {
    if (!baremeData.id) {
      baremeData.id = 'bar_' + Date.now();
    }

    const idx = this.baremes.findIndex(b => b.id === baremeData.id);
    if (idx >= 0) {
      this.baremes[idx] = baremeData;
    } else {
      this.baremes.push(baremeData);
    }
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('baremes').upsert({
          id: baremeData.id,
          discipline: baremeData.discipline,
          engin: baremeData.engin || null,
          classe: baremeData.classe,
          genre: baremeData.genre,
          type: baremeData.type || 'distance',
          grille: baremeData.grille || []
        });
      } catch (e) {
        console.warn("Offline fallback for bareme upsert:", e);
      }
    }

    return baremeData;
  }

  // --- EVALUATIONS CRUD ---
  getEvaluations(filterDiscipline = null, filterClasse = null, profId = null) {
    const targetProf = profId || this.currentProfesseurId;
    let list = this.evaluations.filter(ev => ev.professeurId === targetProf || (!ev.professeurId && targetProf === 'prof_default'));

    if (filterDiscipline && filterDiscipline !== 'ALL') {
      const discTarget = filterDiscipline.trim().toLowerCase();
      list = list.filter(ev => (ev.discipline || '').trim().toLowerCase() === discTarget);
    }

    if (filterClasse && filterClasse !== 'ALL') {
      list = list.filter(ev =>
        ev.classeId === filterClasse ||
        ev.classeNom === filterClasse ||
        ev.classe === filterClasse
      );
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async addEvaluation(evaluation) {
    if (!evaluation.id) {
      evaluation.id = 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    }
    if (!evaluation.date) {
      evaluation.date = new Date().toISOString();
    }
    if (!evaluation.professeurId) {
      evaluation.professeurId = this.currentProfesseurId;
    }
    if (evaluation.distance === undefined && evaluation.performance !== undefined) {
      evaluation.distance = evaluation.performance;
    }

    // Format performance with proper unit if not present
    if (!evaluation.performanceFormatted) {
      const isTime = EPSEngine.isTimeDiscipline(evaluation.discipline);
      evaluation.performanceFormatted = EPSEngine.formatPerformance(evaluation.distance, isTime, evaluation.discipline);
    }

    this.evaluations.unshift(evaluation);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('evaluations').insert({
          id: evaluation.id,
          eleve_id: evaluation.eleveId || null,
          eleve_nom: evaluation.eleveNom,
          discipline: evaluation.discipline,
          engin: evaluation.engin || null,
          classe: evaluation.classe,
          genre: evaluation.genre,
          distance: evaluation.distance,
          note: evaluation.note,
          evaluation_date: evaluation.date,
          professeur_id: evaluation.professeurId,
          classe_id: evaluation.classeId || null
        });
      } catch (e) {
        console.warn("Supabase insert evaluation notice:", e);
      }
    }

    return evaluation;
  }

  async deleteEvaluation(id) {
    const idx = this.evaluations.findIndex(ev => ev.id === id);
    if (idx < 0) return false;

    // Security check
    if (this.evaluations[idx].professeurId && this.evaluations[idx].professeurId !== this.currentProfesseurId) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à supprimer cette évaluation.");
    }

    this.evaluations.splice(idx, 1);
    this.saveLocalAll();

    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        await sb.from('evaluations').delete().eq('id', id);
      } catch (e) {
        console.warn("Offline delete notice:", e);
      }
    }
    return true;
  }

  // --- EXPORT & IMPORT ---
  exportDatabase() {
    return JSON.stringify({
      version: '3.0-multi-prof',
      exportedAt: new Date().toISOString(),
      professeurs: this.professeurs,
      classes: this.classes,
      eleves: this.eleves,
      evaluations: this.evaluations,
      baremes: this.baremes
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
