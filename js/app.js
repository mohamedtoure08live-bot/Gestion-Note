/**
 * EPS Pro Application Entry Point & Router (js/app.js)
 * Full Stack PostgreSQL & Supabase orchestration
 */

import { db } from './db.js';
import { SupabaseManager } from './supabaseClient.js';
import { renderDashboard } from './views/dashboard.js';
import { renderNotation } from './views/notation.js';
import { renderBaremes } from './views/baremes.js';
import { renderEleves } from './views/eleves.js';
import { renderHistorique } from './views/historique.js';

const routes = {
  'dashboard': { title: 'Tableau de Bord Analytics', render: renderDashboard },
  'notation': { title: 'Évaluation & Calcul de Note', render: renderNotation },
  'baremes': { title: 'Gestion des Barèmes Officiels', render: renderBaremes },
  'eleves': { title: 'Répertoire des Élèves', render: renderEleves },
  'historique': { title: 'Historique des Évaluations', render: renderHistorique }
};

class App {
  static async init() {
    console.log("Initializing EPS Application Full Stack...");

    // Setup Cloud Status Listener
    App.setupCloudStatus();

    // Setup Navigation Listeners
    window.addEventListener('hashchange', () => App.navigate());
    
    // Toggle Mobile Sidebar
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
    await db.init();

    // Re-render active view with freshly synced cloud data
    App.navigate();
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
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    if (!routes[hash]) hash = 'dashboard';

    const route = routes[hash];

    // Update Header Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = route.title;

    // Update Active Nav Class
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href').replace('#', '');
      if (href === hash) {
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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
