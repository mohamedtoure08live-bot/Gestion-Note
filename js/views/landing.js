/**
 * GHIM PRO — Landing Page View Controller (js/views/landing.js)
 * Preset: SPORT TECH PREMIUM
 * Implements high-end vitrine with live interactive widgets connected to real EPSEngine & DB.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { SupabaseManager } from '../supabaseClient.js';

export function renderLanding(container) {
  // Extract real database summary
  const eleves = db.getEleves();
  const evaluations = db.getEvaluations();
  const totalEleves = eleves.length;
  const totalEvals = evaluations.length;

  let averageGrade = "-";
  let passRate = "Aucune donnée";
  let topLauncher = "Aucune évaluation";

  if (evaluations.length > 0) {
    const validEvals = evaluations.filter(ev => ev.note !== null && !isNaN(ev.note));
    if (validEvals.length > 0) {
      const sum = validEvals.reduce((acc, ev) => acc + (ev.note || 0), 0);
      averageGrade = (sum / validEvals.length).toFixed(1) + " / 20";
      const passCount = validEvals.filter(ev => ev.note >= 10).length;
      passRate = Math.round((passCount / validEvals.length) * 100) + "%";
      
      let best = validEvals.reduce((prev, curr) => (curr.note > (prev.note || 0)) ? curr : prev, validEvals[0]);
      if (best && best.eleveNom) {
        topLauncher = `${best.eleveNom} (${best.note}/20)`;
      }
    }
  }

  container.innerHTML = `
    <div class="landing-view">
      <!-- =================================================================
           1. FLOATING NAVBAR
           ================================================================= -->
      <div class="lp-navbar-wrapper">
        <nav class="lp-navbar" id="lp-navbar" aria-label="Navigation principale">
          <a href="#hero" class="lp-brand">
            <div class="lp-brand-icon">
              <i class="fas fa-running"></i>
            </div>
            <div class="lp-brand-text">
              <span class="lp-brand-name">GHIM PRO</span>
              <span class="lp-brand-tag">EPS NOTATION & BARÈMES</span>
            </div>
          </a>

          <ul class="lp-nav-links">
            <li><a href="#hero" class="lp-nav-link active">Accueil</a></li>
            <li><a href="#features" class="lp-nav-link">Fonctionnalités</a></li>
            <li><a href="#how-it-works" class="lp-nav-link">Fonctionnement</a></li>
            <li><a href="#demo" class="lp-nav-link">Démonstration</a></li>
            <li><a href="#avantages" class="lp-nav-link">Avantages</a></li>
            <li><a href="#faq" class="lp-nav-link">FAQ</a></li>
          </ul>

          <div class="lp-nav-actions">
            <a href="#features" class="lp-btn lp-btn-secondary">Découvrir</a>
            <a href="#dashboard" class="lp-btn lp-btn-primary">
              <i class="fas fa-arrow-right-to-bracket"></i> Accéder à l'application
            </a>
            <button class="lp-mobile-toggle" id="lp-mobile-toggle" aria-label="Ouvrir le menu">
              <i class="fas fa-bars"></i>
            </button>
          </div>
        </nav>
      </div>

      <!-- Mobile Menu Drawer -->
      <div class="lp-mobile-drawer" id="lp-mobile-drawer">
        <a href="#hero" class="lp-nav-link lp-mobile-link">Accueil</a>
        <a href="#features" class="lp-nav-link lp-mobile-link">Fonctionnalités</a>
        <a href="#how-it-works" class="lp-nav-link lp-mobile-link">Fonctionnement</a>
        <a href="#demo" class="lp-nav-link lp-mobile-link">Démonstration</a>
        <a href="#avantages" class="lp-nav-link lp-mobile-link">Avantages</a>
        <a href="#faq" class="lp-nav-link lp-mobile-link">FAQ</a>
        <div class="lp-nav-actions">
          <a href="#dashboard" class="lp-btn lp-btn-primary">
            <i class="fas fa-arrow-right-to-bracket"></i> Accéder à l'application
          </a>
        </div>
      </div>

      <!-- =================================================================
           2. HERO SECTION
           ================================================================= -->
      <header class="lp-hero-section" id="hero">
        <div class="lp-container">
          <div class="lp-hero-grid">
            <!-- Left Column: Promise & CTAs -->
            <div class="lp-hero-content">
              <div class="lp-hero-badge">
                <i class="fas fa-bolt"></i> GHIM PRO · EPS NOTATION & BARÈMES
              </div>

              <h1 class="lp-hero-title">
                Évaluez les performances.<br>
                <span class="highlight-text">Simplifiez la notation.</span>
              </h1>

              <p class="lp-hero-desc">
                Un outil conçu pour organiser la saisie des performances sportives, faciliter la notation en EPS et rendre les résultats plus lisibles.
              </p>

              <div class="lp-hero-ctas">
                <a href="#dashboard" class="lp-btn lp-btn-primary" style="padding: 15px 32px; font-size: 1.05rem;">
                  <i class="fas fa-arrow-right"></i> Accéder à l'application
                </a>
                <a href="#features" class="lp-btn lp-btn-secondary" style="padding: 15px 28px; font-size: 1.05rem;">
                  <i class="fas fa-compass"></i> Découvrir les fonctionnalités
                </a>
              </div>

              <div class="lp-hero-trust">
                <i class="fas fa-shield-halved"></i>
                <span>Calculs officiels automatiques, conformité réglementaire & synchronisation cloud.</span>
              </div>
            </div>

            <!-- Right Column: Interactive Faithful Product Preview -->
            <div class="lp-hero-preview">
              <div class="lp-mockup-frame">
                <div class="lp-mockup-topbar">
                  <div class="lp-mockup-dots">
                    <span class="lp-mockup-dot red"></span>
                    <span class="lp-mockup-dot yellow"></span>
                    <span class="lp-mockup-dot green"></span>
                  </div>
                  <div class="lp-mockup-address">
                    <i class="fas fa-lock"></i> ghim-pro.app/notation
                  </div>
                  <div class="lp-mockup-cloud-badge">
                    <span id="lp-cloud-state">Cloud Synchronisé</span>
                  </div>
                </div>

                <div class="lp-mockup-body">
                  <!-- KPI Cards Row -->
                  <div class="lp-preview-kpis">
                    <div class="lp-preview-kpi">
                      <span>Moyenne Classe</span>
                      <strong>${averageGrade}</strong>
                    </div>
                    <div class="lp-preview-kpi">
                      <span>Taux Réussite</span>
                      <strong>${passRate}</strong>
                    </div>
                    <div class="lp-preview-kpi">
                      <span>Meilleur Lanceur</span>
                      <strong style="font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${topLauncher}</strong>
                    </div>
                  </div>

                  <!-- Live Interactive Card -->
                  <div class="lp-preview-calculator">
                    <div class="lp-preview-calc-header">
                      <div class="lp-preview-calc-title">
                        <i class="fas fa-stopwatch"></i> Simulateur Live EPS
                      </div>
                      <span class="lp-preview-calc-tag">Moteur EPSEngine</span>
                    </div>

                    <div class="lp-preview-calc-grid">
                      <div class="lp-preview-input-group">
                        <label>Activité</label>
                        <select id="hero-select-activity">
                          <option value="Lancer de poids">Lancer de poids</option>
                          <option value="Course 1000m">Course 1000m</option>
                          <option value="Course 800m">Course 800m</option>
                          <option value="Saut en longueur">Saut en longueur</option>
                        </select>
                      </div>

                      <div class="lp-preview-input-group">
                        <label>Classe & Genre</label>
                        <select id="hero-select-category">
                          <option value="Troisième_Fille">3e · Fille (Poids 3kg)</option>
                          <option value="Troisième_Garçon">3e · Garçon (Poids 4kg)</option>
                          <option value="Seconde_Garçon">2nde · Garçon (Poids 5kg)</option>
                          <option value="Sixième_Fille">6e · Fille (Poids 3kg)</option>
                        </select>
                      </div>
                    </div>

                    <div class="lp-preview-input-group" style="margin-bottom: 14px;">
                      <label style="display:flex; justify-content:space-between;">
                        <span>Performance réalisée</span>
                        <strong id="hero-perf-val" class="lp-mono" style="color:var(--lp-blue)">7.20 m</strong>
                      </label>
                      <input type="range" id="hero-perf-slider" min="3.0" max="12.0" step="0.1" value="7.2">
                    </div>

                    <div class="lp-preview-result-box">
                      <div class="lp-preview-result-info">
                        <span id="hero-calc-detail">Barème officiel de 3e Fille</span>
                        <strong id="hero-calc-appreciation">Très bonne performance</strong>
                      </div>
                      <div class="lp-preview-result-badge">
                        <div class="lp-preview-result-note" id="hero-calc-note">14.0</div>
                        <span class="lp-preview-result-total">/ 20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- =================================================================
           3. SECTION FONCTIONNALITÉS (3 GRANDES CARTES INTERACTIVES)
           ================================================================= -->
      <section class="lp-features-section" id="features">
        <div class="lp-container">
          <div class="lp-section-header">
            <span class="lp-section-tag"><i class="fas fa-layer-group"></i> Capacités Métier</span>
            <h2 class="lp-section-title">Tout pour une notation EPS plus structurée.</h2>
            <p class="lp-section-subtitle">
              Découvrez les outils qui facilitent la saisie, l'évaluation et la consultation des performances sportives.
            </p>
          </div>

          <div class="lp-features-grid">
            <!-- CARTE 1 — NOTATION DES PERFORMANCES -->
            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrapper">
                <i class="fas fa-calculator"></i>
              </div>
              <h3 class="lp-feature-title">Une notation plus pratique</h3>
              <p class="lp-feature-desc">
                Organisez la saisie des performances sportives et facilitez leur évaluation grâce aux outils de notation disponibles dans GHIM PRO.
              </p>

              <!-- Widget 1: Interactive Mini Calculator -->
              <div class="lp-feature-widget">
                <div class="lp-widget-mini-calc">
                  <div class="lp-widget-row">
                    <span>Discipline :</span>
                    <strong>Lancer de poids (3 kg)</strong>
                  </div>
                  <div class="lp-widget-row">
                    <span>Catégorie :</span>
                    <strong>Collège · 3e Fille</strong>
                  </div>

                  <div class="lp-widget-slider-box">
                    <label>
                      <span>Distance testée</span>
                      <span id="card1-dist-display" class="lp-mono">7.20 m</span>
                    </label>
                    <input type="range" id="card1-dist-slider" min="4.00" max="11.50" step="0.10" value="7.20">
                  </div>

                  <div class="lp-widget-score-pill">
                    <span>Note calculée instantanément :</span>
                    <strong id="card1-note-display" class="lp-mono">14.0 / 20</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- CARTE 2 — BARÈMES ET RÈGLES D'ÉVALUATION -->
            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrapper" style="background: rgba(34, 160, 107, 0.15); color: var(--lp-green);">
                <i class="fas fa-table-list"></i>
              </div>
              <h3 class="lp-feature-title">Des barèmes mieux structurés</h3>
              <p class="lp-feature-desc">
                Retrouvez les règles d'évaluation applicables aux activités prises en charge et facilitez la consultation des critères de notation.
              </p>

              <!-- Widget 2: Barème Table Preview -->
              <div class="lp-feature-widget">
                <table class="lp-widget-bareme-table">
                  <thead>
                    <tr>
                      <th>Paliers Distance</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>4.00 m - 4.49 m</td>
                      <td>08 / 20</td>
                    </tr>
                    <tr>
                      <td>5.40 m - 5.89 m</td>
                      <td>11 / 20</td>
                    </tr>
                    <tr class="highlight">
                      <td>7.20 m - 7.69 m</td>
                      <td>14 / 20 (Palier actif)</td>
                    </tr>
                    <tr>
                      <td>9.50 m et plus</td>
                      <td>20 / 20</td>
                    </tr>
                  </tbody>
                </table>
                <div class="lp-widget-rule-badge">
                  <i class="fas fa-shield-check"></i> Contrôle réglementaire de l'engin (3kg Fille)
                </div>
              </div>
            </div>

            <!-- CARTE 3 — TABLEAU DE BORD ET SUIVI -->
            <div class="lp-feature-card">
              <div class="lp-feature-icon-wrapper" style="background: #e0f2fe; color: #0284c7;">
                <i class="fas fa-chart-pie"></i>
              </div>
              <h3 class="lp-feature-title">Une vision plus claire des résultats</h3>
              <p class="lp-feature-desc">
                Consultez les informations disponibles dans le tableau de bord afin de mieux comprendre et suivre les données d'évaluation.
              </p>

              <!-- Widget 3: Live Real Analytics -->
              <div class="lp-feature-widget">
                <div class="lp-widget-dash-stats">
                  <div class="lp-widget-dash-box">
                    <span>Élèves enregistrés</span>
                    <strong>${totalEleves > 0 ? totalEleves : '32'}</strong>
                  </div>
                  <div class="lp-widget-dash-box">
                    <span>Évaluations</span>
                    <strong>${totalEvals > 0 ? totalEvals : '28'}</strong>
                  </div>
                </div>

                <div class="lp-widget-progress-row">
                  <label>
                    <span>Taux d'acquisition (Note &ge; 10)</span>
                    <strong class="lp-mono" style="color:var(--lp-green)">${passRate}</strong>
                  </label>
                  <div class="lp-widget-progress-bar">
                    <div class="lp-widget-progress-fill" style="width: ${passRate};"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           4. SECTION PHILOSOPHIE (FOND BLEU NUIT)
           ================================================================= -->
      <section class="lp-philosophy-section" id="philosophy">
        <div class="lp-container">
          <div class="lp-philosophy-wrapper">
            <div class="lp-philosophy-tag">
              <i class="fas fa-bullseye"></i> Raison d'être
            </div>

            <p class="lp-statement-lead">
              L'évaluation mérite des outils adaptés.
            </p>

            <h2 class="lp-statement-core">
              « La notation sportive peut demander du temps, de la rigueur et une attention constante aux règles d'évaluation.
              <br><br>
              GHIM PRO place la <span class="lp-accent-word clarity">Clarté</span>, la <span class="lp-accent-word structure">Structure</span> et la <span class="lp-accent-word precision">Précision</span> au cœur de la notation EPS. »
            </h2>

            <div class="lp-pillars-grid">
              <div class="lp-pillar-card">
                <div class="lp-pillar-num">PILIER 01</div>
                <h4 class="lp-pillar-title">Clarté</h4>
                <p class="lp-pillar-desc">
                  Une lecture immédiate des critères d'évaluation, des performances saisies et des notes attribuées pour chaque élève.
                </p>
              </div>

              <div class="lp-pillar-card">
                <div class="lp-pillar-num">PILIER 02</div>
                <h4 class="lp-pillar-title">Structure</h4>
                <p class="lp-pillar-desc">
                  Une organisation logique par classes, disciplines et barèmes officiels, pensée pour l'efficacité sur le terrain.
                </p>
              </div>

              <div class="lp-pillar-card">
                <div class="lp-pillar-num">PILIER 03</div>
                <h4 class="lp-pillar-title">Précision</h4>
                <p class="lp-pillar-desc">
                  Un moteur algorithmique fiable éliminant les erreurs manuelles et respectant strictement les règles de conformité sportive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           5. SECTION FONCTIONNEMENT (TROIS ÉTAPES)
           ================================================================= -->
      <section class="lp-how-section" id="how-it-works">
        <div class="lp-container">
          <div class="lp-section-header">
            <span class="lp-section-tag"><i class="fas fa-route"></i> Parcours Utilisateur</span>
            <h2 class="lp-section-title">De la performance au résultat, simplement.</h2>
            <p class="lp-section-subtitle">
              Trois étapes fluides conçues pour faire gagner un temps précieux lors des séances d'évaluation.
            </p>
          </div>

          <div class="lp-steps-grid">
            <!-- ÉTAPE 01 -->
            <div class="lp-step-card">
              <div class="lp-step-header">
                <div class="lp-step-number">01</div>
                <span class="lp-step-badge">Configuration</span>
              </div>
              <h3 class="lp-step-title">Sélectionnez l'activité</h3>
              <p class="lp-step-desc">
                Commencez par choisir l'activité ou le module d'évaluation disponible dans l'application (ex. Lancer de poids, Course, Sauts).
              </p>
              <div class="lp-step-visual">
                <div style="display:flex; align-items:center; gap:10px; font-size:0.85rem; color:var(--lp-dark); font-weight:600;">
                  <i class="fas fa-check-circle" style="color:var(--lp-blue)"></i> Lancer de poids · 3e Garçon (Engin 4kg)
                </div>
              </div>
            </div>

            <!-- ÉTAPE 02 -->
            <div class="lp-step-card">
              <div class="lp-step-header">
                <div class="lp-step-number">02</div>
                <span class="lp-step-badge">Mesure</span>
              </div>
              <h3 class="lp-step-title">Renseignez les performances</h3>
              <p class="lp-step-desc">
                Saisissez les données nécessaires à l'évaluation en respectant les règles prévues pour l'activité sélectionnée.
              </p>
              <div class="lp-step-visual">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                  <span style="color:var(--lp-gray-600)">Distance mesurée :</span>
                  <strong class="lp-mono" style="font-size:1.05rem; color:var(--lp-dark)">8.50 m</strong>
                </div>
              </div>
            </div>

            <!-- ÉTAPE 03 -->
            <div class="lp-step-card">
              <div class="lp-step-header">
                <div class="lp-step-number">03</div>
                <span class="lp-step-badge">Validation</span>
              </div>
              <h3 class="lp-step-title">Consultez le résultat</h3>
              <p class="lp-step-desc">
                Retrouvez le résultat calculé ou les informations d'évaluation proposées par l'application, prêts à être enregistrés.
              </p>
              <div class="lp-step-visual">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.85rem; color:var(--lp-green); font-weight:600;">
                    <i class="fas fa-check"></i> Barème validé
                  </span>
                  <strong class="lp-mono" style="font-size:1.2rem; color:var(--lp-blue)">15.5 / 20</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           6. SECTION DÉMONSTRATION
           ================================================================= -->
      <section class="lp-demo-section" id="demo">
        <div class="lp-container">
          <div class="lp-section-header">
            <span class="lp-section-tag"><i class="fas fa-desktop"></i> Interface Réelle</span>
            <h2 class="lp-section-title">Découvrez votre futur espace de notation.</h2>
            <p class="lp-section-subtitle">
              Explorez l'interface de GHIM PRO et découvrez comment ses outils s'intègrent à votre travail d'évaluation.
            </p>
          </div>

          <!-- Module Tabs Navigation -->
          <div class="lp-demo-tabs-nav" role="tablist">
            <button class="lp-demo-tab-btn active" data-tab="tab-dashboard" role="tab" aria-selected="true">
              <i class="fas fa-chart-pie"></i> Tableau de bord
            </button>
            <button class="lp-demo-tab-btn" data-tab="tab-notation" role="tab" aria-selected="false">
              <i class="fas fa-calculator"></i> Notation Rapide
            </button>
            <button class="lp-demo-tab-btn" data-tab="tab-baremes" role="tab" aria-selected="false">
              <i class="fas fa-table-list"></i> Gestion Barèmes
            </button>
            <button class="lp-demo-tab-btn" data-tab="tab-eleves" role="tab" aria-selected="false">
              <i class="fas fa-user-graduate"></i> Répertoire Élèves
            </button>
          </div>

          <!-- Window Frame Container -->
          <div class="lp-demo-window">
            <div class="lp-demo-window-top">
              <div class="lp-mockup-dots">
                <span class="lp-mockup-dot red"></span>
                <span class="lp-mockup-dot yellow"></span>
                <span class="lp-mockup-dot green"></span>
              </div>
              <div class="lp-mockup-address">
                <span id="demo-active-module-label">Module Tableau de bord analytique</span>
              </div>
              <div class="lp-mockup-cloud-badge">
                <span>Application En Service</span>
              </div>
            </div>

            <div class="lp-demo-window-content">
              <!-- Tab 1: Dashboard Panel -->
              <div class="lp-demo-tab-panel active" id="tab-dashboard">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-bottom: 24px;">
                  <div style="background:var(--lp-white); padding:20px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                    <div style="font-size:0.8rem; color:var(--lp-gray-600); margin-bottom:6px;"><i class="fas fa-users" style="color:var(--lp-blue)"></i> ÉLÈVES INSCRITS</div>
                    <div class="lp-mono" style="font-size:1.8rem; font-weight:700; color:var(--lp-dark);">${totalEleves}</div>
                  </div>
                  <div style="background:var(--lp-white); padding:20px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                    <div style="font-size:0.8rem; color:var(--lp-gray-600); margin-bottom:6px;"><i class="fas fa-check-double" style="color:var(--lp-green)"></i> ÉVALUATIONS TOTALES</div>
                    <div class="lp-mono" style="font-size:1.8rem; font-weight:700; color:var(--lp-dark);">${totalEvals}</div>
                  </div>
                  <div style="background:var(--lp-white); padding:20px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                    <div style="font-size:0.8rem; color:var(--lp-gray-600); margin-bottom:6px;"><i class="fas fa-award" style="color:#f59e0b)"></i> MOYENNE CLASSE</div>
                    <div class="lp-mono" style="font-size:1.8rem; font-weight:700; color:var(--lp-blue);">${averageGrade}</div>
                  </div>
                </div>
                <div style="background:var(--lp-white); padding:22px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                  <div style="font-weight:700; margin-bottom:12px; color:var(--lp-dark); display:flex; justify-content:space-between;">
                    <span>Répartition des résultats</span>
                    <span style="color:var(--lp-green); font-size:0.85rem;"><i class="fas fa-arrow-trend-up"></i> ${passRate} de réussite</span>
                  </div>
                  <div style="height:12px; background:var(--lp-gray-200); border-radius:999px; overflow:hidden; display:flex;">
                    <div style="width:${passRate}; background:var(--lp-green);" title="Note >= 10"></div>
                    <div style="flex:1; background:#f43f5e;" title="Note < 10"></div>
                  </div>
                </div>
              </div>

              <!-- Tab 2: Notation Panel -->
              <div class="lp-demo-tab-panel" id="tab-notation">
                <div style="background:var(--lp-white); padding:24px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                    <div>
                      <h4 style="margin:0; font-size:1.1rem; color:var(--lp-dark)">Évaluation Express du Lancer de Poids</h4>
                      <p style="margin:0; font-size:0.85rem; color:var(--lp-gray-600)">Barème officiel collège / lycée avec calcul proportionnel précis</p>
                    </div>
                    <span class="lp-badge" style="background:var(--lp-blue-light); color:var(--lp-blue); padding:4px 12px; border-radius:999px; font-size:0.75rem; font-weight:700;">
                      Interpolation Linéaire
                    </span>
                  </div>

                  <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:18px;">
                    <div style="background:var(--lp-gray-50); padding:10px 14px; border-radius:8px;">
                      <span style="font-size:0.72rem; color:var(--lp-gray-600)">DISCIPLINE</span>
                      <div style="font-weight:600; font-size:0.9rem;">Lancer de poids</div>
                    </div>
                    <div style="background:var(--lp-gray-50); padding:10px 14px; border-radius:8px;">
                      <span style="font-size:0.72rem; color:var(--lp-gray-600)">ENGIN</span>
                      <div style="font-weight:600; font-size:0.9rem;">4 kg (Garçon 3e)</div>
                    </div>
                    <div style="background:var(--lp-gray-50); padding:10px 14px; border-radius:8px;">
                      <span style="font-size:0.72rem; color:var(--lp-gray-600)">DISTANCE</span>
                      <div style="font-weight:600; font-size:0.9rem;" class="lp-mono">9.80 m</div>
                    </div>
                  </div>

                  <div style="background:linear-gradient(135deg, var(--lp-blue-light), #f0fdf4); border:1px solid rgba(36,87,214,0.2); padding:18px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-size:0.85rem; color:var(--lp-gray-600)">Résultat officiel attribué</div>
                      <div style="font-weight:700; color:var(--lp-dark); font-size:1.05rem;">Mention Très Bien</div>
                    </div>
                    <div class="lp-mono" style="font-size:2.2rem; font-weight:800; color:var(--lp-blue)">18.0 / 20</div>
                  </div>
                </div>
              </div>

              <!-- Tab 3: Baremes Panel -->
              <div class="lp-demo-tab-panel" id="tab-baremes">
                <div style="background:var(--lp-white); padding:24px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <div style="font-weight:700; color:var(--lp-dark);">Extrait de la table des barèmes intégrée</div>
                    <span style="font-size:0.8rem; color:var(--lp-gray-600)"><i class="fas fa-database"></i> 10 disciplines enregistrées</span>
                  </div>
                  <div style="overflow-x:auto;">
                    <table class="lp-widget-bareme-table" style="font-size:0.88rem;">
                      <thead>
                        <tr>
                          <th>Discipline</th>
                          <th>Classe</th>
                          <th>Genre</th>
                          <th>Engin</th>
                          <th>Paliers Officiels</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Lancer de poids</td>
                          <td>Troisième</td>
                          <td>Fille</td>
                          <td><span class="lp-mono">3kg</span></td>
                          <td>4.00m (8/20) &rarr; 9.50m (20/20)</td>
                        </tr>
                        <tr>
                          <td>Lancer de poids</td>
                          <td>Troisième</td>
                          <td>Garçon</td>
                          <td><span class="lp-mono">4kg</span></td>
                          <td>5.00m (8/20) &rarr; 11.00m (20/20)</td>
                        </tr>
                        <tr>
                          <td>Course 1000m</td>
                          <td>Troisième</td>
                          <td>Garçon</td>
                          <td>-</td>
                          <td>4'30'' (8/20) &rarr; 2'55'' (20/20)</td>
                        </tr>
                        <tr>
                          <td>Saut en longueur</td>
                          <td>Sixième</td>
                          <td>Fille</td>
                          <td>-</td>
                          <td>1.60m (6.5/20) &rarr; 3.60m (20/20)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Tab 4: Eleves Panel -->
              <div class="lp-demo-tab-panel" id="tab-eleves">
                <div style="background:var(--lp-white); padding:24px; border-radius:12px; border:1px solid var(--lp-gray-200);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <div style="font-weight:700; color:var(--lp-dark);">Gestion du Répertoire des Élèves</div>
                    <span class="lp-mono" style="font-size:0.8rem; color:var(--lp-blue)">Tri par classe et genre</span>
                  </div>
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--lp-gray-50); border-radius:8px;">
                      <div><strong>KOUASSI</strong> Alexandre</div>
                      <div style="display:flex; gap:12px; font-size:0.85rem; color:var(--lp-gray-600);">
                        <span>3e A</span>
                        <span>Garçon</span>
                        <span style="color:var(--lp-green); font-weight:600;"><i class="fas fa-check"></i> Évalué (16/20)</span>
                      </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--lp-gray-50); border-radius:8px;">
                      <div><strong>TOURE</strong> Aminata</div>
                      <div style="display:flex; gap:12px; font-size:0.85rem; color:var(--lp-gray-600);">
                        <span>3e A</span>
                        <span>Fille</span>
                        <span style="color:var(--lp-green); font-weight:600;"><i class="fas fa-check"></i> Évalué (14.5/20)</span>
                      </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--lp-gray-50); border-radius:8px;">
                      <div><strong>BERNARD</strong> Lucas</div>
                      <div style="display:flex; gap:12px; font-size:0.85rem; color:var(--lp-gray-600);">
                        <span>2nde B</span>
                        <span>Garçon</span>
                        <span style="color:var(--lp-blue); font-weight:600;"><i class="fas fa-clock"></i> En attente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action -->
          <div class="lp-demo-action-bar">
            <a href="#dashboard" class="lp-btn lp-btn-primary" style="padding: 15px 36px; font-size: 1.05rem;">
              <i class="fas fa-rocket"></i> Explorer GHIM PRO
            </a>
          </div>
        </div>
      </section>

      <!-- =================================================================
           7. SECTION AVANTAGES
           ================================================================= -->
      <section class="lp-benefits-section" id="avantages">
        <div class="lp-container">
          <div class="lp-section-header">
            <span class="lp-section-tag"><i class="fas fa-star"></i> Bénéfices Concrets</span>
            <h2 class="lp-section-title">Une expérience pensée pour l'évaluation sportive.</h2>
            <p class="lp-section-subtitle">
              Des atouts majeurs conçus pour fluidifier le quotidien pédagogique des enseignants d'EPS.
            </p>
          </div>

          <div class="lp-benefits-grid">
            <!-- Avantage 1 -->
            <div class="lp-benefit-card">
              <div class="lp-benefit-icon">
                <i class="fas fa-eye"></i>
              </div>
              <h3 class="lp-benefit-title">Clarté</h3>
              <p class="lp-benefit-desc">
                Des informations organisées pour faciliter la lecture et la compréhension immédiate des résultats.
              </p>
            </div>

            <!-- Avantage 2 -->
            <div class="lp-benefit-card">
              <div class="lp-benefit-icon">
                <i class="fas fa-folder-tree"></i>
              </div>
              <h3 class="lp-benefit-title">Organisation</h3>
              <p class="lp-benefit-desc">
                Un environnement numérique conçu pour regrouper les outils d'évaluation et les répertoires disponibles.
              </p>
            </div>

            <!-- Avantage 3 -->
            <div class="lp-benefit-card">
              <div class="lp-benefit-icon">
                <i class="fas fa-scale-balanced"></i>
              </div>
              <h3 class="lp-benefit-title">Cohérence</h3>
              <p class="lp-benefit-desc">
                Une meilleure visibilité sur les critères de notation et les règles applicables aux activités prises en charge.
              </p>
            </div>

            <!-- Avantage 4 -->
            <div class="lp-benefit-card">
              <div class="lp-benefit-icon">
                <i class="fas fa-mobile-screen-button"></i>
              </div>
              <h3 class="lp-benefit-title">Accessibilité</h3>
              <p class="lp-benefit-desc">
                Une interface responsive qui s'adapte avec précision aux ordinateurs, aux tablettes et aux smartphones.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           8. SECTION FAQ
           ================================================================= -->
      <section class="lp-faq-section" id="faq">
        <div class="lp-container">
          <div class="lp-section-header">
            <span class="lp-section-tag"><i class="fas fa-circle-question"></i> Questions Fréquentes</span>
            <h2 class="lp-section-title">Vos questions sur GHIM PRO</h2>
            <p class="lp-section-subtitle">
              Toutes les réponses pour comprendre le fonctionnement, l'accès et les atouts de l'application.
            </p>
          </div>

          <div class="lp-faq-accordion" role="region" aria-label="Foire aux questions">
            <!-- FAQ 1 -->
            <div class="lp-faq-item active">
              <button class="lp-faq-question" aria-expanded="true" aria-controls="faq-ans-1">
                <span>Qu'est-ce que GHIM PRO ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-1">
                GHIM PRO est une application dédiée à la notation et aux barèmes d'évaluation en Éducation Physique et Sportive (EPS), conçue pour les enseignants du collège au lycée.
              </div>
            </div>

            <!-- FAQ 2 -->
            <div class="lp-faq-item">
              <button class="lp-faq-question" aria-expanded="false" aria-controls="faq-ans-2">
                <span>À quoi sert l'application ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-2">
                Elle permet de saisir rapidement les performances des élèves, d'appliquer automatiquement les barèmes officiels, de gérer les répertoires de classes et de suivre les statistiques et moyennes via un tableau de bord analytique.
              </div>
            </div>

            <!-- FAQ 3 -->
            <div class="lp-faq-item">
              <button class="lp-faq-question" aria-expanded="false" aria-controls="faq-ans-3">
                <span>Comment accéder à l'application ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-3">
                L'accès est direct et immédiat en cliquant sur le bouton « Accéder à l'application » ou via les onglets du tableau de bord. Les données sont conservées localement dans votre navigateur et synchronisées avec le cloud lorsque la connexion est active.
              </div>
            </div>

            <!-- FAQ 4 -->
            <div class="lp-faq-item">
              <button class="lp-faq-question" aria-expanded="false" aria-controls="faq-ans-4">
                <span>Les barèmes sont-ils automatiquement appliqués ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-4">
                Oui. Dès la saisie d'une distance ou d'un temps, le moteur vérifie la conformité de l'épreuve (genre, classe, poids d'engin réglementaire) et calcule immédiatement la note exacte sur 20, soit par palier soit par interpolation linéaire continue.
              </div>
            </div>

            <!-- FAQ 5 -->
            <div class="lp-faq-item">
              <button class="lp-faq-question" aria-expanded="false" aria-controls="faq-ans-5">
                <span>Peut-on utiliser GHIM PRO sur un téléphone ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-5">
                Absolument. L'interface a été spécialement conçue de manière responsive pour être manipulée confortablement sur smartphone ou tablette directement au bord de la piste ou dans le gymnase.
              </div>
            </div>

            <!-- FAQ 6 -->
            <div class="lp-faq-item">
              <button class="lp-faq-question" aria-expanded="false" aria-controls="faq-ans-6">
                <span>Comment obtenir de l'aide ou signaler une suggestion ?</span>
                <span class="lp-faq-icon"><i class="fas fa-chevron-down"></i></span>
              </button>
              <div class="lp-faq-answer" id="faq-ans-6">
                Vous pouvez consulter la documentation intégrée et le code source du projet sur le dépôt GitHub officiel associé.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           9. SECTION CTA FINALE
           ================================================================= -->
      <section class="lp-cta-section">
        <div class="lp-container">
          <div class="lp-cta-card">
            <div class="lp-cta-content">
              <h2 class="lp-cta-title">Prêt à découvrir une autre façon de gérer la notation EPS ?</h2>
              <p class="lp-cta-desc">
                Explorez GHIM PRO et découvrez les outils conçus pour structurer l'évaluation des performances sportives.
              </p>
              <div class="lp-cta-buttons">
                <a href="#dashboard" class="lp-btn lp-btn-green" style="padding: 16px 36px; font-size: 1.05rem;">
                  <i class="fas fa-rocket"></i> Accéder à GHIM PRO
                </a>
                <a href="#features" class="lp-btn lp-btn-secondary" style="background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.25);">
                  <i class="fas fa-list-check"></i> Découvrir les fonctionnalités
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================
           10. FOOTER
           ================================================================= -->
      <footer class="lp-footer">
        <div class="lp-container">
          <div class="lp-footer-grid">
            <!-- Col 1: Brand -->
            <div class="lp-footer-col brand">
              <div class="lp-brand" style="color: #fff;">
                <div class="lp-brand-icon" style="box-shadow: none;">
                  <i class="fas fa-running"></i>
                </div>
                <div class="lp-brand-text">
                  <span class="lp-brand-name" style="color:#fff;">GHIM PRO</span>
                  <span class="lp-brand-tag" style="color:#60a5fa;">EPS NOTATION & BARÈMES</span>
                </div>
              </div>
              <p>
                Des outils numériques pour structurer la notation et faciliter l'évaluation des performances sportives.
              </p>
            </div>

            <!-- Col 2: Navigation -->
            <div class="lp-footer-col">
              <h5>Navigation</h5>
              <ul class="lp-footer-links">
                <li><a href="#hero">Accueil</a></li>
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#how-it-works">Fonctionnement</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>

            <!-- Col 3: Application -->
            <div class="lp-footer-col">
              <h5>Application</h5>
              <ul class="lp-footer-links">
                <li><a href="#dashboard">Accéder à GHIM PRO</a></li>
                <li><a href="#notation">Notation Rapide</a></li>
                <li><a href="#baremes">Gestion des Barèmes</a></li>
                <li><a href="#eleves">Répertoire Élèves</a></li>
              </ul>
            </div>

            <!-- Col 4: Informations -->
            <div class="lp-footer-col">
              <h5>Informations</h5>
              <ul class="lp-footer-links">
                <li><span style="color:var(--lp-gray-300); font-size:0.9rem;"><i class="fas fa-database"></i> PostgreSQL & Supabase</span></li>
                <li><span style="color:var(--lp-gray-300); font-size:0.9rem;"><i class="fas fa-wifi"></i> Résilience Hors-Ligne</span></li>
                <li><span style="color:var(--lp-gray-300); font-size:0.9rem;"><i class="fas fa-shield-halved"></i> Barèmes Officiels</span></li>
              </ul>
            </div>
          </div>

          <!-- Bottom bar -->
          <div class="lp-footer-bottom">
            <div>
              &copy; 2026 GHIM PRO. Tous droits réservés.
            </div>
            <div class="lp-footer-status">
              <span class="lp-footer-status-dot"></span>
              <span id="lp-footer-status-text">Système Opérationnel (Cloud & Local)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Attach All Dynamic Micro-Interactions & Listeners
  setupLandingInteractions();
}

/**
 * Configure all micro-interactions, calculators, and navigation events
 */
function setupLandingInteractions() {
  // 1. Floating Navbar Scroll Observer
  const navbar = document.getElementById('lp-navbar');
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. Mobile Drawer Toggle
  const toggleBtn = document.getElementById('lp-mobile-toggle');
  const drawer = document.getElementById('lp-mobile-drawer');
  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const isOpen = drawer.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    drawer.querySelectorAll('.lp-mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    });
  }

  // 3. Hero Interactive Live Calculator
  const heroActivity = document.getElementById('hero-select-activity');
  const heroCat = document.getElementById('hero-select-category');
  const heroSlider = document.getElementById('hero-perf-slider');
  const heroPerfVal = document.getElementById('hero-perf-val');
  const heroCalcNote = document.getElementById('hero-calc-note');
  const heroCalcDetail = document.getElementById('hero-calc-detail');
  const heroCalcApprec = document.getElementById('hero-calc-appreciation');

  const updateHeroCalc = () => {
    if (!heroActivity || !heroCat || !heroSlider) return;

    const activity = heroActivity.value;
    const [classe, genre] = heroCat.value.split('_');
    const val = parseFloat(heroSlider.value) || 0;

    let engin = null;
    if (activity === 'Lancer de poids') {
      if (classe === 'Troisième' && genre === 'Fille') engin = '3kg';
      else if (classe === 'Troisième' && genre === 'Garçon') engin = '4kg';
      else if (classe === 'Seconde' && genre === 'Garçon') engin = '5kg';
      else engin = '3kg';
    }

    heroPerfVal.textContent = activity.includes('Course') ? `${val}s` : `${val.toFixed(2)} m`;

    if (!db.baremes || db.baremes.length === 0) {
      heroCalcNote.textContent = '14.0';
      heroCalcDetail.textContent = `Barème officiel ${classe} ${genre} ${engin ? '(' + engin + ')' : ''}`;
      heroCalcApprec.textContent = 'Très bonne performance';
      return;
    }

    try {
      const res = EPSEngine.calculateGrade(activity, classe, genre, val, engin, 'interpolation');
      if (res && res.valid) {
        heroCalcNote.textContent = Number(res.note).toFixed(1);
        heroCalcDetail.textContent = `Barème officiel ${classe} ${genre} ${engin ? '(' + engin + ')' : ''}`;
        heroCalcApprec.textContent = res.appreciation || 'Performance validée';
      } else {
        heroCalcNote.textContent = '-';
        heroCalcDetail.textContent = res.error || 'Non conforme';
        heroCalcApprec.textContent = 'Activité ou engin incompatible';
      }
    } catch (e) {
      console.warn("Calcul error:", e);
    }
  };

  if (heroSlider) heroSlider.addEventListener('input', updateHeroCalc);
  if (heroActivity) heroActivity.addEventListener('change', updateHeroCalc);
  if (heroCat) heroCat.addEventListener('change', updateHeroCalc);
  window.addEventListener('eps:db-ready', () => updateHeroCalc());
  updateHeroCalc();

  // 4. Feature Card 1 Live Slider
  const c1Slider = document.getElementById('card1-dist-slider');
  const c1ValDisplay = document.getElementById('card1-dist-display');
  const c1NoteDisplay = document.getElementById('card1-note-display');

  const updateCard1 = () => {
    if (!c1Slider || !c1ValDisplay || !c1NoteDisplay) return;
    const dist = parseFloat(c1Slider.value);
    c1ValDisplay.textContent = dist.toFixed(2) + ' m';
    if (!db.baremes || db.baremes.length === 0) {
      c1NoteDisplay.textContent = '14.0 / 20';
      return;
    }
    const gradeRes = EPSEngine.calculateGrade('Lancer de poids', 'Troisième', 'Fille', dist, '3kg', 'interpolation');
    if (gradeRes && gradeRes.valid) {
      c1NoteDisplay.textContent = `${Number(gradeRes.note).toFixed(1)} / 20`;
    }
  };

  if (c1Slider) c1Slider.addEventListener('input', updateCard1);
  window.addEventListener('eps:db-ready', () => updateCard1());
  updateCard1();

  // 5. Demonstration Tabs Switcher
  const tabBtns = document.querySelectorAll('.lp-demo-tab-btn');
  const tabPanels = document.querySelectorAll('.lp-demo-tab-panel');
  const moduleLabel = document.getElementById('demo-active-module-label');

  const tabLabels = {
    'tab-dashboard': 'Module Tableau de bord analytique',
    'tab-notation': 'Module Notation Rapide & Interpolation',
    'tab-baremes': 'Module Gestion des Barèmes Officiels',
    'tab-eleves': 'Module Répertoire & Suivi des Élèves'
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const activePanel = document.getElementById(targetTab);
      if (activePanel) activePanel.classList.add('active');

      if (moduleLabel && tabLabels[targetTab]) {
        moduleLabel.textContent = tabLabels[targetTab];
      }
    });
  });

  // 6. Accessible FAQ Accordion
  const faqItems = document.querySelectorAll('.lp-faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.lp-faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close other items for single active accordion style
      faqItems.forEach(other => {
        other.classList.remove('active');
        const btn = other.querySelector('.lp-faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard navigation (Enter / Space)
    questionBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        questionBtn.click();
      }
    });
  });

  // 7. Supabase Real-time Cloud Connection Listener for Landing Badges
  const cloudBadge = document.getElementById('lp-cloud-state');
  const footerStatus = document.getElementById('lp-footer-status-text');

  SupabaseManager.onStatusChange(connected => {
    if (cloudBadge) {
      cloudBadge.textContent = connected ? 'PostgreSQL Connecté' : 'Mode Hors-Ligne Prêt';
    }
    if (footerStatus) {
      footerStatus.textContent = connected ? 'Système Opérationnel (Cloud Supabase Connecté)' : 'Système Opérationnel (Mode Local Actif)';
    }
  });
}
