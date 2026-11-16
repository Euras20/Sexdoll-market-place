
(function () {
  function injectDrawer() {
    if (document.getElementById('cart-drawer')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cart-drawer-backdrop" class="fixed inset-0 bg-on-surface/50 z-50 hidden" onclick="toggleAdultCart(false)"></div>
      <aside id="cart-drawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest z-50 shadow-2xl translate-x-full transition-transform duration-300 flex flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <span class="font-semibold text-primary">Votre panier</span>
          <button type="button" onclick="toggleAdultCart(false)" aria-label="Fermer"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div id="adult-cart-items" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
        <div class="p-4 border-t">
          <div class="flex justify-between mb-3 font-semibold"><span>Total</span><span id="adult-cart-total">0,00 €</span></div>
          <a href="checkout.html" class="block w-full py-3 bg-primary text-on-primary text-center rounded-lg font-semibold">Continuer</a>
        </div>
      </aside>`);
  }

  window.toggleAdultCart = function (open) {
    const d = document.getElementById('cart-drawer');
    const b = document.getElementById('cart-drawer-backdrop');
    if (!d) return;
    d.classList.toggle('translate-x-full', !open);
    b.classList.toggle('hidden', !open);
    if (open) renderDrawer();
  };

  async function renderDrawer() {
    const box = document.getElementById('adult-cart-items');
    const totalEl = document.getElementById('adult-cart-total');
    if (!box || typeof loadCart !== 'function') return;
    try {
      const data = await loadCart();
      const items = data.cart?.items || [];
      const total = data.totals?.subtotal ?? 0;
      if (!items.length) {
        box.innerHTML = '<p class="text-center text-on-surface-variant py-10">Votre panier est vide</p>';
      } else {
        box.innerHTML = items.map(it => {
          const v = it.variant || {};
          const name = v.product?.name || v.variant_name || 'Produit';
          const price = Number(v.price || 0) * (it.quantity || 1);
          return `<div class="flex justify-between gap-3 border-b pb-3">
            <div><div class="font-medium">${name}</div><div class="text-sm text-on-surface-variant">Quantité : ${it.quantity || 1}</div></div>
            <div class="text-right">
              <div class="font-semibold">${StorefrontAPI.formatPrice ? StorefrontAPI.formatPrice(price) : price + ' €'}</div>
              <button type="button" class="text-sm text-error mt-1" onclick="StorefrontAPI.removeCartItem(${it.id}).then(() => window.toggleAdultCart && toggleAdultCart(true))">Retirer</button>
            </div>
          </div>`;
        }).join('');
      }
      if (totalEl) totalEl.textContent = StorefrontAPI.formatPrice ? StorefrontAPI.formatPrice(total) : total + ' €';
      if (typeof refreshCartBadge === 'function') refreshCartBadge();
    } catch (e) {
      box.innerHTML = '<p class="text-center text-on-surface-variant py-10">Panier indisponible</p>';
    }
  }

  function wireBag() {
    document.querySelectorAll('button[aria-label="Panier"], a[aria-label="Panier"]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); toggleAdultCart(true); });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectDrawer();
    wireBag();
    if (typeof refreshCartBadge === 'function') refreshCartBadge();
  });
})();
