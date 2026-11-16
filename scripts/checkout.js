// Checkout flow — creates order from current server cart
async function placeOrder(formData) {
  const token = StorefrontAPI.getGuestToken();
  const headers = {};
  if (token) headers['X-Guest-Cart-Token'] = token;

  const json = await StorefrontAPI.api('/storefront/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(formData),
  });

  return json;
}

async function submitPaymentProof(orderPublicId, file) {
  const token = StorefrontAPI.getGuestToken();
  const form = new FormData();
  form.append('receipt', file);

  const headers = {};
  if (token) headers['X-Guest-Cart-Token'] = token;

  // Use raw fetch because of FormData
  const base = (window.StorefrontAPI && window.API_BASE) || 'https://marketplace-app-production-6dae1174.up.railway.app/api';
  headers['X-Store-Code'] = window.STORE_CODE || 'adult';
  headers['Accept'] = 'application/json';
  const res = await fetch(`${base}/storefront/orders/${orderPublicId}/payment-proofs`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) throw new Error(`Proof upload failed: ${res.status}`);
  return res.json();
}

function collectAdultForm() {
  const COUNTRY = {
    'france': 'FR', 'belgique': 'BE', 'suisse': 'CH',
    'luxembourg': 'LU', 'allemagne': 'DE', 'autre ue': 'FR',
  };
  const rawCountry = (document.getElementById('country')?.value || 'France').trim().toLowerCase();
  const country = COUNTRY[rawCountry] || (rawCountry.length === 2 ? rawCountry.toUpperCase() : 'FR');
  const isAnon = document.querySelector('input[name="delivery"]:checked')?.value === 'anonymous';
  return {
    email: document.getElementById('email')?.value?.trim() || '',
    phone: document.getElementById('phone')?.value || null,
    name: document.getElementById('name')?.value || (isAnon ? 'Client anonyme' : ''),
    address_line_1: document.getElementById('address')?.value || '',
    postal_code: document.getElementById('postal')?.value || '',
    city: document.getElementById('city')?.value || '',
    country_code: country,
  };
}

function collectAgriForm() {
  // Agri form field ids may differ; fall back to common names
  const get = (id) => document.getElementById(id)?.value || document.querySelector(`[name="${id}"]`)?.value || '';
  return {
    email: get('email') || 'guest@example.com',
    phone: get('phone') || get('tel') || null,
    name: get('name') || get('fullname') || get('nom') || '',
    address_line_1: get('address') || get('address_line_1') || get('rue') || '',
    postal_code: get('postal') || get('postal_code') || get('cp') || '',
    city: get('city') || get('ville') || '',
    country_code: (get('country') || get('country_code') || 'FR').slice(0, 2).toUpperCase(),
  };
}

async function handleCheckoutSubmit(e, collector) {
  e?.preventDefault?.();
  const btn = e?.target?.querySelector?.('button[type="submit"], #validate-order, #place-order') || null;
  if (btn) btn.disabled = true;

  try {
    const data = collector();
    if (!data.email || !data.address_line_1 || !data.postal_code || !data.city) {
      alert('Email et adresse sont obligatoires.');
      return;
    }

    const result = await placeOrder(data);
    const order = result.order || result;
    const publicId = order.public_id || order.id;

    try { localStorage.setItem('last_order', JSON.stringify(order)); } catch {}

    const proofInput = document.getElementById('proof') || document.querySelector('input[type="file"]');
    if (proofInput?.files?.[0] && publicId) {
      try { await submitPaymentProof(publicId, proofInput.files[0]); } catch (e) { console.info('Proof upload:', e.message); }
    } else if (publicId) {
      fetch((window.API_BASE || 'https://marketplace-app-production-6dae1174.up.railway.app/api') + '/storefront/orders/' + publicId + '/notify-invoice', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'X-Store-Code': 'adult' }
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error(err);
    const msg = err.message || '';
    alert('Impossible de créer la commande.\n' + (msg || 'Vérifiez votre panier et réessayez.'));
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

window.StorefrontAPI = {
  ...window.StorefrontAPI,
  placeOrder,
  submitPaymentProof,
  collectAdultForm,
  collectAgriForm,
  handleCheckoutSubmit,
};
