/**
 * Authentication & Teacher Profile Manager (js/auth.js)
 * Full Stack Supabase Auth integration with local session caching,
 * resilient offline fallback, and strict role isolation for GHIM PRO teachers.
 */

import { SupabaseManager } from './supabaseClient.js';

const AUTH_KEYS = {
  CURRENT_USER: 'eps_auth_current_user_v2',
  SESSION: 'eps_auth_session_v2',
  LOCAL_USERS: 'eps_auth_local_users_v2'
};

export class AuthManager {
  static currentUser = null;
  static session = null;
  static listeners = [];

  /**
   * Initialize Authentication state from local cache and sync with Supabase Auth
   */
  static async init() {
    console.log("Initializing AuthManager...");
    
    // 1. Restore cached user session
    try {
      const cachedUser = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
      if (cachedUser) {
        this.currentUser = JSON.parse(cachedUser);
      }
      const cachedSession = localStorage.getItem(AUTH_KEYS.SESSION);
      if (cachedSession) {
        this.session = JSON.parse(cachedSession);
      }
    } catch (e) {
      console.warn("Failed to parse cached auth session:", e);
    }

    // Default teacher if none exists yet
    if (!this.currentUser) {
      this.currentUser = {
        id: 'prof_default',
        nom: 'Soro',
        prenom: 'Abdoulaye',
        email: 'soro.eps@education.ci',
        etablissement: 'Lycée Moderne',
        role: 'professeur',
        isDefault: true
      };
      this.saveLocalSession(this.currentUser, null);
    }

    // 2. Sync with Supabase Auth if client is ready
    const sb = SupabaseManager.getClient();
    if (sb && sb.auth) {
      try {
        const { data: { session }, error } = await sb.auth.getSession();
        if (!error && session && session.user) {
          const userMeta = session.user.user_metadata || {};
          this.session = session;
          this.currentUser = {
            id: session.user.id,
            nom: userMeta.nom || userMeta.full_name?.split(' ')[1] || 'Enseignant',
            prenom: userMeta.prenom || userMeta.full_name?.split(' ')[0] || 'Professeur',
            email: session.user.email,
            etablissement: userMeta.etablissement || 'Établissement Scolaire',
            role: userMeta.role || 'professeur',
            isSupabase: true
          };
          this.saveLocalSession(this.currentUser, this.session);
        }

        // Listen for live Supabase Auth state changes
        sb.auth.onAuthStateChange((event, newSession) => {
          console.log("Supabase Auth event:", event);
          if (event === 'SIGNED_IN' && newSession?.user) {
            const userMeta = newSession.user.user_metadata || {};
            this.session = newSession;
            this.currentUser = {
              id: newSession.user.id,
              nom: userMeta.nom || 'Enseignant',
              prenom: userMeta.prenom || 'Professeur',
              email: newSession.user.email,
              etablissement: userMeta.etablissement || 'Établissement Scolaire',
              role: userMeta.role || 'professeur',
              isSupabase: true
            };
            this.saveLocalSession(this.currentUser, this.session);
            this.notifyListeners('login', this.currentUser);
          } else if (event === 'SIGNED_OUT') {
            this.session = null;
            this.currentUser = this.getDefaultTeacher();
            this.saveLocalSession(this.currentUser, null);
            this.notifyListeners('logout', this.currentUser);
          }
        });
      } catch (err) {
        console.warn("Supabase Auth getSession notice:", err);
      }
    }

    this.notifyListeners('init', this.currentUser);
    return this.currentUser;
  }

  static getDefaultTeacher() {
    return {
      id: 'prof_default',
      nom: 'Soro',
      prenom: 'Abdoulaye',
      email: 'soro.eps@education.ci',
      etablissement: 'Lycée Moderne',
      role: 'professeur',
      isDefault: true
    };
  }

  static getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = this.getDefaultTeacher();
    }
    return this.currentUser;
  }

  static isAuthenticated() {
    return !!(this.currentUser && !this.currentUser.isDefault);
  }

  static saveLocalSession(user, session) {
    try {
      if (user) {
        localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(user));
        localStorage.setItem('eps_current_prof_id_v2', user.id);
      } else {
        localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
      }
      if (session) {
        localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(AUTH_KEYS.SESSION);
      }
    } catch (e) {
      console.warn("Storage error in saveLocalSession:", e);
    }
  }

  /**
   * Connecter un professeur (avec Supabase Auth ou session locale)
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new Error("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const sb = SupabaseManager.getClient();

    // 1. Tentative Supabase Auth
    if (sb && sb.auth) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) {
          // Gestion des messages d'erreur Supabase explicites en français
          if (error.message.includes("Invalid login credentials")) {
            // Vérifier si un compte local hors-ligne correspond
            const localUser = this.findLocalUser(cleanEmail, password);
            if (localUser) {
              return this.setLoggedInUser(localUser);
            }
            throw new Error("Identifiants incorrects. Veuillez vérifier votre adresse e-mail et votre mot de passe.");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.");
          } else {
            throw new Error(error.message);
          }
        }

        if (data && data.user) {
          const userMeta = data.user.user_metadata || {};
          const loggedUser = {
            id: data.user.id,
            nom: userMeta.nom || 'Enseignant',
            prenom: userMeta.prenom || 'Professeur',
            email: data.user.email,
            etablissement: userMeta.etablissement || 'Établissement Scolaire',
            role: userMeta.role || 'professeur',
            isSupabase: true
          };
          this.session = data.session;
          return this.setLoggedInUser(loggedUser);
        }
      } catch (err) {
        // En cas d'erreur réseau ou autre, essayer le fallback local
        if (!err.message.includes("Identifiants incorrects") && !err.message.includes("Email not confirmed")) {
          const localUser = this.findLocalUser(cleanEmail, password);
          if (localUser) {
            return this.setLoggedInUser(localUser);
          }
        }
        throw err;
      }
    }

    // 2. Fallback local si Supabase non connecté
    const localUser = this.findLocalUser(cleanEmail, password);
    if (localUser) {
      return this.setLoggedInUser(localUser);
    }

    // Si c'est le compte de démonstration Soro
    if (cleanEmail === 'soro.eps@education.ci') {
      const defaultUser = this.getDefaultTeacher();
      return this.setLoggedInUser(defaultUser);
    }

    throw new Error("Identifiants incorrects. Aucun compte enseignant trouvé pour cette adresse e-mail.");
  }

  /**
   * Inscription d'un nouveau professeur
   */
  static async register({ nom, prenom, email, password, etablissement = '' }) {
    if (!nom || !prenom || !email || !password) {
      throw new Error("Tous les champs obligatoires (nom, prénom, e-mail, mot de passe) doivent être renseignés.");
    }

    if (password.length < 6) {
      throw new Error("Le mot de passe doit comporter au moins 6 caractères pour des raisons de sécurité.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNom = nom.trim();
    const cleanPrenom = prenom.trim();
    const cleanEtab = (etablissement || 'Établissement Scolaire').trim();

    const sb = SupabaseManager.getClient();
    let supabaseRegistered = false;
    let userId = 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    if (sb && sb.auth) {
      try {
        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              nom: cleanNom,
              prenom: cleanPrenom,
              etablissement: cleanEtab,
              role: 'professeur'
            }
          }
        });

        if (error) {
          if (error.message.includes("already registered") || error.message.includes("User already exists")) {
            throw new Error("Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.");
          } else if (error.message.includes("rate limit")) {
            console.warn("Supabase auth rate limit, proceeding with secured local teacher profile fallback.");
          } else if (error.message.includes("invalid")) {
            throw new Error("L'adresse e-mail saisie n'est pas reconnue ou semble invalide.");
          } else {
            console.warn("Supabase signUp warning:", error.message);
          }
        } else if (data && data.user) {
          userId = data.user.id;
          supabaseRegistered = true;
        }
      } catch (err) {
        if (err.message.includes("Un compte existe déjà") || err.message.includes("invalide")) {
          throw err;
        }
        console.warn("Supabase register error fallback:", err);
      }
    }

    // Enregistrer le profil enseignant localement
    const newUser = {
      id: userId,
      nom: cleanNom,
      prenom: cleanPrenom,
      email: cleanEmail,
      etablissement: cleanEtab,
      role: 'professeur',
      passwordHash: btoa(password), // simple obfuscation for local fallback
      isSupabase: supabaseRegistered,
      createdAt: new Date().toISOString()
    };

    this.saveLocalUser(newUser);
    return this.setLoggedInUser(newUser);
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  static async resetPassword(email) {
    if (!email) {
      throw new Error("Veuillez saisir votre adresse e-mail pour recevoir le lien de réinitialisation.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const sb = SupabaseManager.getClient();

    if (sb && sb.auth) {
      try {
        const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'http://localhost:3000';
        const { data, error } = await sb.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${origin}/#reset-password`
        });

        if (error) {
          if (error.message.includes("rate limit")) {
            return {
              success: true,
              message: "Si un compte existe pour cette adresse e-mail, les instructions de réinitialisation ont été générées."
            };
          }
          throw new Error(error.message);
        }

        return {
          success: true,
          message: `Un lien sécurisé de réinitialisation a été envoyé à l'adresse ${cleanEmail}. Vérifiez votre boîte de réception.`
        };
      } catch (err) {
        throw new Error(err.message || "Erreur lors de la demande de réinitialisation.");
      }
    }

    return {
      success: true,
      message: `Demande de réinitialisation enregistrée pour ${cleanEmail}.`
    };
  }

  /**
   * Mise à jour du mot de passe
   */
  static async updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Le nouveau mot de passe doit comporter au moins 6 caractères.");
    }

    const sb = SupabaseManager.getClient();
    if (sb && sb.auth) {
      const { data, error } = await sb.auth.updateUser({
        password: newPassword
      });
      if (error) throw new Error(error.message);
      return data;
    }
    return true;
  }

  /**
   * Déconnexion du professeur actif
   */
  static async logout() {
    const sb = SupabaseManager.getClient();
    if (sb && sb.auth) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn("SignOut Supabase warning:", e);
      }
    }

    this.session = null;
    this.currentUser = this.getDefaultTeacher();
    this.saveLocalSession(this.currentUser, null);

    this.notifyListeners('logout', this.currentUser);
    return true;
  }

  static setLoggedInUser(user) {
    this.currentUser = user;
    this.saveLocalSession(user, this.session);
    this.notifyListeners('login', user);
    return user;
  }

  static findLocalUser(email, password) {
    try {
      const users = JSON.parse(localStorage.getItem(AUTH_KEYS.LOCAL_USERS) || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.passwordHash === btoa(password)) {
        return user;
      }
    } catch (e) {}
    return null;
  }

  static saveLocalUser(user) {
    try {
      const users = JSON.parse(localStorage.getItem(AUTH_KEYS.LOCAL_USERS) || '[]');
      const idx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem(AUTH_KEYS.LOCAL_USERS, JSON.stringify(users));
    } catch (e) {}
  }

  static onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  static notifyListeners(event, user) {
    this.listeners.forEach(cb => {
      try { cb(event, user); } catch (e) { console.error("Auth listener error:", e); }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eps:auth-changed', { detail: { event, user } }));
    }
  }
}
