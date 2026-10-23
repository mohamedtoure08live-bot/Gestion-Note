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

const appRoutes = {
  'dashboard': { title: 'Tableau de Bord Analytics', render: renderDashboard },
  'notation': { title: 'Évaluation & Calcul de Note', render: renderNotation },
  'baremes': { title: 'Gestion des Barèmes Officiels', render: renderBaremes },
  'classes': { title: 'Mes classes & Répertoire des Élèves', render: renderEleves },
  'eleves': { title: 'Mes classes & Répertoire des Élèves', render: renderEleves },
  'historique': { title: 'Historique des Évaluations', render: renderHistorique }
};

const landingSections = ['hero', 'features', 'philosophy', 'how-it-works', 'demo', 'avantages', 'faq'];

class App {
  static async init() {
    console.log("Initializing GHIM PRO Application Full Stack...");

    // Setup Cloud Status Listener for app header badge
    App.setupCloudStatus();

    // Setup Navigation Hashchange Listener
    window.addEventListener('hashchange', () => App.navigate());

    // Toggle Mobile Sidebar inside App
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

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

    // Close Mobile Sidebar on navigation
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('open');

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
