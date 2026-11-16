

// ---- extracted from checkout.html ----

let currentOrder = JSON.parse(localStorage.getItem('currentOrder') || '{}');
        let deliveryInfo = {};

        function renderSummary() {
            if (!currentOrder.name && !(currentOrder.items && currentOrder.items.length)) {
                document.getElementById('order-summary').innerHTML = '<p>Aucune commande. <a href="collection.html" class="text-secondary">Choisissez un modèle</a></p>';
                return;
            }
            // Server cart items
            if (currentOrder.items && currentOrder.items.length) {
                const rows = currentOrder.items.map(it => {
                    const name = it.name || 'Produit';
                    const qty = it.quantity || 1;
                    const price = it.price || 0;
                    const img = it.image || '';
                    const opts = (it.addons || []).map(a => `<div class="text-xs text-on-surface-variant">${a.label || a.name} (+${a.price} €)</div>`).join('');
                    return `
                        <div class="flex gap-3">
                            ${img ? `<img src="${img}" class="w-16 h-20 object-cover rounded" />` : '<div class="w-16 h-20 bg-surface-container rounded"></div>'}
                            <div class="flex-1">
                                <div class="font-medium">${name}</div>
                                <div class="text-xs text-on-surface-variant">Qté ${qty}</div>
                                ${opts}
                            </div>
                            <div class="font-medium">${(price * qty).toLocaleString('fr-FR')} €</div>
                        </div>`;
                }).join('');
                document.getElementById('order-summary').innerHTML = rows;
                const totalStr = (currentOrder.total || 0).toLocaleString('fr-FR') + ' €';
                document.getElementById('sidebar-total').textContent = totalStr;
                const pay = document.getElementById('payment-amount');
                if (pay) pay.textContent = totalStr;
                return;
            }
            const addonsHtml = (currentOrder.addons || []).map(a => `<div class="flex justify-between"><span>${a.name}</span><span>+${a.price} €</span></div>`).join('');
            document.getElementById('order-summary').innerHTML = `
                <div class="flex gap-3">
                    <img src="${currentOrder.image}" class="w-16 h-20 object-cover rounded" />
                    <div>
                        <div class="font-medium">${currentOrder.name}</div>
                        <div class="text-xs text-on-surface-variant">Personnalisé</div>
                    </div>
                </div>
                <div class="space-y-1 text-sm border-t pt-3">
                    <div class="flex justify-between"><span>Base</span><span>${currentOrder.basePrice} €</span></div>
                    ${currentOrder.sizeExtra ? `<div class="flex justify-between"><span>Taille</span><span>+${currentOrder.sizeExtra} €</span></div>` : ''}
                    ${currentOrder.pubicExtra ? `<div class="flex justify-between"><span>Poils pubiens</span><span>+${currentOrder.pubicExtra} €</span></div>` : ''}
                    ${addonsHtml}
                </div>
            `;
            const total = currentOrder.total || 0;
            document.getElementById('sidebar-total').textContent = total.toLocaleString('fr-FR') + ' €';
            document.getElementById('payment-amount').textContent = total.toLocaleString('fr-FR') + ' €';
        }

        
        async function loadServerCart() {
            if (!window.StorefrontAPI?.api) return false;
            try {
                const token = StorefrontAPI.getGuestToken?.();
                const headers = {};
                if (token) headers['X-Guest-Cart-Token'] = token;
                const data = await StorefrontAPI.api('/storefront/cart', { headers });
                if (data.guest_token) StorefrontAPI.setGuestToken(data.guest_token);
                const items = data.cart?.items || [];
                if (!items.length) return false;
                currentOrder = {
                    items: items.map(it => {
                        const v = it.variant || {};
                        const product = v.product || {};
                        const media = product.media || v.media || [];
                        const img = (window.StorefrontAPI.mediaUrl && media[0]) ? StorefrontAPI.mediaUrl(media[0]) : '';
                        const addons = it.options?.addons || [];
                        const addonTotal = addons.reduce((s, a) => s + (Number(a.price) || 0), 0);
                        return {
                            name: product.name || v.variant_name || 'Produit',
                            quantity: it.quantity || 1,
                            price: (Number(v.price) || 0) + addonTotal,
                            image: img,
                            addons,
                        };
                    }),
                    total: Number(data.totals?.subtotal) || 0,
                };
                return true;
            } catch (e) {
                console.info('Server cart unavailable:', e.message);
                return false;
            }
        }

        loadServerCart().then(() => renderSummary());

        // Delivery type toggle
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => {
                document.getElementById('standard-fields').classList.toggle('hidden', radio.value !== 'standard');
            });
        });

        // Step navigation
        function showStep(n) {
            document.querySelectorAll('[id^="step-"]').forEach(el => el.classList.add('hidden'));
            document.getElementById('step-' + n).classList.remove('hidden');
            document.querySelectorAll('.step-indicator').forEach(ind => {
                const s = parseInt(ind.dataset.step);
                ind.classList.toggle('bg-primary', s <= n);
                ind.classList.toggle('text-white', s <= n);
                ind.classList.toggle('bg-gray-200', s > n);
            });
        }

        document.getElementById('to-step-2').addEventListener('click', () => {
            const isAnon = document.querySelector('input[name="delivery"]:checked').value === 'anonymous';
            deliveryInfo = {
                type: isAnon ? 'Anonyme' : 'Standard',
                name: isAnon ? '—' : document.getElementById('name').value,
                phone: isAnon ? '—' : document.getElementById('phone').value,
                address: document.getElementById('address').value,
                postal: document.getElementById('postal').value,
                city: document.getElementById('city').value,
                country: document.getElementById('country').value,
                note: document.getElementById('note').value
            };
            if (!deliveryInfo.address || !deliveryInfo.postal || !deliveryInfo.city) {
                alert('Veuillez remplir l\'adresse complète.');
                return;
            }
            document.getElementById('verify-summary').innerHTML = `
                <div><strong>Type :</strong> ${deliveryInfo.type}</div>
                ${!isAnon ? `<div><strong>Nom :</strong> ${deliveryInfo.name}</div><div><strong>Tél :</strong> ${deliveryInfo.phone}</div>` : ''}
                <div><strong>Adresse :</strong> ${deliveryInfo.address}, ${deliveryInfo.postal} ${deliveryInfo.city}, ${deliveryInfo.country}</div>
                ${deliveryInfo.note ? `<div><strong>Note :</strong> ${deliveryInfo.note}</div>` : ''}
            `;
            showStep(2);
        });

        document.getElementById('back-to-1').addEventListener('click', () => showStep(1));
        document.getElementById('to-step-3').addEventListener('click', () => showStep(3));

        document.getElementById('validate-order').addEventListener('click', async () => {
            const file = document.getElementById('proof').files[0];
            if (!window.StorefrontAPI?.handleCheckoutSubmit) {
                alert('Service indisponible. Rechargez la page.');
                return;
            }
            const ok = await StorefrontAPI.handleCheckoutSubmit(null, StorefrontAPI.collectAdultForm);
            if (ok) {
                showStep('success');
                localStorage.removeItem('currentOrder');
            }
        });

        showStep(1);

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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('https://marketplace-app-production-6dae1174.up.railway.app/api/storefront/payment-info', {
      headers: { 'Accept': 'application/json', 'X-Store-Code': 'adult' }
    });
    if (!res.ok) return;
    const info = await res.json();
    const iban = document.getElementById('iban');
    if (iban && info.iban) iban.textContent = info.iban;
    document.querySelectorAll('span, p, div').forEach(el => {
      if (el.children.length) return;
      const t = el.textContent.trim();
      if (info.beneficiary && /beneficiaire|titulaire/i.test(t)) return;
      if (info.bic && el.id === 'bic') el.textContent = info.bic;
    });
    if (info.bic) {
      let bicEl = document.getElementById('bic');
      if (!bicEl) {
        document.querySelectorAll('span').forEach(el => {
          if (!bicEl && el.textContent.trim().length && el.previousElementSibling && /BIC/i.test(el.previousElementSibling.textContent || '')) bicEl = el;
        });
      }
      if (bicEl) bicEl.textContent = info.bic;
    }
    if (info.beneficiary) {
      const b = document.getElementById('beneficiary');
      if (b) b.textContent = info.beneficiary;
    }
    if (info.instructions) {
      const i = document.getElementById('payment-instructions');
      if (i) i.textContent = info.instructions;
    }
  } catch (e) { console.info('payment-info failed', e); }
});
