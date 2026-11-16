

// ---- extracted from livraison-discrete.html ----

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
