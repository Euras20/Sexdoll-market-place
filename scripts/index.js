

// ---- extracted from index.html ----

document.addEventListener('DOMContentLoaded', function() {
  const cookieBanner = document.querySelector('.fixed.bottom-4');
  if (cookieBanner) {
    const closeBtn = cookieBanner.querySelector('button[aria-label="Fermer"]');
    const acceptBtn = cookieBanner.querySelector('button:last-child');
    const customizeBtn = cookieBanner.querySelectorAll('button')[1];
    
    function hideBanner() {
      cookieBanner.style.display = 'none';
    }
    
    if (closeBtn) closeBtn.addEventListener('click', hideBanner);
    if (acceptBtn) acceptBtn.addEventListener('click', hideBanner);
    if (customizeBtn) customizeBtn.addEventListener('click', hideBanner);
  }
});

document.addEventListener("DOMContentLoaded", () => { if (window.StorefrontAPI) StorefrontAPI.loadCategories("category-grid"); });

(function(){
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const gate = document.getElementById('age-gate');
  if (gate && !store.get('ageOk', false)) gate.classList.remove('hidden');
  const yes = document.getElementById('age-yes');
  if (yes) yes.addEventListener('click', () => { store.set('ageOk', true); gate.classList.add('hidden'); });
})();

document.addEventListener('DOMContentLoaded', () => {
  if (window.StorefrontAPI?.refreshCartBadge) StorefrontAPI.refreshCartBadge();
});

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('category-grid');
  const empty = document.getElementById('category-empty');
  if (!grid || !window.StorefrontAPI) return;
  try {
    const json = await StorefrontAPI.api('/storefront/categories');
    const cats = Array.isArray(json) ? json : (json.data || []);
    if (!cats.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    grid.innerHTML = cats.map(c => `
      <a class="group flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all" href="collection.html?category=${encodeURIComponent(c.slug)}">
        <div class="relative aspect-[3/4] overflow-hidden bg-surface-container">
          <div class="absolute inset-0 flex items-center justify-center text-on-surface-variant">Aucune image</div>
          <div class="absolute top-3 left-3 bg-surface-container-lowest/90 px-2.5 py-1 rounded text-primary font-label-sm font-semibold uppercase tracking-wider">${c.name}</div>
        </div>
        <div class="p-space-md">
          <h3 class="font-title-md text-title-md text-primary font-semibold group-hover:text-secondary">${c.name}</h3>
          <p class="font-body-sm text-on-surface-variant mt-1">${c.description || ''}</p>
          <span class="inline-flex items-center gap-1 mt-3 text-primary font-semibold">Découvrir <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span>
        </div>
      </a>`).join('');
  } catch (e) {
    console.info('collections load failed', e);
    if (empty) empty.classList.remove('hidden');
  }
});

document.getElementById('site-search')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) location.href = 'collection.html?q=' + encodeURIComponent(q);
  }
});
