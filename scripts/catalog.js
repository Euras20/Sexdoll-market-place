// Catalog: layout, categories, products
async function loadLayout() {
  try {
    const json = await StorefrontAPI.api('/storefront/layout');
    const data = json.data || json;

    const ann = document.getElementById('announcement');
    if (ann && data.header?.announcement) ann.textContent = data.header.announcement;

    const phoneEl = document.getElementById('store-phone');
    if (phoneEl && data.header?.phone) phoneEl.textContent = data.header.phone;

    const legal = document.getElementById('footer-legal');
    if (legal && data.footer?.legal_text) legal.textContent = data.footer.legal_text;

    document.querySelectorAll('[data-store-name]').forEach(el => {
      el.textContent = data.store?.name || el.textContent;
    });

    return data;
  } catch (err) {
    console.warn('Layout load failed:', err);
    return null;
  }
}

async function loadCategories(containerId = 'category-grid', options = {}) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  try {
    const json = await StorefrontAPI.api('/storefront/categories');
    const categories = json.data || json || [];
    if (!categories.length) return;
    grid.innerHTML = categories.map(cat => renderCategoryCard(cat, options)).join('');
  } catch (err) {
    console.warn('Categories load failed:', err);
  }
}

function renderCategoryCard(cat, options = {}) {
  const img = StorefrontAPI.mediaUrl(cat.image) || StorefrontAPI.PLACEHOLDER;
  const name = cat.name || 'Collection';
  const slug = cat.slug || '';
  const page = options.page || 'collection.html';

  return `
    <a class="group flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
       href="${page}?category=${encodeURIComponent(slug)}">
      <div class="relative aspect-[3/4] overflow-hidden bg-surface-container">
        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             src="${img}" alt="${name}" />
      </div>
      <div class="p-space-md flex flex-col flex-1 justify-between gap-space-xs">
        <div>
          <h3 class="font-title-md text-title-md text-primary font-semibold group-hover:text-secondary transition-colors">
            ${name}
          </h3>
        </div>
        <span class="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold pt-space-xs group-hover:translate-x-1 transition-transform">
          Découvrir <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </span>
      </div>
    </a>
  `;
}

async function loadProducts(options = {}) {
  const {
    containerId = 'product-grid',
    category = null,
    sort = null,
    limit = null,
    page = null,
    minPrice = null,
    maxPrice = null,
    brand = null,
    q = null,
    inStock = null,
    attrs = null,
    promo = null,
    loadingId = 'products-loading',
    emptyId = 'products-empty',
    errorId = 'products-error',
  } = options;

  const grid = document.getElementById(containerId);
  if (!grid) return;

  const loading = document.getElementById(loadingId);
  const empty = document.getElementById(emptyId);
  const errorEl = document.getElementById(errorId);

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');

  try {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', String(limit));
    if (page) params.set('page', String(page));
    if (minPrice != null) params.set('min_price', String(minPrice));
    if (maxPrice != null) params.set('max_price', String(maxPrice));
    if (brand) params.set('brand', brand);
    if (q) params.set('q', q);
    if (inStock) params.set('in_stock', '1');
    if (promo) params.set('promo', '1');
    if (attrs && typeof attrs === 'object') {
      Object.entries(attrs).forEach(([code, value]) => {
        if (value != null && value !== '') params.set(`attr[${code}]`, value);
      });
    }

    const qs = params.toString();
    const path = '/storefront/products' + (qs ? `?${qs}` : '');

    const json = await StorefrontAPI.api(path);
    const list = Array.isArray(json) ? json : (json.data || []);

    if (!list.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }

    grid.innerHTML = list.map(p => renderProductCard(p)).join('');

    const pag = document.getElementById(containerId + '-pagination') || document.getElementById('pagination');
    if (pag && json.current_page) {
      const cur = json.current_page, last = json.last_page;
      let html = '';
      if (cur > 1) html += `<button onclick="window.loadCollectionPage && window.loadCollectionPage(${cur-1})" class="px-4 py-2 border rounded">Précédent</button>`;
      html += `<span class="px-4 py-2">Page ${cur} / ${last}</span>`;
      if (cur < last) html += `<button onclick="window.loadCollectionPage && window.loadCollectionPage(${cur+1})" class="px-4 py-2 border rounded">Suivant</button>`;
      pag.innerHTML = html;
      pag.classList.remove('hidden');
    }
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = 'Impossible de charger les produits.';
      errorEl.classList.remove('hidden');
    }
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

function renderProductCard(product) {
  const img = StorefrontAPI.mediaUrl(product.media?.[0]) || product.image || StorefrontAPI.PLACEHOLDER;
  const variant = product.variants?.[0] || {};
  const price = variant.price ?? product.price ?? 0;
  const compare = variant.compare_at_price ?? product.compare_at_price ?? null;
  const name = product.name || 'Produit';
  const slug = product.slug || product.id;
  const brand = product.brand?.name || product.brand_name || '';
  const discount = (compare && compare > price) ? Math.round((1 - price / compare) * 100) : null;
  const href = `produit.html?slug=${encodeURIComponent(slug)}`;

  return `
    <a href="${href}" class="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div class="relative aspect-[3/4] bg-surface-container-low overflow-hidden">
        <img src="${img}" alt="${name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ${discount ? `<div class="absolute top-2 left-2"><span class="px-2 py-0.5 bg-primary text-on-primary text-xs font-bold rounded">-${discount}%</span></div>` : ''}
      </div>
      <div class="p-space-md">
        ${brand ? `<p class="text-xs uppercase tracking-wider text-secondary font-semibold">${brand}</p>` : ''}
        <h3 class="font-title-md text-title-md text-on-surface font-semibold mt-1">${name}</h3>
        <p class="text-body-sm text-on-surface-variant mt-1">${product.category?.name || ''}</p>
        <div class="mt-space-sm flex items-baseline gap-2">
          <span class="font-semibold text-primary text-lg">${StorefrontAPI.formatPrice(price)}</span>
          ${compare ? `<span class="text-on-surface-variant line-through text-sm">${StorefrontAPI.formatPrice(compare)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadLayout();
});

window.StorefrontAPI = {
  ...window.StorefrontAPI,
  loadLayout,
  loadCategories,
  loadProducts,
  renderCategoryCard,
  renderProductCard,
};
