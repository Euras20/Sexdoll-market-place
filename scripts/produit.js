

// ---- extracted from produit.html ----

/* ---------- Safe storage helpers ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const fmt = n => n.toLocaleString('fr-FR') + ' €';
const PLACEHOLDER_IMG_FALLBACK = window.StorefrontAPI?.PLACEHOLDER || ('data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#e8edff"/></svg>'));

/* ---------- Data (host your own images in /images) ---------- */
const SIZES = [
  { id: '148', label: '148 cm', extra: 0 }, { id: '155', label: '155 cm', extra: 100 },
  { id: '162', label: '162 cm', extra: 200 }, { id: '168', label: '168 cm', extra: 350 }
];
const PUBIC = [
  { id: 'none', label: 'Sans', extra: 0 }, { id: 'trimmed', label: 'Coupés / rasés', extra: 50 },
  { id: 'full', label: 'Complets', extra: 80 }
];
const ADDONS = [
  { id: 'chauffage', label: 'Système de chauffage corporel', desc: 'Température corporelle réaliste', price: 180 },
  { id: 'vibration', label: 'Fonction vibration', desc: 'Plusieurs intensités', price: 150 },
  { id: 'oral', label: 'Fonction orale automatique', desc: 'Mécanisme de succion', price: 220 },
  { id: 'cheveux-implantes', label: 'Cheveux implantés (permanent)', desc: "Plus réaliste qu'une perruque", price: 300 },
  { id: 'maquillage-custom', label: 'Maquillage sur mesure', desc: 'Selon vos préférences', price: 120 }
];
const PRODUCTS = {
  1: { name: 'Aria Platine', material: 'Silicone Platine', basePrice: 2499, defaultSize: '155',
       desc: "Modèle ultra-réaliste en silicone platine médical de qualité supérieure. Peau d'une douceur exceptionnelle, détails anatomiques poussés à l'extrême et finitions artisanales européennes.",
       images: ['images/aria-1.jpg', 'images/aria-2.jpg', 'images/aria-3.jpg'] },
  2: { name: 'Luna TPE', material: 'TPE Médical', basePrice: 1699, defaultSize: '155',
       desc: 'Souplesse naturelle exceptionnelle en TPE médical. Confort optimal et réalisme au quotidien.',
       images: ['images/luna-1.jpg', 'images/luna-2.jpg'] },
  3: { name: 'Sofia Généreuse', material: 'Silicone Platine', basePrice: 2899, defaultSize: '162',
       desc: 'Silhouette voluptueuse et formes généreuses en silicone platine. Poitrine et hanches affirmées.',
       images: ['images/sofia-1.jpg', 'images/sofia-2.jpg'] },
  4: { name: 'Eva Compacte', material: 'TPE', basePrice: 1499, defaultSize: '148', sizes: ['148', '155'],
       addons: ['chauffage', 'vibration', 'maquillage-custom'],
       desc: 'Format compact et pratique en TPE. Facile à manipuler et à ranger, sans compromis sur le réalisme.',
       images: ['images/eva-1.jpg'] },
  5: { name: 'Mia Ultra', material: 'Silicone Platine', basePrice: 2699, defaultSize: '162',
       desc: "Ultra-réalisme poussé à l'extrême. Visage sculpté, peau platine et proportions harmonieuses.",
       images: ['images/mia-1.jpg', 'images/mia-2.jpg'] },
  6: { name: 'Nina Sur Mesure', material: 'Silicone', basePrice: 3199, defaultSize: '155',
       desc: 'Création entièrement personnalisable. Visage, taille, morphologie et finitions selon vos souhaits précis.',
       images: ['images/nina-1.jpg'] }
};

/* ---------- Setup ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

// Age gate
const gate = document.getElementById('age-gate');
if (!store.get('ageOk', false)) gate.classList.remove('hidden');
document.getElementById('age-yes').addEventListener('click', () => { store.set('ageOk', true); gate.classList.add('hidden'); });

// Badges
function updateBadges() {
  const count = store.get('cart', []).length;
  const favs = store.get('favs', []).length;
  [['cart-badge', count], ['fav-badge', favs]].forEach(([id, n]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
    el.classList.toggle('flex', n > 0);
  });
}
updateBadges();

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('opacity-0');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('opacity-0'), 2500);
}

/* ---------- Product lookup (API first, dummy fallback) ---------- */
const PLACEHOLDER_IMG = window.StorefrontAPI?.PLACEHOLDER || PLACEHOLDER_IMG_FALLBACK;

function setImg(el, src) {
  if (!el) return;
  el.onerror = () => { el.onerror = null; el.src = PLACEHOLDER_IMG; };
  el.src = src || PLACEHOLDER_IMG;
}

function buildGallery(images, altName) {
  const main = document.getElementById('main-image');
  const thumbs = document.getElementById('thumbs');
  if (!main || !thumbs) return;
  thumbs.innerHTML = '';
  const list = (images && images.length) ? images : [PLACEHOLDER_IMG];
  main.alt = altName || '';
  setImg(main, list[0]);
  list.forEach((src, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Image ${i + 1}`);
    b.className = 'w-16 h-20 flex-shrink-0 rounded overflow-hidden border-2 ' + (i === 0 ? 'border-primary' : 'border-transparent');
    const im = document.createElement('img');
    im.alt = '';
    im.className = 'w-full h-full object-cover';
    setImg(im, src);
    b.appendChild(im);
    b.addEventListener('click', () => {
      setImg(main, src);
      thumbs.querySelectorAll('button').forEach(x => x.classList.replace('border-primary', 'border-transparent'));
      b.classList.replace('border-transparent', 'border-primary');
    });
    thumbs.appendChild(b);
  });
}

function buildRadios(containerId, items, onSelect) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return [];
  wrap.innerHTML = '';
  const btns = items.map((item, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.id = String(item.id);
    b.className = 'px-4 py-2 border border-outline-variant rounded-lg text-body-sm transition-colors';
    b.textContent = item.label + (item.extra ? ` (+${item.extra} €)` : '');
    b.addEventListener('click', () => onSelect(item, b));
    wrap.appendChild(b);
    return b;
  });
  return btns;
}

function markSelected(btns, id) {
  btns.forEach(b => {
    const on = b.dataset.id === String(id);
    b.setAttribute('aria-checked', on);
    b.classList.toggle('bg-primary', on);
    b.classList.toggle('text-on-primary', on);
    b.classList.toggle('border-primary', on);
  });
}

function showProduct() {
  document.getElementById('product')?.classList.remove('hidden');
  document.getElementById('not-found')?.classList.add('hidden');
}
function showNotFound() {
  document.title = 'Produit introuvable | Sexydoll Atelier';
  document.getElementById('not-found')?.classList.remove('hidden');
  document.getElementById('product')?.classList.add('hidden');
}

/* Dummy fallback (only when API fails) */
function renderDummy() {
  document.getElementById('characteristics')?.classList.add('hidden');
  document.getElementById('legacy-options')?.classList.remove('hidden');
  const productId = new URLSearchParams(location.search).get('id') || '1';
  const product = PRODUCTS[productId];
  if (!product) { showNotFound(); return; }

  showProduct();
  document.title = product.name + ' | Sexydoll Atelier';
  document.querySelector('meta[name="description"]').content = product.desc;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('material-badge').textContent = product.material;
  document.getElementById('short-desc').textContent = product.desc;

  buildGallery(product.images, product.name);

  const sizes = SIZES.filter(s => !product.sizes || product.sizes.includes(s.id));
  const addons = ADDONS.filter(a => !product.addons || product.addons.includes(a.id));
  const state = {
    size: sizes.find(s => s.id === product.defaultSize) || sizes[0],
    pubic: PUBIC[0],
    addons: new Set()
  };

  const priceEl = document.getElementById('current-price');
  const total = () => product.basePrice + state.size.extra + state.pubic.extra +
    addons.filter(a => state.addons.has(a.id)).reduce((s, a) => s + a.price, 0);
  const updatePrice = () => { if (priceEl) priceEl.textContent = fmt(total()); };

  const sizeBtns = buildRadios('size-options', sizes, (item) => { state.size = item; markSelected(sizeBtns, item.id); updatePrice(); });
  const pubicBtns = buildRadios('pubic-options', PUBIC, (item) => { state.pubic = item; markSelected(pubicBtns, item.id); updatePrice(); });
  markSelected(sizeBtns, state.size.id);
  markSelected(pubicBtns, state.pubic.id);

  const addonWrap = document.getElementById('addon-options');
  if (addonWrap) {
    addonWrap.innerHTML = '';
    addons.forEach(a => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-3 p-3 border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = false; cb.autocomplete = 'off';
      cb.addEventListener('change', () => { cb.checked ? state.addons.add(a.id) : state.addons.delete(a.id); updatePrice(); });
      const text = document.createElement('div');
      text.className = 'flex-1';
      const t1 = document.createElement('div'); t1.className = 'font-medium'; t1.textContent = a.label;
      const t2 = document.createElement('div'); t2.className = 'text-body-sm text-on-surface-variant'; t2.textContent = a.desc;
      text.append(t1, t2);
      const price = document.createElement('span');
      price.className = 'text-secondary font-semibold'; price.textContent = `+${a.price} €`;
      label.append(cb, text, price);
      addonWrap.appendChild(label);
    });
  }
  updatePrice();

  function addToCartLocal() {
    const cart = store.get('cart', []);
    cart.push({
      productId, name: product.name, image: product.images[0],
      size: state.size.id, pubic: state.pubic.id, addons: [...state.addons],
      displayTotal: total()
    });
    store.set('cart', cart);
    updateBadges();
  }
  document.getElementById('add-to-cart').onclick = () => { addToCartLocal(); toast(`${product.name} ajoutée au panier`); };
  document.getElementById('buy-now').onclick = () => { addToCartLocal(); location.href = 'checkout.html'; };
}

/* Live product from DB */
async function renderFromApi(slug) {
  const json = await StorefrontAPI.api(`/storefront/products/${encodeURIComponent(slug)}`);
  const p = json.data || json;
  if (!p || !p.name) throw new Error('empty product');

  showProduct();
  document.title = p.name + ' | Sexydoll Atelier';
  document.getElementById('product-name').textContent = p.name || '';
  document.getElementById('short-desc').textContent = p.short_description || p.description || '';
  document.getElementById('material-badge').textContent = p.category?.name || p.brand?.name || '';

  // Hide dummy option blocks when we have real data
  const legacy = document.getElementById('legacy-options');
  if (legacy) legacy.classList.add('hidden');

  // Gallery from media (placeholder if none)
  const imgs = (p.media || []).map(m => StorefrontAPI.mediaUrl(m)).filter(Boolean);
  buildGallery(imgs, p.name);

  // ---- Characteristics from DB ----
  const charBox = document.getElementById('characteristics');
  if (charBox) charBox.innerHTML = '';

  const variants = (p.variants || []).filter(v => v.is_active !== false);
  const basePrice = variants.length
    ? Math.min(...variants.map(v => Number(v.price) || 0))
    : Number(p.price || 0);

  // Selected state
  const state = {
    variant: variants[0] || null,
    attrs: {},          // code -> selected value
    addons: new Set(),
  };
  window.currentVariantId = state.variant?.id || null;

  function currentPrice() {
    let total = state.variant ? Number(state.variant.price) || basePrice : basePrice;
    // Attribute option prices (if an option carries a price)
    Object.values(state.attrs).forEach(a => { if (a && a.extra) total += Number(a.extra) || 0; });
    // Add-ons
    ADDONS.forEach(a => { if (state.addons.has(a.id)) total += a.price; });
    return total;
  }
  const priceEl = document.getElementById('current-price');
  const updatePrice = () => { if (priceEl) priceEl.textContent = StorefrontAPI.formatPrice(currentPrice()); };

  // 1) Variants as the price-varying option (Taille / Variante)
  if (variants.length) {
    const items = variants.map(v => ({
      id: v.id,
      label: v.variant_name || v.sku || `Variante ${v.id}`,
      extra: Math.max(0, Math.round((Number(v.price) || 0) - basePrice)),
      raw: v,
    }));
    addCharSection(charBox, 'Taille', items, items[0].id, (item) => {
      state.variant = item.raw;
      window.currentVariantId = item.id;
      updatePrice();
    });
  }

  // 2) All attribute values the product has
  const attrValues = p.attribute_values || p.attributeValues || [];
  attrValues.forEach(av => {
    const def = av.definition || {};
    const label = def.label || def.code || 'Caractéristique';
    const code = def.code || String(av.attribute_definition_id);
    const value = av.value_text ?? av.value_integer ?? av.value_decimal ?? av.value_boolean ?? '';
    const options = Array.isArray(def.options) ? def.options : [];

    // Build selectable items: from definition options if present, else the single value
    let items;
    if (options.length) {
      items = options.map((opt, i) => {
        const o = typeof opt === 'string' ? { label: opt } : opt;
        return {
          id: o.value || o.label || i,
          label: o.label || o.value || String(opt),
          extra: Number(o.price || o.extra || 0),
        };
      });
    } else if (value !== '' && value != null) {
      items = [{ id: String(value), label: String(value), extra: 0 }];
    } else {
      return;
    }

    const selectedId = items.find(it => it.label === String(value) || it.id === String(value))?.id || items[0].id;
    state.attrs[code] = items.find(it => it.id === selectedId) || items[0];

    addCharSection(charBox, label, items, selectedId, (item) => {
      state.attrs[code] = item;
      updatePrice();
    });
  });

  // 3) Add-ons: not stored on the product. Selecting them adds price and is sent with the cart.
  const addonWrap = document.getElementById('addon-options');
  if (addonWrap) {
    addonWrap.innerHTML = '';
    ADDONS.forEach(a => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-3 p-3 border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.autocomplete = 'off';
      cb.addEventListener('change', () => {
        cb.checked ? state.addons.add(a.id) : state.addons.delete(a.id);
        updatePrice();
      });
      const text = document.createElement('div');
      text.className = 'flex-1';
      const t1 = document.createElement('div'); t1.className = 'font-medium'; t1.textContent = a.label;
      const t2 = document.createElement('div'); t2.className = 'text-body-sm text-on-surface-variant'; t2.textContent = a.desc;
      text.append(t1, t2);
      const price = document.createElement('span');
      price.className = 'text-secondary font-semibold'; price.textContent = `+${a.price} €`;
      label.append(cb, text, price);
      addonWrap.appendChild(label);
    });
  }
  updatePrice();

  // Add to cart: send variant + selected characteristics + add-ons
  const payload = () => ({
    variant_id: window.currentVariantId || variants[0]?.id,
    quantity: 1,
    options: {
      attributes: Object.fromEntries(Object.entries(state.attrs).map(([k, v]) => [k, v.label])),
      addons: ADDONS.filter(a => state.addons.has(a.id)).map(a => ({ id: a.id, label: a.label, price: a.price })),
    },
  });
  const doAdd = async () => {
    const body = payload();
    if (!body.variant_id) { toast('Aucune variante disponible'); return false; }
    if (StorefrontAPI.addToCart) {
      await StorefrontAPI.addToCart(body.variant_id, body.quantity, body.options);
    }
    if (StorefrontAPI.refreshCartBadge) await StorefrontAPI.refreshCartBadge();
    toast(`${p.name} ajoutée au panier`);
    return true;
  };
  const addBtn = document.getElementById('add-to-cart');
  const buyBtn = document.getElementById('buy-now');
  if (addBtn) addBtn.onclick = async () => { try { await doAdd(); } catch (e) { console.info(e); toast('Erreur panier'); } };
  if (buyBtn) buyBtn.onclick = async () => { try { if (await doAdd()) location.href = 'checkout.html'; } catch (e) { console.info(e); } };
}

function addCharSection(container, title, items, selectedId, onSelect) {
  if (!container || !items.length) return;
  const wrap = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'block text-title-md mb-space-sm';
  label.textContent = title;
  const row = document.createElement('div');
  row.className = 'flex flex-wrap gap-2';
  row.setAttribute('role', 'radiogroup');
  wrap.append(label, row);
  container.appendChild(wrap);

  const btns = items.map(item => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.id = String(item.id);
    b.className = 'px-4 py-2 border border-outline-variant rounded-lg text-body-sm transition-colors';
    b.textContent = item.label + (item.extra ? ` (+${item.extra} €)` : '');
    b.addEventListener('click', () => {
      markSelected(btns, item.id);
      onSelect(item);
    });
    row.appendChild(b);
    return b;
  });
  markSelected(btns, selectedId);
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || params.get('id');

  if (slug && window.StorefrontAPI) {
    try {
      await renderFromApi(slug);
      if (StorefrontAPI.refreshCartBadge) StorefrontAPI.refreshCartBadge();
      return;
    } catch (err) {
      console.info('Product API failed, using dummy:', err.message);
    }
  }
  // Fallback only when API is unavailable or product not found
  renderDummy();
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.StorefrontAPI?.refreshCartBadge) StorefrontAPI.refreshCartBadge();
});
