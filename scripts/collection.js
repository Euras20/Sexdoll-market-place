

// ---- extracted from collection.html ----

/* ---------- Safe storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const fmt = n => n.toLocaleString('fr-FR') + ' €';
const PLACEHOLDER_IMG = window.StorefrontAPI?.PLACEHOLDER || ('data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#e8edff"/></svg>'));
const PRODUCT_PAGE = 'product.html'; // change if your product page has another file name

document.getElementById('year').textContent = new Date().getFullYear();

/* Age gate */
const gate = document.getElementById('age-gate');
if (!store.get('ageOk', false)) gate.classList.remove('hidden');
document.getElementById('age-yes').addEventListener('click', () => { store.set('ageOk', true); gate.classList.add('hidden'); });

/* Badges */
[['cart-badge', store.get('cart', []).length], ['fav-badge', store.get('favs', []).length]].forEach(([id, n]) => {
  const el = document.getElementById(id);
  el.textContent = n;
  el.classList.toggle('hidden', n === 0);
  el.classList.toggle('flex', n > 0);
});

// dummy catalogue removed
// dummy render disabled

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('product-grid');
  const filters = document.getElementById('filters');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty');
  if (!grid || !window.StorefrontAPI) return;

  grid.innerHTML = '';
  if (filters) filters.innerHTML = '';

  const params = new URLSearchParams(location.search);
  const category = params.get('category');
  const q = params.get('q');
  const view = params.get('view'); // morphologie | matiere | taille | marque
  const selected = params.get('value');

  try {
    const catJson = await StorefrontAPI.api('/storefront/categories');
    const cats = Array.isArray(catJson) ? catJson : (catJson.data || []);
    if (filters) {
      const all = document.createElement('a');
      all.href = 'collection.html';
      all.textContent = 'Tous';
      all.className = 'px-4 py-2 rounded-full text-body-sm font-medium ' + (!category ? 'bg-primary text-on-primary' : 'bg-surface-container-low');
      filters.appendChild(all);
      cats.forEach(c => {
        const a = document.createElement('a');
        a.href = 'collection.html?category=' + encodeURIComponent(c.slug);
        a.textContent = c.name;
        a.className = 'px-4 py-2 rounded-full text-body-sm font-medium ' + (category === c.slug ? 'bg-primary text-on-primary' : 'bg-surface-container-low');
        filters.appendChild(a);
      });
    }
  } catch (e) {
    console.info('categories failed', e);
  }

  try {
    const opts = { containerId: 'product-grid', emptyId: 'empty' };
    if (category) opts.category = category;
    if (q) opts.q = q;
    await StorefrontAPI.loadProducts(opts);
    const n = grid.children.length;
    if (count) count.textContent = n ? (n + ' modèle' + (n > 1 ? 's' : '')) : '';
    if (!n && empty) empty.classList.remove('hidden');
  } catch (e) {
    if (empty) {
      empty.textContent = 'Aucun produit pour le moment.';
      empty.classList.remove('hidden');
    }
  }

  if (view) {
    const titles = { morphologie: 'Par morphologie', matiere: 'Par matière', taille: 'Par taille', marque: 'Par marque' };
    const h = document.querySelector('h1');
    if (h) h.textContent = titles[view] || 'Collection';
    try {
      const json = await StorefrontAPI.api('/storefront/products' + (category ? '?category=' + encodeURIComponent(category) : ''));
      const list = Array.isArray(json) ? json : (json.data || []);
      const values = new Set();
      list.forEach(p => {
        if (view === 'marque' && p.brand?.name) values.add(p.brand.name);
        (p.attribute_values || p.attributeValues || []).forEach(av => {
          const label = (av.definition?.label || av.definition?.code || '').toLowerCase();
          const match = view === 'morphologie' ? /morpholog/ : view === 'matiere' ? /mati[eè]re|matiere|silicone|tpe/ : view === 'taille' ? /taille|size|cm/ : /marque|brand/;
          if (match.test(label)) {
            const v = av.value_text ?? av.value_integer ?? av.value_decimal;
            if (v) values.add(String(v));
          }
        });
      });
      if (filters && values.size) {
        filters.innerHTML = '';
        const all = document.createElement('a');
        all.href = 'collection.html?view=' + view;
        all.textContent = 'Tous';
        all.className = 'px-4 py-2 rounded-full text-body-sm font-medium ' + (!selected ? 'bg-primary text-on-primary' : 'bg-surface-container-low');
        filters.appendChild(all);
        [...values].forEach(v => {
          const a = document.createElement('a');
          a.href = 'collection.html?view=' + view + '&value=' + encodeURIComponent(v);
          a.textContent = v;
          a.className = 'px-4 py-2 rounded-full text-body-sm font-medium ' + (selected === v ? 'bg-primary text-on-primary' : 'bg-surface-container-low');
          filters.appendChild(a);
        });
      }
      if (selected && grid) {
        const cards = [...grid.children];
        // re-render filtered
        const filtered = list.filter(p => {
          if (view === 'marque') return p.brand?.name === selected;
          return (p.attribute_values || []).some(av => String(av.value_text ?? av.value_integer ?? av.value_decimal) === selected);
        });
        grid.innerHTML = filtered.map(p => StorefrontAPI.renderProductCard ? StorefrontAPI.renderProductCard(p) : '').join('');
        if (count) count.textContent = filtered.length + ' modèle' + (filtered.length > 1 ? 's' : '');
        if (empty) empty.classList.toggle('hidden', filtered.length > 0);
      }
    } catch (e) { console.info('view filters', e); }
  }

});


window.loadCollectionPage = async function(page) {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  await StorefrontAPI.loadProducts({
    containerId: 'product-grid',
    category: category || undefined,
    q: q || undefined,
    page: page,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
