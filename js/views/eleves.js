/**
 * Eleves View Controller (js/views/eleves.js)
 * Student directory management (Add, edit, list, delete).
 */

import { db } from '../db.js';
import { Toast, Modal } from '../components.js';

export function renderEleves(container) {
  const classes = ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"];

  container.innerHTML = `
    <div class="eleves-wrapper">
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-user-plus"></i> Ajouter un Élève</h3>
        </div>

        <form id="add-eleve-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nom</label>
              <input type="text" class="form-control" id="input-nom" placeholder="Ex: KOUASSI" required />
            </div>

            <div class="form-group">
              <label class="form-label">Prénom</label>
              <input type="text" class="form-control" id="input-prenom" placeholder="Ex: Jean-Marc" required />
            </div>

            <div class="form-group">
              <label class="form-label">Classe</label>
              <select class="form-select" id="input-classe">
                ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Genre</label>
              <select class="form-select" id="input-genre">
                <option value="Garçon">Garçon</option>
                <option value="Fille">Fille</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-user-check"></i> Enregistrer l'Élève
          </button>
        </form>
      </div>

      <!-- Student Directory List Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-users-cog"></i> Répertoire des Élèves</h3>
          
          <div style="display:flex; gap: 12px; align-items: center;">
            <select class="form-select" id="filter-classe-eleve" style="width: 180px;">
              <option value="ALL">Toutes les classes</option>
              ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-eleves">
            <thead>
              <tr>
                <th>Nom & Prénom</th>
                <th>Classe</th>
                <th>Genre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tbody-eleves">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const addForm = container.querySelector('#add-eleve-form');
  const inputNom = container.querySelector('#input-nom');
  const inputPrenom = container.querySelector('#input-prenom');
  const inputClasse = container.querySelector('#input-classe');
  const inputGenre = container.querySelector('#input-genre');

  const filterClasse = container.querySelector('#filter-classe-eleve');
  const tbody = container.querySelector('#tbody-eleves');

  function renderList() {
    const selectedClasse = filterClasse.value;
    const eleves = db.getEleves(selectedClasse);

    if (eleves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Aucun élève trouvé.</td></tr>`;
      return;
    }

    tbody.innerHTML = eleves.map(el => `
      <tr>
        <td><strong>${el.nom.toUpperCase()} ${el.prenom}</strong></td>
        <td>${el.classe}</td>
        <td><span class="badge ${el.genre === 'Garçon' ? 'badge-garcon' : 'badge-fille'}">${el.genre}</span></td>
        <td>
          <button class="btn btn-sm btn-danger btn-delete-eleve" data-id="${el.id}" data-name="${el.nom} ${el.prenom}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-delete-eleve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-name');

        Modal.open(
          "Supprimer l'élève",
          `<p>Voulez-vous supprimer définitivement <strong>${name}</strong> ?</p>`,
          () => {
            db.deleteEleve(id);
            Toast.show(`Élève ${name} supprimé.`, "info");
            renderList();
          }
        );
      });
    });
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = inputNom.value.trim();
    const prenom = inputPrenom.value.trim();

    if (!nom || !prenom) {
      Toast.show("Le nom et le prénom sont obligatoires", "error");
      return;
    }

    db.addEleve({
      nom: nom,
      prenom: prenom,
      classe: inputClasse.value,
      genre: inputGenre.value
    });

    Toast.show(`Élève ${nom} ${prenom} ajouté avec succès !`, "success");
    inputNom.value = '';
    inputPrenom.value = '';
    renderList();
  });

  filterClasse.addEventListener('change', renderList);

  renderList();
}
