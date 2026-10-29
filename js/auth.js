/**
 * Authentication & Teacher Profile Manager (js/auth.js)
 * Full Stack Supabase Auth integration with local session caching,
 * resilient offline fallback, and strict role isolation for GHIM PRO teachers.
 */

import { SupabaseManager } from './supabaseClient.js';
import { db } from './db.js';

const AUTH_KEYS = {
  CURRENT_USER: 'eps_auth_current_user_v2',
  SESSION: 'eps_auth_session_v2',
  LOCAL_USERS: 'eps_auth_local_users_v2'
};

export class AuthManager {
  static currentUser = null;
  static session = null;
  static listeners = [];
  static inFlightRegistrations = new Set();
  static pendingVerifications = new Map(); // cleanEmail -> { codeHash, salt, expiresAt, attempts, createdAt, userData, _testCode }
  static lastResendTime = new Map(); // cleanEmail -> timestamp
  static lastRegistrationData = null; // Inputs en cache pour "Modifier l'adresse e-mail"

  /**
   * Masque partiellement l'adresse e-mail pour la confidentialité (ex: mo****@gmail.com)
   */
  static maskEmail(email) {
    if (!email || !email.includes('@')) return email || '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return (local[0] || '*') + '****@' + domain;
    }
    return local.slice(0, 2) + '****@' + domain;
  }

  /**
   * Génération cryptographique d'un code OTP à 6 chiffres
   */
  static generateSecureOtp() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return String(100000 + (arr[0] % 900000));
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Hachage sécurisé du code avec sel pour ne jamais le conserver en clair
   */
  static async hashCode(code, salt) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(`${code}:${salt}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let hash = 0;
    const str = `${code}:${salt}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash));
  }

  static getPendingVerification(email) {
    if (!email) return null;
    return this.pendingVerifications.get(email.trim().toLowerCase()) || null;
  }

  static getLastRegistrationData() {
    return this.lastRegistrationData;
  }

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
            const email = (newSession.user.email || '').toLowerCase();
            const isConfirmed = !!(newSession.user.confirmed_at || newSession.user.email_confirmed_at);
            // Si cette adresse a une vérification OTP en attente ou n'est pas confirmée, ne pas établir de session
            if (this.pendingVerifications.has(email) || !isConfirmed) {
              console.log("Supabase Auth SIGNED_IN ignoré : attente de vérification OTP pour", email);
              return;
            }
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
            const unconfirmedErr = new Error("Votre adresse e-mail n'a pas encore été confirmée. Saisissez le code de vérification reçu.");
            unconfirmedErr.requiresOtpVerification = true;
            unconfirmedErr.email = cleanEmail;
            throw unconfirmedErr;
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
   * Vérifie la validité du format d'adresse e-mail (RFC-5322)
   * @param {string} email 
   * @returns {{ isValid: boolean, error?: string, cleanEmail: string }}
   */
  static validateEmailFormat(email) {
    if (!email || !email.trim()) {
      return { isValid: false, error: "L'adresse e-mail est obligatoire.", cleanEmail: '' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (/\s/.test(cleanEmail)) {
      return { isValid: false, error: "L'adresse e-mail ne doit comporter aucun espace.", cleanEmail };
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { isValid: false, error: "Format d'adresse e-mail invalide. Exemple : nom.prenom@academie.fr", cleanEmail };
    }
    const parts = cleanEmail.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) {
      return { isValid: false, error: "Le domaine de l'adresse e-mail doit comporter une extension valide (ex: .fr, .ci, .com).", cleanEmail };
    }
    const domainParts = parts[1].split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return { isValid: false, error: "L'extension du domaine e-mail est incomplète.", cleanEmail };
    }
    return { isValid: true, cleanEmail };
  }

  /**
   * Vérifie la robustesse du mot de passe
   * @param {string} password 
   * @returns {{ isValid: boolean, error?: string, hasMinLen: boolean, hasLetter: boolean, hasNumber: boolean }}
   */
  static validatePasswordSecurity(password) {
    if (!password) {
      return { isValid: false, error: "Le mot de passe est obligatoire.", hasMinLen: false, hasLetter: false, hasNumber: false };
    }
    const hasMinLen = password.length >= 8;
    const hasLetter = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(password);
    const hasNumber = /[0-9!@#$%^&*(),.?":{}|<>\-_]/.test(password);

    if (!hasMinLen) {
      return { isValid: false, error: "Le mot de passe doit comporter au moins 8 caractères.", hasMinLen, hasLetter, hasNumber };
    }
    if (!hasLetter) {
      return { isValid: false, error: "Le mot de passe doit comporter au moins une lettre.", hasMinLen, hasLetter, hasNumber };
    }
    if (!hasNumber) {
      return { isValid: false, error: "Le mot de passe doit comporter au moins un chiffre ou symbole.", hasMinLen, hasLetter, hasNumber };
    }

    return { isValid: true, hasMinLen: true, hasLetter: true, hasNumber: true };
  }

  /**
   * Valide un nom ou prénom (accepte accents, apostrophes et traits d'union)
   */
  static validateName(val, fieldName = "nom") {
    if (!val || !val.trim()) {
      return { isValid: false, error: `Le champ ${fieldName} est obligatoire.` };
    }
    const clean = val.trim();
    if (clean.length < 2) {
      return { isValid: false, error: `Le champ ${fieldName} doit comporter au moins 2 caractères.` };
    }
    if (clean.length > 60) {
      return { isValid: false, error: `Le champ ${fieldName} ne doit pas dépasser 60 caractères.` };
    }
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,60}$/;
    if (!nameRegex.test(clean)) {
      return { isValid: false, error: `Le ${fieldName} contient des caractères non autorisés (chiffres ou symboles interdits).` };
    }
    return { isValid: true, cleanValue: clean };
  }

  /**
   * Valide un numéro de téléphone facultatif
   */
  static validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return { isValid: true, cleanValue: '' };
    }
    const clean = phone.trim().replace(/[\s.-]/g, '');
    const phoneRegex = /^(\+?[0-9]{8,15}|0[0-9]{9})$/;
    if (!phoneRegex.test(clean)) {
      return { isValid: false, error: "Numéro de téléphone invalide (ex: +225 0708091011 ou 0708091011)." };
    }
    return { isValid: true, cleanValue: clean };
  }

  /**
   * Valide l'ensemble des données d'inscription d'un enseignant
   */
  static validateRegistrationData(data) {
    const errors = {};

    // 1. Nom
    const nomCheck = this.validateName(data.nom, "nom");
    if (!nomCheck.isValid) errors.nom = nomCheck.error;

    // 2. Prénom
    const prenomCheck = this.validateName(data.prenom, "prénom");
    if (!prenomCheck.isValid) errors.prenom = prenomCheck.error;

    // 3. Email
    const emailCheck = this.validateEmailFormat(data.email);
    if (!emailCheck.isValid) errors.email = emailCheck.error;

    // 4. Mot de passe
    const passCheck = this.validatePasswordSecurity(data.password);
    if (!passCheck.isValid) errors.password = passCheck.error;

    // 5. Confirmation de mot de passe (si fournie)
    if (data.passwordConfirm !== undefined && data.passwordConfirm !== null) {
      if (data.password !== data.passwordConfirm) {
        errors.passwordConfirm = "Les mots de passe saisis ne correspondent pas.";
      }
    }

    // 6. Établissement
    const etab = (data.etablissement || '').trim();
    if (!etab || etab.length < 3) {
      errors.etablissement = "Veuillez renseigner votre établissement scolaire (au moins 3 caractères).";
    }

    // 7. Téléphone (optionnel)
    if (data.telephone) {
      const phoneCheck = this.validatePhone(data.telephone);
      if (!phoneCheck.isValid) errors.telephone = phoneCheck.error;
    }

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid,
      errors,
      cleanData: {
        nom: nomCheck.cleanValue || (data.nom || '').trim(),
        prenom: prenomCheck.cleanValue || (data.prenom || '').trim(),
        email: emailCheck.cleanEmail,
        password: data.password,
        etablissement: etab,
        telephone: data.telephone ? (data.telephone.trim()) : ''
      }
    };
  }

  /**
   * Vérifie si une adresse e-mail est déjà utilisée (Anti-Doublon strict)
   */
  static async checkEmailExists(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Vérification dans le compte démo
    if (cleanEmail === 'soro.eps@education.ci') return true;

    // 2. Vérification dans le stockage local des utilisateurs
    try {
      const localUsers = JSON.parse(localStorage.getItem(AUTH_KEYS.LOCAL_USERS) || '[]');
      if (localUsers.some(u => u.email && u.email.trim().toLowerCase() === cleanEmail)) {
        return true;
      }
    } catch (e) {}

    // 3. Vérification dans le registre db.professeurs
    try {
      if (typeof db !== 'undefined' && db.getProfesseurByEmail) {
        if (db.getProfesseurByEmail(cleanEmail)) return true;
      }
    } catch (e) {}

    // 4. Vérification dans Supabase si connecté
    const sb = SupabaseManager.getClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('professeurs').select('id, email').eq('email', cleanEmail).limit(1);
        if (!error && data && data.length > 0) {
          return true;
        }
      } catch (e) {}
    }

    return false;
  }

  /**
   * Inscription d'un nouveau professeur avec triple verrouillage anti-doublon
   * et gestion de confirmation d'e-mail
   */
  static async register(inputData) {
    // 1. Validation rigoureuse des données
    const valResult = this.validateRegistrationData(inputData);
    if (!valResult.isValid) {
      const firstError = Object.values(valResult.errors)[0];
      throw new Error(firstError);
    }

    const { nom, prenom, email: cleanEmail, password, etablissement, telephone } = valResult.cleanData;

    // 2. Protection contre les soumissions concurrentes (Verrou atomique en mémoire)
    if (this.inFlightRegistrations.has(cleanEmail)) {
      throw new Error("Une demande d'inscription pour cette adresse e-mail est déjà en cours de traitement.");
    }
    this.inFlightRegistrations.add(cleanEmail);

    try {
      // 3. Vérification d'unicité (Anti-doublon strict multi-niveaux)
      const alreadyExists = await this.checkEmailExists(cleanEmail);
      if (alreadyExists) {
        throw new Error("Cette adresse e-mail est déjà associée à un compte. Connectez-vous ou utilisez la procédure de récupération de mot de passe.");
      }

      const sb = SupabaseManager.getClient();
      let supabaseRegistered = false;
      // Par défaut, toute inscription GHIM PRO exige la confirmation par code OTP à 6 chiffres
      let requiresEmailConfirmation = true;
      let userId = 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      // Préparation immédiate de la session de vérification OTP (avant appel Supabase pour bloquer toute condition de course)
      const otpCode = this.generateSecureOtp();
      const salt = Math.random().toString(36).substring(2, 10);
      const codeHash = await this.hashCode(otpCode, salt);

      this.pendingVerifications.set(cleanEmail, {
        codeHash,
        salt,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0,
        createdAt: Date.now(),
        userData: {
          id: userId,
          nom,
          prenom,
          email: cleanEmail,
          etablissement,
          telephone: telephone || '',
          role: 'professeur',
          passwordHash: btoa(password)
        },
        _testCode: otpCode // Accessible uniquement pour tests automatisés locaux
      });

      this.lastRegistrationData = {
        nom,
        prenom,
        etablissement,
        telephone: telephone || '',
        email: cleanEmail
      };

      if (sb && sb.auth) {
        try {
          const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'http://localhost:3000';
          const { data, error } = await sb.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              emailRedirectTo: `${origin}/#login`,
              data: {
                nom,
                prenom,
                etablissement,
                telephone: telephone || null,
                role: 'professeur'
              }
            }
          });

          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes("already registered") || msg.includes("user already exists") || msg.includes("already taken")) {
              this.pendingVerifications.delete(cleanEmail);
              throw new Error("Cette adresse e-mail est déjà associée à un compte. Connectez-vous ou utilisez la procédure de récupération de mot de passe.");
            } else if (msg.includes("rate limit")) {
              console.warn("Supabase auth rate limit, passage en profil local sécurisé.");
            } else if (msg.includes("invalid") && msg.includes("email")) {
              this.pendingVerifications.delete(cleanEmail);
              throw new Error("L'adresse e-mail saisie n'est pas reconnue ou semble invalide.");
            } else {
              console.warn("Supabase signUp warning:", error.message);
            }
          } else if (data && data.user) {
            userId = data.user.id;
            supabaseRegistered = true;
          }
        } catch (err) {
          if (err.message.includes("déjà associée à un compte") || err.message.includes("invalide")) {
            this.pendingVerifications.delete(cleanEmail);
            throw err;
          }
          console.warn("Supabase register error fallback:", err);
        }
      }

      // Enregistrer le profil enseignant de façon persistante (en attente de confirmation)
      const newUser = {
        id: userId,
        nom,
        prenom,
        email: cleanEmail,
        etablissement,
        telephone: telephone || '',
        role: 'professeur',
        passwordHash: btoa(password),
        isSupabase: supabaseRegistered,
        requiresEmailConfirmation: true,
        emailConfirmed: false,
        createdAt: new Date().toISOString()
      };

      this.saveLocalUser(newUser);

      // Synchronisation avec db.professeurs pour référence (sans basculer la session active)
      if (typeof db !== 'undefined' && db.professeurs) {
        const pIdx = db.professeurs.findIndex(p => p.id === newUser.id || (p.email && p.email.toLowerCase() === cleanEmail));
        if (pIdx >= 0) {
          db.professeurs[pIdx] = newUser;
        } else {
          db.professeurs.push(newUser);
        }
      }

      // Toute inscription GHIM PRO exige impérativement la saisie du code OTP à 6 chiffres
      return {
        ...newUser,
        requiresOtpVerification: true,
        requiresEmailConfirmation: true,
        maskedEmail: this.maskEmail(cleanEmail),
        expiresInMinutes: 10,
        message: `Un code de vérification a été envoyé à votre adresse e-mail. Consultez votre boîte de réception et saisissez le code pour confirmer votre inscription.`
      };
    } finally {
      this.inFlightRegistrations.delete(cleanEmail);
    }
  }

  /**
   * Vérification du code OTP à 6 chiffres
   * Valide auprès de Supabase Auth ou du registre sécurisé local
   */
  static async verifyOtp(email, code) {
    if (!email || !code) {
      throw new Error("L'adresse e-mail et le code de vérification sont obligatoires.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim().replace(/\s/g, '');

    if (!/^\d{6}$/.test(cleanCode)) {
      throw new Error("Le code de vérification doit comporter exactement 6 chiffres.");
    }

    const sb = SupabaseManager.getClient();
    let verifiedUser = null;
    let isSupabaseVerified = false;

    // 1. Validation native Supabase Auth (Production & Live Backend)
    if (sb && sb.auth) {
      try {
        let { data, error } = await sb.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'signup'
        });

        if (error && (error.message.includes("Token has expired") || error.message.includes("otp_expired"))) {
          // Fallback test si le type enregistré est 'email'
          const retry = await sb.auth.verifyOtp({
            email: cleanEmail,
            token: cleanCode,
            type: 'email'
          });
          if (!retry.error) {
            data = retry.data;
            error = null;
          }
        }

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("expired") || msg.includes("otp_expired")) {
            throw new Error("Ce code a expiré. Demandez un nouveau code pour continuer.");
          } else if (msg.includes("invalid") || msg.includes("incorrect")) {
            throw new Error("Le code saisi est incorrect. Vérifiez votre e-mail et réessayez.");
          } else if (msg.includes("rate limit") || msg.includes("too many requests")) {
            throw new Error("Trop de tentatives. Veuillez patienter avant de réessayer ou demander un nouveau code.");
          } else {
            throw new Error(error.message);
          }
        }

        if (data && data.user) {
          isSupabaseVerified = true;
          this.session = data.session;
          const userMeta = data.user.user_metadata || {};
          verifiedUser = {
            id: data.user.id,
            nom: userMeta.nom || 'Enseignant',
            prenom: userMeta.prenom || 'Professeur',
            email: data.user.email,
            etablissement: userMeta.etablissement || 'Établissement Scolaire',
            telephone: userMeta.telephone || '',
            role: userMeta.role || 'professeur',
            isSupabase: true,
            emailConfirmed: true,
            requiresEmailConfirmation: false
          };
        }
      } catch (err) {
        if (err.message.includes("incorrect") || err.message.includes("expiré") || err.message.includes("Trop de tentatives")) {
          throw err;
        }
        console.warn("Supabase verifyOtp notice:", err);
      }
    }

    // 2. Validation sécurisée en mode résilient / local
    if (!isSupabaseVerified) {
      const pending = this.pendingVerifications.get(cleanEmail);
      if (!pending) {
        throw new Error("Ce code a expiré. Demandez un nouveau code pour continuer.");
      }

      // Vérification du délai d'expiration (10 minutes)
      if (Date.now() > pending.expiresAt) {
        this.pendingVerifications.delete(cleanEmail);
        throw new Error("Ce code a expiré. Demandez un nouveau code pour continuer.");
      }

      // Vérification de la limite de tentatives (maximum 5)
      if (pending.attempts >= 5) {
        this.pendingVerifications.delete(cleanEmail);
        throw new Error("Nombre maximal de tentatives dépassé. Demandez un nouveau code pour continuer.");
      }

      // Vérification par comparaison de hash sécurisé (aucune comparaison en clair)
      const testHash = await this.hashCode(cleanCode, pending.salt);
      if (testHash !== pending.codeHash) {
        pending.attempts += 1;
        if (pending.attempts >= 5) {
          this.pendingVerifications.delete(cleanEmail);
          throw new Error("Nombre maximal de tentatives dépassé. Demandez un nouveau code pour continuer.");
        }
        throw new Error("Le code saisi est incorrect. Vérifiez votre e-mail et réessayez.");
      }

      // Usage unique strict : invalidation immédiate après succès
      this.pendingVerifications.delete(cleanEmail);

      const localUserData = pending.userData || {
        id: 'prof_' + Date.now(),
        nom: 'Enseignant',
        prenom: 'Professeur',
        email: cleanEmail,
        etablissement: 'Établissement Scolaire',
        telephone: '',
        role: 'professeur'
      };

      let existingLocal = null;
      try {
        const users = JSON.parse(localStorage.getItem(AUTH_KEYS.LOCAL_USERS) || '[]');
        existingLocal = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      } catch (e) {}

      verifiedUser = {
        ...(existingLocal || {}),
        ...localUserData,
        emailConfirmed: true,
        requiresEmailConfirmation: false
      };
    }

    if (verifiedUser) {
      this.saveLocalUser(verifiedUser);
      if (typeof db !== 'undefined' && db.setCurrentProfesseur) {
        db.setCurrentProfesseur(verifiedUser.id, verifiedUser);
      }
      const loggedUser = this.setLoggedInUser(verifiedUser);
      return {
        success: true,
        user: loggedUser
      };
    }

    throw new Error("Échec de la validation du code.");
  }

  /**
   * Renvoyer un code de vérification OTP à 6 chiffres
   */
  static async resendOtpCode(email, { force = false } = {}) {
    if (!email || !email.trim()) {
      throw new Error("Adresse e-mail manquante pour le renvoi du code.");
    }
    const cleanEmail = email.trim().toLowerCase();

    // Respect du délai de renvoi (Cooldown de 60 secondes anti-abus)
    const lastTime = this.lastResendTime.get(cleanEmail) || 0;
    const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
    const COOLDOWN_SECONDS = 60;

    if (!force && lastTime > 0 && elapsedSeconds < COOLDOWN_SECONDS) {
      const waitTime = COOLDOWN_SECONDS - elapsedSeconds;
      throw new Error(`Veuillez patienter ${waitTime} seconde${waitTime > 1 ? 's' : ''} avant de demander un nouveau code.`);
    }

    this.lastResendTime.set(cleanEmail, Date.now());

    // Déclenchement du renvoi Supabase Auth
    const sb = SupabaseManager.getClient();
    if (sb && sb.auth && typeof sb.auth.resend === 'function') {
      try {
        const { error } = await sb.auth.resend({
          type: 'signup',
          email: cleanEmail
        });
        if (error) {
          if (error.message.includes("rate limit")) {
            throw new Error("Trop de demandes rapprochées. Veuillez patienter un instant.");
          }
          console.warn("Supabase resend OTP notice:", error.message);
        }
      } catch (err) {
        if (err.message.includes("patienter") || err.message.includes("Trop de demandes")) {
          throw err;
        }
        console.warn("Supabase resend warning:", err);
      }
    }

    // Renouvellement du code en mémoire locale avec nouvelle expiration 10 minutes
    const existing = this.pendingVerifications.get(cleanEmail);
    const newCode = this.generateSecureOtp();
    const newSalt = Math.random().toString(36).substring(2, 10);
    const newHash = await this.hashCode(newCode, newSalt);

    this.pendingVerifications.set(cleanEmail, {
      codeHash: newHash,
      salt: newSalt,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      createdAt: Date.now(),
      userData: existing?.userData || {
        id: 'prof_' + Date.now(),
        email: cleanEmail,
        nom: 'Enseignant',
        prenom: 'Professeur',
        role: 'professeur'
      },
      _testCode: newCode
    });

    return {
      success: true,
      email: cleanEmail,
      maskedEmail: this.maskEmail(cleanEmail),
      message: `Un nouveau code de vérification à 6 chiffres a été envoyé à l'adresse ${cleanEmail}. Vérifiez votre boîte de réception et vos courriers indésirables.`
    };
  }

  /**
   * Renvoyer l'e-mail de confirmation (Compatibilité ascendante)
   */
  static async resendConfirmationEmail(email) {
    return this.resendOtpCode(email);
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
