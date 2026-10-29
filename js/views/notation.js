/**
 * Notation View Controller (js/views/notation.js)
 * Real-time grading module connected to Teacher Classes, official scales,
 * autonomous individual grading without required student roster, and strict regulatory validation.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { Toast } from '../components.js';

export function renderNotation(container) {
  const currentProf = db.getCurrentProfesseur();
  const myClasses = db.getClasses();
  const officialNiveaux = EPSEngine.OFFICIAL_LEVELS;
  const disciplinesList = db.getDisciplines();

  // Selected class: either first class of teacher or default official level
  let selectedClasseId = "Troisième";
  if (myClasses.length > 0) {
    selectedClasseId = myClasses[0].id;
  }

  container.innerHTML = `
    <div class="notation-wrapper">
      <!-- Form Panel -->
      <div class="card notation-card">
        <div class="card-header" style="justify-content:space-between; align-items:center;">
          <h3 class="card-title"><i class="fas fa-stopwatch"></i> Saisie de la Performance & Calcul</h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Professeur : <strong>${currentProf.nom}</strong></span>
        </div>

        <!-- Active Class Banner Indicator -->
        <div id="active-class-banner" style="margin: 0 0 18px 0; background: var(--primary-light); color: var(--primary); padding: 10px 16px; border-radius: var(--radius-sm); font-size: 0.88rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(79, 70, 229, 0.2);">
          <div>
            <i class="fas fa-layer-group"></i> Barème officiel : 
            <strong id="banner-class-level">Troisième</strong>
            <span id="banner-class-name-container" style="color: var(--text-muted); font-size: 0.82rem; margin-left: 6px;"></span>
          </div>
          <span class="badge" id="banner-class-count" style="background: #ffffff; color: var(--primary); font-weight:700;">Calcul direct autonome</span>
        </div>

        <form id="notation-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Classe ou Niveau officiel <span style="color:red;">*</span></label>
              <select class="form-select" id="select-classe">
                <optgroup label="Niveaux standards (Calcul direct)">
                  ${officialNiveaux.map(n => `<option value="${n}" ${n === selectedClasseId ? 'selected' : ''}>${n}</option>`).join('')}
                </optgroup>
                ${myClasses.length > 0 ? `
                  <optgroup label="Vos classes configurées">
                    ${myClasses.map(c => `<option value="${c.id}" ${c.id === selectedClasseId ? 'selected' : ''}>${c.nom} (${c.niveau})</option>`).join('')}
                  </optgroup>
                ` : ''}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Élève évalué <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(Optionnel pour le calcul)</span></label>
              <select class="form-select" id="select-eleve">
                <option value="">-- Mode direct (Sans liste d'élèves) --</option>
              </select>
              <input type="text" id="input-eleve-nom-libre" class="form-control" placeholder="Nom ou prénom de l'élève (optionnel)" style="margin-top: 6px; font-size: 0.85rem;" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Activité Sportive</label>
              <select class="form-select" id="select-discipline">
                ${disciplinesList.map(d => `<option value="${d.nom}" ${d.nom === 'Lancer de poids' ? 'selected' : ''}>${d.nom}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" id="group-select-engin">
              <label class="form-label">Poids de l'Engin</label>
              <select class="form-select" id="select-engin">
                <!-- Dynamically filled -->
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Genre</label>
              <select class="form-select" id="select-genre">
                <option value="Garçon">Garçon</option>
                <option value="Fille">Fille</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1.5;">
              <label class="form-label"><i class="fas fa-scale-balanced"></i> Barème d'évaluation appliqué <span style="color:red;">*</span></label>
              <select class="form-select" id="select-bareme-mode">
                <option value="OFFICIAL" selected>🛡️ Barème Officiel Ministériel (Référence Nationale)</option>
              </select>
            </div>

            <div class="form-group" style="flex: 1;">
              <label class="form-label">Mode de Calcul de la Note</label>
              <select class="form-select" id="select-mode-calcul">
                <option value="interpolation" selected>Interpolation Linéaire Exacte (Proportionnelle)</option>
                <option value="palier">Palier Strict (Note Inférieure)</option>
              </select>
            </div>
          </div>

          <div id="validation-error-alert" class="alert alert-danger" style="display: none; margin-bottom: 16px; border-radius: 8px; font-size: 0.9rem; padding: 12px 16px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; line-height: 1.5;">
            <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #f87171;"></i>
            <span id="validation-error-msg"></span>
          </div>

          <div class="form-group">
            <label class="form-label" id="label-performance">Distance Réalisée</label>
            <div class="distance-input-container">
              <input type="text" inputmode="decimal" autocomplete="off" autocorrect="off" spellcheck="false" class="form-control distance-big-input" id="input-distance" placeholder="0.00" autofocus />
              <span class="distance-unit" id="unit-badge">mètres</span>
            </div>
          </div>

          <!-- Instant Live Score Banner for Mobile Viewports -->
          <div class="mobile-live-score-banner" id="mobile-live-score-banner">
            <div class="live-score-left">
              <span class="live-score-label">Note calculée :</span>
              <strong class="live-score-value" id="mobile-score-val">-- / 20</strong>
            </div>
            <span class="live-score-badge" id="mobile-score-apprec">En attente</span>
          </div>

          <button type="button" class="btn btn-success btn-lg" id="btn-save-eval" style="width: 100%; margin-top: 10px;">
            <i class="fas fa-check-circle"></i> Enregistrer la Note
          </button>
        </form>
      </div>

      <!-- Realtime Score Hero Card -->
      <div class="score-result-card">
        <h4 style="color: var(--text-light); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">Note Calculée</h4>

        <div class="score-circle" id="score-circle">
          <span class="score-value" id="score-val">00</span>
          <span class="score-max">/ 20</span>
        </div>

        <div class="score-appreciation" id="score-apprec" style="background: rgba(255,255,255,0.1); color: white;">
          Saisissez une performance
        </div>

        <div id="score-mode-details" style="margin-top: 16px; font-size: 0.85rem; color: #cbd5e1; text-align: center; line-height: 1.6;">
          <p id="score-detail-exact">Note Exacte (Interpolée) : <strong>-</strong></p>
          <p id="score-detail-palier">Note Palier Strict : <strong>-</strong></p>
        </div>

        <p id="score-detail" style="font-size: 0.78rem; color: var(--text-light); margin-top: 12px; text-align: center;">
          Barème actif
        </p>
      </div>
    </div>
  `;

  // DOM references
  const selectClasse = container.querySelector('#select-classe');
  const selectEleve = container.querySelector('#select-eleve');
  const inputEleveNomLibre = container.querySelector('#input-eleve-nom-libre');
  const selectDiscipline = container.querySelector('#select-discipline');
  const groupEngin = container.querySelector('#group-select-engin');
  const selectEngin = container.querySelector('#select-engin');
  const selectGenre = container.querySelector('#select-genre');
  const selectBaremeMode = container.querySelector('#select-bareme-mode');
  const selectMode = container.querySelector('#select-mode-calcul');
  const labelPerformance = container.querySelector('#label-performance');
  const inputDistance = container.querySelector('#input-distance');
  const unitBadge = container.querySelector('#unit-badge');
  const btnSave = container.querySelector('#btn-save-eval');
  const validationAlert = container.querySelector('#validation-error-alert');
  const validationMsg = container.querySelector('#validation-error-msg');

  const bannerClassLevel = container.querySelector('#banner-class-level');
  const bannerClassNameContainer = container.querySelector('#banner-class-name-container');
  const bannerClassCount = container.querySelector('#banner-class-count');

  const scoreVal = container.querySelector('#score-val');
  const scoreApprec = container.querySelector('#score-apprec');
  const scoreDetail = container.querySelector('#score-detail');
  const scoreDetailExact = container.querySelector('#score-detail-exact');
  const scoreDetailPalier = container.querySelector('#score-detail-palier');
  const scoreCircle = container.querySelector('#score-circle');
  const mobileScoreVal = container.querySelector('#mobile-score-val');
  const mobileScoreApprec = container.querySelector('#mobile-score-apprec');

  // Helper: get current active class object and resolved official niveau
  function getActiveClasseInfo() {
    const val = selectClasse.value;
    const clsObj = db.getClassById(val);
    if (clsObj) {
      return {
        id: clsObj.id,
        nom: clsObj.nom,
        niveau: clsObj.niveau || EPSEngine.normalizeNiveau(clsObj.nom)
      };
    }
    // Fallback: standard niveau string
    const normalized = EPSEngine.normalizeNiveau(val);
    return {
      id: null,
      nom: val || normalized,
      niveau: normalized
    };
  }

  function updateBaremeChoices() {
    if (!selectBaremeMode) return;
    const discipline = selectDiscipline.value;
    const { niveau } = getActiveClasseInfo();
    const genre = selectGenre.value;
    const currentVal = selectBaremeMode.value;

    const customBaremes = db.getCustomBaremes(currentProf.id, discipline, niveau, genre);

    let html = '<option value="OFFICIAL">🛡️ Barème Officiel Ministériel (Référence Nationale)</option>';
    if (customBaremes && customBaremes.length > 0) {
      html += '<optgroup label="Vos Barèmes Personnalisés">';
      customBaremes.forEach(cb => {
        html += `<option value="${cb.id}">⚙️ ${cb.nom}</option>`;
      });
      html += '</optgroup>';
    }

    selectBaremeMode.innerHTML = html;
    if (currentVal && (currentVal === 'OFFICIAL' || customBaremes.some(cb => cb.id === currentVal))) {
      selectBaremeMode.value = currentVal;
    } else {
      selectBaremeMode.value = 'OFFICIAL';
    }
  }

  function updateEnginsList() {
    const disciplineNom = selectDiscipline.value;
    const availableDisciplines = db.getDisciplines();
    const discObj = availableDisciplines.find(d => d.nom === disciplineNom);
    let engins = (discObj && discObj.engins && discObj.engins.length > 0) ? discObj.engins : [];

    if (engins.length === 0) {
      const lower = disciplineNom.toLowerCase();
      if (lower.includes("poids")) engins = ["3kg", "4kg", "5kg"];
      else if (lower.includes("disque")) engins = ["2kg", "3kg"];
      else if (lower.includes("javelot")) engins = ["600g", "800g"];
    }

    if (engins.length > 0) {
      groupEngin.style.display = 'block';
      const prevVal = selectEngin.value;
      selectEngin.innerHTML = engins.map(e => `<option value="${e}">${e}</option>`).join('');
      
      // Auto-select standard engine according to class level and gender
      const { niveau } = getActiveClasseInfo();
      const genre = selectGenre.value;
      if (disciplineNom.toLowerCase().includes("poids")) {
        if (genre === 'Fille') {
          if (engins.includes("3kg")) selectEngin.value = "3kg";
          else if (engins.includes("4kg")) selectEngin.value = "4kg";
        } else {
          if ((niveau === "Seconde" || niveau === "Première" || niveau === "Terminale") && engins.includes("5kg")) {
            selectEngin.value = "5kg";
          } else if (engins.includes("4kg")) {
            selectEngin.value = "4kg";
          }
        }
      } else if (prevVal && engins.includes(prevVal)) {
        selectEngin.value = prevVal;
      }
    } else {
      groupEngin.style.display = 'none';
      selectEngin.innerHTML = '';
    }

    const isTime = EPSEngine.isTimeDiscipline(disciplineNom);
    const isLongRun = disciplineNom.toLowerCase().includes("1000m") || disciplineNom.toLowerCase().includes("800m");
    
    labelPerformance.textContent = isTime ? "Temps / Chrono Réalisé" : "Distance / Hauteur Réalisée";
    unitBadge.textContent = isLongRun ? "min'sec'' (ex: 2'10'' ou 3'09'')" : (isTime ? "secondes (ex: 8.20 ou 9.80)" : "mètres");
    inputDistance.placeholder = isLongRun ? "ex: 2'10'', 3'09'', ou 2'10 (min'sec'')" : (isTime ? "ex: 8''2 ou 9''8 ou 8.20" : "ex: 11.70");
  }

  function updateEleveList() {
    const classInfo = getActiveClasseInfo();
    
    // Update active class banner indicator
    bannerClassLevel.textContent = classInfo.niveau;
    if (bannerClassNameContainer) {
      if (classInfo.id) {
        bannerClassNameContainer.textContent = `· Classe : ${classInfo.nom}`;
      } else {
        bannerClassNameContainer.textContent = `· Barème officiel direct`;
      }
    }

    // Filter students belonging to this class (if created)
    const classStudents = db.getEleves(classInfo.id || classInfo.niveau);
    if (classStudents.length > 0) {
      bannerClassCount.textContent = `${classStudents.length} élève${classStudents.length > 1 ? 's' : ''}`;
      selectEleve.innerHTML = '<option value="">-- Calcul direct (Sans élève spécifique) --</option>';
      classStudents.forEach(e => {
        const isEvaluated = db.getEvaluations().some(ev => (ev.eleveId === e.id || ev.eleveNom === `${e.nom} ${e.prenom}`) && ev.discipline === selectDiscipline.value);
        selectEleve.innerHTML += `
          <option value="${e.id}" data-genre="${e.genre}">
            ${e.nom} ${e.prenom} (${e.genre}) ${isEvaluated ? '✓' : ''}
          </option>
        `;
      });
      if (inputEleveNomLibre) {
        inputEleveNomLibre.style.display = selectEleve.value === '' ? 'block' : 'none';
      }
    } else {
      bannerClassCount.textContent = `Calcul direct autonome`;
      selectEleve.innerHTML = '<option value="">-- Mode direct (Sans liste d\'élèves) --</option>';
      if (inputEleveNomLibre) {
        inputEleveNomLibre.style.display = 'block';
      }
    }
  }

  function updateLiveScore() {
    const discipline = selectDiscipline.value;
    const engin = selectEngin.value || null;
    const classInfo = getActiveClasseInfo();
    const classe = classInfo.niveau;
    let genre = selectGenre.value;
    const mode = selectMode.value;
    const rawVal = inputDistance.value.trim();

    // If an existing student is explicitly selected, his/her actual gender prevails
    const eleveId = selectEleve.value;
    if (eleveId) {
      const eleveObj = db.getEleveById(eleveId);
      if (eleveObj) {
        genre = eleveObj.genre;
        if (selectGenre.value !== genre) {
          selectGenre.value = genre;
          updateEnginsList();
        }
      }
    }

    // Selected scale (Official or Custom)
    const baremeChoice = selectBaremeMode ? selectBaremeMode.value : 'OFFICIAL';
    let customBareme = null;
    if (baremeChoice !== 'OFFICIAL') {
      customBareme = db.findBaremeById(baremeChoice);
    }

    // 1. Strict input validation
    const validation = EPSEngine.validateInput(discipline, classe, genre, engin);

    if (!validation.valid && !customBareme) {
      validationAlert.style.display = 'block';
      validationMsg.textContent = validation.message;

      scoreVal.textContent = "--";
      scoreCircle.style.borderColor = "var(--accent-rose)";
      scoreApprec.textContent = validation.errorType === 'engin_incompatible' ? "Poids Incompatible" : "Activité Non Autorisée";
      scoreApprec.style.background = "var(--accent-rose)";
      scoreDetailExact.innerHTML = `Note Exacte (Interpolée) : <strong style="color: #f87171;">Non calculée</strong>`;
      scoreDetailPalier.innerHTML = `Note Palier Strict : <strong style="color: #f87171;">Non calculée</strong>`;
      scoreDetail.innerHTML = `<span style="color:#fca5a5; font-weight:600;"><i class="fas fa-ban"></i> Saisie non conforme au barème officiel</span>`;
      
      btnSave.disabled = true;
      btnSave.style.opacity = '0.5';
      btnSave.style.cursor = 'not-allowed';
      return;
    }

    // Input is valid
    validationAlert.style.display = 'none';
    validationMsg.textContent = '';
    btnSave.disabled = false;
    btnSave.style.opacity = '1';
    btnSave.style.cursor = 'pointer';

    if (!rawVal) {
      scoreVal.textContent = "00";
      scoreApprec.textContent = "Saisissez une performance";
      scoreApprec.style.background = "rgba(255,255,255,0.1)";
      scoreDetailExact.innerHTML = "Note Exacte (Interpolée) : <strong>-</strong>";
      scoreDetailPalier.innerHTML = "Note Palier Strict : <strong>-</strong>";
      if (customBareme) {
        scoreDetail.innerHTML = `<span style="color:#f59e0b; font-weight:700;"><i class="fas fa-sliders"></i> Barème Personnalisé : ${customBareme.nom}</span>`;
      } else {
        scoreDetail.innerHTML = `<span style="color:#10b981; font-weight:600;"><i class="fas fa-lock"></i> Barème officiel actif : ${classe} - ${genre}${engin ? ' (' + engin + ')' : ''}</span>`;
      }
      scoreCircle.style.borderColor = "var(--primary)";
      if (mobileScoreVal) mobileScoreVal.textContent = "-- / 20";
      if (mobileScoreApprec) {
        mobileScoreApprec.textContent = "En attente";
        mobileScoreApprec.className = "live-score-badge";
      }
      return;
    }

    const result = EPSEngine.calculateGrade(discipline, classe, genre, rawVal, engin, mode, customBareme);

    if (result.valid && result.note !== null) {
      const displayNote = (mode === 'interpolation') ? Number(result.noteExacte).toFixed(2) : result.notePalier;
      scoreVal.textContent = displayNote;
      scoreApprec.textContent = result.appreciation;

      let badgeClass = "badge-mid";
      if (result.note >= 14) {
        scoreCircle.style.borderColor = "var(--accent-emerald)";
        scoreApprec.style.background = "var(--accent-emerald)";
        badgeClass = "badge-high";
      } else if (result.note >= 10) {
        scoreCircle.style.borderColor = "var(--accent-amber)";
        scoreApprec.style.background = "var(--accent-amber)";
        badgeClass = "badge-mid";
      } else {
        scoreCircle.style.borderColor = "var(--accent-rose)";
        scoreApprec.style.background = "var(--accent-rose)";
        badgeClass = "badge-low";
      }

      if (mobileScoreVal) mobileScoreVal.textContent = `${displayNote} / 20`;
      if (mobileScoreApprec) {
        mobileScoreApprec.textContent = result.appreciation;
        mobileScoreApprec.className = `live-score-badge ${badgeClass}`;
      }

      scoreDetailExact.innerHTML = `Note Exacte (Interpolée) : <strong style="color: #4ade80;">${Number(result.noteExacte).toFixed(2)} / 20</strong>`;
      scoreDetailPalier.innerHTML = `Note Palier Strict : <strong style="color: #60a5fa;">${result.notePalier} / 20</strong>`;
      if (customBareme) {
        scoreDetail.innerHTML = `<span style="color:#f59e0b; font-weight:700;"><i class="fas fa-sliders"></i> Barème Personnalisé actif : ${customBareme.nom}</span>`;
      } else {
        scoreDetail.innerHTML = `<span style="color:#10b981; font-weight:600;"><i class="fas fa-lock"></i> Barème officiel actif : ${classe} - ${genre}${engin ? ' (' + engin + ')' : ''}</span>`;
      }
    } else {
      scoreVal.textContent = "--";
      scoreApprec.textContent = result.appreciation || "Performance non valide";
      scoreApprec.style.background = "var(--accent-rose)";
      scoreCircle.style.borderColor = "var(--accent-rose)";
      if (mobileScoreVal) mobileScoreVal.textContent = "-- / 20";
      if (mobileScoreApprec) {
        mobileScoreApprec.textContent = result.appreciation || "Non valide";
        mobileScoreApprec.className = "live-score-badge badge-low";
      }
      scoreDetailExact.innerHTML = "Note Exacte (Interpolée) : <strong>-</strong>";
      scoreDetailPalier.innerHTML = "Note Palier Strict : <strong>-</strong>";
      scoreDetail.textContent = result.detail || "Saisie hors barème";
    }
  }

  // --- EVENT LISTENERS ---
  selectClasse.addEventListener('change', () => {
    updateEleveList();
    updateEnginsList();
    updateBaremeChoices();
    updateLiveScore();
  });

  selectDiscipline.addEventListener('change', () => {
    updateEnginsList();
    updateEleveList();
    updateBaremeChoices();
    updateLiveScore();
  });

  selectEngin.addEventListener('change', () => {
    updateBaremeChoices();
    updateLiveScore();
  });

  selectGenre.addEventListener('change', () => {
    updateEnginsList();
    updateBaremeChoices();
    updateLiveScore();
  });

  if (selectBaremeMode) {
    selectBaremeMode.addEventListener('change', () => {
      updateLiveScore();
    });
  }

  selectMode.addEventListener('change', () => {
    updateLiveScore();
  });

  selectEleve.addEventListener('change', () => {
    const val = selectEleve.value;
    if (val) {
      if (inputEleveNomLibre) inputEleveNomLibre.style.display = 'none';
      const el = db.getEleveById(val);
      if (el) {
        selectGenre.value = el.genre;
        updateEnginsList();
        updateBaremeChoices();
      }
    } else {
      if (inputEleveNomLibre) inputEleveNomLibre.style.display = 'block';
    }
    updateLiveScore();
  });

  if (inputEleveNomLibre) {
    inputEleveNomLibre.addEventListener('input', () => {
      // Freeform student name typed
    });
  }

  inputDistance.addEventListener('input', () => {
    updateLiveScore();
  });

  // Save evaluation button (autonomous or student-linked)
  btnSave.addEventListener('click', async () => {
    const rawVal = inputDistance.value.trim();

    if (!rawVal) {
      Toast.show("Veuillez saisir une performance valide avant d'enregistrer.", "error");
      inputDistance.focus();
      return;
    }

    const classInfo = getActiveClasseInfo();
    const officialNiveau = classInfo.niveau;
    let genre = selectGenre.value;
    let eleveNom = "";
    let studentIdToSave = null;

    const eleveId = selectEleve.value;
    if (eleveId) {
      const eleveObj = db.getEleveById(eleveId);
      if (eleveObj) {
        studentIdToSave = eleveObj.id;
        eleveNom = `${eleveObj.nom} ${eleveObj.prenom}`;
        genre = eleveObj.genre;
      }
    }

    if (!eleveNom) {
      const nomLibre = inputEleveNomLibre ? (inputEleveNomLibre.value || '').trim() : '';
      if (nomLibre) {
        eleveNom = nomLibre;
      } else {
        eleveNom = `Élève (${genre} - ${officialNiveau})`;
      }
    }

    // Determine chosen scale (Official vs Custom)
    const baremeChoice = selectBaremeMode ? selectBaremeMode.value : 'OFFICIAL';
    let chosenBareme = null;
    if (baremeChoice !== 'OFFICIAL') {
      chosenBareme = db.findBaremeById(baremeChoice);
    } else {
      chosenBareme = db.findOfficialBareme(selectDiscipline.value, officialNiveau, genre, selectEngin.value || null);
    }

    // Validate inputs against official scale (if official mode)
    if (!chosenBareme || chosenBareme.isOfficial !== false) {
      const validation = EPSEngine.validateInput(selectDiscipline.value, officialNiveau, genre, selectEngin.value || null);
      if (!validation.valid) {
        Toast.show(validation.message, "error");
        return;
      }
    }

    const perfNum = EPSEngine.parsePerformance(rawVal);
    const result = EPSEngine.calculateGrade(selectDiscipline.value, officialNiveau, genre, rawVal, selectEngin.value || null, selectMode.value, chosenBareme);

    if (!result.valid || result.note === null || !result.baremeFound) {
      Toast.show(result.error || "Impossible d'enregistrer : saisie non conforme", "error");
      return;
    }

    btnSave.disabled = true;
    btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enregistrement...`;

    try {
      const isTime = EPSEngine.isTimeDiscipline(selectDiscipline.value);
      const perfFormatted = EPSEngine.formatPerformance(perfNum, isTime, selectDiscipline.value);

      await db.addEvaluation({
        eleveId: studentIdToSave,
        eleveNom: eleveNom,
        classeId: classInfo.id,
        classeNom: classInfo.nom,
        classe: officialNiveau,
        genre: genre,
        discipline: selectDiscipline.value,
        engin: result.engin || selectEngin.value || null,
        distance: perfNum,
        performanceFormatted: perfFormatted,
        note: result.note,
        noteExacte: result.noteExacte,
        notePalier: result.notePalier,
        professeurId: currentProf.id,
        baremeId: chosenBareme ? chosenBareme.id : 'bareme_officiel',
        baremeNom: chosenBareme ? chosenBareme.nom : 'Barème Officiel Ministériel',
        baremeType: (chosenBareme && chosenBareme.isOfficial === false) ? 'personnalisé' : 'officiel'
      });

      Toast.show(`Note de ${result.note}/20 enregistrée avec succès pour ${eleveNom} !`, "success");
      inputDistance.value = '';
      if (inputEleveNomLibre) inputEleveNomLibre.value = '';

      // Update student list checkmarks and auto-advance to next student if in a roster
      updateEleveList();

      if (eleveId) {
        const options = Array.from(selectEleve.options).filter(opt => opt.value !== '');
        const currentIndex = options.findIndex(opt => opt.value === eleveId);
        if (currentIndex >= 0 && currentIndex < options.length - 1) {
          selectEleve.value = options[currentIndex + 1].value;
          const nextEl = db.getEleveById(selectEleve.value);
          if (nextEl) {
            selectGenre.value = nextEl.genre;
            updateEnginsList();
            updateBaremeChoices();
          }
        } else {
          selectEleve.value = '';
        }
      }

      updateLiveScore();
      inputDistance.focus();
    } catch (err) {
      console.error(err);
      Toast.show("Erreur lors de l'enregistrement de l'évaluation.", "error");
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fas fa-check-circle"></i> Enregistrer la Note`;
    }
  });

  // Initial setup
  updateEnginsList();
  updateEleveList();
  updateBaremeChoices();
  updateLiveScore();

  // Listen to background updates
  window.addEventListener('eps:prof-changed', () => {
    updateEnginsList();
    updateEleveList();
    updateBaremeChoices();
    updateLiveScore();
  });
  window.addEventListener('eps:db-synced', () => {
    updateEnginsList();
    updateEleveList();
    updateBaremeChoices();
    updateLiveScore();
  });
}
