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
            <div class="form-row" style="display: flex; gap: 12px;">
              <div class="form-group" style="flex: 1;">
                <label class="form-label" for="reg-nom">Nom <span class="required-star">*</span></label>
                <input type="text" id="reg-nom" class="form-control auth-input" placeholder="Ex: Soro" required />
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label" for="reg-prenom">Prénom <span class="required-star">*</span></label>
                <input type="text" id="reg-prenom" class="form-control auth-input" placeholder="Ex: Abdoulaye" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-etablissement">
                <i class="fas fa-school"></i> Établissement scolaire
              </label>
              <input type="text" id="reg-etablissement" class="form-control auth-input" placeholder="Ex: Lycée Moderne / Collège" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">
                <i class="fas fa-envelope"></i> Adresse e-mail professionnelle <span class="required-star">*</span>
              </label>
              <input type="email" id="reg-email" class="form-control auth-input" placeholder="professeur.eps@academie.fr" autocomplete="email" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">
                <i class="fas fa-lock"></i> Mot de passe <span class="required-star">*</span>
                <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: normal;">(6 caractères minimum)</span>
              </label>
              <div class="password-input-group">
                <input type="password" id="reg-password" class="form-control auth-input" placeholder="••••••••" autocomplete="new-password" required minlength="6" />
                <button type="button" class="password-toggle-btn" data-target="reg-password" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password-confirm">
                <i class="fas fa-lock"></i> Confirmer le mot de passe <span class="required-star">*</span>
              </label>
              <div class="password-input-group">
                <input type="password" id="reg-password-confirm" class="form-control auth-input" placeholder="••••••••" autocomplete="new-password" required minlength="6" />
                <button type="button" class="password-toggle-btn" data-target="reg-password-confirm" aria-label="Afficher le mot de passe">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
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
        showAlert(err.message || "Erreur de connexion.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-arrow-right-to-bracket"></i> Se connecter`;
      }
    });
  }

  // 2. Submit Register
  const formRegister = container.querySelector('#form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const nom = container.querySelector('#reg-nom').value.trim();
      const prenom = container.querySelector('#reg-prenom').value.trim();
      const etablissement = container.querySelector('#reg-etablissement').value.trim();
      const email = container.querySelector('#reg-email').value.trim();
      const password = container.querySelector('#reg-password').value;
      const confirmPassword = container.querySelector('#reg-password-confirm').value;
      const submitBtn = container.querySelector('#btn-submit-register');

      if (!nom || !prenom || !email || !password) {
        showAlert("Veuillez remplir tous les champs obligatoires (*).");
        return;
      }

      if (password.length < 6) {
        showAlert("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Les mots de passe saisis ne correspondent pas.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Création du compte...`;

      try {
        const newUser = await AuthManager.register({
          nom,
          prenom,
          etablissement,
          email,
          password
        });

        Toast.show(`Compte enseignant créé avec succès ! Bienvenue ${newUser.prenom} ${newUser.nom}.`, "success");
        window.location.hash = '#dashboard';
      } catch (err) {
        console.error("Register error:", err);
        showAlert(err.message || "Erreur lors de la création du compte.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-user-check"></i> Créer mon compte enseignant`;
      }
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
