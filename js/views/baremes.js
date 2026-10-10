/**
 * Baremes View Controller (js/views/baremes.js)
 * View, edit, add, and save barèmes tables with full Engin and Discipline support.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { Toast, Modal } from '../components.js';

export function renderBaremes(container) {
  const classes = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"];
  const genres = ["Garçon", "Fille"];
  
  const disciplinesList = db.getDisciplines();
  if (disciplinesList.length === 0) {
    disciplinesList.push({ id: "poids", nom: "Lancer de poids", engins: ["3kg", "4kg", "5kg"] });
  }

  let currentDiscipline = disciplinesList[0].nom;
  let currentEngin = "3kg";
  let currentClasse = "Sixième";
  let currentGenre = "Garçon";

  container.innerHTML = `
    <div class="baremes-wrapper">
      <div class="bareme-filter-bar">
        <div class="form-group" style="margin-bottom:0; flex:1.2;">
          <label class="form-label">Discipline</label>
          <select class="form-select" id="filter-discipline">
            ${disciplinesList.map(d => `<option value="${d.nom}">${d.nom}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="group-filter-engin" style="margin-bottom:0; flex:1;">
          <label class="form-label">Engin (Poids)</label>
          <select class="form-select" id="filter-engin">
            <!-- Dynamically populated -->
          </select>
        </div>

        <div class="form-group" style="margin-bottom:0; flex:1;">
          <label class="form-label">Classe</label>
          <select class="form-select" id="filter-classe">
            ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-bottom:0; flex:1;">
          <label class="form-label">Genre</label>
          <select class="form-select" id="filter-genre">
            <option value="Garçon">Garçon</option>
            <option value="Fille">Fille</option>
          </select>
        </div>

        <button class="btn btn-primary" id="btn-save-bareme" style="margin-top:22px;">
          <i class="fas fa-save"></i> Enregistrer
        </button>

        <button class="btn btn-secondary" id="btn-reset-baremes" style="margin-top:22px;">
          <i class="fas fa-undo"></i> Barèmes Officiels
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="bareme-title"><i class="fas fa-table"></i> Grille Officielle de Cotation</h3>
          <button class="btn btn-sm btn-success" id="btn-add-row"><i class="fas fa-plus"></i> Ajouter une ligne</button>
        </div>

        <div class="table-responsive bareme-grid-table">
          <table class="table" id="bareme-table">
            <thead>
              <tr>
                <th>Note sur 20</th>
                <th id="th-perf-col">Seuil de Performance (m)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="bareme-tbody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const filterDiscipline = container.querySelector('#filter-discipline');
  const groupEngin = container.querySelector('#group-filter-engin');
  const filterEngin = container.querySelector('#filter-engin');
  const filterClasse = container.querySelector('#filter-classe');
  const filterGenre = container.querySelector('#filter-genre');
  const btnSave = container.querySelector('#btn-save-bareme');
  const btnReset = container.querySelector('#btn-reset-baremes');
  const btnAddRow = container.querySelector('#btn-add-row');

  const baremeTitle = container.querySelector('#bareme-title');
  const thPerfCol = container.querySelector('#th-perf-col');
  const tbody = container.querySelector('#bareme-tbody');

  let activeBareme = null;

  function updateEnginsList() {
    const disciplineNom = filterDiscipline.value;
    const discObj = disciplinesList.find(d => d.nom === disciplineNom);
    const engins = (discObj && discObj.engins && discObj.engins.length > 0) ? discObj.engins : [];

    if (engins.length > 0) {
      groupEngin.style.display = 'block';
      filterEngin.innerHTML = engins.map(e => `<option value="${e}">${e}</option>`).join('');
      currentEngin = filterEngin.value;
    } else {
      groupEngin.style.display = 'none';
      filterEngin.innerHTML = '';
      currentEngin = null;
    }
  }

  function loadActiveBareme() {
    currentDiscipline = filterDiscipline.value;
    currentEngin = filterEngin.value || null;
    currentClasse = filterClasse.value;
    currentGenre = filterGenre.value;

    const isTime = currentDiscipline.toLowerCase().includes("course") || currentDiscipline.toLowerCase().includes("natation");
    thPerfCol.textContent = isTime ? "Seuil Temps (secondes)" : "Seuil Performance (mètres)";

    baremeTitle.innerHTML = `<i class="fas fa-table"></i> Grille Officielle : ${currentDiscipline} ${currentEngin ? currentEngin : ''} (${currentClasse} - ${currentGenre})`;

    const found = db.findBareme(currentDiscipline, currentClasse, currentGenre, currentEngin);

    if (found) {
      activeBareme = JSON.parse(JSON.stringify(found));
    } else {
      activeBareme = {
        id: `bar_${Date.now()}`,
        discipline: currentDiscipline,
        engin: currentEngin,
        classe: currentClasse,
        genre: currentGenre,
        type: isTime ? "temps" : "distance",
        grille: []
      };
    }

    renderTableRows();
  }

  function renderTableRows() {
    tbody.innerHTML = '';
    const sorted = [...(activeBareme.grille || [])].sort((a, b) => b.note - a.note);
    activeBareme.grille = sorted;

    if (sorted.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">
            <i class="fas fa-info-circle"></i> Aucun barème configuré pour cette sélection. Cliquez sur <strong>Barèmes Officiels</strong> pour charger la grille ministérielle ou sur <strong>Ajouter une ligne</strong>.
          </td>
        </tr>
      `;
      return;
    }

    sorted.forEach((row, index) => {
      const tr = document.createElement('tr');
      const isTime = activeBareme.type === "temps" || currentDiscipline.toLowerCase().includes("course") || currentDiscipline.toLowerCase().includes("natation");
      const distValue = isTime ? EPSEngine.formatPerformance(row.distanceMin, true, currentDiscipline) : row.distanceMin;

      tr.innerHTML = `
        <td>
          <input type="number" step="0.5" min="0" max="20" class="form-control bareme-row-input row-note" value="${row.note}" />
        </td>
        <td>
          <input type="text" class="form-control bareme-row-input row-dist" value="${distValue}" />
        </td>
        <td>
          <button class="btn btn-sm btn-danger delete-row-btn" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        activeBareme.grille.splice(idx, 1);
        renderTableRows();
      });
    });
  }

  btnAddRow.addEventListener('click', () => {
    if (!activeBareme.grille) activeBareme.grille = [];
    activeBareme.grille.push({ note: 10, distanceMin: 5.0 });
    renderTableRows();
  });

  filterDiscipline.addEventListener('change', () => {
    updateEnginsList();
    loadActiveBareme();
  });

  [filterEngin, filterClasse, filterGenre].forEach(el => {
    el.addEventListener('change', loadActiveBareme);
  });

  btnSave.addEventListener('click', () => {
    const rows = tbody.querySelectorAll('tr');
    const newGrille = [];

    rows.forEach(tr => {
      const noteInput = tr.querySelector('.row-note');
      const distInput = tr.querySelector('.row-dist');

      const note = parseFloat(noteInput.value);
      const distanceMin = EPSEngine.parsePerformance(distInput.value);

      if (!isNaN(note) && !isNaN(distanceMin)) {
        newGrille.push({ note, distanceMin });
      }
    });

    activeBareme.grille = newGrille;
    activeBareme.engin = currentEngin;
    db.saveBareme(activeBareme);
    Toast.show(`Barème ${currentClasse} ${currentDiscipline} (${currentGenre}) sauvegardé !`, "success");
  });

  btnReset.addEventListener('click', () => {
    Modal.open(
      "Réinitialiser les Barèmes Officiels",
      "<p>Voulez-vous restaurer les barèmes officiels ministériels d'origine pour toutes les classes et épreuves ?</p>",
      async () => {
        await db.resetToDefaults();
        Toast.show("Barèmes officiels restaurés avec succès !", "success");
        loadActiveBareme();
      }
    );
  });

  // Init
  updateEnginsList();
  loadActiveBareme();
}
