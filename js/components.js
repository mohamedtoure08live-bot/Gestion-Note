/**
 * UI Components Helper (js/components.js)
 * Toast notifications, modals, template helpers.
 */

export class Toast {
  static show(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
      <i class="fas ${iconClass}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export class Modal {
  static open(title, contentHtml, onConfirm = null) {
    let overlay = document.getElementById('global-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 id="modal-title">Titre</h3>
            <button class="btn btn-sm btn-secondary" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer">
            <button class="btn btn-secondary" id="modal-cancel-btn">Fermer</button>
            <button class="btn btn-primary" id="modal-confirm-btn">Valider</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const titleEl = overlay.querySelector('#modal-title');
    const bodyEl = overlay.querySelector('#modal-body');
    const confirmBtn = overlay.querySelector('#modal-confirm-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    const closeBtn = overlay.querySelector('#modal-close-btn');

    titleEl.textContent = title;
    bodyEl.innerHTML = contentHtml;

    if (onConfirm) {
      confirmBtn.style.display = 'inline-flex';
      confirmBtn.onclick = () => {
        onConfirm();
        Modal.close();
      };
    } else {
      confirmBtn.style.display = 'none';
    }

    cancelBtn.onclick = () => Modal.close();
    closeBtn.onclick = () => Modal.close();
    overlay.onclick = (e) => { if (e.target === overlay) Modal.close(); };

    overlay.classList.add('active');
  }

  static close() {
    const overlay = document.getElementById('global-modal');
    if (overlay) overlay.classList.remove('active');
  }
}
