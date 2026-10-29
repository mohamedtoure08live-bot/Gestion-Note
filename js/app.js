/**
 * EPS Pro Application Entry Point & Router (js/app.js)
 * Full Stack PostgreSQL & Supabase orchestration with Sport Tech Premium Showcase
 */

import { db } from './db.js';
import { SupabaseManager } from './supabaseClient.js';
import { renderLanding } from './views/landing.js';
import { renderDashboard } from './views/dashboard.js';
import { renderNotation } from './views/notation.js';
import { renderBaremes } from './views/baremes.js';
import { renderEleves } from './views/eleves.js';
import { renderHistorique } from './views/historique.js';
import { AuthManager } from './auth.js';
import { renderAuth } from './views/auth.js';

const appRoutes = {
  'dashboard': { title: 'Tableau de Bord Analytics', render: renderDashboard },
  'notation': { title: 'Évaluation & Calcul de Note', render: renderNotation },
  'baremes': { title: 'Gestion des Barèmes', render: renderBaremes },
  'classes': { title: 'Mes classes & Répertoire des Élèves', render: renderEleves },
  'eleves': { title: 'Mes classes & Répertoire des Élèves', render: renderEleves },
  'historique': { title: 'Historique des Évaluations', render: renderHistorique },
  'auth': { title: 'Espace Enseignant EPS', render: renderAuth },
  'login': { title: 'Connexion Enseignant', render: (c) => renderAuth(c, 'login') },
  'register': { title: 'Inscription Enseignant', render: (c) => renderAuth(c, 'register') },
  'reset-password': { title: 'Réinitialisation de mot de passe', render: (c) => renderAuth(c, 'forgot') }
};

const landingSections = ['hero', 'features', 'philosophy', 'how-it-works', 'demo', 'avantages', 'faq'];

class App {
  static async init() {
    console.log("Initializing GHIM PRO Application Full Stack...");

    // Setup Auth Manager & User Session
    try {
      await AuthManager.init();
      const currentUser = AuthManager.getCurrentUser();
      db.setCurrentProfesseur(currentUser.id);
    } catch (e) {
      console.warn("Auth initialization notice:", e);
    }

    // Update Header User Profile Badge
    App.updateUserBadge();

    // Listen to Auth State Changes
    window.addEventListener('eps:auth-changed', (e) => {
      const user = e.detail?.user || AuthManager.getCurrentUser();
      if (user) {
        db.setCurrentProfesseur(user.id);
      }
      App.updateUserBadge();
      App.navigate();
    });

    // Setup Cloud Status Listener for app header badge
    App.setupCloudStatus();

    // Setup Navigation Hashchange Listener
    window.addEventListener('hashchange', () => App.navigate());

    // Toggle Mobile Sidebar inside App with backdrop and close button
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.querySelector('.sidebar');

    App.openSidebar = () => {
      if (sidebar) sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('sidebar-open');
    };

    App.closeSidebar = () => {
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', () => App.openSidebar());
    if (closeBtn) closeBtn.addEventListener('click', () => App.closeSidebar());
    if (backdrop) backdrop.addEventListener('click', () => App.closeSidebar());

    // Listen to background sync / realtime events to re-render active view
    window.addEventListener('eps:db-synced', () => {
      const currentHash = window.location.hash.replace('#', '').trim();
      if (appRoutes[currentHash]) {
        App.navigate();
      }
    });

    // Render initial view with local cache for instant UI
    App.navigate();

    // Init & Sync Database with Supabase PostgreSQL
    try {
      await db.init();
    } catch (e) {
      console.warn("DB initialization notice:", e);
    }

    // Re-render active view with freshly synced cloud data if inside app
    const hash = window.location.hash.replace('#', '').trim();
    if (appRoutes[hash]) {
      App.navigate();
    }
  }

  static updateUserBadge() {
    const user = AuthManager.getCurrentUser();
    const nameEl = document.getElementById('header-user-name');
    const avatarEl = document.getElementById('header-user-avatar');
    const badgeEl = document.getElementById('header-user-btn');

    if (nameEl && user) {
      nameEl.textContent = `M. ${user.nom || 'Enseignant'}`;
    }
    if (avatarEl && user) {
      avatarEl.textContent = ((user.prenom || user.nom || 'P')[0] || 'P').toUpperCase();
    }
    if (badgeEl && user) {
      badgeEl.title = `Connecté : ${user.prenom || ''} ${user.nom || ''} (${user.etablissement || 'EPS'})`;
    }
  }

  static setupCloudStatus() {
    const badge = document.getElementById('cloud-status-badge');
    if (!badge) return;

    SupabaseManager.onStatusChange(connected => {
      if (connected) {
        badge.className = 'badge badge-cloud-connected';
        badge.innerHTML = `<span class="status-dot"></span> Supabase Connecté`;
        badge.title = "Base de données PostgreSQL connectée en temps réel";
      } else {
        badge.className = 'badge badge-cloud-offline';
        badge.innerHTML = `<span class="status-dot"></span> Mode Hors-ligne`;
        badge.title = "Données enregistrées localement. Synchronisation dès reconnexion.";
      }
    });
  }

  static navigate() {
    const rawHash = window.location.hash.replace('#', '').trim();
    const landingContainer = document.getElementById('landing-container');
    const appLayout = document.getElementById('app-layout');

    const isLandingRoute = !rawHash || rawHash === 'landing' || landingSections.includes(rawHash);

    if (isLandingRoute) {
      // Show Landing Page, Hide App Framework
      if (appLayout) appLayout.style.display = 'none';
      if (landingContainer) {
        landingContainer.style.display = 'block';
        if (!landingContainer.dataset.rendered) {
          renderLanding(landingContainer);
          landingContainer.dataset.rendered = 'true';
        }
        // Smooth scroll to section if hash targets an anchor
        if (rawHash && rawHash !== 'landing') {
          const targetEl = document.getElementById(rawHash);
          if (targetEl) {
            setTimeout(() => {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          }
        }
      }
      document.title = "GHIM PRO | EPS Notation & Barèmes";
      return;
    }

    // Operational Application View (dashboard, notation, baremes, eleves, historique)
    let routeKey = rawHash;
    if (!appRoutes[routeKey]) routeKey = 'dashboard';

    const route = appRoutes[routeKey];
    document.title = `${route.title} — GHIM PRO`;

    // Hide Landing Page, Show App Framework
    if (landingContainer) landingContainer.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';

    // Update Header Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = route.title;

    // Update Active Nav Class in App Sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      const href = item.getAttribute('href').replace('#', '');
      const isMatch = href === routeKey || 
                      ((href === 'classes' || href === 'eleves') && (routeKey === 'classes' || routeKey === 'eleves'));
      if (isMatch) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Active Nav Class in Mobile Bottom Nav Bar
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
      const routeAttr = item.getAttribute('data-route') || item.getAttribute('href').replace('#', '');
      const isMatch = routeAttr === routeKey || 
                      ((routeAttr === 'classes' || routeAttr === 'eleves') && (routeKey === 'classes' || routeKey === 'eleves'));
      if (isMatch) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close Mobile Sidebar on navigation if open
    if (App.closeSidebar) App.closeSidebar();

    // Render View Content
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = '';
      route.render(container);
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
