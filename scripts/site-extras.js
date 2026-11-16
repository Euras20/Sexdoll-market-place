// Floating WhatsApp + dynamic category drawer
(function () {
  const WA_NUMBER = '33189402210'; // change to the real number
  const WA_TEXT = encodeURIComponent('Bonjour, je souhaite des informations.');

  function addWhatsApp() {
    if (document.getElementById('wa-float')) return;
    const a = document.createElement('a');
    a.id = 'wa-float';
    a.href = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'WhatsApp');
    a.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:60;width:56px;height:56px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);';
    a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 20.5 3.5zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.1.7.7-3-.2-.3A9.1 9.1 0 1 1 12 20.5zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>';
    document.body.appendChild(a);
  }

  async function loadCategoryDrawer() {
    const drawer = document.getElementById('category-drawer');
    if (!drawer || !window.StorefrontAPI) return;
    const list = drawer.querySelector('.flex.flex-col') || drawer.querySelector('div');
    if (!list) return;
    try {
      const json = await StorefrontAPI.api('/storefront/categories');
      const cats = Array.isArray(json) ? json : (json.data || []);
      if (!cats.length) return;
      list.innerHTML = cats.map(c => `
        <a class="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low" href="category.html?category=${encodeURIComponent(c.slug)}">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[22px]">category</span>
            <span class="font-label-md text-label-md font-semibold text-on-surface">${c.name}</span>
          </div>
          <span class="material-symbols-outlined text-[18px] text-secondary">chevron_right</span>
        </a>`).join('');
    } catch (e) {
      console.info('Category drawer load failed', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCategoryDrawer();
  });
})();
