(function () {
  function attach() {
    const input = document.getElementById('site-search') || document.querySelector('input[type="search"], input[placeholder*="Rechercher"]');
    if (!input || input.dataset.live || !window.StorefrontAPI) return;
    input.dataset.live = '1';
    input.setAttribute('autocomplete', 'off');

    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;z-index:60;left:0;right:0;top:100%;margin-top:6px;background:#fff;border:1px solid #eee;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08);max-height:360px;overflow:auto;display:none;';
    const wrap = input.parentElement;
    if (wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    wrap.appendChild(box);

    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { box.style.display = 'none'; return; }
      timer = setTimeout(() => search(q), 250);
    });
    document.addEventListener('click', (e) => { if (!box.contains(e.target) && e.target !== input) box.style.display = 'none'; });

    async function search(q) {
      try {
        const json = await StorefrontAPI.api('/storefront/products?q=' + encodeURIComponent(q));
        const list = (Array.isArray(json) ? json : (json.data || [])).slice(0, 8);
        if (!list.length) {
          box.innerHTML = '<div style="padding:12px 14px;color:#6b7280;font-size:13px;">Aucun résultat</div>';
          box.style.display = 'block';
          return;
        }
        box.innerHTML = list.map(p => {
          const chars = (p.attribute_values || []).map(a => a.value_text).filter(Boolean).slice(0, 2).join(' · ');
          return `<a href="produit.html?slug=${encodeURIComponent(p.slug)}" style="display:block;padding:10px 14px;text-decoration:none;color:#1f2937;border-bottom:1px solid #f3f4f6;">
            <span style="display:block;font-weight:600;font-size:14px;">${p.name}</span>
            <span style="display:block;font-size:12px;color:#6b7280;">${p.category?.name || ''} ${chars ? '· ' + chars : ''}</span>
          </a>`;
        }).join('');
        box.style.display = 'block';
      } catch (e) { box.style.display = 'none'; }
    }
  }
  document.addEventListener('DOMContentLoaded', attach);
})();
