/**
 * Authentication View Controller (js/views/auth.js)
 * Modern, responsive authentication interface for GHIM PRO teachers:
 * - Professional Login form with password visibility toggle
 * - Teacher Account Registration with validation and confirmation
 * - Password Reset recovery flow via Supabase Auth
 * - Connected Teacher Profile view with quick navigation and logout
 */

import { AuthManager } from '../auth.js';
import { Toast } from '../components.js';

export function renderAuth(container, initialTab = 'login') {
  const currentUser = AuthManager.getCurrentUser();
  const isAuth = AuthManager.isAuthenticated();

  // If already authenticated and not explicitly in reset mode, display the active profile dashboard card
  const hash = window.location.hash.replace('#', '').trim();
  const isResetMode = hash === 'reset-password';

  if (isAuth && !isResetMode) {
    renderProfileCard(container, currentUser);
    return;
  }

  container.innerHTML = `
    <div class="auth-page-container">
      <div class="auth-card-wrapper">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="auth-logo-badge">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <h2 class="auth-title">Espace Enseignant EPS</h2>
          <p class="auth-subtitle">Accédez à votre espace personnel, vos classes et vos barèmes</p>
        </div>

        <!-- Navigation Tabs -->
        <div class="auth-nav-tabs" id="auth-tabs" ${isResetMode ? 'style="display:none;"' : ''}>
          <button class="auth-tab-btn ${initialTab === 'login' ? 'active' : ''}" data-tab="login" id="tab-login-btn">
            <i class="fas fa-arrow-right-to-bracket"></i> Connexion
          </button>
          <button class="auth-tab-btn ${initialTab === 'register' ? 'active' : ''}" data-tab="register" id="tab-register-btn">
            <i class="fas fa-user-plus"></i> Inscription Enseignant
          </button>
        </div>

        <!-- Notification Banner -->
        <div id="auth-alert" class="auth-alert" style="display: none;"></div>

        <!-- FORMULAIRE 1 : CONNEXION -->
        <div class="auth-form-panel ${initialTab === 'login' && !isResetMode ? 'active' : ''}" id="panel-login">
          <form id="form-login" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-email">
                <i class="fas fa-envelope"></i> Adresse e-mail professionnelle <span class="required-star">*</span>
              </label>
              <input type="email" id="login-email" class="form-control auth-input" placeholder="professeur.eps@academie.fr" autocomplete="username" required />
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" for="login-password" style="margin-bottom: 0;">
                  <i class="fas fa-lock"></i> Mot de passe <span class="required-star">*</span>
                </label>
                <button type="button" class="btn-text-link" id="link-forgot-password">Mot de passe oublié ?</button>
              </div>
              <div class="password-input-group">
                <input type="password" id="login-password" class="form-control auth-input" placeholder="••••••••" autocomplete="current-password" required />
                <button type="button" class="password-toggle-btn" data-target="login-password" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit-btn" id="btn-submit-login">
              <i class="fas fa-arrow-right-to-bracket"></i> Se connecter
            </button>
          </form>

          <div class="auth-footer-link">
            <span>Vous n'avez pas encore de compte ?</span>
            <button type="button" class="btn-text-link link-switch-tab" data-target="register">Créer un compte enseignant</button>
          </div>
        </div>

        <!-- FORMULAIRE 2 : INSCRIPTION PROFESSEUR -->
        <div class="auth-form-panel ${initialTab === 'register' && !isResetMode ? 'active' : ''}" id="panel-register">
          <form id="form-register" novalidate>
            <!-- Nom et Prénom -->
            <div class="form-row" style="display: flex; gap: 12px;">
              <div class="form-group" style="flex: 1;">
                <label class="form-label" for="reg-nom">Nom <span class="required-star">*</span></label>
                <input type="text" id="reg-nom" class="form-control auth-input" placeholder="Ex: Soro" required autocomplete="family-name" />
                <div class="field-error-msg" id="err-reg-nom"></div>
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label" for="reg-prenom">Prénoms <span class="required-star">*</span></label>
                <input type="text" id="reg-prenom" class="form-control auth-input" placeholder="Ex: Abdoulaye" required autocomplete="given-name" />
                <div class="field-error-msg" id="err-reg-prenom"></div>
              </div>
            </div>

            <!-- Établissement scolaire -->
            <div class="form-group">
              <label class="form-label" for="reg-etablissement">
                <i class="fas fa-school"></i> Établissement scolaire <span class="required-star">*</span>
              </label>
              <input type="text" id="reg-etablissement" class="form-control auth-input" placeholder="Ex: Lycée Moderne de Grand-Bassam" required />
              <div class="field-error-msg" id="err-reg-etablissement"></div>
            </div>

            <!-- Adresse e-mail professionnelle -->
            <div class="form-group">
              <label class="form-label" for="reg-email">
                <i class="fas fa-envelope"></i> Adresse e-mail professionnelle <span class="required-star">*</span>
              </label>
              <input type="email" id="reg-email" class="form-control auth-input" placeholder="professeur.eps@academie.fr" autocomplete="email" required />
              <div class="field-error-msg" id="err-reg-email"></div>
              
              <!-- Alerte anti-doublon interactive -->
              <div id="reg-email-duplicate-box" class="auth-alert-duplicate" style="display: none;">
                <div><i class="fas fa-circle-exclamation"></i> <strong>Cette adresse e-mail est déjà associée à un compte.</strong></div>
                <div style="font-size: 0.82rem; margin-top: 4px; color: #78350f;">Connectez-vous directement ou demandez un nouveau mot de passe.</div>
                <div class="alert-actions">
                  <button type="button" class="btn btn-sm btn-primary link-switch-tab" data-target="login">Se connecter</button>
                  <button type="button" class="btn btn-sm btn-secondary link-switch-tab" data-target="forgot">Mot de passe oublié ?</button>
                </div>
              </div>
            </div>

            <!-- Contact téléphonique (facultatif) -->
            <div class="form-group">
              <label class="form-label" for="reg-telephone">
                <i class="fas fa-phone"></i> Contact téléphonique <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: normal;">(Optionnel)</span>
              </label>
              <input type="tel" id="reg-telephone" class="form-control auth-input" placeholder="Ex: +225 07 08 09 10 11 ou 0708091011" autocomplete="tel" />
              <div class="field-error-msg" id="err-reg-telephone"></div>
            </div>

            <!-- Mot de passe -->
            <div class="form-group">
              <label class="form-label" for="reg-password">
                <i class="fas fa-lock"></i> Mot de passe <span class="required-star">*</span>
              </label>
              <div class="password-input-group">
                <input type="password" id="reg-password" class="form-control auth-input" placeholder="••••••••" autocomplete="new-password" required minlength="8" />
                <button type="button" class="password-toggle-btn" data-target="reg-password" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <!-- Checklist de sécurité mot de passe -->
              <div class="password-rules-checklist" id="reg-password-rules">
                <div class="rule-item" id="rule-minlen"><i class="fas fa-circle"></i> Au moins 8 caractères</div>
                <div class="rule-item" id="rule-letter"><i class="fas fa-circle"></i> Au moins une lettre (a-z)</div>
                <div class="rule-item" id="rule-num"><i class="fas fa-circle"></i> Au moins un chiffre ou symbole</div>
              </div>
              <div class="field-error-msg" id="err-reg-password"></div>
            </div>

            <!-- Confirmation mot de passe -->
            <div class="form-group">
              <label class="form-label" for="reg-password-confirm">
                <i class="fas fa-lock"></i> Confirmer le mot de passe <span class="required-star">*</span>
              </label>
              <div class="password-input-group">
                <input type="password" id="reg-password-confirm" class="form-control auth-input" placeholder="••••••••" autocomplete="new-password" required minlength="8" />
                <button type="button" class="password-toggle-btn" data-target="reg-password-confirm" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="field-error-msg" id="err-reg-password-confirm"></div>
            </div>

            <div class="auth-security-notice">
              <i class="fas fa-shield-halved" style="color: var(--primary);"></i>
              <span>Ce compte sera associé à un profil Enseignant EPS sécurisé avec isolation stricte de vos classes et barèmes.</span>
            </div>

            <button type="submit" class="btn btn-success btn-block btn-lg auth-submit-btn" id="btn-submit-register">
              <i class="fas fa-user-check"></i> Créer mon compte enseignant
            </button>
          </form>

          <div class="auth-footer-link">
            <span>Vous possédez déjà un compte ?</span>
            <button type="button" class="btn-text-link link-switch-tab" data-target="login">Se connecter</button>
          </div>
        </div>

        <!-- FORMULAIRE 5 : VÉRIFICATION CODE OTP À 6 CHIFFRES -->
        <div class="auth-form-panel" id="panel-otp">
          <div class="auth-confirmation-card otp-card">
            <div class="otp-icon">
              <i class="fas fa-shield-halved"></i>
            </div>
            <h3 class="otp-title">Vérification de votre compte</h3>
            <p class="otp-lead-text">
              Un code de vérification à 6 chiffres a été envoyé à votre adresse e-mail. Consultez votre boîte de réception et saisissez le code pour confirmer votre inscription.
            </p>

            <div class="otp-masked-badge">
              <i class="fas fa-envelope"></i>
              <span id="otp-masked-email-display">mo****@gmail.com</span>
            </div>

            <div id="otp-status-alert" class="auth-alert" style="display: none; margin: 12px 0 16px 0;"></div>

            <form id="form-verify-otp" novalidate autocomplete="off">
              <div class="otp-inputs-wrapper" id="otp-inputs-container">
                <input type="text" maxlength="1" class="otp-digit" data-index="0" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" autofocus />
                <input type="text" maxlength="1" class="otp-digit" data-index="1" inputmode="numeric" pattern="[0-9]*" />
                <input type="text" maxlength="1" class="otp-digit" data-index="2" inputmode="numeric" pattern="[0-9]*" />
                <input type="text" maxlength="1" class="otp-digit" data-index="3" inputmode="numeric" pattern="[0-9]*" />
                <input type="text" maxlength="1" class="otp-digit" data-index="4" inputmode="numeric" pattern="[0-9]*" />
                <input type="text" maxlength="1" class="otp-digit" data-index="5" inputmode="numeric" pattern="[0-9]*" />
              </div>

              <div class="otp-expiry-indicator">
                <i class="fas fa-clock"></i>
                <span>Ce code est valable pendant encore <strong id="otp-timer-display">10:00</strong></span>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit-btn" id="btn-submit-verify-otp" style="margin-top: 18px;" disabled>
                <i class="fas fa-check-circle"></i> Vérifier le code et accéder à mon espace
              </button>
            </form>

            <div class="otp-secondary-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-otp-resend">
                <i class="fas fa-rotate-right"></i> <span id="btn-otp-resend-label">Renvoyer un nouveau code</span>
              </button>
              <button type="button" class="btn-text-link" id="btn-otp-edit-email" style="display: inline-flex; align-items: center; gap: 6px;">
                <i class="fas fa-pen-to-square"></i> Modifier l'adresse e-mail
              </button>
            </div>

            <div class="otp-tips-box">
              <i class="fas fa-circle-info" style="color: var(--primary); font-size: 1rem; margin-top: 2px;"></i>
              <span><strong>Vous n'avez pas reçu le code ?</strong> Vérifiez attentivement votre dossier de courriers indésirables (spams) ou l'onglet Notifications.</span>
            </div>
          </div>
        </div>

        <!-- FORMULAIRE 3 : MOT DE PASSE OUBLIÉ -->
        <div class="auth-form-panel ${isResetMode ? 'active' : ''}" id="panel-forgot">
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Récupération de mot de passe</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">
              Saisissez l'adresse e-mail associée à votre compte enseignant. Un lien sécurisé vous permettra de définir un nouveau mot de passe.
            </p>
          </div>

          <form id="form-forgot" novalidate>
            <div class="form-group">
              <label class="form-label" for="forgot-email">
                <i class="fas fa-envelope"></i> Votre adresse e-mail <span class="required-star">*</span>
              </label>
              <input type="email" id="forgot-email" class="form-control auth-input" placeholder="professeur.eps@academie.fr" required />
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit-btn" id="btn-submit-forgot">
              <i class="fas fa-paper-plane"></i> Envoyer le lien de récupération
            </button>
          </form>

          <div class="auth-footer-link">
            <button type="button" class="btn-text-link link-switch-tab" data-target="login">
              <i class="fas fa-arrow-left"></i> Retour à la connexion
            </button>
          </div>
        </div>

        <!-- FORMULAIRE 4 : MISE À JOUR MOT DE PASSE (Si lien de reset cliqué) -->
        <div class="auth-form-panel" id="panel-reset-new">
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Nouveau mot de passe</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">
              Choisissez un nouveau mot de passe sécurisé pour votre compte enseignant.
            </p>
          </div>

          <form id="form-reset-new" novalidate>
            <div class="form-group">
              <label class="form-label" for="new-password">Nouveau mot de passe <span class="required-star">*</span></label>
              <div class="password-input-group">
                <input type="password" id="new-password" class="form-control auth-input" placeholder="••••••••" required minlength="6" />
                <button type="button" class="password-toggle-btn" data-target="new-password" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit-btn" id="btn-submit-new-pass">
              <i class="fas fa-key"></i> Enregistrer le mot de passe
            </button>
          </form>
        </div>

      </div>
    </div>
  `;

  // Attach event handlers
  setupAuthInteractions(container);
}

function renderProfileCard(container, user) {
  container.innerHTML = `
    <div class="auth-page-container">
      <div class="auth-card-wrapper profile-card">
        <div class="profile-header">
          <div class="profile-avatar-circle">
            ${(user.prenom || 'P')[0].toUpperCase()}${(user.nom || 'E')[0].toUpperCase()}
          </div>
          <h2 class="profile-name">${user.prenom} ${user.nom}</h2>
          <span class="badge badge-success" style="padding: 4px 12px; font-size: 0.82rem;">
            <i class="fas fa-chalkboard-user"></i> ${user.role === 'professeur' ? 'Enseignant EPS' : (user.role || 'Enseignant')}
          </span>
        </div>

        <div class="profile-details-list">
          <div class="profile-detail-item">
            <span class="detail-label"><i class="fas fa-envelope"></i> E-mail</span>
            <span class="detail-value">${user.email}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label"><i class="fas fa-school"></i> Établissement</span>
            <span class="detail-value">${user.etablissement || 'Non renseigné'}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label"><i class="fas fa-fingerprint"></i> Identifiant Professeur</span>
            <span class="detail-value" style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${user.id}</span>
          </div>
          <div class="profile-detail-item">
            <span class="detail-label"><i class="fas fa-cloud-arrow-up"></i> Statut Cloud</span>
            <span class="detail-value">${user.isSupabase ? '<span style="color:#10b981;"><i class="fas fa-check-circle"></i> Supabase Auth Actif</span>' : '<span style="color:#64748b;"><i class="fas fa-laptop"></i> Profil Local / Déconnecté</span>'}</span>
          </div>
        </div>

        <div class="profile-actions-grid">
          <a href="#dashboard" class="btn btn-primary btn-block">
            <i class="fas fa-chart-pie"></i> Accéder à mon Tableau de Bord
          </a>
          <a href="#classes" class="btn btn-secondary btn-block">
            <i class="fas fa-chalkboard-user"></i> Gérer mes Classes & Élèves
          </a>
          <a href="#baremes" class="btn btn-secondary btn-block">
            <i class="fas fa-table-list"></i> Mes Barèmes & Barèmes Officiels
          </a>
          <button type="button" class="btn btn-danger btn-block" id="btn-profile-logout" style="margin-top: 10px;">
            <i class="fas fa-right-from-bracket"></i> Me déconnecter
          </button>
        </div>
      </div>
    </div>
  `;

  const btnLogout = container.querySelector('#btn-profile-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await AuthManager.logout();
      Toast.show("Vous avez été déconnecté avec succès.", "info");
      renderAuth(container, 'login');
    });
  }
}

function setupAuthInteractions(container) {
  const alertEl = container.querySelector('#auth-alert');

  function showAlert(msg, type = 'error') {
    if (!alertEl) return;
    alertEl.className = `auth-alert auth-alert-${type}`;
    alertEl.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> <span>${msg}</span>`;
    alertEl.style.display = 'flex';
  }

  function hideAlert() {
    if (alertEl) alertEl.style.display = 'none';
  }

  // Switch between panels (tabs)
  function switchPanel(panelName) {
    hideAlert();
    container.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === panelName);
    });
    container.querySelectorAll('.auth-form-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = container.querySelector(`#panel-${panelName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  }

  // Tab button clicks
  container.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      switchPanel(tab);
    });
  });

  // Switch link clicks
  container.querySelectorAll('.link-switch-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-target');
      switchPanel(tab);
    });
  });

  // Forgot password link
  const linkForgot = container.querySelector('#link-forgot-password');
  if (linkForgot) {
    linkForgot.addEventListener('click', () => switchPanel('forgot'));
  }

  // Password visibility toggle buttons (Eye icon)
  container.querySelectorAll('.password-toggle-btn').forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
      const targetId = toggleBtn.getAttribute('data-target');
      const input = container.querySelector(`#${targetId}`);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
      toggleBtn.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    });
  });

  // 1. Submit Login
  const formLogin = container.querySelector('#form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = container.querySelector('#login-email').value.trim();
      const password = container.querySelector('#login-password').value;
      const submitBtn = container.querySelector('#btn-submit-login');

      if (!email || !password) {
        showAlert("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connexion en cours...`;

      try {
        const user = await AuthManager.login(email, password);
        Toast.show(`Bienvenue, ${user.prenom} ${user.nom} !`, "success");
        window.location.hash = '#dashboard';
      } catch (err) {
        console.error("Login error:", err);
        if (err.requiresOtpVerification && err.email) {
          showAlert(`Votre adresse n'a pas encore été confirmée. <button type="button" class="btn btn-sm btn-primary" id="btn-login-to-otp" style="margin-left: 8px;"><i class="fas fa-shield-halved"></i> Saisir mon code</button>`);
          const btnToOtp = container.querySelector('#btn-login-to-otp');
          if (btnToOtp) {
            btnToOtp.addEventListener('click', () => {
              openOtpVerification(err.email);
            });
          }
        } else {
          showAlert(err.message || "Erreur de connexion.");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-arrow-right-to-bracket"></i> Se connecter`;
      }
    });
  }

  // --- Fonctions d'assistance d'affichage des erreurs par champ ---
  function setFieldError(fieldId, errorMsg) {
    const input = container.querySelector(`#reg-${fieldId}`);
    const errEl = container.querySelector(`#err-reg-${fieldId}`);
    if (input) {
      if (errorMsg) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
      } else {
        input.classList.remove('is-invalid');
      }
    }
    if (errEl) {
      errEl.textContent = errorMsg || '';
      errEl.style.display = errorMsg ? 'block' : 'none';
    }
  }

  function clearAllFieldErrors() {
    ['nom', 'prenom', 'etablissement', 'telephone', 'email', 'password', 'password-confirm'].forEach(f => {
      const input = container.querySelector(`#reg-${f}`);
      const errEl = container.querySelector(`#err-reg-${f}`);
      if (input) input.classList.remove('is-invalid');
      if (errEl) {
        errEl.textContent = '';
        errEl.style.display = 'none';
      }
    });
  }

  // --- Dynamic Password Security Checklist ---
  const regPass = container.querySelector('#reg-password');
  const ruleMinLen = container.querySelector('#rule-minlen');
  const ruleLetter = container.querySelector('#rule-letter');
  const ruleNum = container.querySelector('#rule-num');

  function updatePasswordChecklist(val) {
    const minLenValid = val.length >= 8;
    const letterValid = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(val);
    const numValid = /[0-9!@#$%^&*(),.?":{}|<>\-_]/.test(val);

    if (ruleMinLen) {
      ruleMinLen.classList.toggle('valid', minLenValid);
      ruleMinLen.innerHTML = `<i class="fas ${minLenValid ? 'fa-circle-check' : 'fa-circle'}"></i> Au moins 8 caractères`;
    }
    if (ruleLetter) {
      ruleLetter.classList.toggle('valid', letterValid);
      ruleLetter.innerHTML = `<i class="fas ${letterValid ? 'fa-circle-check' : 'fa-circle'}"></i> Au moins une lettre (a-z)`;
    }
    if (ruleNum) {
      ruleNum.classList.toggle('valid', numValid);
      ruleNum.innerHTML = `<i class="fas ${numValid ? 'fa-circle-check' : 'fa-circle'}"></i> Au moins un chiffre ou symbole`;
    }
  }

  if (regPass) {
    regPass.addEventListener('input', (e) => {
      updatePasswordChecklist(e.target.value);
      setFieldError('password', null);
    });
  }

  // --- Password Confirmation Real-Time Match Check ---
  const regPassConfirm = container.querySelector('#reg-password-confirm');
  if (regPassConfirm) {
    regPassConfirm.addEventListener('input', () => {
      const p1 = regPass ? regPass.value : '';
      const p2 = regPassConfirm.value;
      if (p2 && p1 !== p2) {
        setFieldError('password-confirm', "Les mots de passe saisis ne correspondent pas.");
      } else {
        setFieldError('password-confirm', null);
      }
    });
  }

  // --- Email Duplicate & Format Live Check ---
  const regEmail = container.querySelector('#reg-email');
  const dupBox = container.querySelector('#reg-email-duplicate-box');
  const btnDupLogin = container.querySelector('#btn-dup-login');
  const btnDupForgot = container.querySelector('#btn-dup-forgot');

  if (btnDupLogin) {
    btnDupLogin.addEventListener('click', () => {
      const emailVal = regEmail ? regEmail.value.trim() : '';
      const loginEmail = container.querySelector('#login-email');
      if (loginEmail && emailVal) loginEmail.value = emailVal;
      switchPanel('login');
    });
  }

  if (btnDupForgot) {
    btnDupForgot.addEventListener('click', () => {
      const emailVal = regEmail ? regEmail.value.trim() : '';
      const forgotEmail = container.querySelector('#forgot-email');
      if (forgotEmail && emailVal) forgotEmail.value = emailVal;
      switchPanel('forgot');
    });
  }

  async function checkEmailDuplicateLive(showFormatError = false) {
    if (!regEmail) return;
    const val = regEmail.value.trim();
    if (!val) {
      if (dupBox) dupBox.style.display = 'none';
      setFieldError('email', null);
      return;
    }

    const formatCheck = AuthManager.validateEmailFormat(val);
    if (!formatCheck.isValid) {
      if (showFormatError) {
        setFieldError('email', formatCheck.error);
      }
      if (dupBox) dupBox.style.display = 'none';
      return;
    }

    setFieldError('email', null);
    try {
      const exists = await AuthManager.checkEmailExists(formatCheck.cleanEmail);
      if (exists) {
        if (dupBox) dupBox.style.display = 'block';
        regEmail.classList.add('is-invalid');
      } else {
        if (dupBox) dupBox.style.display = 'none';
        regEmail.classList.remove('is-invalid');
      }
    } catch (e) {
      console.warn("checkEmailDuplicateLive warning:", e);
    }
  }

  if (regEmail) {
    regEmail.addEventListener('blur', () => checkEmailDuplicateLive(true));
    regEmail.addEventListener('input', () => {
      if (dupBox && dupBox.style.display !== 'none') {
        dupBox.style.display = 'none';
      }
      setFieldError('email', null);
    });
  }

  // 2. Submit Register avec validation rigoureuse et anti-doublon
  const formRegister = container.querySelector('#form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();
      clearAllFieldErrors();
      if (dupBox) dupBox.style.display = 'none';

      const nom = (container.querySelector('#reg-nom')?.value || '').trim();
      const prenom = (container.querySelector('#reg-prenom')?.value || '').trim();
      const etablissement = (container.querySelector('#reg-etablissement')?.value || '').trim();
      const telephone = (container.querySelector('#reg-telephone')?.value || '').trim();
      const email = (container.querySelector('#reg-email')?.value || '').trim();
      const password = container.querySelector('#reg-password')?.value || '';
      const passwordConfirm = container.querySelector('#reg-password-confirm')?.value || '';
      const submitBtn = container.querySelector('#btn-submit-register');

      // Validation de toutes les entrées
      const validation = AuthManager.validateRegistrationData({
        nom,
        prenom,
        etablissement,
        telephone,
        email,
        password,
        passwordConfirm
      });

      if (!validation.isValid) {
        let firstInputToFocus = null;
        for (const [field, errorMsg] of Object.entries(validation.errors)) {
          const inputKey = field === 'passwordConfirm' ? 'password-confirm' : field;
          setFieldError(inputKey, errorMsg);
          if (!firstInputToFocus) {
            firstInputToFocus = container.querySelector(`#reg-${inputKey}`);
          }
        }
        if (firstInputToFocus) firstInputToFocus.focus();
        showAlert("Veuillez corriger les informations indiquées dans le formulaire.");
        return;
      }

      // Verrou d'interface anti-double-clic immédiat
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Création du compte en cours...`;

      try {
        const result = await AuthManager.register({
          nom,
          prenom,
          etablissement,
          telephone,
          email,
          password,
          passwordConfirm
        });

        if (result && (result.requiresOtpVerification || result.requiresEmailConfirmation)) {
          openOtpVerification(result.email, result.maskedEmail);
          Toast.show("Compte créé ! Un code de vérification à 6 chiffres vous a été envoyé.", "info");
        } else {
          Toast.show(`Compte enseignant créé avec succès ! Bienvenue ${result.prenom} ${result.nom}.`, "success");
          window.location.hash = '#dashboard';
        }
      } catch (err) {
        console.error("Register error:", err);
        const errMsg = err.message || "Erreur lors de la création du compte.";
        if (errMsg.includes("déjà associée à un compte")) {
          if (dupBox) dupBox.style.display = 'block';
          if (regEmail) {
            regEmail.classList.add('is-invalid');
            regEmail.focus();
          }
        } else {
          showAlert(errMsg);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-user-check"></i> Créer mon compte enseignant`;
      }
    });
  }

  // =========================================================================
  // GESTIONNAIRE COMPLET DE L'ÉCRAN DE VÉRIFICATION OTP (CODE À 6 CHIFFRES)
  // =========================================================================
  let currentOtpEmail = '';
  let otpValidityTimer = null;
  let otpResendCooldownTimer = null;

  function showOtpAlert(msg, type = 'error') {
    const alertBox = container.querySelector('#otp-status-alert');
    if (!alertBox) return;
    alertBox.className = `auth-alert auth-alert-${type}`;
    alertBox.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> <span>${msg}</span>`;
    alertBox.style.display = 'flex';
  }

  function hideOtpAlert() {
    const alertBox = container.querySelector('#otp-status-alert');
    if (alertBox) alertBox.style.display = 'none';
  }

  function startOtpValidityTimer(durationSeconds = 600) {
    if (otpValidityTimer) clearInterval(otpValidityTimer);
    let remaining = durationSeconds;
    const timerDisplay = container.querySelector('#otp-timer-display');
    const submitBtn = container.querySelector('#btn-submit-verify-otp');

    const updateDisplay = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerDisplay) {
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    };
    updateDisplay();

    otpValidityTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(otpValidityTimer);
        otpValidityTimer = null;
        if (timerDisplay) timerDisplay.textContent = "00:00";
        showOtpAlert("Ce code a expiré. Demandez un nouveau code pour continuer.", "error");
        if (submitBtn) submitBtn.disabled = true;
      } else {
        updateDisplay();
      }
    }, 1000);
  }

  function startResendCooldown(cooldownSeconds = 60) {
    const resendBtn = container.querySelector('#btn-otp-resend');
    const resendLabel = container.querySelector('#btn-otp-resend-label');
    if (!resendBtn || !resendLabel) return;

    if (otpResendCooldownTimer) clearInterval(otpResendCooldownTimer);
    let remaining = cooldownSeconds;
    resendBtn.disabled = true;

    const updateLabel = () => {
      resendLabel.textContent = `Renvoyer (${remaining}s)`;
    };
    updateLabel();

    otpResendCooldownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(otpResendCooldownTimer);
        otpResendCooldownTimer = null;
        resendBtn.disabled = false;
        resendLabel.textContent = "Renvoyer un nouveau code";
      } else {
        updateLabel();
      }
    }, 1000);
  }

  function openOtpVerification(email, maskedEmail = null) {
    currentOtpEmail = (email || '').trim().toLowerCase();
    hideOtpAlert();

    const displayEl = container.querySelector('#otp-masked-email-display');
    if (displayEl) {
      displayEl.textContent = maskedEmail || AuthManager.maskEmail(currentOtpEmail);
    }

    const otpDigits = container.querySelectorAll('.otp-digit');
    otpDigits.forEach(input => {
      input.value = '';
      input.classList.remove('is-filled', 'is-invalid');
    });

    const submitBtn = container.querySelector('#btn-submit-verify-otp');
    if (submitBtn) submitBtn.disabled = true;

    startOtpValidityTimer(600); // 10 minutes de validité
    startResendCooldown(60);     // 60s cooldown de renvoi anti-abus

    switchPanel('otp');

    setTimeout(() => {
      const firstDigit = container.querySelector('.otp-digit[data-index="0"]');
      if (firstDigit) firstDigit.focus();
    }, 100);
  }

  // --- Gestion des 6 cases de saisie du code OTP ---
  const otpInputs = container.querySelectorAll('.otp-digit');
  const btnSubmitOtp = container.querySelector('#btn-submit-verify-otp');

  function checkAllOtpFilled() {
    let allFilled = true;
    let codeStr = '';
    otpInputs.forEach(input => {
      if (!input.value || !/^\d$/.test(input.value)) {
        allFilled = false;
      } else {
        codeStr += input.value;
      }
    });
    if (btnSubmitOtp) {
      btnSubmitOtp.disabled = !allFilled;
    }
    return { allFilled, code: codeStr };
  }

  otpInputs.forEach((input, idx) => {
    // 1. Saisie d'un chiffre
    input.addEventListener('input', (e) => {
      hideOtpAlert();
      input.classList.remove('is-invalid');

      const val = input.value;
      if (!/^\d$/.test(val)) {
        input.value = '';
        input.classList.remove('is-filled');
        checkAllOtpFilled();
        return;
      }

      input.classList.add('is-filled');
      if (idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }
      checkAllOtpFilled();
    });

    // 2. Navigation et retour arrière (Backspace)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!input.value && idx > 0) {
          otpInputs[idx - 1].value = '';
          otpInputs[idx - 1].classList.remove('is-filled');
          otpInputs[idx - 1].focus();
        } else {
          input.value = '';
          input.classList.remove('is-filled');
        }
        checkAllOtpFilled();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        otpInputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }
    });

    // 3. Prise en charge transparente du Copier-Coller complet
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const digits = (pasted || '').replace(/\D/g, '').slice(0, 6);
      if (!digits) return;

      digits.split('').forEach((d, dIdx) => {
        if (otpInputs[dIdx]) {
          otpInputs[dIdx].value = d;
          otpInputs[dIdx].classList.add('is-filled');
          otpInputs[dIdx].classList.remove('is-invalid');
        }
      });

      const nextFocusIdx = Math.min(digits.length, otpInputs.length - 1);
      otpInputs[nextFocusIdx].focus();
      checkAllOtpFilled();
    });
  });

  // Soumission de la vérification du code
  const formVerifyOtp = container.querySelector('#form-verify-otp');
  if (formVerifyOtp) {
    formVerifyOtp.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideOtpAlert();

      const { allFilled, code } = checkAllOtpFilled();
      if (!allFilled || code.length !== 6) {
        showOtpAlert("Veuillez saisir les 6 chiffres du code de vérification.", "error");
        return;
      }

      btnSubmitOtp.disabled = true;
      btnSubmitOtp.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Vérification du code en cours...`;

      try {
        const result = await AuthManager.verifyOtp(currentOtpEmail, code);
        if (otpValidityTimer) clearInterval(otpValidityTimer);
        if (otpResendCooldownTimer) clearInterval(otpResendCooldownTimer);

        Toast.show(`Compte validé avec succès ! Bienvenue ${result.user.prenom} ${result.user.nom}.`, "success");
        window.location.hash = '#dashboard';
      } catch (err) {
        console.error("verifyOtp error:", err);
        const errMsg = err.message || "Le code saisi est incorrect. Vérifiez votre e-mail et réessayez.";
        showOtpAlert(errMsg, "error");
        otpInputs.forEach(i => i.classList.add('is-invalid'));
        otpInputs[0].focus();
      } finally {
        btnSubmitOtp.disabled = !checkAllOtpFilled().allFilled;
        btnSubmitOtp.innerHTML = `<i class="fas fa-check-circle"></i> Vérifier le code et accéder à mon espace`;
      }
    });
  }

  // Renvoi du code avec cooldown anti-spam
  const btnOtpResend = container.querySelector('#btn-otp-resend');
  if (btnOtpResend) {
    btnOtpResend.addEventListener('click', async () => {
      if (!currentOtpEmail) {
        showOtpAlert("Adresse e-mail introuvable pour le renvoi.", "error");
        return;
      }

      hideOtpAlert();
      btnOtpResend.disabled = true;
      const resendLabel = container.querySelector('#btn-otp-resend-label');
      if (resendLabel) resendLabel.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Envoi...`;

      try {
        const res = await AuthManager.resendOtpCode(currentOtpEmail);
        showOtpAlert(res.message, "success");
        startResendCooldown(60);
        startOtpValidityTimer(600); // 10 minutes remises à zéro
        otpInputs.forEach(i => {
          i.value = '';
          i.classList.remove('is-filled', 'is-invalid');
        });
        checkAllOtpFilled();
        otpInputs[0].focus();
        Toast.show("Nouveau code envoyé !", "success");
      } catch (err) {
        showOtpAlert(err.message || "Erreur lors du renvoi du code.", "error");
        if (resendLabel) resendLabel.textContent = "Renvoyer un nouveau code";
        btnOtpResend.disabled = false;
      }
    });
  }

  // Bouton : Modifier l'adresse e-mail (revient à l'inscription en préservant les champs)
  const btnOtpEditEmail = container.querySelector('#btn-otp-edit-email');
  if (btnOtpEditEmail) {
    btnOtpEditEmail.addEventListener('click', () => {
      if (otpValidityTimer) clearInterval(otpValidityTimer);
      if (otpResendCooldownTimer) clearInterval(otpResendCooldownTimer);

      const lastData = AuthManager.getLastRegistrationData();
      if (lastData) {
        if (container.querySelector('#reg-nom')) container.querySelector('#reg-nom').value = lastData.nom || '';
        if (container.querySelector('#reg-prenom')) container.querySelector('#reg-prenom').value = lastData.prenom || '';
        if (container.querySelector('#reg-etablissement')) container.querySelector('#reg-etablissement').value = lastData.etablissement || '';
        if (container.querySelector('#reg-telephone')) container.querySelector('#reg-telephone').value = lastData.telephone || '';
        if (container.querySelector('#reg-email')) container.querySelector('#reg-email').value = lastData.email || '';
      }
      switchPanel('register');
      setTimeout(() => {
        const emailInput = container.querySelector('#reg-email');
        if (emailInput) {
          emailInput.focus();
          emailInput.select();
        }
      }, 100);
    });
  }

  // 3. Submit Forgot Password
  const formForgot = container.querySelector('#form-forgot');
  if (formForgot) {
    formForgot.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = container.querySelector('#forgot-email').value.trim();
      const submitBtn = container.querySelector('#btn-submit-forgot');

      if (!email) {
        showAlert("Veuillez saisir votre adresse e-mail.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Envoi en cours...`;

      try {
        const result = await AuthManager.resetPassword(email);
        showAlert(result.message, "success");
      } catch (err) {
        showAlert(err.message || "Erreur lors de l'envoi de la réinitialisation.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Envoyer le lien de récupération`;
      }
    });
  }

  // 4. Submit New Password
  const formResetNew = container.querySelector('#form-reset-new');
  if (formResetNew) {
    formResetNew.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const newPass = container.querySelector('#new-password').value;
      const submitBtn = container.querySelector('#btn-submit-new-pass');

      if (!newPass || newPass.length < 6) {
        showAlert("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mise à jour...`;

      try {
        await AuthManager.updatePassword(newPass);
        Toast.show("Votre mot de passe a été mis à jour avec succès !", "success");
        switchPanel('login');
      } catch (err) {
        showAlert(err.message || "Erreur lors de la mise à jour du mot de passe.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-key"></i> Enregistrer le mot de passe`;
      }
    });
  }
}
