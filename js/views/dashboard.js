/**
 * Dashboard View Controller (js/views/dashboard.js)
 * Multi-activity analytics engine supporting all sports disciplines,
 * intelligent unit comparison (time vs distance vs height), and class filtering.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';

export function renderDashboard(container) {
  let activeDiscipline = 'ALL';
  let activeClasse = 'ALL';

  function computeDashboardStats() {
    const disciplinesList = db.getDisciplines();
    // 1. Fetch filtered evaluations
    const evaluations = db.getEvaluations(activeDiscipline, activeClasse);
    const validEvals = evaluations.filter(ev => ev.note !== null && !isNaN(ev.note));

    // 2. Fetch filtered students
    const eleves = db.getEleves(activeClasse);
    const totalEleves = eleves.length;
    const totalEvals = validEvals.length;

    // 3. Compute Averages and Success Rates
    let averageGradeStr = "-";
    let passRateStr = "Aucune donnée";
    let failRateStr = "Aucune donnée";
    let passCount = 0;
    let failCount = 0;

    if (totalEvals > 0) {
      const sumGrade = validEvals.reduce((acc, ev) => acc + ev.note, 0);
      averageGradeStr = (sumGrade / totalEvals).toFixed(2) + " / 20";

      validEvals.forEach(ev => {
        if (ev.note >= 10) passCount++;
        else failCount++;
      });

      const passPercent = Math.round((passCount / totalEvals) * 100);
      const failPercent = 100 - passPercent;
      passRateStr = `${passPercent}%`;
      failRateStr = `${failPercent}%`;
    }

    // 4. Compute Best Performance
    let bestPerfData = null;

    if (activeDiscipline !== 'ALL') {
      // Single discipline: find best performance according to activity physics
      const isTime = EPSEngine.isTimeDiscipline(activeDiscipline);
      let bestEv = null;

      validEvals.forEach(ev => {
        const perfVal = parseFloat(ev.distance);
        if (isNaN(perfVal) || perfVal <= 0) return;

        if (!bestEv) {
          bestEv = ev;
          return;
        }

        const currentBestVal = parseFloat(bestEv.distance);
        if (EPSEngine.isBetterPerformance(activeDiscipline, perfVal, currentBestVal)) {
          bestEv = ev;
        } else if (perfVal === currentBestVal && (ev.note || 0) > (bestEv.note || 0)) {
          bestEv = ev;
        }
      });

      if (bestEv) {
        const formatted = EPSEngine.formatPerformance(parseFloat(bestEv.distance), isTime, activeDiscipline);
        bestPerfData = {
          title: `Meilleure performance (${activeDiscipline})`,
          mainValue: formatted,
          subtitle: `${bestEv.eleveNom} (${bestEv.classeNom || bestEv.classe}) — Note: ${bestEv.note}/20`
        };
      } else {
        bestPerfData = {
          title: `Meilleure performance (${activeDiscipline})`,
          mainValue: "-",
          subtitle: "Aucune performance enregistrée"
        };
      }
    } else {
      // ALL disciplines: highlight overall highest grade or top performer without mixing meters and seconds
      let topGradeEv = null;
      validEvals.forEach(ev => {
        if (!topGradeEv || (ev.note || 0) > (topGradeEv.note || 0)) {
          topGradeEv = ev;
        }
      });

      if (topGradeEv) {
        const isTime = EPSEngine.isTimeDiscipline(topGradeEv.discipline);
        const formatted = EPSEngine.formatPerformance(parseFloat(topGradeEv.distance), isTime, topGradeEv.discipline);
        bestPerfData = {
          title: "Meilleure note générale",
          mainValue: `${topGradeEv.note} / 20`,
          subtitle: `${topGradeEv.eleveNom} · ${topGradeEv.discipline} (${formatted})`
        };
      } else {
        bestPerfData = {
          title: "Meilleure performance",
          mainValue: "-",
          subtitle: "Aucune évaluation enregistrée"
        };
      }
    }

    // 5. Compute discipline records breakdown (when all disciplines view)
    const recordsByDiscipline = [];
    if (activeDiscipline === 'ALL') {
      disciplinesList.forEach(disc => {
        const discEvals = validEvals.filter(ev => (ev.discipline || '').toLowerCase() === disc.nom.toLowerCase());
        if (discEvals.length === 0) return;

        const isTime = EPSEngine.isTimeDiscipline(disc.nom);
        let best = discEvals[0];

        discEvals.forEach(ev => {
          const val = parseFloat(ev.distance);
          const bestVal = parseFloat(best.distance);
          if (EPSEngine.isBetterPerformance(disc.nom, val, bestVal)) {
            best = ev;
          }
        });

        recordsByDiscipline.push({
          discipline: disc.nom,
          bestFormatted: EPSEngine.formatPerformance(parseFloat(best.distance), isTime, disc.nom),
          eleveNom: best.eleveNom,
          classe: best.classeNom || best.classe,
          note: best.note,
          count: discEvals.length
        });
      });
    }

    return {
      totalEleves,
      totalEvals,
      averageGradeStr,
      passRateStr,
      failRateStr,
      bestPerfData,
      recordsByDiscipline,
      evaluations: validEvals
    };
  }

  function render() {
    const currentProf = db.getCurrentProfesseur();
    const classesList = db.getClasses();
    const disciplinesList = db.getDisciplines();
    const stats = computeDashboardStats();

    container.innerHTML = `
      <div class="dashboard-wrapper">
        <!-- Top Toolbar with Activity & Class Filters -->
        <div class="card dash-filters-toolbar" style="margin-bottom: 24px; padding: 16px 20px; background: #ffffff;">
          <div class="dash-filters-inner">
            <div class="dash-filters-title">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--primary-light); color: var(--primary); display:flex; align-items:center; justify-content:center; font-size: 1.15rem; flex-shrink: 0;">
                <i class="fas fa-filter"></i>
              </div>
              <div>
                <h3 style="font-size: 1.05rem; margin:0; color: var(--text-main);">Filtres Analytiques</h3>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Affinez les statistiques par discipline ou classe</span>
              </div>
            </div>

            <div class="dash-filters-controls">
              <div class="form-group dash-filter-col" style="margin:0;">
                <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px;">Activité Sportive</label>
                <select class="form-select" id="dash-filter-discipline">
                  <option value="ALL" ${activeDiscipline === 'ALL' ? 'selected' : ''}>Toutes les activités (${disciplinesList.length})</option>
                  ${disciplinesList.map(d => `<option value="${d.nom}" ${activeDiscipline === d.nom ? 'selected' : ''}>${d.nom}</option>`).join('')}
                </select>
              </div>

              <div class="form-group dash-filter-col" style="margin:0;">
                <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px;">Classe Évaluée</label>
                <select class="form-select" id="dash-filter-classe">
                  <option value="ALL" ${activeClasse === 'ALL' ? 'selected' : ''}>Toutes les classes</option>
                  ${classesList.map(c => `<option value="${c.id}" ${activeClasse === c.id ? 'selected' : ''}>${c.nom} (${c.niveau})</option>`).join('')}
                </select>
              </div>

              ${(activeDiscipline !== 'ALL' || activeClasse !== 'ALL') ? `
                <button class="btn btn-secondary btn-sm dash-btn-reset" id="btn-reset-dash-filters" title="Réinitialiser les filtres">
                  <i class="fas fa-rotate-left"></i> Réinitialiser
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- KPI Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card cyan">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-info">
              <h3>${stats.totalEleves}</h3>
              <p>${activeClasse !== 'ALL' ? 'Élèves de la classe' : 'Élèves inscrits'}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
            <div class="stat-info">
              <h3>${stats.totalEvals}</h3>
              <p>Évaluations valides</p>
            </div>
          </div>

          <div class="stat-card emerald">
            <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
            <div class="stat-info">
              <h3>${stats.averageGradeStr}</h3>
              <p>Moyenne générale</p>
            </div>
          </div>

          <div class="stat-card amber">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-info">
              <h3>${stats.bestPerfData.mainValue}</h3>
              <p title="${stats.bestPerfData.subtitle}">${stats.bestPerfData.title}</p>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${stats.bestPerfData.subtitle}
              </span>
            </div>
          </div>

          <div class="stat-card emerald">
            <div class="stat-icon"><i class="fas fa-thumbs-up"></i></div>
            <div class="stat-info">
              <h3>${stats.passRateStr}</h3>
              <p>Taux de réussite (≥10/20)</p>
            </div>
          </div>

          <div class="stat-card rose">
            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-info">
              <h3>${stats.failRateStr}</h3>
              <p>Taux d'échec (<10/20)</p>
            </div>
          </div>
        </div>

        <!-- Records by Discipline (when 'Toutes les activités' is active) -->
        ${(activeDiscipline === 'ALL' && stats.recordsByDiscipline.length > 0) ? `
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3 class="card-title"><i class="fas fa-medal" style="color: #f59e0b;"></i> Records par Activité Sportive</h3>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${stats.recordsByDiscipline.length} disciplines évaluées</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
              ${stats.recordsByDiscipline.map(rec => `
                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${rec.discipline}</strong>
                    <span class="badge badge-note-high">${rec.note}/20</span>
                  </div>
                  <div style="font-family: 'IBM Plex Mono', monospace; font-size: 1.35rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
                    ${rec.bestFormatted}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    <i class="fas fa-user"></i> ${rec.eleveNom} (${rec.classe})
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-light); margin-top: 4px;">
                    ${rec.count} évaluation${rec.count > 1 ? 's' : ''} au total
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Main Dashboard Grid -->
        <div class="dashboard-main-grid">
          <!-- Recent Activity Table -->
          <div class="card">
            <div class="card-header">
              <div style="display:flex; align-items:center; gap: 8px;">
                <h3 class="card-title"><i class="fas fa-history"></i> Dernières Évaluations</h3>
                <span class="badge" style="background: var(--primary-light); color: var(--primary); font-size: 0.75rem;">
                  ${stats.evaluations.length} total
                </span>
              </div>
              <a href="#historique" class="btn btn-sm btn-secondary">Voir tout</a>
            </div>

            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Classe</th>
                    <th>Genre</th>
                    <th>Discipline</th>
                    <th>Performance</th>
                    <th>Note</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.evaluations.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align:center; padding: 36px 16px; color: var(--text-muted);">
                        <i class="fas fa-clipboard-question" style="font-size: 2rem; margin-bottom: 10px; display:block; opacity: 0.5;"></i>
                        Aucune évaluation trouvée pour les filtres sélectionnés.
                      </td>
                    </tr>
                  ` : stats.evaluations.slice(0, 7).map(ev => {
                    const isTime = EPSEngine.isTimeDiscipline(ev.discipline);
                    const perfFormatted = ev.performanceFormatted || EPSEngine.formatPerformance(parseFloat(ev.distance), isTime, ev.discipline);
                    return `
                      <tr>
                        <td><strong>${ev.eleveNom}</strong></td>
                        <td>${ev.classeNom || ev.classe}</td>
                        <td><span class="badge ${ev.genre === 'Garçon' ? 'badge-garcon' : 'badge-fille'}">${ev.genre}</span></td>
                        <td><span style="font-weight: 500; color: var(--primary);">${ev.discipline}</span></td>
                        <td><strong style="font-family: 'IBM Plex Mono', monospace;">${perfFormatted}</strong></td>
                        <td><span class="badge ${ev.note >= 14 ? 'badge-note-high' : ev.note >= 10 ? 'badge-note-mid' : 'badge-note-low'}">${ev.note} / 20</span></td>
                        <td>${new Date(ev.date).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quick Action & Discipline Guide -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fas fa-info-circle"></i> Modules & Accès Rapide</h3>
            </div>
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-muted);">
              <div style="margin-bottom: 16px; background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div style="font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                  <i class="fas fa-chalkboard-user" style="color: var(--primary);"></i> Espace Enseignant
                </div>
                <div style="font-size: 0.85rem;">
                  Professeur actif : <strong>${currentProf.nom} ${currentProf.prenom || ''}</strong>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-light);">
                  ${classesList.length} classe${classesList.length > 1 ? 's' : ''} gérée${classesList.length > 1 ? 's' : ''} · ${disciplinesList.length} disciplines EPS
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap: 10px;">
                <a href="#notation" class="btn btn-primary btn-lg" style="width: 100%; text-align:center;">
                  <i class="fas fa-stopwatch"></i> Lancer une Évaluation
                </a>
                <a href="#classes" class="btn btn-secondary" style="width: 100%; text-align:center;">
                  <i class="fas fa-users-rectangle"></i> Gérer mes classes & élèves
                </a>
                <a href="#baremes" class="btn btn-secondary" style="width: 100%; text-align:center;">
                  <i class="fas fa-table-list"></i> Consulter les barèmes
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    const selectDisc = container.querySelector('#dash-filter-discipline');
    const selectCls = container.querySelector('#dash-filter-classe');
    const btnReset = container.querySelector('#btn-reset-dash-filters');

    if (selectDisc) {
      selectDisc.addEventListener('change', () => {
        activeDiscipline = selectDisc.value;
        render();
      });
    }

    if (selectCls) {
      selectCls.addEventListener('change', () => {
        activeClasse = selectCls.value;
        render();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeDiscipline = 'ALL';
        activeClasse = 'ALL';
        render();
      });
    }
  }

  // Initial render
  render();

  // Listen for background updates
  window.addEventListener('eps:prof-changed', () => render());
  window.addEventListener('eps:db-ready', () => render());
  window.addEventListener('eps:db-synced', () => render());
}
