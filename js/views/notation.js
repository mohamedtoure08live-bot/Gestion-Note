/**
 * Notation View Controller (js/views/notation.js)
 * Real-time grading module with exact linear interpolation & engin weight selection.
 */

import { db } from '../db.js';
import { EPSEngine } from '../engine.js';
import { Toast } from '../components.js';

export function renderNotation(container) {
  const eleves = db.getEleves();
  const classes = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"];
  const disciplinesList = db.getDisciplines();
  if (disciplinesList.length === 0) {
    disciplinesList.push({ id: "poids", nom: "Lancer de poids", engins: ["3kg", "4kg", "5kg"] });
  }

  container.innerHTML = `
    <div class="notation-wrapper">
      <!-- Form Panel -->
      <div class="card notation-card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-stopwatch"></i> Saisie de la Performance</h3>
        </div>

        <form id="notation-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Discipline</label>
              <select class="form-select" id="select-discipline">
                ${disciplinesList.map(d => `<option value="${d.nom}">${d.nom}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" id="group-select-engin">
              <label class="form-label">Poids de l'Engin</label>
              <select class="form-select" id="select-engin">
                <!-- Dynamically filled -->
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Classe</label>
              <select class="form-select" id="select-classe">
                ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
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
            <div class="form-group">
              <label class="form-label">Mode de Calcul de la Note</label>
              <select class="form-select" id="select-mode-calcul">
                <option value="interpolation" selected>Interpolation Linéaire Exacte (Proportionnelle)</option>
                <option value="palier">Palier Strict (Note Inférieure)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Sélectionner l'Élève</label>
              <select class="form-select" id="select-eleve">
                <option value="">-- Choisir un élève --</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" id="label-performance">Distance Réalisée</label>
            <div class="distance-input-container">
              <input type="text" class="form-control distance-big-input" id="input-distance" placeholder="0.00" autofocus />
              <span class="distance-unit" id="unit-badge">mètres</span>
            </div>
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
  const selectDiscipline = container.querySelector('#select-discipline');
  const groupEngin = container.querySelector('#group-select-engin');
  const selectEngin = container.querySelector('#select-engin');
  const selectClasse = container.querySelector('#select-classe');
  const selectGenre = container.querySelector('#select-genre');
  const selectMode = container.querySelector('#select-mode-calcul');
  const selectEleve = container.querySelector('#select-eleve');
  const labelPerformance = container.querySelector('#label-performance');
  const inputDistance = container.querySelector('#input-distance');
  const unitBadge = container.querySelector('#unit-badge');
  const btnSave = container.querySelector('#btn-save-eval');

  const scoreVal = container.querySelector('#score-val');
  const scoreApprec = container.querySelector('#score-apprec');
  const scoreDetail = container.querySelector('#score-detail');
  const scoreDetailExact = container.querySelector('#score-detail-exact');
  const scoreDetailPalier = container.querySelector('#score-detail-palier');
  const scoreCircle = container.querySelector('#score-circle');

  function updateEnginsList() {
    const disciplineNom = selectDiscipline.value;
    const discObj = disciplinesList.find(d => d.nom === disciplineNom);
    const engins = (discObj && discObj.engins && discObj.engins.length > 0) ? discObj.engins : [];

    if (engins.length > 0) {
      groupEngin.style.display = 'block';
      selectEngin.innerHTML = engins.map(e => `<option value="${e}">${e}</option>`).join('');
    } else {
      groupEngin.style.display = 'none';
      selectEngin.innerHTML = '';
    }

    const isTime = disciplineNom.toLowerCase().includes("course") || disciplineNom.toLowerCase().includes("natation");
    const isLongRun = disciplineNom.toLowerCase().includes("1000m") || disciplineNom.toLowerCase().includes("800m");
    
    labelPerformance.textContent = isTime ? "Temps / Chrono Réalisé" : "Distance / Hauteur Réalisée";
    unitBadge.textContent = isLongRun ? "min'sec'' (ex: 3’7´´ ou 3'7'')" : (isTime ? "secondes (ex: 8.20)" : "mètres");
    inputDistance.placeholder = isLongRun ? "ex: 3’7´´ ou 3'7'' ou 3'07'' (3 min 7 sec)" : (isTime ? "ex: 8''2 ou 8.2" : "ex: 11.70");
  }

  function updateEleveList() {
    const selectedClasse = selectClasse.value;
    const selectedGenre = selectGenre.value;
    const filtered = eleves.filter(e => e.classe === selectedClasse && e.genre === selectedGenre);

    selectEleve.innerHTML = '<option value="">-- Choisir un élève --</option>';
    filtered.forEach(e => {
      selectEleve.innerHTML += `<option value="${e.id}">${e.nom} ${e.prenom}</option>`;
    });
  }

  function updateLiveScore() {
    const discipline = selectDiscipline.value;
    const engin = selectEngin.value || null;
    const classe = selectClasse.value;
    const genre = selectGenre.value;
    const mode = selectMode.value;
    const rawVal = inputDistance.value.trim();

    if (!rawVal) {
      scoreVal.textContent = "00";
      scoreApprec.textContent = "Saisissez une performance";
      scoreApprec.style.background = "rgba(255,255,255,0.1)";
      scoreDetailExact.innerHTML = "Note Exacte (Interpolée) : <strong>-</strong>";
      scoreDetailPalier.innerHTML = "Note Palier Strict : <strong>-</strong>";
      scoreDetail.textContent = "Barème en attente de saisie";
      scoreCircle.style.borderColor = "var(--primary)";
      return;
    }

    const result = EPSEngine.calculateGrade(discipline, classe, genre, rawVal, engin, mode);

    scoreVal.textContent = typeof result.note === 'number' ? result.note.toFixed(result.note % 1 === 0 ? 0 : 2) : result.note;
    scoreApprec.textContent = result.appreciation;
    
    scoreDetailExact.innerHTML = `Note Exacte (Interpolée) : <strong style="color:#38bdf8;">${result.noteExacte} / 20</strong>`;
    scoreDetailPalier.innerHTML = `Note Palier Strict : <strong style="color:#facc15;">${result.notePalier} / 20</strong>`;
    scoreDetail.textContent = result.detail + (result.engin ? ` (Engin: ${result.engin})` : '');

    if (result.note >= 14) {
      scoreCircle.style.borderColor = "var(--accent-emerald)";
      scoreApprec.style.background = "var(--accent-emerald)";
    } else if (result.note >= 10) {
      scoreCircle.style.borderColor = "var(--accent-amber)";
      scoreApprec.style.background = "var(--accent-amber)";
    } else {
      scoreCircle.style.borderColor = "var(--accent-rose)";
      scoreApprec.style.background = "var(--accent-rose)";
    }
  }

  // Bind Events
  selectDiscipline.addEventListener('change', () => { updateEnginsList(); updateLiveScore(); });
  selectClasse.addEventListener('change', () => { updateEleveList(); updateLiveScore(); });
  selectGenre.addEventListener('change', () => { updateEleveList(); updateLiveScore(); });
  selectEngin.addEventListener('change', updateLiveScore);
  selectMode.addEventListener('change', updateLiveScore);
  inputDistance.addEventListener('input', updateLiveScore);

  btnSave.addEventListener('click', () => {
    const eleveId = selectEleve.value;
    const rawVal = inputDistance.value.trim();

    if (!eleveId) {
      Toast.show("Veuillez sélectionner un élève", "error");
      return;
    }
    if (!rawVal) {
      Toast.show("Veuillez saisir une performance valide", "error");
      return;
    }

    const eleveObj = eleves.find(e => e.id === eleveId);
    const result = EPSEngine.calculateGrade(selectDiscipline.value, selectClasse.value, selectGenre.value, rawVal, selectEngin.value || null, selectMode.value);

    if (!result.baremeFound) {
      Toast.show("Impossible d'enregistrer : Barème non trouvé", "error");
      return;
    }

    db.addEvaluation({
      eleveId: eleveObj.id,
      eleveNom: `${eleveObj.nom} ${eleveObj.prenom}`,
      discipline: selectDiscipline.value,
      engin: result.engin || selectEngin.value || null,
      classe: selectClasse.value,
      genre: selectGenre.value,
      distance: rawVal,
      note: result.note,
      noteExacte: result.noteExacte,
      notePalier: result.notePalier
    });

    Toast.show(`Note de ${result.note}/20 enregistrée pour ${eleveObj.nom} !`, "success");
    inputDistance.value = '';
    updateLiveScore();
  });

  // Init
  updateEnginsList();
  updateEleveList();
}
