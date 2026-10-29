/**
 * EPS Database Manager (js/db.js)
 * Full Stack Supabase integration with PostgreSQL cloud persistence,
 * optimistic local caching, multi-professeur data isolation, and classes management.
 */

import { SupabaseManager } from './supabaseClient.js';
import { EPSEngine } from './engine.js';
import { ImportEngine } from './importEngine.js';

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

export const OFFICIAL_CLASSES = [
  { id: 'Sixième', nom: 'Sixième', niveau: 'Sixième', ordre: 1, anneeScolaire: '2026-2027', description: 'Classe de 6ème', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Cinquième', nom: 'Cinquième', niveau: 'Cinquième', ordre: 2, anneeScolaire: '2026-2027', description: 'Classe de 5ème', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Quatrième', nom: 'Quatrième', niveau: 'Quatrième', ordre: 3, anneeScolaire: '2026-2027', description: 'Classe de 4ème', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Troisième', nom: 'Troisième', niveau: 'Troisième', ordre: 4, anneeScolaire: '2026-2027', description: 'Classe de 3ème', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Seconde', nom: 'Seconde', niveau: 'Seconde', ordre: 5, anneeScolaire: '2026-2027', description: 'Classe de 2nde', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Première', nom: 'Première', niveau: 'Première', ordre: 6, anneeScolaire: '2026-2027', description: 'Classe de 1ère', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'Terminale', nom: 'Terminale', niveau: 'Terminale', ordre: 7, anneeScolaire: '2026-2027', description: 'Classe de Terminale', professeurId: 'prof_default', createdAt: '2026-09-01T08:00:00.000Z' }
];

export const FAKE_CLASS_IDS = ['cls_3eA', 'cls_6e1', 'cls_2ndeB'];

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
    this.syncState = {
      status: 'idle',
      lastSynced: null,
      error: null,
      classesCount: 0,
      elevesCount: 0,
      evaluationsCount: 0
    };
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
        this.syncState.status = 'syncing';
        await this.syncFromSupabase();
        this.setupRealtime();
      } else {
        console.warn("Operating in offline cache mode.");
        this.syncState.status = 'offline';
        this.syncState.error = "Mode Hors-ligne : connexion à Supabase impossible.";
        if (this.baremes.length === 0) {
          await this.seedDefaultsLocally();
        }
      }
    } catch (err) {
      console.error("Database initialization error:", err);
      this.syncState.status = 'error';
      this.syncState.error = err.message || "Erreur de connexion à Supabase";
      if (this.baremes.length === 0) {
        await this.seedDefaultsLocally();
      }
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eps:db-ready', { detail: { baremesCount: this.baremes.length } }));
        window.dispatchEvent(new CustomEvent('eps:sync-status', { detail: this.syncState }));
      }
    } catch (e) {}
  }

  /**
   * Sync all tables from Supabase PostgreSQL
   */
  async syncFromSupabase() {
    const sb = SupabaseManager.getClient();
    if (!sb) {
      this.syncState = {
        status: 'offline',
        lastSynced: this.syncState.lastSynced || null,
        error: "Client Supabase non initialisé."
      };
      return;
    }

    try {
      // 1. Fetch Classes
      const { data: clsData, error: clsErr } = await sb
        .from('classes')
        .select('*');

      if (!clsErr && clsData && clsData.length > 0) {
        const fetchedClasses = clsData.map(row => ({
          id: row.id,
          nom: row.nom,
          niveau: row.niveau || row.cycle || EPSEngine.normalizeNiveau(row.nom),
          ordre: typeof row.ordre === 'number' ? row.ordre : 10,
          anneeScolaire: row.annee_scolaire || '2026-2027',
          description: row.description || '',
          professeurId: row.professeur_id || 'prof_default',
          createdAt: row.created_at || new Date().toISOString()
        }));

        // Sort by official order
        fetchedClasses.sort((a, b) => (a.ordre || 10) - (b.ordre || 10));

        // Purge any lingering fake mock classes
        const cleanExisting = this.classes.filter(c => 
          !FAKE_CLASS_IDS.includes(c.id) && 
          !fetchedClasses.some(f => f.id === c.id)
        );

        this.classes = [...fetchedClasses, ...cleanExisting];
        localStorage.setItem(DB_KEYS.CLASSES, JSON.stringify(this.classes));
      }

      // 2. Fetch Eleves
      const { data: elData, error: elErr } = await sb
        .from('eleves')
        .select('*');

      if (!elErr && elData && elData.length > 0) {
        const fetchedEleves = elData.map(row => {
          const rawClass = row.classe || '';
          const matchCls = this.classes.find(c => 
            c.id === rawClass || 
            c.nom === rawClass || 
            c.niveau === rawClass ||
            (c.nom && rawClass && EPSEngine.normalizeNiveau(c.nom).toLowerCase() === EPSEngine.normalizeNiveau(rawClass).toLowerCase())
          );

          return {
            id: row.id,
            nom: (row.nom || '').trim(),
            prenom: (row.prenom || '').trim(),
            genre: row.genre,
            classe: matchCls ? matchCls.niveau : rawClass,
            classeId: matchCls ? matchCls.id : (row.classe_id || rawClass),
            classeNom: matchCls ? matchCls.nom : rawClass,
            matricule: row.matricule || '',
            professeurId: row.professeur_id || 'prof_default'
          };
        });

        // Filter out any potential mock students from local cache
        const cleanExisting = this.eleves.filter(e => 
          !['BERNARD Lucas', 'TOURE Aminata Fake'].includes(`${e.nom} ${e.prenom}`) &&
          !fetchedEleves.some(f => f.id === e.id)
        );

        this.eleves = [...fetchedEleves, ...cleanExisting];
        localStorage.setItem(DB_KEYS.ELEVES, JSON.stringify(this.eleves));
      }

      // 3. Fetch Evaluations
      const { data: evData, error: evErr } = await sb
        .from('evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });

      if (!evErr && evData && evData.length > 0) {
        this.evaluations = evData.map(row => {
          const disc = this.normalizeDisciplineName(row.discipline);
          const isTime = EPSEngine.isTimeDiscipline(disc);
          const distNum = parseFloat(row.distance);
          const rawClass = row.classe || '';
          const matchCls = this.classes.find(c => 
            c.id === rawClass || 
            c.nom === rawClass || 
            c.niveau === rawClass ||
            (c.nom && rawClass && EPSEngine.normalizeNiveau(c.nom).toLowerCase() === EPSEngine.normalizeNiveau(rawClass).toLowerCase())
          );

          return {
            id: row.id,
            eleveId: row.eleve_id,
            eleveNom: row.eleve_nom,
            discipline: disc,
            engin: row.engin,
            classe: matchCls ? matchCls.niveau : rawClass,
            classeId: matchCls ? matchCls.id : (row.classe_id || rawClass),
            classeNom: matchCls ? matchCls.nom : rawClass,
            genre: row.genre,
            distance: distNum,
            note: parseFloat(row.note),
            date: row.evaluation_date,
            professeurId: row.professeur_id || 'prof_default',
            performanceFormatted: EPSEngine.formatPerformance(distNum, isTime, disc)
          };
        });
        localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(this.evaluations));
      }

      // 4. Fetch Baremes (Official Ministerial Reference Scales)
      const { data: barData, error: barErr } = await sb
        .from('baremes')
        .select('*');

      if (!barErr && barData && barData.length > 0) {
        const fetchedOfficialBaremes = barData
          .filter(b => !b.discipline.toLowerCase().includes("haies") && b.discipline !== "Course 60m / 80m")
          .map(row => ({
            id: row.id,
            discipline: this.normalizeDisciplineName(row.discipline),
            engin: row.engin || null,
            classe: row.classe,
            genre: row.genre,
            type: row.type || 'distance',
            grille: row.grille || [],
            isOfficial: true,
            professeurId: null,
            nom: row.nom || `Barème Officiel — ${row.discipline}${row.engin ? ' (' + row.engin + ')' : ''} (${row.classe} ${row.genre})`,
            createdAt: row.created_at || new Date().toISOString()
          }));

        // Preserve existing custom teacher scales
        const localCustomBaremes = this.baremes.filter(b => b.isOfficial === false && b.professeurId);
        this.baremes = [...fetchedOfficialBaremes, ...localCustomBaremes];
        localStorage.setItem(DB_KEYS.BAREMES, JSON.stringify(this.baremes));
      }

      this.saveLocalAll();

      this.syncState = {
        status: 'synced',
        lastSynced: new Date().toISOString(),
        error: null,
        classesCount: this.classes.length,
        elevesCount: this.eleves.length,
        evaluationsCount: this.evaluations.length
      };

      console.log(`Supabase Sync complete: ${this.classes.length} classes, ${this.eleves.length} élèves, ${this.evaluations.length} évaluations, ${this.baremes.length} barèmes.`);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eps:db-synced', { detail: { count: this.evaluations.length } }));
        window.dispatchEvent(new CustomEvent('eps:sync-status', { detail: this.syncState }));
      }
    } catch (e) {
      console.warn("Failed to complete full sync from Supabase:", e);
      this.syncState = {
        status: 'error',
        lastSynced: this.syncState.lastSynced || null,
        error: e.message || "Erreur de communication avec la base de données Supabase."
      };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eps:sync-status', { detail: this.syncState }));
      }
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
            const disc = this.normalizeDisciplineName(row.discipline);
            const isTime = EPSEngine.isTimeDiscipline(disc);
            const distNum = parseFloat(row.distance);
            const item = {
              id: row.id,
              eleveId: row.eleve_id,
              eleveNom: row.eleve_nom,
              discipline: disc,
              engin: row.engin,
              classe: row.classe,
              classeId: row.classe_id || null,
              genre: row.genre,
              distance: distNum,
              note: parseFloat(row.note),
              date: row.evaluation_date,
              professeurId: row.professeur_id || 'prof_default',
              performanceFormatted: EPSEngine.formatPerformance(distNum, isTime, disc)
            };
            if (!this.evaluations.find(e => e.id === item.id)) {
              this.evaluations.unshift(item);
              this.saveLocalAll();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('eps:db-synced', { detail: { newEval: item } }));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            this.evaluations = this.evaluations.filter(e => e.id !== payload.old.id);
            this.saveLocalAll();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('eps:db-synced'));
            }
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
      const storedBaremes = (JSON.parse(localStorage.getItem(DB_KEYS.BAREMES) || '[]'))
        .filter(b => !b.discipline.toLowerCase().includes("haies") && b.discipline !== "Course 60m / 80m");

      this.baremes = storedBaremes.map(b => {
        const isOfficial = b.isOfficial !== false && !b.professeurId;
        return {
          ...b,
          discipline: this.normalizeDisciplineName(b.discipline),
          isOfficial: isOfficial,
          professeurId: isOfficial ? null : (b.professeurId || this.currentProfesseurId),
          nom: b.nom || (isOfficial ? `Barème Officiel — ${b.discipline}${b.engin ? ' (' + b.engin + ')' : ''} (${b.classe} ${b.genre})` : 'Barème personnalisé')
        };
      });
      
      this.cachedDisciplines = (JSON.parse(localStorage.getItem(DB_KEYS.DISCIPLINES) || '[]'))
        .filter(d => !d.nom.toLowerCase().includes("haies") && d.nom !== "Course 60m / 80m");

      // Load Professeurs (default to active teacher)
      this.professeurs = JSON.parse(localStorage.getItem(DB_KEYS.PROFESSEURS) || '[]');
      if (this.professeurs.length === 0 || this.professeurs.some(p => p.id === 'prof_toure')) {
        this.professeurs = [
          { id: 'prof_default', nom: 'M. Soro', prenom: 'Abdoulaye', email: 'soro.eps@education.ci', etablissement: 'Lycée Moderne', role: 'Enseignant EPS' }
        ];
      }
      this.currentProfesseurId = localStorage.getItem(DB_KEYS.CURRENT_PROF) || 'prof_default';

      // Load Classes & purge any legacy mock classes
      const storedClasses = JSON.parse(localStorage.getItem(DB_KEYS.CLASSES) || '[]');
      this.classes = storedClasses.filter(c => !FAKE_CLASS_IDS.includes(c.id));

      if (this.classes.length === 0) {
        // Initialize with the standard official classes matching Supabase
        this.classes = JSON.parse(JSON.stringify(OFFICIAL_CLASSES));
      }

      // Load Eleves (with backward compatibility)
      let storedEleves = JSON.parse(localStorage.getItem(DB_KEYS.ELEVES) || '[]');
      if (storedEleves.length === 0) {
        storedEleves = JSON.parse(localStorage.getItem('eps_eleves_v1') || '[]');
      }
      
      this.eleves = storedEleves
        .filter(el => !['BERNARD Lucas', 'TOURE Aminata Fake'].includes(`${el.nom} ${el.prenom}`))
        .map(el => {
          const rawClass = el.classe || '';
          const matchCls = this.classes.find(c => 
            c.id === el.classeId || 
            c.id === rawClass || 
            c.nom === rawClass || 
            c.niveau === rawClass ||
            (c.nom && rawClass && EPSEngine.normalizeNiveau(c.nom).toLowerCase() === EPSEngine.normalizeNiveau(rawClass).toLowerCase())
          );
          return {
            id: el.id,
            nom: (el.nom || '').trim(),
            prenom: (el.prenom || '').trim(),
            genre: el.genre,
            classe: matchCls ? matchCls.niveau : (rawClass || 'Troisième'),
            classeId: matchCls ? matchCls.id : (el.classeId || rawClass || 'Troisième'),
            classeNom: matchCls ? matchCls.nom : (el.classeNom || rawClass || 'Troisième'),
            matricule: el.matricule || '',
            professeurId: el.professeurId || 'prof_default'
          };
        });

      // Load Evaluations (with backward compatibility)
      let storedEvals = JSON.parse(localStorage.getItem(DB_KEYS.EVALUATIONS) || '[]');
      if (storedEvals.length === 0) {
        storedEvals = JSON.parse(localStorage.getItem('eps_evaluations_v1') || '[]');
      }
      this.evaluations = storedEvals.map(ev => {
        const rawClass = ev.classe || '';
        const matchCls = this.classes.find(c => 
          c.id === ev.classeId || 
          c.id === rawClass || 
          c.nom === rawClass || 
          c.niveau === rawClass ||
          (c.nom && rawClass && EPSEngine.normalizeNiveau(c.nom).toLowerCase() === EPSEngine.normalizeNiveau(rawClass).toLowerCase())
        );
        return {
          ...ev,
          discipline: this.normalizeDisciplineName(ev.discipline),
          classe: matchCls ? matchCls.niveau : rawClass,
          classeId: matchCls ? matchCls.id : (ev.classeId || rawClass),
          classeNom: matchCls ? matchCls.nom : (ev.classeNom || rawClass),
          professeurId: ev.professeurId || 'prof_default'
        };
      });

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
      let defaultBaremes = [];
      if (typeof window !== 'undefined' && window.location && typeof fetch === 'function') {
        const res = await fetch('data/default_baremes.json');
        defaultBaremes = await res.json();
      } else {
        try {
          const fs = await import('fs');
          defaultBaremes = JSON.parse(fs.readFileSync('./data/default_baremes.json', 'utf8'));
        } catch (efs) {}
      }
      this.baremes = (defaultBaremes || []).map(b => ({
        ...b,
        discipline: this.normalizeDisciplineName(b.discipline),
        isOfficial: true,
        professeurId: null,
        nom: b.nom || `Barème Officiel — ${b.discipline}${b.engin ? ' (' + b.engin + ')' : ''} (${b.classe} ${b.genre})`
      }));
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

  getProfesseurByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.professeurs.find(p => p.email && p.email.trim().toLowerCase() === cleanEmail) || null;
  }

  setCurrentProfesseur(id, profData = null) {
    if (!id) return null;
    this.currentProfesseurId = id;
    localStorage.setItem(DB_KEYS.CURRENT_PROF, id);

    let p = this.professeurs.find(prof => prof.id === id);
    if (!p && profData && profData.email) {
      const existingByEmail = this.getProfesseurByEmail(profData.email);
      if (existingByEmail) {
        p = existingByEmail;
      }
    }
    if (!p) {
      p = profData || {
        id: id,
        nom: 'Enseignant',
        prenom: '',
        role: 'professeur'
      };
      this.professeurs.push(p);
      this.saveLocalAll();
    } else if (profData) {
      Object.assign(p, profData);
      this.saveLocalAll();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eps:prof-changed', { detail: { prof: p } }));
    }
    return p;
  }

  addProfesseur(data) {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (cleanEmail) {
      const existing = this.getProfesseurByEmail(cleanEmail);
      if (existing) {
        throw new Error(`Cette adresse e-mail est déjà associée à un compte. Connectez-vous ou utilisez la procédure de récupération de mot de passe.`);
      }
    }

    const newProf = {
      id: data.id || ('prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      nom: (data.nom || '').trim(),
      prenom: (data.prenom || '').trim(),
      email: cleanEmail,
      etablissement: (data.etablissement || 'Établissement Scolaire').trim(),
      telephone: (data.telephone || '').trim(),
      role: data.role || 'professeur',
      createdAt: new Date().toISOString()
    };
    this.professeurs.push(newProf);
    this.saveLocalAll();
    return newProf;
  }

  // --- CLASSES CRUD (« Mes classes ») ---
  getClasses(profId = null) {
    const targetProf = profId || this.currentProfesseurId;
    return this.classes.filter(c => 
      c.professeurId === targetProf || 
      (!c.professeurId && targetProf === 'prof_default') ||
      (OFFICIAL_CLASSES.some(oc => oc.id === c.id) && targetProf === 'prof_default')
    );
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
          ordre: 10
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
          nom: this.classes[idx].nom
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
    let list = this.eleves.filter(e => 
      e.professeurId === targetProf || 
      (!e.professeurId && targetProf === 'prof_default')
    );

    if (filterClasse && filterClasse !== 'ALL') {
      const targetCls = this.getClassById(filterClasse);
      if (targetCls) {
        return list.filter(e => e.classeId === filterClasse || e.classeId === targetCls.id);
      }

      const norm = EPSEngine.normalizeNiveau(filterClasse).toLowerCase();
      list = list.filter(e =>
        e.classeId === filterClasse ||
        e.classeNom === filterClasse ||
        e.classe === filterClasse ||
        (e.classe && EPSEngine.normalizeNiveau(e.classe).toLowerCase() === norm) ||
        (e.classeNom && EPSEngine.normalizeNiveau(e.classeNom).toLowerCase() === norm)
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
          genre: eleve.genre
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
   * @param {Array} elevesList - Liste des élèves { nom, prenom, genre, matricule, ... }
   * @param {string} classeId - Identifiant de la classe de destination
   * @param {Object} [options] - Options { allowDuplicates: boolean, chunkSize: number }
   * @returns {Promise<Object>} { added, duplicates, errors, failures, totalRequested, totalAdded }
   */
  async addElevesBatch(elevesList, classeId, options = {}) {
    const targetClass = this.getClassById(classeId);
    if (!targetClass) {
      throw new Error("Classe introuvable pour l'importation.");
    }

    const added = [];
    const duplicates = [];
    const errors = [];
    const failures = [];

    const existingInClass = this.getEleves(classeId, targetClass.professeurId);

    for (const raw of elevesList) {
      const nom = (raw.nom || '').trim().toUpperCase();
      const prenom = (raw.prenom || '').trim();
      
      // Normalisation exhaustive du genre (G, F, M, Garçon, Fille, Homme, Femme, etc.)
      const genre = ImportEngine.normalizeGenre(raw.genreNormalized || raw.genre);

      if (!nom || !prenom) {
        errors.push({ raw, reason: "Nom ou prénom manquant." });
        continue;
      }

      if (!genre) {
        errors.push({ raw, reason: `Genre non reconnu ("${raw.genre || 'vide'}"). Utilisez 'Garçon' ou 'Fille'.` });
        continue;
      }

      const matriculeClean = (raw.matricule || '').trim();

      // Duplicate check: matching matricule (if provided) OR matching Nom and Prénom in this class
      const isDup = existingInClass.some(e => {
        if (matriculeClean && e.matricule && e.matricule.trim().toLowerCase() === matriculeClean.toLowerCase()) {
          return true;
        }
        return e.nom.toUpperCase() === nom && e.prenom.toLowerCase() === prenom.toLowerCase();
      });

      if (isDup && !options.allowDuplicates) {
        duplicates.push({ nom, prenom, matricule: matriculeClean, reason: "Déjà inscrit dans cette classe ou matricule identique." });
        continue;
      }

      const newStudent = {
        id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        nom: nom,
        prenom: prenom,
        genre: genre,
        matricule: matriculeClean,
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

    // Supabase batch insert par lots sécurisés de 50 (évite les limites de payload HTTP ou les timeouts)
    const sb = SupabaseManager.getClient();
    if (sb && added.length > 0) {
      const CHUNK_SIZE = options.chunkSize || 50;
      for (let i = 0; i < added.length; i += CHUNK_SIZE) {
        const chunk = added.slice(i, i + CHUNK_SIZE);
        const payload = chunk.map(e => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          classe: e.classe,
          genre: e.genre,
          classe_id: e.classeId,
          professeur_id: e.professeurId,
          matricule: e.matricule || null
        }));

        try {
          const { error: sbErr } = await sb.from('eleves').insert(payload);
          if (sbErr) {
            console.warn("Avertissement insertion de lot Supabase, bascule en mode unitaire :", sbErr);
            // Si le lot de 50 échoue, on tente d'insérer individuellement chaque élève
            for (const item of payload) {
              try {
                const { error: singleErr } = await sb.from('eleves').insert(item);
                if (singleErr) {
                  failures.push({ student: item, error: singleErr.message });
                }
              } catch (unitErr) {
                failures.push({ student: item, error: unitErr.message });
              }
            }
          }
        } catch (e) {
          console.warn("Erreur réseau Supabase insert :", e);
        }
      }
    }

    return {
      added,
      duplicates,
      errors,
      failures,
      totalRequested: elevesList.length,
      totalAdded: added.length
    };
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
          genre: this.eleves[idx].genre
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
  normalizeDisciplineName(name) {
    if (!name) return "";
    const lower = name.trim().toLowerCase();
    if (lower.includes("60m") || lower.includes("60 mètres") || lower.includes("60 metres")) {
      return "Course de vitesse de 60 mètres";
    }
    if (lower.includes("80m") || lower.includes("80 mètres") || lower.includes("80 metres")) {
      return "Course de vitesse de 80m";
    }
    if (lower.includes("1000m") || lower.includes("1000 mètres")) {
      return "Course 1000m";
    }
    if (lower.includes("800m") || lower.includes("800 mètres")) {
      return "Course 800m";
    }
    if (lower.includes("poids")) {
      return "Lancer de poids";
    }
    if (lower.includes("hauteur")) {
      return "Saut en hauteur";
    }
    if (lower.includes("longueur")) {
      return "Saut en longueur";
    }
    if (lower.includes("triple")) {
      return "Triple saut";
    }
    if (lower.includes("disque")) {
      return "Lancer de disque";
    }
    if (lower.includes("javelot")) {
      return "Lancer de javelot";
    }
    return name.trim();
  }

  getDisciplines() {
    const list = [];
    const seen = new Map();

    (this.baremes || []).forEach(b => {
      if (!b.discipline) return;
      const normalized = this.normalizeDisciplineName(b.discipline);
      if (!seen.has(normalized)) {
        seen.set(normalized, new Set());
      }
      if (b.engin) {
        seen.get(normalized).add(b.engin);
      }
    });

    seen.forEach((enginsSet, nom) => {
      list.push({
        id: nom.toLowerCase().replace(/\s+/g, '_').replace('/', '_'),
        nom: nom,
        engins: Array.from(enginsSet)
      });
    });

    const cleaned = list.filter(d => {
      const n = (d.nom || '').toLowerCase();
      return !n.includes("haies") && d.nom !== "Course 60m / 80m";
    });

    const officialDefaults = [
      { id: "lancer_de_poids", nom: "Lancer de poids", engins: ["3kg", "4kg", "5kg"] },
      { id: "course_1000m", nom: "Course 1000m", engins: [] },
      { id: "course_800m", nom: "Course 800m", engins: [] },
      { id: "course_de_vitesse_de_60_metres", nom: "Course de vitesse de 60 mètres", engins: [] },
      { id: "saut_en_hauteur", nom: "Saut en hauteur", engins: [] },
      { id: "saut_en_longueur", nom: "Saut en longueur", engins: [] }
    ];

    if (cleaned.length === 0) {
      return officialDefaults;
    }

    // Merge any missing official disciplines
    officialDefaults.forEach(def => {
      if (!cleaned.some(c => c.nom.toLowerCase() === def.nom.toLowerCase())) {
        cleaned.push(def);
      }
    });

    return cleaned;
  }

  get disciplines() {
    return this.getDisciplines();
  }

  // --- BAREMES CRUD : SÉPARATION STRICTE OFFICIEL VS PERSONNALISÉ ---
  getBaremes() {
    return this.baremes;
  }

  /**
   * Retourne uniquement les barèmes officiels ministériels de référence
   */
  getOfficialBaremes(discipline = null, classe = null, genre = null) {
    let list = this.baremes.filter(b => b.isOfficial !== false && !b.professeurId);

    if (discipline && discipline !== 'ALL') {
      const disc = this.normalizeDisciplineName(discipline).toLowerCase();
      list = list.filter(b => this.normalizeDisciplineName(b.discipline).toLowerCase() === disc);
    }
    if (classe && classe !== 'ALL') {
      const cls = classe.trim().toLowerCase();
      list = list.filter(b => (b.classe || '').trim().toLowerCase() === cls);
    }
    if (genre && genre !== 'ALL') {
      const gnr = genre.trim().toLowerCase();
      list = list.filter(b => (b.genre || '').trim().toLowerCase() === gnr);
    }

    return list;
  }

  /**
   * Retourne uniquement les barèmes personnalisés d'un professeur
   */
  getCustomBaremes(profId = null, discipline = null, classe = null, genre = null) {
    const targetProf = profId || this.currentProfesseurId;
    let list = this.baremes.filter(b => b.isOfficial === false && b.professeurId === targetProf);

    if (discipline && discipline !== 'ALL') {
      const disc = this.normalizeDisciplineName(discipline).toLowerCase();
      list = list.filter(b => this.normalizeDisciplineName(b.discipline).toLowerCase() === disc);
    }
    if (classe && classe !== 'ALL') {
      const cls = classe.trim().toLowerCase();
      list = list.filter(b => (b.classe || '').trim().toLowerCase() === cls);
    }
    if (genre && genre !== 'ALL') {
      const gnr = genre.trim().toLowerCase();
      list = list.filter(b => (b.genre || '').trim().toLowerCase() === gnr);
    }

    return list;
  }

  /**
   * Trouve un barème par son ID unique (officiel ou personnalisé)
   */
  findBaremeById(id) {
    if (!id) return null;
    return this.baremes.find(b => b.id === id) || null;
  }

  /**
   * Trouve le barème officiel ministériel correspondant aux critères
   */
  findOfficialBareme(discipline, classe, genre, engin = null) {
    const list = this.getBaremesForCategory(discipline, classe, genre, null, true);
    if (!list || list.length === 0) return null;

    if (engin) {
      const eng = engin.trim().toLowerCase();
      const exact = list.find(b => b.engin && b.engin.trim().toLowerCase() === eng && (b.isOfficial !== false && !b.professeurId));
      if (exact) return exact;
    }

    const noEngin = list.find(b => !b.engin && (b.isOfficial !== false && !b.professeurId));
    if (noEngin) return noEngin;

    return list.find(b => b.isOfficial !== false && !b.professeurId) || list[0] || null;
  }

  /**
   * Recherche tous les barèmes applicables à une catégorie :
   * Le barème officiel en premier, suivi des barèmes personnalisés du professeur.
   */
  getBaremesForCategory(discipline, classe, genre, profId = null, officialOnly = false) {
    if (!discipline || !classe || !genre) return [];
    let disc = discipline.trim().toLowerCase();
    const cls = classe.trim().toLowerCase();
    const gnr = genre.trim().toLowerCase();
    const targetProf = profId || this.currentProfesseurId;

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

    let matching = (this.baremes || []).filter(b =>
      matchesDisc(b.discipline) &&
      (b.classe || '').trim().toLowerCase() === cls &&
      (b.genre || '').trim().toLowerCase() === gnr
    );

    if (officialOnly) {
      return matching.filter(b => b.isOfficial !== false && !b.professeurId);
    }

    // Filtrer : barème officiel + barèmes personnalisés du prof cible
    return matching.filter(b => (b.isOfficial !== false && !b.professeurId) || b.professeurId === targetProf);
  }

  /**
   * Recherche de barème pour le calcul ou l'affichage
   */
  findBareme(discipline, classe, genre, engin = null, customId = null, profId = null) {
    if (customId) {
      const custom = this.findBaremeById(customId);
      if (custom) return custom;
    }

    const list = this.getBaremesForCategory(discipline, classe, genre, profId);
    if (!list || list.length === 0) return null;

    if (engin) {
      const eng = engin.trim().toLowerCase();
      // Priorité 1: barème personnalisé du professeur pour cet engin
      const customMatch = list.find(b => !b.isOfficial && b.engin && b.engin.trim().toLowerCase() === eng);
      if (customMatch && !customId) return customMatch;

      // Priorité 2: barème officiel pour cet engin
      const exactOfficial = list.find(b => (b.isOfficial !== false && !b.professeurId) && b.engin && b.engin.trim().toLowerCase() === eng);
      if (exactOfficial) return exactOfficial;

      // Fallback: any matching engin
      const anyMatch = list.find(b => b.engin && b.engin.trim().toLowerCase() === eng);
      if (anyMatch) return anyMatch;
    }

    const officialDefault = list.find(b => (b.isOfficial !== false && !b.professeurId) && !b.engin) || list.find(b => (b.isOfficial !== false && !b.professeurId));
    if (officialDefault) return officialDefault;

    return list[0] || null;
  }

  /**
   * Sauvegarde d'un barème personnalisé avec PROTECTION ABSOLUE du barème officiel
   */
  async saveCustomBareme(baremeData, profId = null) {
    const targetProf = profId || this.currentProfesseurId;

    // PROTECTION CRITIQUE 1 : Interdiction formelle de modifier directement un barème officiel
    if (baremeData.isOfficial === true) {
      throw new Error("Action interdite : Le barème officiel est une référence ministérielle protégée et ne peut pas être modifié. Veuillez créer une copie personnalisée.");
    }

    const existingIdx = this.baremes.findIndex(b => b.id === baremeData.id);
    if (existingIdx >= 0) {
      const existing = this.baremes[existingIdx];
      if (existing.isOfficial === true) {
        throw new Error("Action interdite : Le barème officiel est une référence ministérielle protégée et ne peut pas être modifié. Veuillez créer une copie personnalisée.");
      }
      if (existing.professeurId && existing.professeurId !== targetProf) {
        throw new Error("Accès refusé : vous n'êtes pas autorisé à modifier ce barème personnalisé.");
      }
    }

    // Assurer les métadonnées de barème personnalisé
    const customBareme = {
      ...baremeData,
      id: baremeData.id || ('bar_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      isOfficial: false,
      professeurId: targetProf,
      nom: (baremeData.nom || 'Mon barème personnalisé').trim(),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      this.baremes[existingIdx] = customBareme;
    } else {
      this.baremes.push(customBareme);
    }

    this.saveLocalAll();
    return customBareme;
  }

  /**
   * Dupliquer un barème officiel ou existant en tant que barème personnalisé indépendant
   */
  duplicateBaremeAsCustom(sourceId, customName = null, profId = null) {
    const source = this.findBaremeById(sourceId);
    if (!source) {
      throw new Error("Barème source introuvable.");
    }

    const targetProf = profId || this.currentProfesseurId;
    const defaultName = customName || `Mon barème — ${source.discipline}${source.engin ? ' (' + source.engin + ')' : ''} (${source.classe} ${source.genre})`;

    const cloned = {
      id: 'bar_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      discipline: source.discipline,
      engin: source.engin || null,
      classe: source.classe,
      genre: source.genre,
      type: source.type || 'distance',
      grille: JSON.parse(JSON.stringify(source.grille || [])),
      isOfficial: false,
      professeurId: targetProf,
      parentBaremeId: source.id,
      nom: defaultName,
      createdAt: new Date().toISOString()
    };

    this.baremes.push(cloned);
    this.saveLocalAll();
    return cloned;
  }

  /**
   * Supprimer un barème personnalisé (interdiction formelle sur barème officiel)
   */
  deleteCustomBareme(baremeId, profId = null) {
    const idx = this.baremes.findIndex(b => b.id === baremeId);
    if (idx < 0) return false;

    const target = this.baremes[idx];
    if (target.isOfficial === true) {
      throw new Error("Action interdite : Les barèmes officiels ne peuvent pas être supprimés.");
    }

    const targetProf = profId || this.currentProfesseurId;
    if (target.professeurId && target.professeurId !== targetProf) {
      throw new Error("Accès refusé : vous n'êtes pas autorisé à supprimer ce barème.");
    }

    this.baremes.splice(idx, 1);
    this.saveLocalAll();
    return true;
  }

  /**
   * Méthode de compatibilité descendante avec garde-fou
   */
  async saveBareme(baremeData) {
    if (baremeData.isOfficial) {
      throw new Error("Action interdite : Le barème officiel est une référence ministérielle protégée et ne peut pas être modifié. Veuillez créer une copie personnalisée.");
    }
    return this.saveCustomBareme(baremeData);
  }

  // --- EVALUATIONS CRUD ---
  getEvaluations(filterDiscipline = null, filterClasse = null, profId = null) {
    const targetProf = profId || this.currentProfesseurId;
    let list = this.evaluations.filter(ev => 
      ev.professeurId === targetProf || 
      (!ev.professeurId && targetProf === 'prof_default')
    );

    if (filterDiscipline && filterDiscipline !== 'ALL') {
      const discTarget = this.normalizeDisciplineName(filterDiscipline).toLowerCase();
      list = list.filter(ev => this.normalizeDisciplineName(ev.discipline || '').toLowerCase() === discTarget);
    }

    if (filterClasse && filterClasse !== 'ALL') {
      const norm = EPSEngine.normalizeNiveau(filterClasse).toLowerCase();
      list = list.filter(ev =>
        ev.classeId === filterClasse ||
        ev.classeNom === filterClasse ||
        ev.classe === filterClasse ||
        (ev.classe && EPSEngine.normalizeNiveau(ev.classe).toLowerCase() === norm) ||
        (ev.classeNom && EPSEngine.normalizeNiveau(ev.classeNom).toLowerCase() === norm)
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

    // Normalize discipline name
    if (evaluation.discipline) {
      evaluation.discipline = this.normalizeDisciplineName(evaluation.discipline);
    }

    // Capture & fige l'instantané (snapshot) du barème utilisé pour protéger l'historique
    let usedBareme = null;
    if (evaluation.baremeId) {
      usedBareme = this.findBaremeById(evaluation.baremeId);
    }
    if (!usedBareme) {
      usedBareme = this.findBareme(evaluation.discipline, evaluation.classe, evaluation.genre, evaluation.engin);
    }

    evaluation.baremeId = usedBareme ? usedBareme.id : (evaluation.baremeId || 'bareme_officiel');
    evaluation.baremeNom = usedBareme ? (usedBareme.nom || (usedBareme.isOfficial ? 'Barème Officiel' : 'Barème Personnalisé')) : 'Barème Officiel';
    evaluation.baremeType = (usedBareme && usedBareme.isOfficial === false) ? 'personnalisé' : 'officiel';
    evaluation.baremeSnapshot = usedBareme ? {
      id: usedBareme.id,
      nom: usedBareme.nom,
      isOfficial: usedBareme.isOfficial !== false,
      type: usedBareme.type || 'distance',
      grille: JSON.parse(JSON.stringify(usedBareme.grille || []))
    } : null;

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
          evaluation_date: evaluation.date
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
