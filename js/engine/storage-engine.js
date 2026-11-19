/* =====================================================================
 * WeddingFlow Engine — Safe LocalStorage Persistence Engine
 * ===================================================================== */
const WFStorage = (function () {
  'use strict';

  const KEY = 'weddingflow_pro_state_v2';
  let timer = null;

  function saveDebounced(state, onSaved) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ v: 2, savedAt: Date.now(), state }));
        if (onSaved) onSaved(true);
      } catch (e) {
        if (onSaved) onSaved(false);
      }
    }, 450);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.state ? parsed.state : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  return { saveDebounced, load, clear };
})();
