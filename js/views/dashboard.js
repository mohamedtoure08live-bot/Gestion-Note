/**
 * Dashboard View Controller (js/views/dashboard.js)
 * Computes & renders real-time stats, class breakdown, best launcher, pass/fail rate.
 */

import { db } from '../db.js';

export function renderDashboard(container) {
  const eleves = db.getEleves();
  const evaluations = db.getEvaluations();

  // Computations
  const totalEleves = eleves.length;
  const totalEvals = evaluations.length;

  let averageGrade = "N/A";
  let bestLauncher = { name: "Aucun", distance: 0, note: 0, classe: "-" };
  let passCount = 0;
  let failCount = 0;

  if (evaluations.length > 0) {
    const sumGrade = evaluations.reduce((acc, ev) => acc + (ev.note || 0), 0);
    averageGrade = (sumGrade / evaluations.length).toFixed(2) + " / 20";

    evaluations.forEach(ev => {
      if (ev.note >= 10) passCount++;
      else failCount++;

      if (ev.distance > bestLauncher.distance) {
        bestLauncher = {
          name: ev.eleveNom,
          distance: ev.distance,
          note: ev.note,
          classe: ev.classe
        };
      }
    });
  }

  const passRate = totalEvals > 0 ? Math.round((passCount / totalEvals) * 100) + "%" : "0%";
  const failRate = totalEvals > 0 ? Math.round((failCount / totalEvals) * 100) + "%" : "0%";

  container.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- KPI Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card cyan">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <h3>${totalEleves}</h3>
            <p>Élèves inscrits</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
          <div class="stat-info">
            <h3>${totalEvals}</h3>
            <p>Évaluations réalisées</p>
          </div>
        </div>

        <div class="stat-card emerald">
          <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
          <div class="stat-info">
            <h3>${averageGrade}</h3>
            <p>Moyenne générale</p>
          </div>
        </div>

        <div class="stat-card amber">
          <div class="stat-icon"><i class="fas fa-trophy"></i></div>
          <div class="stat-info">
            <h3>${bestLauncher.distance ? bestLauncher.distance + ' m' : '-'}</h3>
            <p>Meilleur Lanceur (${bestLauncher.name})</p>
          </div>
        </div>

        <div class="stat-card emerald">
          <div class="stat-icon"><i class="fas fa-thumbs-up"></i></div>
          <div class="stat-info">
            <h3>${passRate}</h3>
            <p>Taux de réussite (≥10/20)</p>
          </div>
        </div>

        <div class="stat-card rose">
          <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-info">
            <h3>${failRate}</h3>
            <p>Taux d'échec (<10/20)</p>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-main-grid">
        <!-- Recent Activity Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-history"></i> Dernières Évaluations</h3>
            <a href="#historique" class="btn btn-sm btn-secondary">Voir tout</a>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Classe</th>
                  <th>Genre</th>
                  <th>Distance</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${evaluations.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Aucune évaluation enregistrée.</td></tr>
                ` : evaluations.slice(0, 5).map(ev => `
                  <tr>
                    <td><strong>${ev.eleveNom}</strong></td>
                    <td>${ev.classe}</td>
                    <td><span class="badge ${ev.genre === 'Garçon' ? 'badge-garcon' : 'badge-fille'}">${ev.genre}</span></td>
                    <td><strong>${typeof ev.distance === 'number' ? ev.distance.toFixed(2) : ev.distance}</strong></td>
                    <td><span class="badge ${ev.note >= 14 ? 'badge-note-high' : ev.note >= 10 ? 'badge-note-mid' : 'badge-note-low'}">${ev.note} / 20</span></td>
                    <td>${new Date(ev.date).toLocaleDateString('fr-FR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Info Panel -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-info-circle"></i> Guide Rapide EPS</h3>
          </div>
          <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-muted);">
            <p style="margin-bottom: 12px;"><strong>🏆 Lancer de Poids Officiel</strong></p>
            <ul style="padding-left: 18px; margin-bottom: 16px;">
              <li>6ème / 5ème : Poids 3kg (Filles & Garçons)</li>
              <li>4ème : Poids 3kg (F & G)</li>
              <li>3ème : Poids 3kg (Filles), 4kg (Garçons)</li>
              <li>Lycee : 4kg (Filles), 5kg/6kg (Garçons)</li>
            </ul>
            <a href="#notation" class="btn btn-primary btn-lg" style="width: 100%;">
              <i class="fas fa-bolt"></i> Lancer une Évaluation
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}
