/**
 * Mes classes & Répertoire des Élèves View Controller (js/views/eleves.js)
 * Implements teacher class management, student roster, search, and CSV import wizard.
 */

import { db } from '../db.js';
import { Toast, Modal } from '../components.js';

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
                <div style="display:flex; align-items:center; gap: 10px; margin-top: 4px; font-size: 0.85rem; color: var(--text-muted);">
                  <span>Enseignant :</span>
                  <select class="form-select" id="select-active-prof" style="padding: 3px 10px; font-size: 0.82rem; width: auto; font-weight: 600;">
                    ${allProfesseurs.map(p => `
                      <option value="${p.id}" ${p.id === prof.id ? 'selected' : ''}>${p.nom} ${p.prenom || ''} (${p.etablissement || 'EPS'})</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

            <div style="display:flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="btn-import-csv">
                <i class="fas fa-file-csv"></i> Importer une liste (CSV)
              </button>
              <button class="btn btn-primary" id="btn-create-class">
                <i class="fas fa-plus-circle"></i> Nouvelle classe
              </button>
            </div>
          </div>
        </div>

        <!-- Class Cards Grid -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin:0;">
            <i class="fas fa-layer-group" style="color:var(--primary); margin-right:6px;"></i> Vos classes actives (${myClasses.length})
          </h3>
          <span style="font-size: 0.82rem; color: var(--text-muted);">Cliquez sur une classe pour consulter et gérer ses élèves</span>
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
                          <i class="fas fa-file-csv"></i> Importer un fichier CSV
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

  // --- MODAL: ASSISTANT D'IMPORTATION CSV / EXCEL ---
  function openCsvImportModal() {
    const myClasses = db.getClasses();
    if (myClasses.length === 0) {
      Toast.show("Veuillez d'abord créer au moins une classe avant d'importer une liste.", "error");
      return;
    }

    const defaultCid = selectedClasseId !== 'ALL' ? selectedClasseId : myClasses[0].id;
    let parsedStudents = [];

    const contentHtml = `
      <div id="csv-wizard-container">
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); font-size: 0.88rem; line-height: 1.5;">
          <strong><i class="fas fa-circle-info" style="color:var(--primary);"></i> Format du fichier attendu :</strong>
          <p style="margin: 4px 0 8px; color: var(--text-muted);">
            Colonnes : <code>Nom;Prénom;Genre;Matricule</code> (séparateur point-virgule <code>;</code> ou virgule <code>,</code>).<br>
            Le genre doit être <strong>Garçon</strong> (ou M) ou <strong>Fille</strong> (ou F).
          </p>
          <a href="#" id="btn-download-csv-template" style="color: var(--primary); font-weight: 600; text-decoration: none; display: inline-flex; align-items:center; gap: 6px;">
            <i class="fas fa-download"></i> Télécharger un exemple de fichier CSV
          </a>
        </div>

        <div class="form-group">
          <label class="form-label">Classe de destination <span style="color:red;">*</span></label>
          <select class="form-select" id="csv-target-class" required>
            ${myClasses.map(c => `
              <option value="${c.id}" ${c.id === defaultCid ? 'selected' : ''}>${c.nom} (${c.niveau})</option>
            `).join('')}
          </select>
        </div>

        <div class="csv-dropzone" id="csv-dropzone">
          <i class="fas fa-cloud-arrow-up" style="font-size: 2.2rem; color: var(--primary); margin-bottom: 8px;"></i>
          <p style="margin: 0; font-weight: 600;">Sélectionnez ou glissez votre fichier CSV ici</p>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Fichiers .csv ou .txt acceptés (UTF-8)</span>
          <input type="file" id="csv-file-input" accept=".csv,.txt" style="display: none;" />
        </div>

        <div class="form-group">
          <label class="form-label" style="display:flex; justify-content:space-between;">
            <span>Ou collez directement votre liste (depuis Excel ou texte)</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Ex: DUPONT;Pierre;Garçon;MAT01</span>
          </label>
          <textarea class="form-control" id="csv-paste-area" rows="4" placeholder="DUPONT;Pierre;Garçon;MAT01&#10;KOUASSI;Awa;Fille;MAT02"></textarea>
        </div>

        <div id="csv-preview-area" style="display: none;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--text-main);">
            <i class="fas fa-list-check"></i> Prévisualisation de l'importation (<span id="csv-valid-count">0</span> élèves détectés)
          </h4>
          <div class="csv-preview-table-container">
            <table class="table" style="font-size: 0.82rem; margin: 0;">
              <thead>
                <tr>
                  <th>Statut</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Genre</th>
                  <th>Matricule</th>
                  <th>Note / Alerte</th>
                </tr>
              </thead>
              <tbody id="csv-preview-tbody">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Modal.open("Assistant d'Importation d'une Liste d'Élèves", contentHtml, async () => {
      const selectClass = document.getElementById('csv-target-class');
      if (!selectClass || !selectClass.value) {
        Toast.show("Veuillez sélectionner une classe de destination.", "error");
        return;
      }

      if (parsedStudents.length === 0) {
        Toast.show("Aucun élève valide à importer. Veuillez charger un fichier ou coller une liste.", "error");
        return;
      }

      const targetCid = selectClass.value;
      const targetClassObj = db.getClassById(targetCid);

      try {
        const result = await db.addElevesBatch(parsedStudents, targetCid);
        const addedCount = result.added.length;
        const dupCount = result.duplicates.length;
        const errCount = result.errors.length;

        let msg = `${addedCount} élève${addedCount > 1 ? 's' : ''} importé${addedCount > 1 ? 's' : ''} avec succès dans la classe ${targetClassObj.nom}.`;
        if (dupCount > 0) msg += ` (${dupCount} doublon${dupCount > 1 ? 's' : ''} ignoré${dupCount > 1 ? 's' : ''})`;

        Toast.show(msg, addedCount > 0 ? "success" : "info", 4500);
        selectedClasseId = targetCid;
        renderView();
      } catch (err) {
        Toast.show(err.message, "error");
      }
    });

    // Wire up parser logic inside modal
    setTimeout(() => {
      const fileInput = document.getElementById('csv-file-input');
      const dropzone = document.getElementById('csv-dropzone');
      const pasteArea = document.getElementById('csv-paste-area');
      const previewArea = document.getElementById('csv-preview-area');
      const previewTbody = document.getElementById('csv-preview-tbody');
      const validCountSpan = document.getElementById('csv-valid-count');
      const selectClass = document.getElementById('csv-target-class');
      const downloadTemplateBtn = document.getElementById('btn-download-csv-template');

      // Template Download Generator
      if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const csvHeader = "\uFEFFNom;Prénom;Genre;Matricule\nKOUASSI;Alexandre;Garçon;MAT-2026-001\nTOURE;Aminata;Fille;MAT-2026-002\nDIALLO;Moussa;Garçon;MAT-2026-003\nYAO;Marie-Ange;Fille;MAT-2026-004\n";
          const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.setAttribute("download", "modele_eleves_ghim_pro.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }

      function parseRawCsvText(text) {
        if (!text || !text.trim()) {
          parsedStudents = [];
          if (previewArea) previewArea.style.display = 'none';
          return;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        const targetCid = selectClass ? selectClass.value : defaultCid;
        const existingInClass = db.getEleves(targetCid);

        parsedStudents = [];
        const previewRows = [];

        // Check if first row is header
        let startIndex = 0;
        const firstLineLower = lines[0].toLowerCase();
        if (firstLineLower.includes("nom") && (firstLineLower.includes("prenom") || firstLineLower.includes("prénom"))) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          // Support semicolon, comma, and tab
          let delimiter = ';';
          if (line.includes(';')) delimiter = ';';
          else if (line.includes('\t')) delimiter = '\t';
          else if (line.includes(',')) delimiter = ',';

          const parts = line.split(delimiter).map(p => p.trim());
          const nom = (parts[0] || '').toUpperCase();
          const prenom = parts[1] || '';
          let genreRaw = parts[2] || '';
          const matricule = parts[3] || '';

          // Normalize gender
          let genre = '';
          const gLower = genreRaw.toLowerCase();
          if (gLower.startsWith('m') || gLower === 'garcon' || gLower === 'garçon') {
            genre = 'Garçon';
          } else if (gLower.startsWith('f') || gLower === 'fille') {
            genre = 'Fille';
          }

          let status = 'valid';
          let alert = 'Prêt';

          if (!nom || !prenom) {
            status = 'error';
            alert = 'Nom ou prénom manquant';
          } else if (!genre) {
            status = 'error';
            alert = `Genre invalide (${genreRaw || 'vide'})`;
          } else {
            // Check for duplicate in class
            const isDup = existingInClass.some(e => e.nom.toUpperCase() === nom && e.prenom.toLowerCase() === prenom.toLowerCase());
            if (isDup) {
              status = 'duplicate';
              alert = 'Déjà inscrit dans la classe';
            }
          }

          if (status === 'valid') {
            parsedStudents.push({ nom, prenom, genre, matricule });
          }

          previewRows.push({ status, nom, prenom, genre: genre || genreRaw, matricule, alert });
        }

        // Render preview table
        if (previewArea && previewTbody && validCountSpan) {
          previewArea.style.display = 'block';
          validCountSpan.textContent = String(parsedStudents.length);
          previewTbody.innerHTML = previewRows.map(r => `
            <tr>
              <td>
                <span class="csv-status-badge ${r.status === 'valid' ? 'csv-status-valid' : (r.status === 'duplicate' ? 'csv-status-dup' : 'csv-status-err')}">
                  ${r.status === 'valid' ? '<i class="fas fa-check"></i> Valide' : (r.status === 'duplicate' ? '<i class="fas fa-triangle-exclamation"></i> Doublon' : '<i class="fas fa-times"></i> Rejeté')}
                </span>
              </td>
              <td><strong>${r.nom || '-'}</strong></td>
              <td>${r.prenom || '-'}</td>
              <td>${r.genre || '-'}</td>
              <td>${r.matricule || '-'}</td>
              <td style="color:${r.status === 'valid' ? '#15803d' : '#b91c1c'}; font-weight:500;">${r.alert}</td>
            </tr>
          `).join('');
        }
      }

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        });

        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            handleFile(fileInput.files[0]);
          }
        });
      }

      function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          if (pasteArea) pasteArea.value = content;
          parseRawCsvText(content);
        };
        reader.readAsText(file, 'UTF-8');
      }

      if (pasteArea) {
        pasteArea.addEventListener('input', () => {
          parseRawCsvText(pasteArea.value);
        });
      }

      if (selectClass) {
        selectClass.addEventListener('change', () => {
          if (pasteArea && pasteArea.value) {
            parseRawCsvText(pasteArea.value);
          }
        });
      }
    }, 80);
  }

  // Initial render
  renderView();

  // Listen for background events
  window.addEventListener('eps:prof-changed', () => renderView());
  window.addEventListener('eps:db-ready', () => renderView());
}
