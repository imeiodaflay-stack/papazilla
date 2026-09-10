document.addEventListener('click', (event) => {
  const chip = event.target.closest('.pz-chip');
  if (chip) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');

  const tab = event.target.closest('.pz-tab');
  if (tab) {
    tab.closest('.pz-tabs').querySelectorAll('.pz-tab').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
  }

  const navItem = event.target.closest('.pz-bottom-nav__item');
  if (navItem) {
    navItem.closest('.pz-bottom-nav').querySelectorAll('.pz-bottom-nav__item').forEach((item) => item.removeAttribute('aria-current'));
    navItem.setAttribute('aria-current', 'page');
  }

  if (event.target.closest('[data-toast]')) {
    const toast = document.createElement('div');
    toast.className = 'pz-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<strong>Receita salva!</strong><br><span class="pz-small">Ela já está pronta para a próxima fornalha.</span>';
    document.querySelector('.pz-toast-region').append(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  if (event.target.closest('[data-open-sheet]')) document.querySelector('.pz-backdrop').dataset.open = 'true';
  if (event.target.closest('[data-close-sheet]') || event.target.classList.contains('pz-backdrop')) document.querySelector('.pz-backdrop').dataset.open = 'false';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelector('.pz-backdrop').dataset.open = 'false';
});

