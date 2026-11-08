/**
 * Mes classes & Répertoire des Élèves View Controller (js/views/eleves.js)
 * Implements teacher class management, student roster, search, and CSV import wizard.
 */

import { db } from '../db.js';
import { Toast, Modal } from '../components.js';
import { ImportEngine } from '../importEngine.js';
import { OCREngine } from '../ocrEngine.js';

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
              <button class="btn btn-secondary" id="btn-import-csv" title="Sélectionner un fichier CSV, Excel, ODS ou Texte">
                <i class="fas fa-file-excel"></i> Importer un fichier
              </button>
              <button class="btn btn-secondary" id="btn-import-photo" style="border-color: var(--primary); color: var(--primary);" title="Photographier une liste de classe ou sélectionner une image">
                <i class="fas fa-camera"></i> Importer par photo
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
                      <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-secondary" id="btn-empty-import-csv">
                          <i class="fas fa-file-excel"></i> Importer un fichier
                        </button>
                        <button class="btn btn-sm btn-secondary" id="btn-empty-import-photo" style="border-color: var(--primary); color: var(--primary);">
                          <i class="fas fa-camera"></i> Importer par photo
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

    // 10. Open CSV Import Modal & Photo Import Modal
    const btnImportCsv = container.querySelector('#btn-import-csv');
    const btnEmptyImport = container.querySelector('#btn-empty-import-csv');
    const btnImportPhoto = container.querySelector('#btn-import-photo');
    const btnEmptyImportPhoto = container.querySelector('#btn-empty-import-photo');
    if (btnImportCsv) btnImportCsv.addEventListener('click', () => openCsvImportModal());
    if (btnEmptyImport) btnEmptyImport.addEventListener('click', () => openCsvImportModal());
    if (btnImportPhoto) btnImportPhoto.addEventListener('click', () => openPhotoImportModal());
    if (btnEmptyImportPhoto) btnEmptyImportPhoto.addEventListener('click', () => openPhotoImportModal());
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
      <form id="modal-student-form" class="student-form-enhanced" autocomplete="off">
        <div class="student-form-intro">
          <i class="fas ${isEdit ? 'fa-user-pen' : 'fa-user-plus'}"></i>
          <span>${isEdit ? "Modifiez les informations de l'élève ci-dessous puis validez." : "Renseignez les informations de l'élève à ajouter dans la classe."}</span>
        </div>

        <div class="form-row student-form-row">
          <div class="form-group">
            <label class="form-label" for="student-input-nom">Nom de famille <span style="color:#dc2626;">*</span></label>
            <input type="text" class="form-control form-control-lg" id="student-input-nom" placeholder="Ex : KOUASSI" value="${studentToEdit ? studentToEdit.nom : ''}" required style="text-transform: uppercase; font-weight: 600;" />
          </div>

          <div class="form-group">
            <label class="form-label" for="student-input-prenom">Prénom(s) <span style="color:#dc2626;">*</span></label>
            <input type="text" class="form-control form-control-lg" id="student-input-prenom" placeholder="Ex : Jean Marc" value="${studentToEdit ? studentToEdit.prenom : ''}" required />
          </div>
        </div>

        <div class="form-row student-form-row">
          <div class="form-group">
            <label class="form-label" for="student-input-classe">Classe de rattachement <span style="color:#dc2626;">*</span></label>
            <select class="form-select form-control-lg" id="student-input-classe" required>
              ${myClasses.map(c => `
                <option value="${c.id}" ${(studentToEdit && studentToEdit.classeId === c.id) || (!studentToEdit && defaultClassId === c.id) ? 'selected' : ''}>
                  ${c.nom} (${c.niveau})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="student-input-genre">Sexe / Genre <span style="color:#dc2626;">*</span></label>
            <select class="form-select form-control-lg" id="student-input-genre" required>
              <option value="Garçon" ${studentToEdit && studentToEdit.genre === 'Garçon' ? 'selected' : ''}>Garçon (Masculin)</option>
              <option value="Fille" ${studentToEdit && studentToEdit.genre === 'Fille' ? 'selected' : ''}>Fille (Féminin)</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label" for="student-input-matricule">Matricule / Identifiant <span style="color:var(--text-muted); font-weight:400;">(optionnel)</span></label>
          <input type="text" class="form-control form-control-lg" id="student-input-matricule" placeholder="Ex : MAT-2026-089" value="${studentToEdit ? (studentToEdit.matricule || '') : ''}" />
        </div>
      </form>
    `;

    Modal.open(title, contentHtml, async () => {
      const inputNom = document.getElementById('student-input-nom');
      const inputPrenom = document.getElementById('student-input-prenom');
      const inputClasse = document.getElementById('student-input-classe');
      const inputGenre = document.getElementById('student-input-genre');
      const inputMatricule = document.getElementById('student-input-matricule');

      if (!inputNom || !inputNom.value.trim()) {
        Toast.show("Veuillez saisir le nom de famille de l'élève.", "error");
        if (inputNom) inputNom.focus();
        return false;
      }

      if (!inputPrenom || !inputPrenom.value.trim()) {
        Toast.show("Veuillez saisir le prénom de l'élève.", "error");
        if (inputPrenom) inputPrenom.focus();
        return false;
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
          Toast.show(`Élève ${payload.nom} ${payload.prenom} mis à jour avec succès.`, "success");
        } else {
          await db.addEleve(payload);
          Toast.show(`Élève ${payload.nom} ${payload.prenom} enregistré avec succès.`, "success");
        }
        renderView();
        return true;
      } catch (err) {
        Toast.show(err.message, "error");
        return false;
      }
    });

    setTimeout(() => {
      const confirmBtn = document.getElementById('modal-confirm-btn');
      if (confirmBtn) {
        confirmBtn.innerHTML = isEdit
          ? `<i class="fas fa-check-circle"></i> Enregistrer les modifications`
          : `<i class="fas fa-user-plus"></i> Ajouter l'élève`;
      }
    }, 30);
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
        <!-- Sélecteur de méthode d'importation -->
        <div class="import-methods-switcher">
          <button type="button" class="import-method-card active" id="switch-to-file-import">
            <div class="import-method-icon"><i class="fas fa-file-excel"></i></div>
            <div class="import-method-info">
              <h4>Importer un fichier</h4>
              <p>Sélectionner un fichier CSV, Excel ou un autre format pris en charge.</p>
            </div>
          </button>
          <button type="button" class="import-method-card" id="switch-to-photo-import">
            <div class="import-method-icon"><i class="fas fa-camera"></i></div>
            <div class="import-method-info">
              <h4>Importer par photo</h4>
              <p>Photographier une liste de classe ou sélectionner une image depuis son appareil.</p>
            </div>
          </button>
        </div>

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
      const btnSwitchToPhoto = document.getElementById('switch-to-photo-import');

      if (btnSwitchToPhoto) {
        btnSwitchToPhoto.addEventListener('click', () => {
          openPhotoImportModal();
        });
      }

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

  // --- MODAL: IMPORTATION PAR PHOTO (APPAREIL PHOTO, PRÉTRAITEMENT, OCR & CORRECTION) ---
  function openPhotoImportModal() {
    const myClasses = db.getClasses();
    if (myClasses.length === 0) {
      Toast.show("Veuillez d'abord créer au moins une classe avant d'importer une liste.", "error");
      return;
    }

    const defaultCid = selectedClasseId !== 'ALL' ? selectedClasseId : myClasses[0].id;

    // État interne des pages photographiées et des élèves reconnus
    let photoPages = []; // [{ id, fileName, formatLabel, imgElement, rotationDeg, skewDeg, cropPreset, enhanceContrast, processedCanvas, qualityReport }]
    let activePageIndex = 0;
    let extractedRows = []; // Lignes d'élèves extraites et modifiables
    let validationResult = { rows: [], stats: { detectedCount: 0, validCount: 0, toVerifyCount: 0, duplicateCount: 0, incompleteCount: 0 }, validStudentsToSave: [] };
    let showVerifyOnly = false;
    let activeCameraStream = null;

    function stopActiveCameraStream() {
      if (activeCameraStream) {
        try {
          activeCameraStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        activeCameraStream = null;
      }
    }

    function cleanupAllPhotoState() {
      stopActiveCameraStream();
      OCREngine.cleanupImageResources();
      photoPages = [];
    }

    const contentHtml = `
      <div id="photo-import-wizard-container">
        <!-- Sélecteur de méthode d'importation -->
        <div class="import-methods-switcher">
          <button type="button" class="import-method-card" id="photo-switch-to-file">
            <div class="import-method-icon"><i class="fas fa-file-excel"></i></div>
            <div class="import-method-info">
              <h4>Importer un fichier</h4>
              <p>Sélectionner un fichier CSV, Excel ou un autre format pris en charge.</p>
            </div>
          </button>
          <button type="button" class="import-method-card active" id="photo-switch-to-photo">
            <div class="import-method-icon"><i class="fas fa-camera"></i></div>
            <div class="import-method-info">
              <h4>Importer par photo</h4>
              <p>Photographier une liste de classe ou sélectionner une image depuis son appareil.</p>
            </div>
          </button>
        </div>

        <!-- Bandeau formats d'images supportés -->
        <div style="background: var(--bg-main); padding: 12px 16px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-color); font-size: 0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <strong><i class="fas fa-camera-retro" style="color:var(--primary);"></i> Formats d'image pris en charge :</strong>
              <span style="margin-left: 6px; color: var(--text-muted);">JPG / JPEG, PNG, WEBP, HEIC (iPhone)</span>
            </div>
            <span style="font-size: 0.78rem; color: #059669; font-weight: 600;">
              <i class="fas fa-shield-halved"></i> Confidentialité garantie : photos supprimées après l'importation
            </span>
          </div>
        </div>

        <!-- Classe de destination -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight:600;">Classe de destination <span style="color:red;">*</span></label>
          <select class="form-select" id="photo-import-target-class" required>
            ${myClasses.map(c => `
              <option value="${c.id}" ${c.id === defaultCid ? 'selected' : ''}>${c.nom} (${c.niveau})</option>
            `).join('')}
          </select>
        </div>

        <!-- Zone de prise de photo ou sélection depuis la galerie -->
        <div class="photo-capture-actions-grid" id="photo-capture-initial-grid">
          <div class="photo-action-box" id="btn-trigger-mobile-camera">
            <i class="fas fa-camera"></i>
            <strong>Prendre une photo</strong>
            <span>Ouvrir l'appareil photo (iPhone / Mobile / Caméra)</span>
            <input type="file" id="photo-camera-input" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" style="display: none;" />
          </div>

          <div class="photo-action-box" id="btn-trigger-gallery-picker">
            <i class="fas fa-images"></i>
            <strong>Choisir dans la galerie</strong>
            <span>Sélectionner une ou plusieurs photos existantes</span>
            <input type="file" id="photo-gallery-input" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif" multiple style="display: none;" />
          </div>

          <div class="photo-action-box" id="btn-trigger-webcam">
            <i class="fas fa-video"></i>
            <strong>Caméra de l'ordinateur</strong>
            <span>Capturer directement depuis la webcam</span>
          </div>
        </div>

        <!-- Flux Caméra en direct (WebRTC sur ordinateur / mobile compatible) -->
        <div id="photo-live-camera-container" style="display: none; background: #0f172a; padding: 14px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
          <video id="photo-live-video" autoplay playsinline muted style="max-width: 100%; max-height: 300px; border-radius: 8px; background: #000;"></video>
          <div style="display:flex; justify-content:center; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" id="btn-snap-live-photo">
              <i class="fas fa-camera"></i> Capturer la liste
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-close-live-camera">
              <i class="fas fa-times"></i> Fermer la caméra
            </button>
          </div>
        </div>

        <!-- Espace de prévisualisation, rotation, recadrage et diagnostic qualité -->
        <div class="photo-preview-workspace" id="photo-preview-workspace" style="display: none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <strong style="font-size: 0.92rem; color: var(--text-main);">
              <i class="fas fa-crop-simple" style="color:var(--primary);"></i> Prévisualisation & Ajustement avant analyse
            </strong>
            <div style="display:flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-secondary" id="btn-photo-add-more" title="Ajouter une autre page de la liste">
                <i class="fas fa-file-circle-plus"></i> Ajouter une page
              </button>
              <button type="button" class="btn btn-sm btn-secondary" id="btn-photo-retake" title="Reprendre ou remplacer cette photo">
                <i class="fas fa-rotate"></i> Reprendre la photo
              </button>
              <button type="button" class="btn btn-sm btn-danger" id="btn-photo-delete-page" title="Supprimer la photo sélectionnée">
                <i class="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <!-- Barre des pages (si liste sur plusieurs pages) -->
          <div class="photo-pages-strip" id="photo-pages-strip"></div>

          <!-- Alertes qualité (photo floue, trop sombre, etc.) -->
          <div id="photo-quality-warnings" style="display: none; margin-bottom: 10px;"></div>

          <!-- Aperçu Canvas -->
          <div class="photo-canvas-wrapper">
            <canvas id="photo-preview-canvas"></canvas>
          </div>

          <!-- Outils d'orientation, redressement, recadrage et contraste -->
          <div class="photo-tools-bar">
            <div style="display:flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-secondary" id="btn-photo-rot-left" title="Pivoter de 90° à gauche">
                <i class="fas fa-rotate-left"></i> Pivoter -90°
              </button>
              <button type="button" class="btn btn-sm btn-secondary" id="btn-photo-rot-right" title="Pivoter de 90° à droite">
                <i class="fas fa-rotate-right"></i> Pivoter +90°
              </button>

              <div style="display:inline-flex; align-items:center; gap:6px; background:#fff; padding:4px 10px; border-radius:8px; border:1px solid var(--border-color); font-size:0.78rem;">
                <span>Inclinaison :</span>
                <input type="range" id="photo-skew-range" min="-10" max="10" step="0.5" value="0" style="width: 75px;" />
                <strong id="photo-skew-val">0°</strong>
              </div>

              <select class="form-select" id="photo-crop-preset" style="width: auto; padding: 5px 10px; font-size: 0.78rem;">
                <option value="none">Cadrage : Image entière</option>
                <option value="margin5">Recadrer les marges (5%)</option>
                <option value="margin10">Recadrer les marges (10%)</option>
                <option value="headerfooter">Isoler le tableau central (12%)</option>
              </select>

              <label style="display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; cursor:pointer; background:#fff; padding:5px 10px; border-radius:8px; border:1px solid var(--border-color);">
                <input type="checkbox" id="photo-enhance-contrast" checked />
                <span>Améliorer la lisibilité</span>
              </label>
            </div>

            <button type="button" class="btn btn-primary" id="btn-run-ocr-analysis">
              <i class="fas fa-wand-magic-sparkles"></i> Analyser la photo
            </button>
          </div>
        </div>

        <!-- Barre de progression de l'analyse OCR (Section 9) -->
        <div class="ocr-progress-container" id="photo-ocr-progress-box" style="display: none;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem; font-weight:600; color:var(--text-main);">
            <span id="photo-ocr-step-label"><i class="fas fa-spinner fa-spin" style="color:var(--primary); margin-right:6px;"></i> Préparation de l'image...</span>
            <span id="photo-ocr-percent">0%</span>
          </div>
          <div class="ocr-progress-bar-track">
            <div class="ocr-progress-bar-fill" id="photo-ocr-progress-fill" style="width: 0%;"></div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);" id="photo-ocr-substatus">
            Traitement sécurisé de la liste de classe en cours...
          </div>
        </div>

        <!-- Étape obligatoire : Aperçu, Vérification et Correction avant importation (Section 5) -->
        <div id="photo-verification-section" style="display: none;">
          <div class="import-stats-summary" style="margin-bottom: 12px;">
            <div class="import-stat-box val-total">
              <div class="stat-val" id="photo-stat-detected">0</div>
              <div class="stat-lbl">Élèves détectés</div>
            </div>
            <div class="import-stat-box val-valid">
              <div class="stat-val" id="photo-stat-valid">0</div>
              <div class="stat-lbl">Prêts à importer</div>
            </div>
            <div class="import-stat-box val-err">
              <div class="stat-val" id="photo-stat-verify">0</div>
              <div class="stat-lbl">À vérifier / corriger</div>
            </div>
            <div class="import-stat-box val-dup">
              <div class="stat-val" id="photo-stat-dup">0</div>
              <div class="stat-lbl">Doublons</div>
            </div>
          </div>

          <!-- Barre d'outils de correction et de sélection -->
          <div class="photo-verif-toolbar">
            <div>
              <h4 style="font-size: 1rem; margin: 0; color: var(--text-main);">
                <i class="fas fa-user-check" style="color:var(--primary);"></i> Vérification, sélection et correction des élèves détectés
              </h4>
              <span style="font-size: 0.84rem; color: var(--text-muted); display:block; margin-top:2px;">
                Vérifiez ou corrigez les noms détectés, cochez les élèves souhaités puis cliquez sur <strong>« Valider l'importation »</strong>.
              </span>
            </div>

            <div style="display:flex; gap: 10px; align-items:center; flex-wrap:wrap;">
              <div class="photo-default-genre-box">
                <label for="photo-default-genre" style="font-size:0.82rem; font-weight:600; color:var(--text-main);">Sexe par défaut :</label>
                <select id="photo-default-genre" class="form-select" style="width:auto; min-height:38px; padding:4px 10px; font-size:0.85rem;">
                  <option value="Garçon" selected>Garçon (M)</option>
                  <option value="Fille">Fille (F)</option>
                </select>
                <button type="button" class="btn btn-sm btn-secondary" id="btn-apply-default-genre" title="Appliquer ce sexe aux élèves de la liste">
                  Appliquer à tous
                </button>
              </div>

              <label style="font-size: 0.84rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-weight:500;">
                <input type="checkbox" id="photo-filter-verify-only" />
                <span>Afficher uniquement « À vérifier »</span>
              </label>
              <label style="font-size: 0.84rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-weight:500;">
                <input type="checkbox" id="photo-allow-duplicates" />
                <span>Autoriser homonymes</span>
              </label>
              <button type="button" class="btn btn-sm btn-secondary" id="btn-photo-add-row">
                <i class="fas fa-user-plus"></i> Ajouter un élève oublié
              </button>
            </div>
          </div>

          <!-- Formulaire spacieux pour ajouter un élève oublié sur la liste -->
          <div id="photo-forgotten-student-box" class="forgotten-student-card" style="display: none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h5 style="margin:0; font-size:0.98rem; color:var(--text-main); display:flex; align-items:center; gap:8px;">
                <i class="fas fa-user-plus" style="color:var(--primary);"></i> Ajouter un élève oublié à la liste
              </h5>
              <button type="button" class="btn btn-sm btn-secondary" id="btn-close-forgotten-box" aria-label="Fermer">&times;</button>
            </div>
            <div class="forgotten-student-grid">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="forgotten-input-nom">Nom de famille <span style="color:#dc2626;">*</span></label>
                <input type="text" id="forgotten-input-nom" class="form-control form-control-lg" placeholder="Ex : KOUASSI" style="text-transform:uppercase; font-weight:600;" />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="forgotten-input-prenom">Prénom(s) <span style="color:#dc2626;">*</span></label>
                <input type="text" id="forgotten-input-prenom" class="form-control form-control-lg" placeholder="Ex : Jean Marc" />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="forgotten-input-genre">Sexe <span style="color:#dc2626;">*</span></label>
                <select id="forgotten-input-genre" class="form-select form-control-lg">
                  <option value="Garçon">Garçon (M)</option>
                  <option value="Fille">Fille (F)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="forgotten-input-matricule">Matricule (optionnel)</label>
                <input type="text" id="forgotten-input-matricule" class="form-control form-control-lg" placeholder="Ex : MAT-01" />
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px; flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-forgotten">Annuler</button>
              <button type="button" class="btn btn-primary" id="btn-confirm-add-forgotten">
                <i class="fas fa-plus-circle"></i> Ajouter cet élève à l'aperçu
              </button>
            </div>
          </div>

          <!-- Tableau éditable d'aperçu et de correction -->
          <div class="csv-preview-table-container photo-verif-table-wrapper" style="max-height: 380px; overflow-y: auto;">
            <table class="table" id="photo-verification-table" style="font-size: 0.9rem; margin: 0;">
              <thead>
                <tr>
                  <th style="width: 44px; text-align:center;">
                    <input type="checkbox" id="photo-select-all-rows" checked title="Tout sélectionner / désélectionner" style="width:18px; height:18px; cursor:pointer;" />
                  </th>
                  <th style="width: 48px;">N°</th>
                  <th style="min-width: 120px;">Matricule</th>
                  <th style="min-width: 165px;">Nom <span style="color:#dc2626;">*</span></th>
                  <th style="min-width: 175px;">Prénoms <span style="color:#dc2626;">*</span></th>
                  <th style="min-width: 130px;">Sexe <span style="color:#dc2626;">*</span></th>
                  <th style="min-width: 155px;">Vérification</th>
                  <th style="width: 64px; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody id="photo-verification-tbody"></tbody>
            </table>
          </div>

          <!-- Barre d'action claire et visible pour valider l'importation -->
          <div class="photo-validate-action-bar">
            <div class="photo-validate-summary-text" id="photo-ready-summary-text">
              Vérifiez les informations ci-dessus puis cliquez sur <strong>« Valider l'importation »</strong>.
            </div>
            <button type="button" class="btn btn-primary btn-lg" id="btn-validate-photo-import" data-action="Confirmer l'importation">
              <i class="fas fa-check-circle"></i> Valider l'importation
            </button>
          </div>
        </div>
      </div>
    `;

    // Synchronise les valeurs saisies dans les champs DOM avec extractedRows avant validation/enregistrement
    function syncExtractedRowsFromDom() {
      const tbody = document.getElementById('photo-verification-tbody');
      if (!tbody) return;
      tbody.querySelectorAll('tr[data-row-id]').forEach((tr) => {
        const rowId = tr.getAttribute('data-row-id');
        const target = extractedRows.find(r => r.rowId === rowId);
        if (!target) return;

        const chk = tr.querySelector('.check-ocr-row');
        const inpMat = tr.querySelector('.input-ocr-matricule');
        const inpNom = tr.querySelector('.input-ocr-nom');
        const inpPre = tr.querySelector('.input-ocr-prenom');
        const selGen = tr.querySelector('.select-ocr-genre');

        if (chk) target.selected = chk.checked;
        if (inpMat) target.matricule = inpMat.value.trim();
        if (inpNom) target.nom = inpNom.value.trim().toUpperCase();
        if (inpPre) target.prenom = inpPre.value.trim();
        if (selGen && selGen.value) target.genre = selGen.value;
      });
    }

    // Fonction centrale de validation et d'enregistrement réel des élèves détectés par photo
    async function executePhotoImportValidationAndSave() {
      syncExtractedRowsFromDom();

      const selectClass = document.getElementById('photo-import-target-class');
      if (!selectClass || !selectClass.value) {
        Toast.show("Veuillez sélectionner une classe de destination.", "error");
        return false;
      }

      if (!extractedRows || extractedRows.length === 0) {
        Toast.show("Aucun élève détecté pour le moment. Analysez d'abord une photo ou ajoutez un élève.", "error");
        return false;
      }

      const selectedRows = extractedRows.filter(r => r.selected !== false);
      if (selectedRows.length === 0) {
        Toast.show("Veuillez sélectionner au moins un élève à importer (cochez les cases correspondantes).", "error");
        return false;
      }

      const targetCid = selectClass.value;
      const targetClassObj = db.getClassById(targetCid);
      const existingInClass = db.getEleves(targetCid);
      const allowDupsEl = document.getElementById('photo-allow-duplicates');
      const allowDuplicates = allowDupsEl ? allowDupsEl.checked : false;
      const defaultGenreEl = document.getElementById('photo-default-genre');
      const defaultGenreVal = defaultGenreEl && defaultGenreEl.value ? defaultGenreEl.value : 'Garçon';

      // Compléter automatiquement le sexe par défaut pour les lignes sélectionnées dont la feuille n'indiquait pas M/F
      extractedRows.forEach(r => {
        if (r.selected !== false && !ImportEngine.normalizeGenre(r.genre)) {
          r.genre = defaultGenreVal;
        }
      });

      validationResult = OCREngine.validatePhotoRosterRows(extractedRows, existingInClass, {
        defaultGenre: defaultGenreVal,
        allowSingleNameFallback: true
      });

      const studentsToSave = allowDuplicates
        ? validationResult.rows
            .filter(r => r.selected !== false && r.status !== 'incomplete')
            .map(r => ({
              nom: r.nom,
              prenom: r.prenom,
              genre: ImportEngine.normalizeGenre(r.genre) || defaultGenreVal,
              matricule: r.matricule || ''
            }))
        : validationResult.validStudentsToSave;

      if (!studentsToSave || studentsToSave.length === 0) {
        const hasDuplicatesOnly = validationResult.stats.duplicateCount > 0 && validationResult.stats.incompleteCount === 0;
        if (hasDuplicatesOnly) {
          Toast.show("Tous les élèves sélectionnés sont déjà présents dans cette classe (cochez « Autoriser homonymes » si nécessaire).", "warning");
        } else {
          Toast.show("Certaines lignes sélectionnées sont incomplètes (Nom ou Prénom manquant). Veuillez les corriger avant de valider.", "error");
        }
        return false;
      }

      try {
        const batchResult = await db.addElevesBatch(studentsToSave, targetCid, { allowDuplicates });

        const totalDetected = validationResult.stats.detectedCount;
        const totalValidated = studentsToSave.length;
        const totalImported = batchResult.totalAdded;
        const totalDuplicates = validationResult.stats.duplicateCount + (batchResult.duplicates ? batchResult.duplicates.length : 0);
        const totalToFix = validationResult.stats.incompleteCount;

        if (totalImported === 0) {
          Toast.show("Aucun nouvel élève n'a été enregistré (élèves déjà présents dans la classe).", "warning");
          return false;
        }

        // Nettoyage immédiat des photos en mémoire (Section 8 — Sécurité & Confidentialité)
        cleanupAllPhotoState();

        Toast.show(`Importation réussie : ${totalImported} élève(s) enregistré(s) dans la classe ${targetClassObj ? targetClassObj.nom : ''}.`, "success");

        displayPhotoImportReport({
          targetClassName: targetClassObj ? targetClassObj.nom : 'Classe sélectionnée',
          detectedCount: totalDetected,
          validatedCount: totalValidated,
          importedCount: totalImported,
          duplicateCount: totalDuplicates,
          toCorrectCount: totalToFix,
          incompleteRows: validationResult.rows.filter(r => r.status === 'incomplete'),
          duplicateRows: validationResult.rows.filter(r => r.status === 'duplicate')
        });

        selectedClasseId = targetCid;
        renderView();
        return true;
      } catch (err) {
        Toast.show(err.message || "Une erreur est survenue lors de l'enregistrement des élèves.", "error");
        return false;
      }
    }

    Modal.open("Importer une liste de classe par photo", contentHtml, async () => {
      return await executePhotoImportValidationAndSave();
    });

    // Changement du libellé du bouton de confirmation de la modale (Confirmer l'importation / Valider l'importation)
    setTimeout(() => {
      const confirmBtn = document.getElementById('modal-confirm-btn');
      const cancelBtn = document.getElementById('modal-cancel-btn');
      const closeBtn = document.getElementById('modal-close-btn');

      if (confirmBtn) {
        confirmBtn.innerHTML = `<i class="fas fa-check-circle"></i> Valider l'importation`;
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => cleanupAllPhotoState(), { once: true });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => cleanupAllPhotoState(), { once: true });
      }

      // Références DOM
      const btnSwitchToFile = document.getElementById('photo-switch-to-file');
      const btnMobileCam = document.getElementById('btn-trigger-mobile-camera');
      const inputCamera = document.getElementById('photo-camera-input');
      const btnGallery = document.getElementById('btn-trigger-gallery-picker');
      const inputGallery = document.getElementById('photo-gallery-input');
      const btnWebcam = document.getElementById('btn-trigger-webcam');
      const liveCamContainer = document.getElementById('photo-live-camera-container');
      const liveVideo = document.getElementById('photo-live-video');
      const btnSnapLive = document.getElementById('btn-snap-live-photo');
      const btnCloseLive = document.getElementById('btn-close-live-camera');

      const previewWorkspace = document.getElementById('photo-preview-workspace');
      const pagesStrip = document.getElementById('photo-pages-strip');
      const qualityWarningsEl = document.getElementById('photo-quality-warnings');
      const previewCanvas = document.getElementById('photo-preview-canvas');
      const btnAddMore = document.getElementById('btn-photo-add-more');
      const btnRetake = document.getElementById('btn-photo-retake');
      const btnDeletePage = document.getElementById('btn-photo-delete-page');
      const btnRotLeft = document.getElementById('btn-photo-rot-left');
      const btnRotRight = document.getElementById('btn-photo-rot-right');
      const skewRange = document.getElementById('photo-skew-range');
      const skewVal = document.getElementById('photo-skew-val');
      const cropPreset = document.getElementById('photo-crop-preset');
      const enhanceCheckbox = document.getElementById('photo-enhance-contrast');
      const btnRunOcr = document.getElementById('btn-run-ocr-analysis');

      const progressBox = document.getElementById('photo-ocr-progress-box');
      const progressLabel = document.getElementById('photo-ocr-step-label');
      const progressPercent = document.getElementById('photo-ocr-percent');
      const progressFill = document.getElementById('photo-ocr-progress-fill');

      const verifSection = document.getElementById('photo-verification-section');
      const verifTbody = document.getElementById('photo-verification-tbody');
      const statDetected = document.getElementById('photo-stat-detected');
      const statValid = document.getElementById('photo-stat-valid');
      const statVerify = document.getElementById('photo-stat-verify');
      const statDup = document.getElementById('photo-stat-dup');
      const filterVerifyCheckbox = document.getElementById('photo-filter-verify-only');
      const allowDupsCheckbox = document.getElementById('photo-allow-duplicates');
      const btnAddRow = document.getElementById('btn-photo-add-row');
      const selectTargetClass = document.getElementById('photo-import-target-class');
      const selectAllCheckbox = document.getElementById('photo-select-all-rows');
      const defaultGenreSelect = document.getElementById('photo-default-genre');
      const btnApplyDefaultGenre = document.getElementById('btn-apply-default-genre');
      const btnValidateInline = document.getElementById('btn-validate-photo-import');
      const readySummaryText = document.getElementById('photo-ready-summary-text');

      // Formulaire dédié « Ajouter un élève oublié »
      const forgottenBox = document.getElementById('photo-forgotten-student-box');
      const btnCloseForgotten = document.getElementById('btn-close-forgotten-box');
      const btnCancelForgotten = document.getElementById('btn-cancel-forgotten');
      const btnConfirmForgotten = document.getElementById('btn-confirm-add-forgotten');
      const inpForgottenNom = document.getElementById('forgotten-input-nom');
      const inpForgottenPrenom = document.getElementById('forgotten-input-prenom');
      const inpForgottenGenre = document.getElementById('forgotten-input-genre');
      const inpForgottenMatricule = document.getElementById('forgotten-input-matricule');

      if (btnSwitchToFile) {
        btnSwitchToFile.addEventListener('click', () => {
          cleanupAllPhotoState();
          openCsvImportModal();
        });
      }

      if (btnValidateInline) {
        btnValidateInline.addEventListener('click', async () => {
          btnValidateInline.disabled = true;
          try {
            await executePhotoImportValidationAndSave();
          } finally {
            btnValidateInline.disabled = false;
          }
        });
      }

      // 1. Prise de photo mobile / iPhone
      if (btnMobileCam && inputCamera) {
        btnMobileCam.addEventListener('click', (e) => {
          if (e.target !== inputCamera) inputCamera.click();
        });
        inputCamera.addEventListener('change', async () => {
          if (inputCamera.files && inputCamera.files.length > 0) {
            await handleSelectedImageFiles(Array.from(inputCamera.files), false);
            inputCamera.value = '';
          }
        });
      }

      // 2. Sélection depuis la galerie (supporte plusieurs pages)
      if (btnGallery && inputGallery) {
        btnGallery.addEventListener('click', (e) => {
          if (e.target !== inputGallery) inputGallery.click();
        });
        inputGallery.addEventListener('change', async () => {
          if (inputGallery.files && inputGallery.files.length > 0) {
            await handleSelectedImageFiles(Array.from(inputGallery.files), true);
            inputGallery.value = '';
          }
        });
      }

      // 3. Caméra en direct (WebRTC avec solution de remplacement automatique si refusée/indisponible)
      if (btnWebcam) {
        btnWebcam.addEventListener('click', async () => {
          if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            Toast.show("L'accès direct à la caméra n'est pas disponible sur ce navigateur. Sélectionnez une image depuis votre appareil.", "info");
            if (inputGallery) inputGallery.click();
            return;
          }
          try {
            activeCameraStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: false
            });
            if (liveVideo && liveCamContainer) {
              liveVideo.srcObject = activeCameraStream;
              liveCamContainer.style.display = 'block';
            }
          } catch (camErr) {
            Toast.show("Accès à la caméra refusé ou indisponible. Vous pouvez sélectionner une photo existante.", "info");
            if (inputGallery) inputGallery.click();
          }
        });
      }

      if (btnCloseLive) {
        btnCloseLive.addEventListener('click', () => {
          stopActiveCameraStream();
          if (liveCamContainer) liveCamContainer.style.display = 'none';
        });
      }

      if (btnSnapLive && liveVideo) {
        btnSnapLive.addEventListener('click', () => {
          const vw = liveVideo.videoWidth || 1280;
          const vh = liveVideo.videoHeight || 720;
          const snapCanvas = document.createElement('canvas');
          snapCanvas.width = vw;
          snapCanvas.height = vh;
          const ctx = snapCanvas.getContext('2d');
          ctx.drawImage(liveVideo, 0, 0, vw, vh);

          snapCanvas.toBlob(async (blob) => {
            if (blob) {
              const capturedFile = new File([blob], `capture_classe_${photoPages.length + 1}.jpg`, { type: 'image/jpeg' });
              stopActiveCameraStream();
              if (liveCamContainer) liveCamContainer.style.display = 'none';
              await handleSelectedImageFiles([capturedFile], true);
            }
          }, 'image/jpeg', 0.92);
        });
      }

      // Chargement d'une ou plusieurs images
      async function handleSelectedImageFiles(files, appendMode = true) {
        if (!appendMode) {
          photoPages = [];
        }

        for (const file of files) {
          if (!OCREngine.isSupportedImage(file)) {
            Toast.show(`Format non pris en charge (${file.name}). Utilisez JPG, PNG, WEBP ou HEIC.`, "error");
            continue;
          }

          try {
            const standardBlob = await OCREngine.ensureStandardImageBlob(file);
            const objUrl = OCREngine.createTrackedObjectUrl(standardBlob);
            const imgEl = await loadImageElement(objUrl);

            photoPages.push({
              id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              fileName: file.name || `Page ${photoPages.length + 1}`,
              formatLabel: OCREngine.getFormatLabel(file.name || 'photo.jpg'),
              imgElement: imgEl,
              rotationDeg: 0,
              skewDeg: 0,
              cropPreset: 'none',
              enhanceContrast: true,
              processedCanvas: null,
              qualityReport: null
            });
          } catch (err) {
            Toast.show(err.message || "Impossible de charger cette image.", "error");
          }
        }

        if (photoPages.length > 0) {
          activePageIndex = photoPages.length - 1;
          if (previewWorkspace) previewWorkspace.style.display = 'block';
          syncControlsWithActivePage();
          renderActivePagePreview();
        }
      }

      function loadImageElement(url) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Impossible de lire le fichier image sélectionné."));
          img.src = url;
        });
      }

      function getCropRectFromPreset(preset) {
        switch (preset) {
          case 'margin5':
            return { x: 0.05, y: 0.05, w: 0.90, h: 0.90 };
          case 'margin10':
            return { x: 0.10, y: 0.10, w: 0.80, h: 0.80 };
          case 'headerfooter':
            return { x: 0.04, y: 0.12, w: 0.92, h: 0.76 };
          default:
            return { x: 0, y: 0, w: 1, h: 1 };
        }
      }

      function syncControlsWithActivePage() {
        const page = photoPages[activePageIndex];
        if (!page) return;
        if (skewRange) skewRange.value = String(page.skewDeg || 0);
        if (skewVal) skewVal.textContent = `${page.skewDeg || 0}°`;
        if (cropPreset) cropPreset.value = page.cropPreset || 'none';
        if (enhanceCheckbox) enhanceCheckbox.checked = page.enhanceContrast !== false;
      }

      function renderPagesStrip() {
        if (!pagesStrip) return;
        if (photoPages.length <= 1) {
          pagesStrip.style.display = 'none';
          return;
        }
        pagesStrip.style.display = 'flex';
        pagesStrip.innerHTML = photoPages.map((p, idx) => `
          <button type="button" class="photo-page-pill ${idx === activePageIndex ? 'active' : ''}" data-page-idx="${idx}">
            <i class="fas fa-file-image"></i> Page ${idx + 1} (${p.fileName})
          </button>
        `).join('');

        pagesStrip.querySelectorAll('.photo-page-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            activePageIndex = parseInt(btn.getAttribute('data-page-idx'), 10) || 0;
            syncControlsWithActivePage();
            renderActivePagePreview();
          });
        });
      }

      function renderActivePagePreview() {
        renderPagesStrip();
        const page = photoPages[activePageIndex];
        if (!page || !previewCanvas) return;

        const { canvas, qualityReport } = OCREngine.preprocessImageInBrowser(page.imgElement, {
          rotationDeg: page.rotationDeg,
          skewDeg: page.skewDeg,
          crop: getCropRectFromPreset(page.cropPreset),
          enhanceContrast: page.enhanceContrast
        });

        page.processedCanvas = canvas;
        page.qualityReport = qualityReport;

        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        const ctx = previewCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);

        // Affichage des avertissements de qualité optique (flou, sombre, contraste)
        if (qualityWarningsEl) {
          if (qualityReport.warnings && qualityReport.warnings.length > 0) {
            qualityWarningsEl.style.display = 'block';
            qualityWarningsEl.innerHTML = qualityReport.warnings.map(w => `
              <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); color: #b45309; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 6px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-triangle-exclamation"></i>
                <span>${w}</span>
              </div>
            `).join('');
          } else {
            qualityWarningsEl.style.display = 'none';
            qualityWarningsEl.innerHTML = '';
          }
        }
      }

      // Événements de retouche d'image (Rotation, Inclinaison, Recadrage, Contraste, Suppression, Reprise)
      if (btnRotLeft) {
        btnRotLeft.addEventListener('click', () => {
          const page = photoPages[activePageIndex];
          if (!page) return;
          page.rotationDeg = (page.rotationDeg - 90) % 360;
          renderActivePagePreview();
        });
      }

      if (btnRotRight) {
        btnRotRight.addEventListener('click', () => {
          const page = photoPages[activePageIndex];
          if (!page) return;
          page.rotationDeg = (page.rotationDeg + 90) % 360;
          renderActivePagePreview();
        });
      }

      if (skewRange) {
        skewRange.addEventListener('input', () => {
          const page = photoPages[activePageIndex];
          if (!page) return;
          page.skewDeg = parseFloat(skewRange.value) || 0;
          if (skewVal) skewVal.textContent = `${page.skewDeg}°`;
          renderActivePagePreview();
        });
      }

      if (cropPreset) {
        cropPreset.addEventListener('change', () => {
          const page = photoPages[activePageIndex];
          if (!page) return;
          page.cropPreset = cropPreset.value;
          renderActivePagePreview();
        });
      }

      if (enhanceCheckbox) {
        enhanceCheckbox.addEventListener('change', () => {
          const page = photoPages[activePageIndex];
          if (!page) return;
          page.enhanceContrast = enhanceCheckbox.checked;
          renderActivePagePreview();
        });
      }

      if (btnAddMore && inputGallery) {
        btnAddMore.addEventListener('click', () => inputGallery.click());
      }

      if (btnRetake && inputCamera) {
        btnRetake.addEventListener('click', () => {
          photoPages.splice(activePageIndex, 1);
          inputCamera.click();
        });
      }

      if (btnDeletePage) {
        btnDeletePage.addEventListener('click', () => {
          if (photoPages.length === 0) return;
          photoPages.splice(activePageIndex, 1);
          if (photoPages.length === 0) {
            activePageIndex = 0;
            if (previewWorkspace) previewWorkspace.style.display = 'none';
          } else {
            activePageIndex = Math.max(0, activePageIndex - 1);
            syncControlsWithActivePage();
            renderActivePagePreview();
          }
        });
      }

      // Lancement de la reconnaissance automatique OCR
      if (btnRunOcr) {
        btnRunOcr.addEventListener('click', async () => {
          if (photoPages.length === 0) {
            Toast.show("Veuillez d'abord prendre ou sélectionner une photo de la liste.", "error");
            return;
          }

          // S'assurer que chaque page a son canvas prétraité à jour
          const canvasesToAnalyze = photoPages.map(p => {
            if (!p.processedCanvas) {
              const res = OCREngine.preprocessImageInBrowser(p.imgElement, {
                rotationDeg: p.rotationDeg,
                skewDeg: p.skewDeg,
                crop: getCropRectFromPreset(p.cropPreset),
                enhanceContrast: p.enhanceContrast
              });
              p.processedCanvas = res.canvas;
              p.qualityReport = res.qualityReport;
            }
            return p.processedCanvas;
          });

          if (progressBox) progressBox.style.display = 'block';
          btnRunOcr.disabled = true;

          try {
            const ocrResult = await OCREngine.recognizePages(canvasesToAnalyze, (prog) => {
              if (progressLabel) {
                progressLabel.innerHTML = `<i class="fas ${prog.percent >= 100 ? 'fa-check-circle' : 'fa-spinner fa-spin'}" style="color:var(--primary); margin-right:6px;"></i> ${prog.message}`;
              }
              if (progressPercent) progressPercent.textContent = `${prog.percent}%`;
              if (progressFill) progressFill.style.width = `${prog.percent}%`;
            });

            btnRunOcr.disabled = false;

            if (!ocrResult.combinedStudents || ocrResult.combinedStudents.length === 0) {
              Toast.show("Aucun élève n'a pu être détecté sur cette image. Vérifiez le cadrage ou ajoutez les élèves manuellement.", "warning");
              extractedRows = [];
            } else {
              const defGenre = defaultGenreSelect ? defaultGenreSelect.value : 'Garçon';
              extractedRows = ocrResult.combinedStudents.map(st => ({
                ...st,
                genre: ImportEngine.normalizeGenre(st.genre) || defGenre,
                selected: true
              }));
              Toast.show(`${extractedRows.length} élève(s) détecté(s). Vérifiez l'aperçu puis cliquez sur « Valider l'importation ».`, "success");
            }

            if (verifSection) {
              verifSection.style.display = 'block';
              setTimeout(() => {
                if (typeof verifSection.scrollIntoView === 'function') {
                  verifSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 120);
            }
            refreshVerificationTable();
          } catch (err) {
            btnRunOcr.disabled = false;
            Toast.show(err.message || "Impossible d'analyser la photo. Vérifiez la lisibilité de l'image.", "error");
          }
        });
      }

      // Met à jour uniquement les compteurs et le résumé sans détruire le focus clavier des champs en cours de saisie
      function updateStatsCountersAndRowBadge(editedRowId = null) {
        const targetCid = selectTargetClass ? selectTargetClass.value : defaultCid;
        const existingInClass = db.getEleves(targetCid);
        const defGenre = defaultGenreSelect ? defaultGenreSelect.value : 'Garçon';

        validationResult = OCREngine.validatePhotoRosterRows(extractedRows, existingInClass, {
          defaultGenre: defGenre,
          allowSingleNameFallback: true
        });

        if (statDetected) statDetected.textContent = String(validationResult.stats.detectedCount);
        if (statValid) statValid.textContent = String(validationResult.stats.validCount);
        if (statVerify) statVerify.textContent = String(validationResult.stats.toVerifyCount);
        if (statDup) statDup.textContent = String(validationResult.stats.duplicateCount);

        if (readySummaryText) {
          readySummaryText.innerHTML = `<strong>${validationResult.stats.validCount}</strong> élève(s) sélectionné(s) prêt(s) à être importé(s) sur <strong>${validationResult.stats.detectedCount}</strong> détecté(s).`;
        }

        if (editedRowId && verifTbody) {
          const vRow = validationResult.rows.find(r => r.rowId === editedRowId);
          const tr = verifTbody.querySelector(`tr[data-row-id="${editedRowId}"]`);
          if (vRow && tr) {
            const isWarn = vRow.status === 'verify' || vRow.status === 'incomplete';
            const isDup = vRow.status === 'duplicate';
            tr.className = isWarn ? 'ocr-row-verify' : (isDup ? 'ocr-row-duplicate' : '');

            const inpNom = tr.querySelector('.input-ocr-nom');
            const inpPre = tr.querySelector('.input-ocr-prenom');
            const selGen = tr.querySelector('.select-ocr-genre');
            if (inpNom) inpNom.classList.toggle('input-warning', !vRow.nom || vRow.nom.length < 2);
            if (inpPre) inpPre.classList.toggle('input-warning', !vRow.prenom || (vRow.prenom !== '-' && vRow.prenom.length < 2));
            if (selGen) selGen.classList.toggle('input-warning', !ImportEngine.normalizeGenre(vRow.genre));

            const badgeCell = tr.querySelector('.ocr-verif-cell');
            if (badgeCell) {
              const badgeClass = vRow.status === 'valid'
                ? 'csv-status-valid'
                : (isDup ? 'csv-status-dup' : 'csv-status-err');
              badgeCell.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <span class="csv-status-badge ${badgeClass}">
                    <i class="fas ${vRow.status === 'valid' ? 'fa-check' : (isDup ? 'fa-copy' : 'fa-triangle-exclamation')}"></i>
                    ${vRow.verificationLabel}
                  </span>
                </div>
                ${vRow.issues && vRow.issues.length > 0 ? `
                  <div style="font-size: 0.75rem; color: ${isDup ? '#b45309' : '#b91c1c'}; margin-top: 3px;">
                    ${vRow.issues[0]}
                  </div>
                ` : ''}
              `;
            }
          }
        }
      }

      // Rafraîchit la validation et le tableau éditable des élèves reconnus
      function refreshVerificationTable() {
        const targetCid = selectTargetClass ? selectTargetClass.value : defaultCid;
        const existingInClass = db.getEleves(targetCid);
        const defGenre = defaultGenreSelect ? defaultGenreSelect.value : 'Garçon';

        validationResult = OCREngine.validatePhotoRosterRows(extractedRows, existingInClass, {
          defaultGenre: defGenre,
          allowSingleNameFallback: true
        });

        if (statDetected) statDetected.textContent = String(validationResult.stats.detectedCount);
        if (statValid) statValid.textContent = String(validationResult.stats.validCount);
        if (statVerify) statVerify.textContent = String(validationResult.stats.toVerifyCount);
        if (statDup) statDup.textContent = String(validationResult.stats.duplicateCount);

        if (readySummaryText) {
          readySummaryText.innerHTML = `<strong>${validationResult.stats.validCount}</strong> élève(s) sélectionné(s) prêt(s) à être importé(s) sur <strong>${validationResult.stats.detectedCount}</strong> détecté(s).`;
        }

        if (selectAllCheckbox) {
          const allSelected = extractedRows.length > 0 && extractedRows.every(r => r.selected !== false);
          selectAllCheckbox.checked = allSelected;
        }

        if (!verifTbody) return;

        const rowsToShow = showVerifyOnly
          ? validationResult.rows.filter(r => r.status !== 'valid')
          : validationResult.rows;

        if (rowsToShow.length === 0) {
          verifTbody.innerHTML = `
            <tr>
              <td colspan="8" style="text-align: center; padding: 28px 14px; color: var(--text-muted); font-size: 0.92rem;">
                ${showVerifyOnly ? 'Aucune ligne à vérifier.' : 'Aucun élève dans la liste. Cliquez sur « Ajouter un élève oublié » pour saisir un élève.'}
              </td>
            </tr>
          `;
          return;
        }

        verifTbody.innerHTML = rowsToShow.map((row) => {
          const isWarn = row.status === 'verify' || row.status === 'incomplete';
          const isDup = row.status === 'duplicate';
          const badgeClass = row.status === 'valid'
            ? 'csv-status-valid'
            : (isDup ? 'csv-status-dup' : 'csv-status-err');

          const issueHint = row.issues && row.issues.length > 0
            ? row.issues.join(' · ')
            : 'Lecture conforme';

          const normGenre = ImportEngine.normalizeGenre(row.genre) || defGenre;

          return `
            <tr class="${isWarn ? 'ocr-row-verify' : (isDup ? 'ocr-row-duplicate' : '')}" data-row-id="${row.rowId}">
              <td data-label="Sélection" style="text-align: center;">
                <input type="checkbox" class="check-ocr-row" data-row-id="${row.rowId}" ${row.selected !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;" title="Sélectionner cet élève pour l'importation" />
              </td>
              <td data-label="N°" style="font-weight: 700; color: var(--text-muted);">${row.numero}</td>
              <td data-label="Matricule">
                <input type="text" class="ocr-editable-input input-ocr-matricule" data-row-id="${row.rowId}" value="${row.matricule || ''}" placeholder="Optionnel" />
              </td>
              <td data-label="Nom *">
                <input type="text" class="ocr-editable-input input-ocr-nom ${!row.nom || row.nom.length < 2 ? 'input-warning' : ''}" data-row-id="${row.rowId}" value="${row.nom || ''}" placeholder="NOM DE FAMILLE" style="text-transform: uppercase; font-weight: 600;" />
              </td>
              <td data-label="Prénoms *">
                <input type="text" class="ocr-editable-input input-ocr-prenom ${!row.prenom || (row.prenom !== '-' && row.prenom.length < 2) ? 'input-warning' : ''}" data-row-id="${row.rowId}" value="${row.prenom === '-' ? '' : (row.prenom || '')}" placeholder="Prénom(s)" />
              </td>
              <td data-label="Sexe *">
                <select class="ocr-editable-input select-ocr-genre ${!normGenre ? 'input-warning' : ''}" data-row-id="${row.rowId}">
                  <option value="Garçon" ${normGenre === 'Garçon' ? 'selected' : ''}>Garçon (M)</option>
                  <option value="Fille" ${normGenre === 'Fille' ? 'selected' : ''}>Fille (F)</option>
                </select>
              </td>
              <td data-label="Statut" class="ocr-verif-cell" title="${issueHint}">
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <span class="csv-status-badge ${badgeClass}">
                    <i class="fas ${row.status === 'valid' ? 'fa-check' : (isDup ? 'fa-copy' : 'fa-triangle-exclamation')}"></i>
                    ${row.verificationLabel}
                  </span>
                  ${row.status === 'verify' ? `
                    <button type="button" class="btn btn-sm btn-secondary btn-confirm-ocr-row" data-row-id="${row.rowId}" title="Confirmer que cette ligne est exacte" style="padding: 4px 8px; font-size: 0.76rem;">
                      <i class="fas fa-check"></i> OK
                    </button>
                  ` : ''}
                </div>
                ${row.issues && row.issues.length > 0 ? `
                  <div style="font-size: 0.75rem; color: ${isDup ? '#b45309' : '#b91c1c'}; margin-top: 3px;">
                    ${row.issues[0]}
                  </div>
                ` : ''}
              </td>
              <td data-label="Action" style="text-align: center;">
                <button type="button" class="btn btn-sm btn-danger btn-delete-ocr-row" data-row-id="${row.rowId}" title="Supprimer cette ligne">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Écouteurs de sélection individuelle
        verifTbody.querySelectorAll('.check-ocr-row').forEach(chk => {
          chk.addEventListener('change', () => {
            const target = extractedRows.find(r => r.rowId === chk.getAttribute('data-row-id'));
            if (target) {
              target.selected = chk.checked;
              updateStatsCountersAndRowBadge(target.rowId);
              if (selectAllCheckbox) {
                selectAllCheckbox.checked = extractedRows.length > 0 && extractedRows.every(r => r.selected !== false);
              }
            }
          });
        });

        // Écouteurs d'édition en temps réel (sans reconstruire le DOM pendant la frappe sur mobile)
        verifTbody.querySelectorAll('.input-ocr-matricule').forEach(inp => {
          inp.addEventListener('input', () => {
            const target = extractedRows.find(r => r.rowId === inp.getAttribute('data-row-id'));
            if (target) {
              target.matricule = inp.value.trim();
              target.verifiedByTeacher = true;
              updateStatsCountersAndRowBadge(target.rowId);
            }
          });
        });

        verifTbody.querySelectorAll('.input-ocr-nom').forEach(inp => {
          inp.addEventListener('input', () => {
            const target = extractedRows.find(r => r.rowId === inp.getAttribute('data-row-id'));
            if (target) {
              target.nom = inp.value.trim().toUpperCase();
              target.verifiedByTeacher = true;
              updateStatsCountersAndRowBadge(target.rowId);
            }
          });
        });

        verifTbody.querySelectorAll('.input-ocr-prenom').forEach(inp => {
          inp.addEventListener('input', () => {
            const target = extractedRows.find(r => r.rowId === inp.getAttribute('data-row-id'));
            if (target) {
              target.prenom = inp.value.trim();
              target.verifiedByTeacher = true;
              updateStatsCountersAndRowBadge(target.rowId);
            }
          });
        });

        verifTbody.querySelectorAll('.select-ocr-genre').forEach(sel => {
          sel.addEventListener('change', () => {
            const target = extractedRows.find(r => r.rowId === sel.getAttribute('data-row-id'));
            if (target) {
              target.genre = sel.value;
              target.verifiedByTeacher = true;
              updateStatsCountersAndRowBadge(target.rowId);
            }
          });
        });

        verifTbody.querySelectorAll('.btn-confirm-ocr-row').forEach(btn => {
          btn.addEventListener('click', () => {
            syncExtractedRowsFromDom();
            const target = extractedRows.find(r => r.rowId === btn.getAttribute('data-row-id'));
            if (target) {
              target.verifiedByTeacher = true;
              target.confidence = 100;
              refreshVerificationTable();
            }
          });
        });

        verifTbody.querySelectorAll('.btn-delete-ocr-row').forEach(btn => {
          btn.addEventListener('click', () => {
            syncExtractedRowsFromDom();
            const rowId = btn.getAttribute('data-row-id');
            extractedRows = extractedRows.filter(r => r.rowId !== rowId);
            extractedRows.forEach((r, i) => { r.numero = i + 1; });
            refreshVerificationTable();
          });
        });
      }

      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
          syncExtractedRowsFromDom();
          const checked = selectAllCheckbox.checked;
          extractedRows.forEach(r => { r.selected = checked; });
          refreshVerificationTable();
        });
      }

      if (btnApplyDefaultGenre && defaultGenreSelect) {
        btnApplyDefaultGenre.addEventListener('click', () => {
          syncExtractedRowsFromDom();
          const chosenGenre = defaultGenreSelect.value || 'Garçon';
          extractedRows.forEach(r => { r.genre = chosenGenre; });
          refreshVerificationTable();
          Toast.show(`Sexe « ${chosenGenre} » appliqué aux élèves de l'aperçu.`, "info");
        });
      }

      if (filterVerifyCheckbox) {
        filterVerifyCheckbox.addEventListener('change', () => {
          syncExtractedRowsFromDom();
          showVerifyOnly = filterVerifyCheckbox.checked;
          refreshVerificationTable();
        });
      }

      if (allowDupsCheckbox) {
        allowDupsCheckbox.addEventListener('change', () => {
          syncExtractedRowsFromDom();
          refreshVerificationTable();
        });
      }

      if (selectTargetClass) {
        selectTargetClass.addEventListener('change', () => {
          syncExtractedRowsFromDom();
          if (extractedRows.length > 0) refreshVerificationTable();
        });
      }

      // Ouvrir / utiliser le formulaire spacieux « Ajouter un élève oublié »
      if (btnAddRow) {
        btnAddRow.addEventListener('click', () => {
          syncExtractedRowsFromDom();
          if (verifSection) verifSection.style.display = 'block';
          if (forgottenBox) {
            forgottenBox.style.display = 'block';
            if (inpForgottenNom) {
              inpForgottenNom.value = '';
              setTimeout(() => {
                inpForgottenNom.focus();
                if (typeof forgottenBox.scrollIntoView === 'function') {
                  forgottenBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 80);
            }
            if (inpForgottenPrenom) inpForgottenPrenom.value = '';
            if (inpForgottenMatricule) inpForgottenMatricule.value = '';
            if (inpForgottenGenre && defaultGenreSelect) inpForgottenGenre.value = defaultGenreSelect.value || 'Garçon';
          } else {
            const nextNum = extractedRows.length + 1;
            extractedRows.push({
              rowId: `manual_row_${Date.now()}_${nextNum}`,
              numero: nextNum,
              matricule: '',
              nom: '',
              prenom: '',
              genre: defaultGenreSelect ? defaultGenreSelect.value : 'Garçon',
              confidence: 100,
              verifiedByTeacher: true,
              selected: true
            });
            showVerifyOnly = false;
            if (filterVerifyCheckbox) filterVerifyCheckbox.checked = false;
            refreshVerificationTable();
          }
        });
      }

      const hideForgottenBox = () => {
        if (forgottenBox) forgottenBox.style.display = 'none';
      };
      if (btnCloseForgotten) btnCloseForgotten.addEventListener('click', hideForgottenBox);
      if (btnCancelForgotten) btnCancelForgotten.addEventListener('click', hideForgottenBox);

      if (btnConfirmForgotten) {
        btnConfirmForgotten.addEventListener('click', () => {
          syncExtractedRowsFromDom();
          const nomVal = inpForgottenNom ? inpForgottenNom.value.trim().toUpperCase() : '';
          const prenomVal = inpForgottenPrenom ? inpForgottenPrenom.value.trim() : '';
          const genreVal = inpForgottenGenre ? inpForgottenGenre.value : 'Garçon';
          const matVal = inpForgottenMatricule ? inpForgottenMatricule.value.trim() : '';

          if (!nomVal || nomVal.length < 2) {
            Toast.show("Veuillez saisir le nom de famille de l'élève oublié.", "error");
            if (inpForgottenNom) inpForgottenNom.focus();
            return;
          }
          if (!prenomVal || prenomVal.length < 2) {
            Toast.show("Veuillez saisir le prénom de l'élève oublié.", "error");
            if (inpForgottenPrenom) inpForgottenPrenom.focus();
            return;
          }

          const nextNum = extractedRows.length + 1;
          extractedRows.push({
            rowId: `manual_row_${Date.now()}_${nextNum}`,
            numero: nextNum,
            matricule: matVal,
            nom: nomVal,
            prenom: prenomVal,
            genre: genreVal,
            confidence: 100,
            verifiedByTeacher: true,
            selected: true
          });

          hideForgottenBox();
          showVerifyOnly = false;
          if (filterVerifyCheckbox) filterVerifyCheckbox.checked = false;
          refreshVerificationTable();
          Toast.show(`Élève ${nomVal} ${prenomVal} ajouté à la liste à importer.`, "success");
        });
      }
    }, 80);
  }

  // --- MODAL: BILAN DE L'IMPORTATION PAR PHOTO (SECTION 7) ---
  function displayPhotoImportReport(report) {
    const isFullSuccess = report.importedCount > 0 && report.toCorrectCount === 0 && report.duplicateCount === 0;
    const reportHtml = `
      <div style="padding: 6px 0;">
        <div style="text-align: center; padding: 18px 12px; background: ${isFullSuccess ? 'rgba(22, 163, 74, 0.08)' : 'rgba(37, 99, 235, 0.08)'}; border-radius: 8px; margin-bottom: 18px; border: 1px solid ${isFullSuccess ? '#16a34a' : '#2563eb'};">
          <i class="fas fa-circle-check" style="font-size: 2.6rem; color: ${isFullSuccess ? '#16a34a' : '#2563eb'}; margin-bottom: 8px;"></i>
          <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main);">
            Bilan de l'importation par photo
          </h3>
          <p style="margin: 4px 0 0; color: var(--text-muted); font-size: 0.9rem;">
            <strong>${report.importedCount}</strong> élève${report.importedCount > 1 ? 's' : ''} importé${report.importedCount > 1 ? 's' : ''} dans la classe <strong>${report.targetClassName}</strong>.
          </p>
        </div>

        <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px 18px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px; font-size: 0.92rem; color: var(--text-main);">
            <i class="fas fa-clipboard-list" style="color:var(--primary); margin-right:6px;"></i> Résultats réels de l'enregistrement
          </h4>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9rem;">
            <div>• Élèves détectés : <strong>${report.detectedCount}</strong></div>
            <div>• Élèves validés : <strong>${report.validatedCount}</strong></div>
            <div style="color: #16a34a;">• Élèves importés : <strong>${report.importedCount}</strong></div>
            <div style="color: #d97706;">• Doublons ignorés : <strong>${report.duplicateCount}</strong></div>
            <div style="color: ${report.toCorrectCount > 0 ? '#dc2626' : 'var(--text-muted)'};">• Lignes à corriger : <strong>${report.toCorrectCount}</strong></div>
          </div>
        </div>

        <div style="margin-top: 18px; text-align: right;">
          <button class="btn btn-primary" id="btn-close-photo-report">
            <i class="fas fa-check"></i> Terminer et afficher la classe
          </button>
        </div>
      </div>
    `;

    Modal.open("Bilan de l'Importation par Photo", reportHtml, () => {});

    setTimeout(() => {
      const btnClose = document.getElementById('btn-close-photo-report');
      if (btnClose) {
        btnClose.addEventListener('click', () => Modal.close());
      }
    }, 50);
  }

  // Initial render
  renderView();

  // Listen for background events
  window.addEventListener('eps:prof-changed', () => renderView());
  window.addEventListener('eps:db-ready', () => renderView());
}
