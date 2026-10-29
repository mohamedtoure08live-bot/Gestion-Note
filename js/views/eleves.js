/**
 * Mes classes & Répertoire des Élèves View Controller (js/views/eleves.js)
 * Implements teacher class management, student roster, search, and CSV import wizard.
 */

import { db } from '../db.js';
import { Toast, Modal } from '../components.js';
import { ImportEngine } from '../importEngine.js';

export function renderEleves(container) {
  const currentProf = db.getCurrentProfesseur();
  const allProfesseurs = db.getProfesseurs();
  const classesList = db.getClasses();
  const officialNiveaux = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"];

  // Default selected class: first available class or 'ALL'
  let selectedClasseId = classesList.length > 0 ? classesList[0].id : 'ALL';
  let searchTerm = '';
  let genderFilter = 'ALL';

  function renderView() {
    const prof = db.getCurrentProfesseur();
    const myClasses = db.getClasses();
    const students = db.getEleves(selectedClasseId);

    // Apply client-side search and gender filters
    const filteredStudents = students.filter(s => {
      const matchSearch = !searchTerm || 
        (s.nom && s.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.prenom && s.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.matricule && s.matricule.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchGender = genderFilter === 'ALL' || s.genre === genderFilter;
      return matchSearch && matchGender;
    });

    const activeClassObj = myClasses.find(c => c.id === selectedClasseId);

    container.innerHTML = `
      <div class="classes-wrapper">
        <!-- Top Toolbar & Teacher Context Header -->
        <div class="card" style="margin-bottom: 24px; padding: 20px 24px; background: #ffffff;">
          <div class="classes-header-bar" style="margin-bottom: 0;">
            <div style="display:flex; align-items:center; gap: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--primary-light); color: var(--primary); display:flex; align-items:center; justify-content:center; font-size: 1.4rem;">
                <i class="fas fa-chalkboard-user"></i>
              </div>
              <div>
                <h2 style="font-size: 1.25rem; margin: 0; color: var(--text-main);">Espace « Mes classes »</h2>
                <div class="class-prof-selector-row" style="display:flex; align-items:center; gap: 8px; margin-top: 6px; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
                  <span>Enseignant :</span>
                  ${allProfesseurs.length > 1 ? `
                    <select class="form-select" id="select-active-prof" style="padding: 4px 10px; font-size: 0.82rem; min-width: 180px; font-weight: 600;">
                      ${allProfesseurs.map(p => `
                        <option value="${p.id}" ${p.id === prof.id ? 'selected' : ''}>${p.nom} ${p.prenom || ''} (${p.etablissement || 'EPS'})</option>
                      `).join('')}
                    </select>
                  ` : `
                    <strong style="color: var(--text-main); font-weight: 600;">${prof.nom} ${prof.prenom || ''}</strong>
                    <span>(${prof.etablissement || 'Lycée Moderne'})</span>
                  `}
                </div>
              </div>
            </div>

            <div class="class-header-actions" style="display:flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="btn-import-csv">
                <i class="fas fa-file-excel"></i> Importer une classe (Excel, CSV, ODS)
              </button>
              <button class="btn btn-primary" id="btn-create-class">
                <i class="fas fa-plus-circle"></i> Nouvelle classe
              </button>
            </div>
          </div>
        </div>

        <!-- Class Cards Grid -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; flex-wrap: wrap; gap: 6px;">
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin:0;">
            <i class="fas fa-layer-group" style="color:var(--primary); margin-right:6px;"></i> Vos classes actives (${myClasses.length})
          </h3>
          <span class="classes-subtip" style="font-size: 0.8rem; color: var(--text-muted);">Cliquez sur une classe pour consulter et gérer ses élèves</span>
        </div>

        <div class="classes-cards-grid">
          <!-- Card 'Toutes les classes' -->
          <div class="class-card-item ${selectedClasseId === 'ALL' ? 'active' : ''}" data-class-id="ALL">
            <div class="class-card-header">
              <h4 class="class-card-title">
                <i class="fas fa-school" style="font-size: 1rem; color: var(--primary);"></i> Toutes les classes
              </h4>
              <span class="class-card-niveau">GLOBAL</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">Vue d'ensemble de tous les élèves enregistrés</p>
            <div class="class-card-stats">
              <span>Effectif total</span>
              <strong>${db.getEleves().length} élèves</strong>
            </div>
          </div>

          <!-- Dynamic Class Cards -->
          ${myClasses.map(c => {
            const count = db.getEleves(c.id).length;
            const isSelected = selectedClasseId === c.id;
            return `
              <div class="class-card-item ${isSelected ? 'active' : ''}" data-class-id="${c.id}">
                <div class="class-card-header">
                  <h4 class="class-card-title">
                    <i class="fas fa-users-rectangle" style="font-size: 1rem; color: var(--primary);"></i> ${c.nom}
                  </h4>
                  <span class="class-card-niveau">${c.niveau || c.nom || 'Officiel'}</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">
                  ${c.anneeScolaire ? `<i class="fas fa-calendar-alt"></i> ${c.anneeScolaire}` : '<i class="fas fa-calendar-alt"></i> 2026-2027'}
                  ${c.description ? `· ${c.description}` : ''}
                </div>
                <div class="class-card-stats">
                  <span>Effectif</span>
                  <strong>${count} élève${count > 1 ? 's' : ''}</strong>
                </div>
                <div style="display:flex; justify-content:flex-end; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                  <button class="btn btn-sm btn-secondary btn-edit-class" data-id="${c.id}" title="Modifier la classe" style="padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fas fa-pen"></i> Modifier
                  </button>
                  <button class="btn btn-sm btn-danger btn-delete-class" data-id="${c.id}" title="Supprimer la classe" style="padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Student Roster Management for Selected Class -->
        <div class="card" style="margin-bottom: 30px;">
          <div class="card-header" style="flex-wrap: wrap; gap: 14px;">
            <div>
              <h3 class="card-title">
                <i class="fas fa-user-graduate"></i> Élèves inscrits : 
                <span style="color: var(--primary);">${activeClassObj ? activeClassObj.nom + ' (' + activeClassObj.niveau + ')' : 'Toutes les classes'}</span>
              </h3>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${filteredStudents.length} élève${filteredStudents.length > 1 ? 's' : ''} affiché${filteredStudents.length > 1 ? 's' : ''}</span>
            </div>

            <!-- Roster Actions & Search -->
            <div style="display:flex; gap: 12px; align-items:center; flex-wrap: wrap;">
              <div style="position: relative; min-width: 220px;">
                <input type="text" class="form-control" id="search-student-input" placeholder="Rechercher par nom..." value="${searchTerm}" style="padding-left: 32px; font-size: 0.88rem;" />
                <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light); font-size: 0.85rem;"></i>
              </div>

              <select class="form-select" id="filter-gender-select" style="width: 140px; font-size: 0.88rem;">
                <option value="ALL" ${genderFilter === 'ALL' ? 'selected' : ''}>Tous genres</option>
                <option value="Garçon" ${genderFilter === 'Garçon' ? 'selected' : ''}>Garçons</option>
                <option value="Fille" ${genderFilter === 'Fille' ? 'selected' : ''}>Filles</option>
              </select>

              <button class="btn btn-primary" id="btn-add-student" style="font-size: 0.88rem;">
                <i class="fas fa-user-plus"></i> Ajouter un élève
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table" id="table-students-roster">
              <thead>
                <tr>
                  <th>Nom & Prénom</th>
                  <th>Classe</th>
                  <th>Genre</th>
                  <th>Matricule</th>
                  <th>Statut Évaluations</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStudents.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding: 40px 16px; color: var(--text-muted);">
                      <i class="fas fa-user-slash" style="font-size: 2rem; opacity: 0.4; display:block; margin-bottom: 8px;"></i>
                      Aucun élève trouvé dans cette classe.
                      <div style="margin-top: 12px;">
                        <button class="btn btn-sm btn-secondary" id="btn-empty-import-csv">
                          <i class="fas fa-file-excel"></i> Importer un fichier (Excel, CSV, ODS)
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : filteredStudents.map(el => {
                  const evalsCount = db.getEvaluations().filter(ev => ev.eleveId === el.id || ev.eleveNom === `${el.nom} ${el.prenom}`).length;
                  return `
                    <tr>
                      <td>
                        <strong>${el.nom}</strong> ${el.prenom}
                      </td>
                      <td>
                        <span class="badge" style="background: var(--primary-light); color: var(--primary); font-weight:600;">
                          ${el.classeNom || el.classe}
                        </span>
                      </td>
                      <td>
                        <span class="badge ${el.genre === 'Garçon' ? 'badge-garcon' : 'badge-fille'}">
                          ${el.genre}
                        </span>
                      </td>
                      <td>
                        <span style="font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; color: var(--text-muted);">
                          ${el.matricule || '-'}
                        </span>
                      </td>
                      <td>
                        ${evalsCount > 0 ? `
                          <span class="badge badge-note-high" title="${evalsCount} évaluation(s) enregistrée(s)">
                            <i class="fas fa-check-circle"></i> ${evalsCount} éval.
                          </span>
                        ` : `
                          <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-color);">
                            En attente
                          </span>
                        `}
                      </td>
                      <td style="text-align: right;">
                        <button class="btn btn-sm btn-secondary btn-edit-student" data-id="${el.id}" title="Modifier">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-student" data-id="${el.id}" title="Retirer de la classe">
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // 1. Select Active Teacher
    const profSelect = container.querySelector('#select-active-prof');
    if (profSelect) {
      profSelect.addEventListener('change', () => {
        db.setCurrentProfesseur(profSelect.value);
        Toast.show(`Profil enseignant actif : ${db.getCurrentProfesseur().nom}`, 'info');
        renderView();
      });
    }

    // 2. Click on Class Card
    container.querySelectorAll('.class-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        // Do not trigger if click originated on action buttons
        if (e.target.closest('button')) return;
        selectedClasseId = card.getAttribute('data-class-id');
        renderView();
      });
    });

    // 3. Search and Gender Filter
    const searchInput = container.querySelector('#search-student-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderView();
      });
    }

    const genderSelect = container.querySelector('#filter-gender-select');
    if (genderSelect) {
      genderSelect.addEventListener('change', (e) => {
        genderFilter = e.target.value;
        renderView();
      });
    }

    // 4. Create Class Modal
    const btnCreateClass = container.querySelector('#btn-create-class');
    if (btnCreateClass) {
      btnCreateClass.addEventListener('click', () => openClassModal());
    }

    // 5. Edit Class Buttons
    container.querySelectorAll('.btn-edit-class').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-id');
        const cObj = db.getClassById(cid);
        if (cObj) openClassModal(cObj);
      });
    });

    // 6. Delete Class Buttons
    container.querySelectorAll('.btn-delete-class').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-id');
        const cObj = db.getClassById(cid);
        if (!cObj) return;

        Modal.open(
          "Confirmation de suppression",
          `
            <p>Êtes-vous sûr de vouloir supprimer la classe <strong>${cObj.nom} (${cObj.niveau})</strong> ?</p>
            <p style="font-size:0.85rem; color: var(--text-muted); margin-top:8px;">
              <i class="fas fa-shield-halved" style="color:var(--primary);"></i> 
              Les élèves seront désassignés mais leurs évaluations passées seront conservées dans l'historique officiel.
            </p>
          `,
          async () => {
            try {
              await db.deleteClass(cid);
              Toast.show(`Classe ${cObj.nom} supprimée.`, 'success');
              if (selectedClasseId === cid) selectedClasseId = 'ALL';
              renderView();
            } catch (err) {
              Toast.show(err.message, 'error');
            }
          }
        );
      });
    });

    // 7. Add Student Modal
    const btnAddStudent = container.querySelector('#btn-add-student');
    if (btnAddStudent) {
      btnAddStudent.addEventListener('click', () => openStudentModal(null, selectedClasseId !== 'ALL' ? selectedClasseId : null));
    }

    // 8. Edit Student Buttons
    container.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-id');
        const el = db.getEleveById(sid);
        if (el) openStudentModal(el);
      });
    });

    // 9. Delete Student Buttons
    container.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-id');
        const el = db.getEleveById(sid);
        if (!el) return;

        Modal.open(
          "Retirer l'élève",
          `
            <p>Êtes-vous sûr de vouloir retirer <strong>${el.nom} ${el.prenom}</strong> de sa classe ?</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
              L'historique des notes et évaluations attribuées à cet élève reste préservé de manière sécurisée.
            </p>
          `,
          async () => {
            try {
              await db.deleteEleve(sid);
              Toast.show(`Élève ${el.nom} ${el.prenom} retiré.`, 'success');
              renderView();
            } catch (err) {
              Toast.show(err.message, 'error');
            }
          }
        );
      });
    });

    // 10. Open CSV Import Modal
    const btnImportCsv = container.querySelector('#btn-import-csv');
    const btnEmptyImport = container.querySelector('#btn-empty-import-csv');
    if (btnImportCsv) btnImportCsv.addEventListener('click', () => openCsvImportModal());
    if (btnEmptyImport) btnEmptyImport.addEventListener('click', () => openCsvImportModal());
  }

  // --- MODAL: CREATE / EDIT CLASS ---
  function openClassModal(classToEdit = null) {
    const isEdit = !!classToEdit;
    const title = isEdit ? "Modifier la classe" : "Créer une nouvelle classe";

    const contentHtml = `
      <form id="modal-class-form">
        <div class="form-group">
          <label class="form-label">Nom de la classe <span style="color:red;">*</span></label>
          <input type="text" class="form-control" id="class-input-nom" placeholder="Ex: 3e A, 6e 1, 2nde B..." value="${classToEdit ? classToEdit.nom : ''}" required />
          <small style="color:var(--text-muted);">Saisissez le nom utilisé dans votre établissement.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Niveau officiel (Barèmes EPS) <span style="color:red;">*</span></label>
          <select class="form-select" id="class-input-niveau" required>
            ${officialNiveaux.map(n => `
              <option value="${n}" ${classToEdit && classToEdit.niveau === n ? 'selected' : ''}>${n}</option>
            `).join('')}
          </select>
          <small style="color:var(--text-muted);">Définit les barèmes réglementaires appliqués aux élèves de cette classe.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Année Scolaire</label>
          <input type="text" class="form-control" id="class-input-annee" placeholder="Ex: 2026-2027" value="${classToEdit ? (classToEdit.anneeScolaire || '2026-2027') : '2026-2027'}" />
        </div>

        <div class="form-group">
          <label class="form-label">Description (facultative)</label>
          <textarea class="form-control" id="class-input-desc" rows="2" placeholder="Ex: Classe du lundi matin / section sportive">${classToEdit ? (classToEdit.description || '') : ''}</textarea>
        </div>
      </form>
    `;

    Modal.open(title, contentHtml, async () => {
      const inputNom = document.getElementById('class-input-nom');
      const inputNiveau = document.getElementById('class-input-niveau');
      const inputAnnee = document.getElementById('class-input-annee');
      const inputDesc = document.getElementById('class-input-desc');

      if (!inputNom || !inputNom.value.trim()) {
        Toast.show("Le nom de la classe est obligatoire.", "error");
        return;
      }

      const payload = {
        nom: inputNom.value.trim(),
        niveau: inputNiveau.value,
        anneeScolaire: inputAnnee.value.trim() || '2026-2027',
        description: inputDesc.value.trim()
      };

      try {
        if (isEdit) {
          await db.updateClass(classToEdit.id, payload);
          Toast.show(`Classe ${payload.nom} mise à jour avec succès.`, "success");
        } else {
          const created = await db.addClass(payload);
          selectedClasseId = created.id;
          Toast.show(`Classe ${payload.nom} créée avec succès.`, "success");
        }
        renderView();
      } catch (err) {
        Toast.show(err.message, "error");
      }
    });
  }

  // --- MODAL: CREATE / EDIT STUDENT ---
  function openStudentModal(studentToEdit = null, defaultClassId = null) {
    const isEdit = !!studentToEdit;
    const title = isEdit ? "Modifier l'élève" : "Ajouter un élève";
    const myClasses = db.getClasses();

    const contentHtml = `
      <form id="modal-student-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nom de famille <span style="color:red;">*</span></label>
            <input type="text" class="form-control" id="student-input-nom" placeholder="Ex: KOUASSI" value="${studentToEdit ? studentToEdit.nom : ''}" required style="text-transform: uppercase;" />
          </div>

          <div class="form-group">
            <label class="form-label">Prénom <span style="color:red;">*</span></label>
            <input type="text" class="form-control" id="student-input-prenom" placeholder="Ex: Marc" value="${studentToEdit ? studentToEdit.prenom : ''}" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Classe de rattachement <span style="color:red;">*</span></label>
            <select class="form-select" id="student-input-classe" required>
              ${myClasses.map(c => `
                <option value="${c.id}" ${(studentToEdit && studentToEdit.classeId === c.id) || (!studentToEdit && defaultClassId === c.id) ? 'selected' : ''}>
                  ${c.nom} (${c.niveau})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Genre <span style="color:red;">*</span></label>
            <select class="form-select" id="student-input-genre" required>
              <option value="Garçon" ${studentToEdit && studentToEdit.genre === 'Garçon' ? 'selected' : ''}>Garçon</option>
              <option value="Fille" ${studentToEdit && studentToEdit.genre === 'Fille' ? 'selected' : ''}>Fille</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Matricule / Identifiant (optionnel)</label>
          <input type="text" class="form-control" id="student-input-matricule" placeholder="Ex: MAT-2026-089" value="${studentToEdit ? (studentToEdit.matricule || '') : ''}" />
        </div>
      </form>
    `;

    Modal.open(title, contentHtml, async () => {
      const inputNom = document.getElementById('student-input-nom');
      const inputPrenom = document.getElementById('student-input-prenom');
      const inputClasse = document.getElementById('student-input-classe');
      const inputGenre = document.getElementById('student-input-genre');
      const inputMatricule = document.getElementById('student-input-matricule');

      if (!inputNom || !inputNom.value.trim() || !inputPrenom || !inputPrenom.value.trim()) {
        Toast.show("Le nom et le prénom sont obligatoires.", "error");
        return;
      }

      const payload = {
        nom: inputNom.value.trim().toUpperCase(),
        prenom: inputPrenom.value.trim(),
        genre: inputGenre.value,
        classeId: inputClasse.value,
        matricule: inputMatricule ? inputMatricule.value.trim() : ''
      };

      try {
        if (isEdit) {
          await db.updateEleve(studentToEdit.id, payload);
          Toast.show(`Élève ${payload.nom} ${payload.prenom} mis à jour.`, "success");
        } else {
          await db.addEleve(payload);
          Toast.show(`Élève ${payload.nom} ${payload.prenom} enregistré.`, "success");
        }
        renderView();
      } catch (err) {
        Toast.show(err.message, "error");
      }
    });
  }

  // --- MODAL: ASSISTANT D'IMPORTATION UNIVERSEL (EXCEL, ODS, CSV, TXT) ---
  function openCsvImportModal() {
    const myClasses = db.getClasses();
    if (myClasses.length === 0) {
      Toast.show("Veuillez d'abord créer au moins une classe avant d'importer une liste.", "error");
      return;
    }

    const defaultCid = selectedClasseId !== 'ALL' ? selectedClasseId : myClasses[0].id;

    // État interne de l'importation
    let currentFileName = '';
    let currentFormat = '';
    let currentWorkbook = null;
    let selectedSheetIndex = 0;
    let currentRows = [];
    let currentHeaders = [];
    let currentHeaderIndex = 0;
    let currentMapping = { colNom: -1, colPrenom: -1, colNomComplet: -1, colGenre: -1, colMatricule: -1 };
    let processedResult = { totalDataRows: 0, validStudents: [], invalidRows: [], duplicateRows: [], allProcessedRows: [] };

    const contentHtml = `
      <div id="import-wizard-container">
        <!-- Bandeau d'information multi-format -->
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); font-size: 0.88rem; line-height: 1.5;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div>
              <strong><i class="fas fa-circle-info" style="color:var(--primary);"></i> Formats de classeurs acceptés :</strong>
              <div class="import-format-pills">
                <span class="import-format-pill excel"><i class="fas fa-file-excel"></i> Excel (.xlsx)</span>
                <span class="import-format-pill excel"><i class="fas fa-file-excel"></i> Excel 97-2004 (.xls)</span>
                <span class="import-format-pill ods"><i class="fas fa-file-invoice"></i> OpenDocument (.ods)</span>
                <span class="import-format-pill csv"><i class="fas fa-file-csv"></i> Fichier CSV (.csv)</span>
                <span class="import-format-pill txt"><i class="fas fa-file-lines"></i> Texte Délimité (.txt)</span>
              </div>
            </div>
            <a href="#" id="btn-download-csv-template" style="color: var(--primary); font-weight: 600; text-decoration: none; display: inline-flex; align-items:center; gap: 6px; font-size: 0.82rem;">
              <i class="fas fa-download"></i> Télécharger un modèle CSV
            </a>
          </div>
        </div>

        <!-- Classe de destination -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight:600;">Classe de destination <span style="color:red;">*</span></label>
          <select class="form-select" id="import-target-class" required>
            ${myClasses.map(c => `
              <option value="${c.id}" ${c.id === defaultCid ? 'selected' : ''}>${c.nom} (${c.niveau})</option>
            `).join('')}
          </select>
        </div>

        <!-- Zone de dépôt universelle (Drag & Drop + File selector) -->
        <div class="csv-dropzone" id="import-dropzone">
          <i class="fas fa-cloud-arrow-up" style="font-size: 2.2rem; color: var(--primary); margin-bottom: 8px;"></i>
          <p style="margin: 0; font-weight: 600; font-size: 1rem;">Sélectionnez ou glissez votre fichier de classe ici</p>
          <span style="font-size: 0.82rem; color: var(--text-muted); display:block; margin-top: 4px;">
            Compatible Excel (.xlsx, .xls), LibreOffice (.ods), CSV (.csv) et Texte (.txt)
          </span>
          <input type="file" id="import-file-input" accept=".csv,.xlsx,.xls,.ods,.txt" style="display: none;" />
        </div>

        <!-- Sélecteur de feuille Excel (si classeur multi-feuilles) -->
        <div id="import-sheet-container" style="display: none; margin-bottom: 14px; background: var(--bg-main); padding: 12px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
          <label class="form-label" style="font-weight:600; margin-bottom: 6px; display:flex; align-items:center; gap:6px;">
            <i class="fas fa-table-cells" style="color:var(--primary);"></i> Feuille du classeur à importer :
          </label>
          <select class="form-select" id="import-sheet-select"></select>
        </div>

        <!-- Zone de saisie / collage direct (optionnelle) -->
        <details style="margin-bottom: 16px; font-size: 0.85rem; color: var(--text-muted);">
          <summary style="cursor: pointer; font-weight: 600; color: var(--primary); margin-bottom: 6px;">
            <i class="fas fa-paste"></i> Ou coller directement le contenu d'un tableau (CSV ou texte)
          </summary>
          <textarea class="form-control" id="import-paste-area" rows="3" placeholder="Nom;Prénom;Genre;Matricule&#10;KOUASSI;Jean;Garçon;MAT01&#10;TOURE;Awa;Fille;MAT02" style="margin-top: 6px;"></textarea>
        </details>

        <!-- Section de correspondance des colonnes (Column Mapping) -->
        <div id="import-mapping-card" class="import-mapping-card" style="display: none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <strong style="font-size: 0.9rem; color: var(--text-main);">
              <i class="fas fa-arrows-split-up-and-left" style="color:var(--primary);"></i> Correspondance des colonnes du fichier :
            </strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Ajustez les colonnes si nécessaire</span>
          </div>
          <div class="import-mapping-grid">
            <div>
              <label class="form-label" style="font-size:0.78rem; margin-bottom:4px;">Colonne NOM <span style="color:red;">*</span></label>
              <select class="form-select" id="map-col-nom" style="font-size:0.82rem; padding: 6px 10px;"></select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.78rem; margin-bottom:4px;">Colonne PRÉNOM <span style="color:red;">*</span></label>
              <select class="form-select" id="map-col-prenom" style="font-size:0.82rem; padding: 6px 10px;"></select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.78rem; margin-bottom:4px;">Ou NOM COMPLET (Nom & Prénoms)</label>
              <select class="form-select" id="map-col-nomcomplet" style="font-size:0.82rem; padding: 6px 10px;"></select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.78rem; margin-bottom:4px;">Colonne GENRE / SEXE <span style="color:red;">*</span></label>
              <select class="form-select" id="map-col-genre" style="font-size:0.82rem; padding: 6px 10px;"></select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.78rem; margin-bottom:4px;">Colonne MATRICULE (Optionnel)</label>
              <select class="form-select" id="map-col-matricule" style="font-size:0.82rem; padding: 6px 10px;"></select>
            </div>
          </div>
        </div>

        <!-- Synthèse et Prévisualisation des élèves -->
        <div id="import-preview-area" style="display: none;">
          <!-- Résumé chiffré -->
          <div class="import-stats-summary">
            <div class="import-stat-box val-total">
              <div class="stat-val" id="stat-total-rows">0</div>
              <div class="stat-lbl">Lignes détectées</div>
            </div>
            <div class="import-stat-box val-valid">
              <div class="stat-val" id="stat-valid-count">0</div>
              <div class="stat-lbl">Élèves valides</div>
            </div>
            <div class="import-stat-box val-dup">
              <div class="stat-val" id="stat-dup-count">0</div>
              <div class="stat-lbl">Doublons identifiés</div>
            </div>
            <div class="import-stat-box val-err">
              <div class="stat-val" id="stat-err-count">0</div>
              <div class="stat-lbl">Lignes rejetées</div>
            </div>
          </div>

          <!-- Options d'importation -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; flex-wrap:wrap; gap:8px;">
            <h4 style="font-size: 0.92rem; margin: 0; color: var(--text-main);">
              <i class="fas fa-list-check"></i> Prévisualisation des données (<span id="import-preview-notice">15 premières lignes</span>)
            </h4>
            <label style="font-size: 0.8rem; display: inline-flex; align-items:center; gap: 6px; cursor: pointer; user-select: none;">
              <input type="checkbox" id="import-allow-duplicates" />
              <span>Autoriser les doublons / homonymes si matricules distincts</span>
            </label>
          </div>

          <!-- Tableau d'aperçu -->
          <div class="csv-preview-table-container">
            <table class="table" style="font-size: 0.82rem; margin: 0;">
              <thead>
                <tr>
                  <th style="width: 50px;">Ligne</th>
                  <th style="width: 100px;">Statut</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Genre</th>
                  <th>Matricule</th>
                  <th>Détail / Motif</th>
                </tr>
              </thead>
              <tbody id="import-preview-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Modal.open("Assistant d'Importation de Classe (Multi-Format)", contentHtml, async () => {
      const selectClass = document.getElementById('import-target-class');
      if (!selectClass || !selectClass.value) {
        Toast.show("Veuillez sélectionner une classe de destination.", "error");
        return;
      }

      if (!processedResult || processedResult.validStudents.length === 0) {
        Toast.show("Aucun élève valide à importer. Veuillez charger un fichier contenant des élèves.", "error");
        return;
      }

      const targetCid = selectClass.value;
      const targetClassObj = db.getClassById(targetCid);
      const allowDupsCheckbox = document.getElementById('import-allow-duplicates');
      const allowDuplicates = allowDupsCheckbox ? allowDupsCheckbox.checked : false;

      // Liste à importer (prend TOUTES les lignes valides, pas seulement l'aperçu !)
      const studentsToImport = allowDuplicates
        ? [...processedResult.validStudents, ...processedResult.duplicateRows]
        : processedResult.validStudents;

      try {
        // Enregistrement par lots sécurisés avec attente et bilan complet
        const result = await db.addElevesBatch(studentsToImport, targetCid, { allowDuplicates });
        
        // Affichage du bilan complet et fiable (Phase 5)
        displayFinalImportReport({
          fileName: currentFileName || 'Fichier importé',
          format: currentFormat || 'Automatique',
          sheetName: currentWorkbook && currentWorkbook.sheets[selectedSheetIndex] ? currentWorkbook.sheets[selectedSheetIndex].name : 'Données',
          totalDataRows: processedResult.totalDataRows,
          validCount: processedResult.validStudents.length,
          importedCount: result.totalAdded,
          duplicateCount: result.duplicates.length,
          invalidCount: processedResult.invalidRows.length,
          failureCount: result.failures ? result.failures.length : 0,
          targetClassName: targetClassObj.nom,
          errors: processedResult.invalidRows,
          duplicates: result.duplicates,
          failures: result.failures || []
        });

        selectedClasseId = targetCid;
        renderView();
      } catch (err) {
        Toast.show("Erreur lors de l'enregistrement : " + err.message, "error");
      }
    });

    // Câblage des événements de l'assistant d'importation
    setTimeout(() => {
      const fileInput = document.getElementById('import-file-input');
      const dropzone = document.getElementById('import-dropzone');
      const pasteArea = document.getElementById('import-paste-area');
      const sheetContainer = document.getElementById('import-sheet-container');
      const sheetSelect = document.getElementById('import-sheet-select');
      const mappingCard = document.getElementById('import-mapping-card');
      const previewArea = document.getElementById('import-preview-area');
      const previewTbody = document.getElementById('import-preview-tbody');
      const previewNotice = document.getElementById('import-preview-notice');
      const statTotal = document.getElementById('stat-total-rows');
      const statValid = document.getElementById('stat-valid-count');
      const statDup = document.getElementById('stat-dup-count');
      const statErr = document.getElementById('stat-err-count');
      const selectClass = document.getElementById('import-target-class');
      const downloadTemplateBtn = document.getElementById('btn-download-csv-template');
      const allowDupsCheckbox = document.getElementById('import-allow-duplicates');

      // Sélecteurs de colonnes
      const mapNom = document.getElementById('map-col-nom');
      const mapPrenom = document.getElementById('map-col-prenom');
      const mapNomComplet = document.getElementById('map-col-nomcomplet');
      const mapGenre = document.getElementById('map-col-genre');
      const mapMatricule = document.getElementById('map-col-matricule');

      // Téléchargement du modèle CSV
      if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const csvHeader = "\uFEFFNom;Prénom;Genre;Matricule\nEXEMPLE_NOM;EXEMPLE_PRENOM;Garçon;MAT-001\nEXEMPLE_NOM2;EXEMPLE_PRENOM2;Fille;MAT-002\n";
          const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.setAttribute("download", "modele_eleves_ghim_pro.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }

      // Gestion du Glisser-Déposer
      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            loadFile(e.dataTransfer.files[0]);
          }
        });

        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            loadFile(fileInput.files[0]);
          }
        });
      }

      // Gestion du collage direct
      if (pasteArea) {
        pasteArea.addEventListener('input', () => {
          const text = pasteArea.value;
          if (text && text.trim()) {
            currentFileName = 'Texte collé';
            currentFormat = 'Texte CSV';
            loadTextContent(text);
          }
        });
      }

      // Changement de classe de destination
      if (selectClass) {
        selectClass.addEventListener('change', () => {
          if (currentRows && currentRows.length > 0) {
            reprocessData();
          }
        });
      }

      // Changement d'option doublons
      if (allowDupsCheckbox) {
        allowDupsCheckbox.addEventListener('change', () => {
          if (currentRows && currentRows.length > 0) {
            reprocessData();
          }
        });
      }

      // Chargement d'un fichier physique (Excel, ODS, CSV, TXT)
      async function loadFile(file) {
        if (!ImportEngine.isSupported(file.name)) {
          Toast.show(`Format non supporté (${file.name}). Utilisez .xlsx, .xls, .ods, .csv ou .txt.`, "error");
          return;
        }

        currentFileName = file.name;
        currentFormat = ImportEngine.getFormatLabel(file.name);

        try {
          const workbook = await ImportEngine.readWorkbook(file, file.name);
          currentWorkbook = workbook;
          selectedSheetIndex = 0;

          // Mise à jour de l'affichage de la dropzone avec le nom du fichier
          dropzone.innerHTML = `
            <i class="fas fa-file-circle-check" style="font-size: 2.2rem; color: #16a34a; margin-bottom: 6px;"></i>
            <p style="margin: 0; font-weight: 700; color: var(--text-main);">${file.name}</p>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${currentFormat} — ${(file.size / 1024).toFixed(1)} Ko</span>
            <div style="margin-top: 8px;">
              <span class="btn btn-sm btn-secondary" style="font-size: 0.78rem;">Changer de fichier</span>
            </div>
          `;

          // Gestion des feuilles si Excel/ODS
          if (workbook.sheets && workbook.sheets.length > 1) {
            sheetContainer.style.display = 'block';
            sheetSelect.innerHTML = workbook.sheets.map((s, idx) => `
              <option value="${idx}">${s.name} (${s.rowCount} lignes)</option>
            `).join('');
            sheetSelect.onchange = () => {
              selectedSheetIndex = parseInt(sheetSelect.value, 10) || 0;
              loadSelectedSheet();
            };
          } else {
            sheetContainer.style.display = 'none';
          }

          loadSelectedSheet();
        } catch (err) {
          Toast.show("Erreur de lecture du fichier : " + err.message, "error");
          console.error(err);
        }
      }

      // Chargement depuis texte brut
      function loadTextContent(text) {
        try {
          const parsed = ImportEngine.parseTextContent(text);
          currentWorkbook = parsed;
          selectedSheetIndex = 0;
          sheetContainer.style.display = 'none';
          loadSelectedSheet();
        } catch (err) {
          Toast.show("Erreur lors de l'analyse du texte : " + err.message, "error");
        }
      }

      // Chargement de la feuille sélectionnée
      function loadSelectedSheet() {
        if (!currentWorkbook || !currentWorkbook.sheets[selectedSheetIndex]) return;
        const sheet = currentWorkbook.sheets[selectedSheetIndex];
        currentRows = sheet.rows || [];

        if (currentRows.length === 0) {
          Toast.show("Cette feuille ne contient aucune ligne de données.", "warning");
          if (previewArea) previewArea.style.display = 'none';
          if (mappingCard) mappingCard.style.display = 'none';
          return;
        }

        // Détection des colonnes et en-têtes
        const detected = ImportEngine.detectColumns(currentRows);
        currentHeaderIndex = detected.headerRowIndex;
        currentHeaders = detected.headers;
        currentMapping = { ...detected.mapping };

        // Configuration des sélecteurs de colonnes
        populateMappingSelects();

        // Analyse et calcul des données
        reprocessData();
      }

      // Remplit les dropdowns de mapping de colonnes
      function populateMappingSelects() {
        if (!mappingCard) return;
        mappingCard.style.display = 'block';

        const buildOptions = (selectedIdx, allowNone = true) => {
          let opts = allowNone ? '<option value="-1">-- Aucun / Non applicable --</option>' : '';
          opts += currentHeaders.map((h, idx) => `
            <option value="${idx}" ${idx === selectedIdx ? 'selected' : ''}>Col ${idx + 1} : ${h}</option>
          `).join('');
          return opts;
        };

        mapNom.innerHTML = buildOptions(currentMapping.colNom);
        mapPrenom.innerHTML = buildOptions(currentMapping.colPrenom);
        mapNomComplet.innerHTML = buildOptions(currentMapping.colNomComplet);
        mapGenre.innerHTML = buildOptions(currentMapping.colGenre);
        mapMatricule.innerHTML = buildOptions(currentMapping.colMatricule);

        // Écoute des changements de mapping
        const onMappingChange = () => {
          currentMapping.colNom = parseInt(mapNom.value, 10);
          currentMapping.colPrenom = parseInt(mapPrenom.value, 10);
          currentMapping.colNomComplet = parseInt(mapNomComplet.value, 10);
          currentMapping.colGenre = parseInt(mapGenre.value, 10);
          currentMapping.colMatricule = parseInt(mapMatricule.value, 10);
          reprocessData();
        };

        mapNom.onchange = onMappingChange;
        mapPrenom.onchange = onMappingChange;
        mapNomComplet.onchange = onMappingChange;
        mapGenre.onchange = onMappingChange;
        mapMatricule.onchange = onMappingChange;
      }

      // Re-calcule et ré-affiche les données analysées
      function reprocessData() {
        if (!currentRows || currentRows.length === 0) return;

        const targetCid = selectClass ? selectClass.value : defaultCid;
        const existingInClass = db.getEleves(targetCid);

        processedResult = ImportEngine.processRows(
          currentRows,
          currentHeaderIndex,
          currentMapping,
          existingInClass
        );

        // Mise à jour des compteurs
        if (statTotal) statTotal.textContent = String(processedResult.totalDataRows);
        if (statValid) statValid.textContent = String(processedResult.validStudents.length);
        if (statDup) statDup.textContent = String(processedResult.duplicateRows.length);
        if (statErr) statErr.textContent = String(processedResult.invalidRows.length);

        // Mise à jour du libellé d'aperçu
        const previewLimit = 15;
        const displayedCount = Math.min(processedResult.allProcessedRows.length, previewLimit);
        if (previewNotice) {
          previewNotice.textContent = `${displayedCount} premier${displayedCount > 1 ? 's' : ''} élève${displayedCount > 1 ? 's' : ''} sur ${processedResult.totalDataRows} détecté${processedResult.totalDataRows > 1 ? 's' : ''}`;
        }

        // Rendu des lignes d'aperçu
        if (previewArea && previewTbody) {
          previewArea.style.display = 'block';

          const rowsToDisplay = processedResult.allProcessedRows.slice(0, previewLimit);
          previewTbody.innerHTML = rowsToDisplay.map(r => `
            <tr>
              <td style="color:var(--text-muted); font-size:0.75rem;">L${r.fileLineNumber}</td>
              <td>
                <span class="csv-status-badge ${r.status === 'valid' ? 'csv-status-valid' : (r.status === 'duplicate' ? 'csv-status-dup' : 'csv-status-err')}">
                  ${r.status === 'valid' ? '<i class="fas fa-check"></i> Valide' : (r.status === 'duplicate' ? '<i class="fas fa-triangle-exclamation"></i> Doublon' : '<i class="fas fa-times"></i> Rejeté')}
                </span>
              </td>
              <td><strong>${r.nom || '-'}</strong></td>
              <td>${r.prenom || '-'}</td>
              <td>${r.genre || '-'}</td>
              <td><code>${r.matricule || '-'}</code></td>
              <td style="color:${r.status === 'valid' ? '#15803d' : (r.status === 'duplicate' ? '#b45309' : '#b91c1c')}; font-weight:500;">
                ${r.message}
              </td>
            </tr>
          `).join('');
        }
      }
    }, 80);
  }

  // --- MODAL: BILAN DÉTAILLÉ DE L'IMPORTATION (PHASE 5) ---
  function displayFinalImportReport(report) {
    const isFullSuccess = report.failureCount === 0 && report.invalidCount === 0 && report.duplicateCount === 0;
    const isPartial = report.importedCount > 0 && (report.invalidCount > 0 || report.duplicateCount > 0 || report.failureCount > 0);

    const reportHtml = `
      <div style="padding: 6px 0;">
        <!-- En-tête du résultat -->
        <div style="text-align: center; padding: 18px 12px; background: ${isFullSuccess ? 'rgba(22, 163, 74, 0.08)' : (isPartial ? 'rgba(217, 119, 6, 0.08)' : 'rgba(220, 38, 38, 0.08)')}; border-radius: 8px; margin-bottom: 18px; border: 1px solid ${isFullSuccess ? '#16a34a' : (isPartial ? '#d97706' : '#dc2626')};">
          <i class="fas ${isFullSuccess ? 'fa-circle-check' : (isPartial ? 'fa-triangle-exclamation' : 'fa-circle-xmark')}" style="font-size: 2.8rem; color: ${isFullSuccess ? '#16a34a' : (isPartial ? '#d97706' : '#dc2626')}; margin-bottom: 8px;"></i>
          <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main);">
            ${isFullSuccess ? 'Importation 100% Réussie !' : (isPartial ? 'Importation terminée avec avertissements' : "Échec de l'importation")}
          </h3>
          <p style="margin: 4px 0 0; color: var(--text-muted); font-size: 0.9rem;">
            ${report.importedCount} élève${report.importedCount > 1 ? 's' : ''} enregistré${report.importedCount > 1 ? 's' : ''} avec succès dans la classe <strong>${report.targetClassName}</strong>.
          </p>
        </div>

        <!-- Récapitulatif métrique officiel (Phase 5) -->
        <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 10px; font-size: 0.92rem; color: var(--text-main); display:flex; justify-content:space-between;">
            <span><i class="fas fa-file-lines" style="color:var(--primary); margin-right:6px;"></i> Fichier : <strong>${report.fileName}</strong></span>
            <span style="font-size:0.8rem; color:var(--text-muted);">${report.format} (${report.sheetName})</span>
          </h4>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.88rem;">
            <div>• Lignes de données détectées : <strong>${report.totalDataRows}</strong></div>
            <div>• Élèves valides détectés : <strong>${report.validCount}</strong></div>
            <div style="color: #16a34a;">• Élèves effectivement importés : <strong>${report.importedCount}</strong></div>
            <div style="color: #d97706;">• Doublons ignorés : <strong>${report.duplicateCount}</strong></div>
            <div style="color: ${report.invalidCount > 0 ? '#dc2626' : 'var(--text-muted)'};">• Lignes invalides rejetées : <strong>${report.invalidCount}</strong></div>
            <div style="color: ${report.failureCount > 0 ? '#dc2626' : 'var(--text-muted)'};">• Échecs d'enregistrement : <strong>${report.failureCount}</strong></div>
          </div>
        </div>

        <!-- Détail des exclusions ou erreurs (si présentes) -->
        ${report.invalidCount > 0 || report.duplicateCount > 0 || report.failureCount > 0 ? `
          <div style="margin-top: 14px;">
            <strong style="font-size: 0.88rem; color: var(--text-main); display:block; margin-bottom: 6px;">
              <i class="fas fa-circle-exclamation" style="color:#d97706;"></i> Détail des élèves non importés :
            </strong>
            <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.8rem;">
              <table class="table" style="margin: 0;">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Nom & Prénom</th>
                    <th>Matricule</th>
                    <th>Motif de l'exclusion</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.errors.map(e => `
                    <tr>
                      <td>L${e.fileLineNumber}</td>
                      <td><strong>${e.nom || '-'}</strong> ${e.prenom || ''}</td>
                      <td>${e.matricule || '-'}</td>
                      <td style="color:#dc2626;">${e.message}</td>
                    </tr>
                  `).join('')}
                  ${report.duplicates.map(d => `
                    <tr>
                      <td>-</td>
                      <td><strong>${d.nom}</strong> ${d.prenom}</td>
                      <td>${d.matricule || '-'}</td>
                      <td style="color:#d97706;">Doublon : ${d.reason}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 18px; text-align: right;">
          <button class="btn btn-primary" id="btn-close-import-report">
            <i class="fas fa-check"></i> Terminer et afficher la classe
          </button>
        </div>
      </div>
    `;

    Modal.open("Bilan de l'Importation de Classe", reportHtml, () => {});

    setTimeout(() => {
      const btnClose = document.getElementById('btn-close-import-report');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          Modal.close();
        });
      }
    }, 50);
  }

  // Initial render
  renderView();

  // Listen for background events
  window.addEventListener('eps:prof-changed', () => renderView());
  window.addEventListener('eps:db-ready', () => renderView());
}
