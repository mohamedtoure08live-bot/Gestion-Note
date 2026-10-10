/**
 * Historique View Controller (js/views/historique.js)
 * View, search, export and manage evaluations history.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { Toast, Modal } from '../components.js';

export function renderHistorique(container) {
  container.innerHTML = `
    <div class="historique-wrapper">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-history"></i> Historique des Évaluations</h3>
          
          <div style="display:flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <input type="text" class="form-control" id="search-eval" placeholder="Rechercher élève..." style="width: 220px;" />
            <button class="btn btn-secondary" id="btn-export-csv">
              <i class="fas fa-file-csv"></i> Exporter CSV
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-historique">
            <thead>
              <tr>
                <th>Date</th>
                <th>Élève</th>
                <th>Discipline (Engin)</th>
                <th>Classe</th>
                <th>Genre</th>
                <th>Distance</th>
                <th>Note sur 20</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="tbody-historique">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const tbody = container.querySelector('#tbody-historique');
  const searchInput = container.querySelector('#search-eval');
  const btnExportCsv = container.querySelector('#btn-export-csv');

  function renderHistory() {
    const evaluations = db.getEvaluations();
    const query = searchInput.value.toLowerCase().trim();

    const filtered = evaluations.filter(ev => 
      ev.eleveNom.toLowerCase().includes(query) ||
      ev.classe.toLowerCase().includes(query) ||
      ev.discipline.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Aucune évaluation trouvée.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(ev => `
      <tr>
        <td>${new Date(ev.date).toLocaleDateString('fr-FR')} ${new Date(ev.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</td>
        <td><strong>${ev.eleveNom}</strong></td>
        <td>${ev.discipline} ${ev.engin ? '(' + ev.engin + ')' : ''}</td>
        <td>${ev.classe}</td>
        <td><span class="badge ${ev.genre === 'Garçon' ? 'badge-garcon' : 'badge-fille'}">${ev.genre}</span></td>
        <td><strong>${typeof ev.distance === 'number' ? ev.distance.toFixed(2) : ev.distance}</strong></td>
        <td><span class="badge ${ev.note >= 14 ? 'badge-note-high' : ev.note >= 10 ? 'badge-note-mid' : 'badge-note-low'}">${ev.note} / 20</span></td>
        <td>
          <button class="btn btn-sm btn-danger btn-delete-eval" data-id="${ev.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-delete-eval').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        Modal.open(
          "Supprimer l'évaluation",
          "<p>Voulez-vous supprimer cette évaluation ?</p>",
          () => {
            db.deleteEvaluation(id);
            Toast.show("Évaluation supprimée.", "info");
            renderHistory();
          }
        );
      });
    });
  }

  searchInput.addEventListener('input', renderHistory);

  btnExportCsv.addEventListener('click', () => {
    const evaluations = db.getEvaluations();
    if (evaluations.length === 0) {
      Toast.show("Aucune donnée à exporter", "error");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Eleve,Discipline,Engin,Classe,Genre,Distance_m,Note_20\n";
    evaluations.forEach(ev => {
      csvContent += `"${ev.date}","${ev.eleveNom}","${ev.discipline}","${ev.engin}","${ev.classe}","${ev.genre}",${ev.distance},${ev.note}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evaluations_eps_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    Toast.show("Fichier CSV exporté avec succès !", "success");
  });

  renderHistory();
}
