/**
 * Baremes View Controller (js/views/baremes.js)
 * Strict Separation: Official Ministerial Scales (Protected Reference) vs Teacher's Custom Scales.
 * Allows teachers to consult official benchmarks, duplicate them into isolated custom scales,
 * and edit/manage their custom variants without ever modifying the official national reference.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { Toast, Modal } from '../components.js';
import { AuthManager } from '../auth.js';

export function renderBaremes(container) {
  const currentProf = AuthManager.getCurrentUser() || db.getCurrentProfesseur();
  const classes = EPSEngine.OFFICIAL_LEVELS;
  const genres = ["Garçon", "Fille"];
  
  const disciplinesList = db.getDisciplines();
  if (disciplinesList.length === 0) {
    disciplinesList.push({ id: "lancer_de_poids", nom: "Lancer de poids", engins: ["3kg", "4kg", "5kg"] });
  }

  let activeTab = 'official'; // 'official' | 'custom'
  let currentDiscipline = disciplinesList.find(d => d.nom === "Lancer de poids") ? "Lancer de poids" : disciplinesList[0].nom;
  let currentEngin = "3kg";
  let currentClasse = "Sixième";
  let currentGenre = "Garçon";

  let selectedCustomBaremeId = null;

  function renderView() {
    const customBaremes = db.getCustomBaremes(currentProf.id);

    container.innerHTML = `
      <div class="baremes-view-container">
        <!-- Top Navigation Segmented Tabs -->
        <div class="baremes-tabs-header">
          <div class="baremes-segmented-tabs">
            <button class="bareme-tab-btn ${activeTab === 'official' ? 'active' : ''}" id="tab-btn-official">
              <i class="fas fa-shield-halved"></i> Barèmes Officiels (Ministériels)
              <span class="badge badge-sm badge-official-tag"><i class="fas fa-lock"></i> Protégés</span>
            </button>
            <button class="bareme-tab-btn ${activeTab === 'custom' ? 'active' : ''}" id="tab-btn-custom">
              <i class="fas fa-sliders"></i> Mes Barèmes Personnalisés
              <span class="badge badge-sm badge-count-tag" id="custom-baremes-counter">${customBaremes.length}</span>
            </button>
          </div>

          <div class="baremes-teacher-badge">
            <i class="fas fa-chalkboard-user"></i> Espace de : <strong>${currentProf.prenom || ''} ${currentProf.nom || 'Enseignant'}</strong>
          </div>
        </div>

        <!-- TAB CONTENT 1 : BARÈMES OFFICIELS (RÉFÉRENCE NATIONALE PROTÉGÉE) -->
        <div class="bareme-tab-panel ${activeTab === 'official' ? 'active' : ''}" id="panel-official">
          <!-- Filter Bar -->
          <div class="bareme-filter-bar">
            <div class="form-group" style="margin-bottom:0; flex:1.2;">
              <label class="form-label">Discipline</label>
              <select class="form-select" id="official-filter-discipline">
                ${disciplinesList.map(d => `<option value="${d.nom}" ${d.nom === currentDiscipline ? 'selected' : ''}>${d.nom}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" id="group-official-engin" style="margin-bottom:0; flex:1;">
              <label class="form-label">Engin (Poids)</label>
              <select class="form-select" id="official-filter-engin">
                <!-- Dynamically populated -->
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0; flex:1;">
              <label class="form-label">Classe</label>
              <select class="form-select" id="official-filter-classe">
                ${classes.map(c => `<option value="${c}" ${c === currentClasse ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0; flex:1;">
              <label class="form-label">Genre</label>
              <select class="form-select" id="official-filter-genre">
                ${genres.map(g => `<option value="${g}" ${g === currentGenre ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>

            <div class="bareme-filter-actions">
              <button class="btn btn-primary" id="btn-create-custom-copy" style="white-space: nowrap;">
                <i class="fas fa-copy"></i> Créer une copie personnalisée
              </button>
            </div>
          </div>

          <!-- Official Scale Card -->
          <div class="card" style="margin-top: 16px;">
            <div class="card-header" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 class="card-title" id="official-bareme-title">
                  <i class="fas fa-table"></i> Grille Officielle Ministérielle
                </h3>
                <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; font-size: 0.78rem; font-weight: 700; border-radius: 20px;">
                  <i class="fas fa-lock"></i> Référence Nationale Protégée — Non Modifiable
                </span>
              </div>
              <button class="btn btn-sm btn-outline-primary" id="btn-create-custom-copy-top">
                <i class="fas fa-plus"></i> Dupliquer pour ma classe
              </button>
            </div>

            <div class="table-responsive bareme-grid-table">
              <table class="table" id="official-bareme-table">
                <thead>
                  <tr>
                    <th style="width: 140px;">Note sur 20</th>
                    <th id="th-official-perf">Seuil de Performance</th>
                    <th style="width: 180px;">Statut Réglementaire</th>
                  </tr>
                </thead>
                <tbody id="official-bareme-tbody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>

            <!-- Explanatory Educational Notice -->
            <div class="bareme-official-notice">
              <div class="notice-icon"><i class="fas fa-circle-info"></i></div>
              <div class="notice-text">
                <strong>Protection du Barème Officiel :</strong> Cette grille constitue la référence nationale d'évaluation EPS.
                Pour adapter les seuils ou notes à vos classes spécifiques, cliquez sur <strong>« Créer une copie personnalisée »</strong>.
                Vos modifications seront isolées dans votre espace personnel et ne modifieront jamais la référence officielle commune.
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT 2 : MES BARÈMES PERSONNALISÉS -->
        <div class="bareme-tab-panel ${activeTab === 'custom' ? 'active' : ''}" id="panel-custom">
          ${renderCustomBaremesPanelHtml(customBaremes)}
        </div>
      </div>
    `;

    setupEventListeners();
  }

  function renderCustomBaremesPanelHtml(customBaremes) {
    if (!customBaremes || customBaremes.length === 0) {
      return `
        <div class="card empty-state-card" style="padding: 48px 24px; text-align: center; margin-top: 16px;">
          <div class="empty-state-icon" style="font-size: 3rem; color: #94a3b8; margin-bottom: 16px;">
            <i class="fas fa-folder-open"></i>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
            Vous n'avez pas encore de barème personnalisé
          </h3>
          <p style="color: #64748b; max-width: 500px; margin: 0 auto 24px; font-size: 0.92rem; line-height: 1.5;">
            Créez une copie personnalisée à partir d'un barème officiel ministériel pour l'adapter aux capacités de vos élèves tout en conservant la référence officielle.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-empty-duplicate-official">
              <i class="fas fa-copy"></i> Dupliquer le barème officiel actuel
            </button>
            <button class="btn btn-secondary" id="btn-back-to-official">
              <i class="fas fa-arrow-left"></i> Consulter les barèmes officiels
            </button>
          </div>
        </div>
      `;
    }

    // If an active custom bareme is selected, find it, otherwise pick the first one
    let activeCustom = customBaremes.find(b => b.id === selectedCustomBaremeId) || customBaremes[0];
    selectedCustomBaremeId = activeCustom.id;

    const isTime = activeCustom.type === "temps" || EPSEngine.isTimeDiscipline(activeCustom.discipline);
    const unitLabel = EPSEngine.getDisciplineUnit(activeCustom.discipline);

    return `
      <!-- Selector & Actions for Custom Scales -->
      <div class="bareme-filter-bar" style="margin-top: 16px; align-items: flex-end;">
        <div class="form-group" style="margin-bottom:0; flex: 2; min-width: 240px;">
          <label class="form-label"><i class="fas fa-list-check"></i> Sélectionner un de vos barèmes personnalisés</label>
          <select class="form-select" id="select-custom-bareme-picker">
            ${customBaremes.map(cb => `
              <option value="${cb.id}" ${cb.id === activeCustom.id ? 'selected' : ''}>
                ${cb.nom} — ${cb.discipline} (${cb.classe} ${cb.genre}${cb.engin ? ', ' + cb.engin : ''})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="bareme-filter-actions" style="margin-bottom:0;">
          <button class="btn btn-outline-primary" id="btn-new-custom-from-official" title="Créer un nouveau barème personnalisé">
            <i class="fas fa-plus"></i> Nouveau barème
          </button>
          <button class="btn btn-secondary" id="btn-duplicate-custom" title="Dupliquer pour créer une variante">
            <i class="fas fa-clone"></i> Dupliquer
          </button>
          <button class="btn btn-danger" id="btn-delete-custom" title="Supprimer ce barème personnalisé">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </div>

      <!-- Editor Card -->
      <div class="card" style="margin-top: 16px;">
        <div class="card-header" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.75rem;">
                <i class="fas fa-user-pen"></i> Barème Personnalisé Enseignant
              </span>
              <span style="font-size: 0.78rem; color: var(--text-muted);">
                Activité : <strong>${activeCustom.discipline}</strong> (${activeCustom.classe} ${activeCustom.genre}${activeCustom.engin ? ' - ' + activeCustom.engin : ''})
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="text" id="input-custom-bareme-name" class="form-control" value="${activeCustom.nom || ''}" placeholder="Nommez votre barème..." style="font-weight: 700; font-size: 1.1rem; max-width: 480px;" />
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-success" id="btn-add-custom-row">
              <i class="fas fa-plus"></i> Ajouter un palier
            </button>
            <button class="btn btn-primary" id="btn-save-custom-bareme">
              <i class="fas fa-save"></i> Enregistrer
            </button>
          </div>
        </div>

        <div class="table-responsive bareme-grid-table">
          <table class="table" id="custom-bareme-table">
            <thead>
              <tr>
                <th style="width: 140px;">Note sur 20</th>
                <th>Seuil de Performance (${unitLabel})</th>
                <th style="width: 100px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="custom-bareme-tbody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>

        <div style="padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 0.82rem; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
          <span><i class="fas fa-shield-halved" style="color: #10b981;"></i> Ce barème vous appartient et n'affecte ni les autres enseignants ni le barème officiel.</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem;">ID: ${activeCustom.id}</span>
        </div>
      </div>
    `;
  }

  function setupEventListeners() {
    // 1. Tab switching
    const tabBtnOfficial = container.querySelector('#tab-btn-official');
    const tabBtnCustom = container.querySelector('#tab-btn-custom');

    if (tabBtnOfficial) {
      tabBtnOfficial.addEventListener('click', () => {
        activeTab = 'official';
        renderView();
      });
    }

    if (tabBtnCustom) {
      tabBtnCustom.addEventListener('click', () => {
        activeTab = 'custom';
        renderView();
      });
    }

    if (activeTab === 'official') {
      setupOfficialTabInteractions();
    } else {
      setupCustomTabInteractions();
    }
  }

  function setupOfficialTabInteractions() {
    const filterDisc = container.querySelector('#official-filter-discipline');
    const groupEngin = container.querySelector('#group-official-engin');
    const filterEngin = container.querySelector('#official-filter-engin');
    const filterClasse = container.querySelector('#official-filter-classe');
    const filterGenre = container.querySelector('#official-filter-genre');
    const tbody = container.querySelector('#official-bareme-tbody');
    const titleEl = container.querySelector('#official-bareme-title');
    const thPerf = container.querySelector('#th-official-perf');
    const btnCreateCopy = container.querySelector('#btn-create-custom-copy');
    const btnCreateCopyTop = container.querySelector('#btn-create-custom-copy-top');

    function updateEnginDropdown() {
      const discNom = filterDisc.value;
      const discObj = disciplinesList.find(d => d.nom === discNom);
      const engins = (discObj && discObj.engins && discObj.engins.length > 0) ? discObj.engins : [];

      if (engins.length > 0) {
        groupEngin.style.display = 'block';
        filterEngin.innerHTML = engins.map(e => `<option value="${e}" ${e === currentEngin ? 'selected' : ''}>${e}</option>`).join('');
        currentEngin = filterEngin.value;
      } else {
        groupEngin.style.display = 'none';
        filterEngin.innerHTML = '';
        currentEngin = null;
      }
    }

    function loadOfficialBareme() {
      currentDiscipline = filterDisc.value;
      currentEngin = filterEngin.value || null;
      currentClasse = filterClasse.value;
      currentGenre = filterGenre.value;

      const isTime = EPSEngine.isTimeDiscipline(currentDiscipline);
      const unitLabel = EPSEngine.getDisciplineUnit(currentDiscipline);
      thPerf.textContent = `Seuil de Performance (${unitLabel})`;

      titleEl.innerHTML = `<i class="fas fa-table"></i> Grille Officielle : ${currentDiscipline} ${currentEngin ? currentEngin : ''} (${currentClasse} - ${currentGenre})`;

      const officialBareme = db.findOfficialBareme(currentDiscipline, currentClasse, currentGenre, currentEngin);

      if (!officialBareme || !officialBareme.grille || officialBareme.grille.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">
              <i class="fas fa-info-circle"></i> Aucun barème officiel spécifique configuré pour cette combinaison.
            </td>
          </tr>
        `;
        return;
      }

      const sorted = [...officialBareme.grille].sort((a, b) => b.note - a.note);
      tbody.innerHTML = '';

      sorted.forEach(row => {
        const tr = document.createElement('tr');
        const perfFormatted = EPSEngine.formatPerformance(row.distanceMin, isTime, currentDiscipline);

        tr.innerHTML = `
          <td>
            <span class="badge badge-note-high" style="font-size: 0.95rem; font-weight: 700; padding: 4px 10px;">
              ${row.note} / 20
            </span>
          </td>
          <td>
            <strong style="font-family: var(--font-mono); font-size: 1.05rem; color: #1e293b;">
              ${perfFormatted}
            </strong>
          </td>
          <td>
            <span style="color: #059669; font-size: 0.82rem; font-weight: 600;">
              <i class="fas fa-lock"></i> Référence Ministérielle
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function promptCreateCustomCopy() {
      const officialBareme = db.findOfficialBareme(currentDiscipline, currentClasse, currentGenre, currentEngin);
      if (!officialBareme) {
        Toast.show("Impossible de dupliquer : barème officiel introuvable.", "error");
        return;
      }

      const defaultCustomName = `Mon barème — ${currentDiscipline}${currentEngin ? ' (' + currentEngin + ')' : ''} (${currentClasse} ${currentGenre})`;

      Modal.open(
        "Créer une copie personnalisée indépendante",
        `
          <p style="margin-bottom: 12px; color: #475569; font-size: 0.92rem;">
            Vous allez créer votre propre barème personnalisé basé sur la grille officielle.
            <strong>Le barème officiel restera strictement inchangé.</strong>
          </p>
          <div class="form-group">
            <label class="form-label">Nom de votre barème personnalisé :</label>
            <input type="text" id="modal-custom-name" class="form-control" value="${defaultCustomName}" />
          </div>
        `,
        () => {
          const modalInput = document.getElementById('modal-custom-name');
          const chosenName = modalInput ? modalInput.value.trim() : defaultCustomName;

          try {
            const newCustom = db.duplicateBaremeAsCustom(officialBareme.id, chosenName, currentProf.id);
            selectedCustomBaremeId = newCustom.id;
            activeTab = 'custom';
            Toast.show(`Barème personnalisé "${newCustom.nom}" créé avec succès !`, "success");
            renderView();
          } catch (err) {
            Toast.show(err.message || "Erreur lors de la création de la copie.", "error");
          }
        }
      );
    }

    filterDisc.addEventListener('change', () => {
      updateEnginDropdown();
      loadOfficialBareme();
    });

    [filterEngin, filterClasse, filterGenre].forEach(el => {
      el.addEventListener('change', loadOfficialBareme);
    });

    if (btnCreateCopy) btnCreateCopy.addEventListener('click', promptCreateCustomCopy);
    if (btnCreateCopyTop) btnCreateCopyTop.addEventListener('click', promptCreateCustomCopy);

    // Initial load
    updateEnginDropdown();
    loadOfficialBareme();
  }

  function setupCustomTabInteractions() {
    const customBaremes = db.getCustomBaremes(currentProf.id);

    // Empty state triggers
    const btnEmptyDup = container.querySelector('#btn-empty-duplicate-official');
    const btnBackOfficial = container.querySelector('#btn-back-to-official');

    if (btnEmptyDup) {
      btnEmptyDup.addEventListener('click', () => {
        const official = db.findOfficialBareme(currentDiscipline, currentClasse, currentGenre, currentEngin);
        if (official) {
          const newCustom = db.duplicateBaremeAsCustom(official.id, null, currentProf.id);
          selectedCustomBaremeId = newCustom.id;
          Toast.show(`Barème personnalisé créé avec succès !`, "success");
          renderView();
        }
      });
    }

    if (btnBackOfficial) {
      btnBackOfficial.addEventListener('click', () => {
        activeTab = 'official';
        renderView();
      });
    }

    if (!customBaremes || customBaremes.length === 0) return;

    let activeCustom = customBaremes.find(b => b.id === selectedCustomBaremeId) || customBaremes[0];
    selectedCustomBaremeId = activeCustom.id;

    const selectPicker = container.querySelector('#select-custom-bareme-picker');
    const nameInput = container.querySelector('#input-custom-bareme-name');
    const tbody = container.querySelector('#custom-bareme-tbody');
    const btnAddRow = container.querySelector('#btn-add-custom-row');
    const btnSave = container.querySelector('#btn-save-custom-bareme');
    const btnDuplicate = container.querySelector('#btn-duplicate-custom');
    const btnDelete = container.querySelector('#btn-delete-custom');
    const btnNewFromOfficial = container.querySelector('#btn-new-custom-from-official');

    function renderCustomRows() {
      tbody.innerHTML = '';
      const isTime = activeCustom.type === "temps" || EPSEngine.isTimeDiscipline(activeCustom.discipline);
      const sorted = [...(activeCustom.grille || [])].sort((a, b) => b.note - a.note);
      activeCustom.grille = sorted;

      if (sorted.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Aucun palier dans ce barème. Cliquez sur <strong>Ajouter un palier</strong> pour commencer.
            </td>
          </tr>
        `;
        return;
      }

      sorted.forEach((row, idx) => {
        const tr = document.createElement('tr');
        const displayPerf = isTime ? EPSEngine.formatPerformance(row.distanceMin, true, activeCustom.discipline) : row.distanceMin;

        tr.innerHTML = `
          <td>
            <input type="number" step="0.5" min="0" max="20" class="form-control row-custom-note" value="${row.note}" style="width: 100px; font-weight:700;" />
          </td>
          <td>
            <input type="text" class="form-control row-custom-dist" value="${displayPerf}" style="font-family: var(--font-mono); font-weight:600;" />
          </td>
          <td style="text-align: center;">
            <button class="btn btn-sm btn-danger delete-custom-row-btn" data-index="${idx}" title="Supprimer ce palier">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.delete-custom-row-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'));
          activeCustom.grille.splice(idx, 1);
          renderCustomRows();
        });
      });
    }

    if (selectPicker) {
      selectPicker.addEventListener('change', (e) => {
        selectedCustomBaremeId = e.target.value;
        renderView();
      });
    }

    if (btnAddRow) {
      btnAddRow.addEventListener('click', () => {
        if (!activeCustom.grille) activeCustom.grille = [];
        activeCustom.grille.push({ note: 10, distanceMin: 5.0 });
        renderCustomRows();
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const rows = tbody.querySelectorAll('tr');
        const newGrille = [];

        rows.forEach(tr => {
          const noteInput = tr.querySelector('.row-custom-note');
          const distInput = tr.querySelector('.row-custom-dist');
          if (noteInput && distInput) {
            const note = parseFloat(noteInput.value);
            const dist = EPSEngine.parsePerformance(distInput.value);
            if (!isNaN(note) && !isNaN(dist)) {
              newGrille.push({ note, distanceMin: dist });
            }
          }
        });

        activeCustom.grille = newGrille;
        activeCustom.nom = nameInput.value.trim() || activeCustom.nom;

        btnSave.disabled = true;
        btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sauvegarde...`;

        try {
          await db.saveCustomBareme(activeCustom, currentProf.id);
          Toast.show(`Barème personnalisé "${activeCustom.nom}" enregistré avec succès !`, "success");
          renderView();
        } catch (err) {
          Toast.show(err.message || "Erreur de sauvegarde", "error");
        } finally {
          btnSave.disabled = false;
          btnSave.innerHTML = `<i class="fas fa-save"></i> Enregistrer`;
        }
      });
    }

    if (btnDuplicate) {
      btnDuplicate.addEventListener('click', () => {
        Modal.open(
          "Dupliquer ce barème personnalisé",
          `
            <div class="form-group">
              <label class="form-label">Nom de la nouvelle variante :</label>
              <input type="text" id="modal-dup-name" class="form-control" value="Variante - ${activeCustom.nom}" />
            </div>
          `,
          () => {
            const nameEl = document.getElementById('modal-dup-name');
            const newName = nameEl ? nameEl.value.trim() : `Copie de ${activeCustom.nom}`;
            const dup = db.duplicateBaremeAsCustom(activeCustom.id, newName, currentProf.id);
            selectedCustomBaremeId = dup.id;
            Toast.show(`Variante "${dup.nom}" créée avec succès !`, "success");
            renderView();
          }
        );
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        Modal.open(
          "Supprimer ce barème personnalisé",
          `<p>Êtes-vous sûr de vouloir supprimer définitivement votre barème <strong>"${activeCustom.nom}"</strong> ? Vos évaluations passées utilisant ce barème conserveront leur instantané intact.</p>`,
          () => {
            try {
              db.deleteCustomBareme(activeCustom.id, currentProf.id);
              Toast.show("Barème personnalisé supprimé avec succès.", "info");
              const remaining = db.getCustomBaremes(currentProf.id);
              selectedCustomBaremeId = remaining.length > 0 ? remaining[0].id : null;
              renderView();
            } catch (err) {
              Toast.show(err.message || "Erreur lors de la suppression.", "error");
            }
          }
        );
      });
    }

    if (btnNewFromOfficial) {
      btnNewFromOfficial.addEventListener('click', () => {
        activeTab = 'official';
        renderView();
        Toast.show("Sélectionnez le barème officiel de votre choix, puis cliquez sur 'Créer une copie personnalisée'.", "info");
      });
    }

    renderCustomRows();
  }

  // Initial render
  renderView();
}
