/* =====================================================================
 * WeddingFlow Pro — Application Controller
 * Pure DOM manipulation (zero XSS innerHTML on user inputs), Undo/Redo,
 * Autosave, Sanitized JSON Upload, and Native Binary PDF 1.4 Export.
 * ===================================================================== */
(function () {
  'use strict';

  const EMBLEMS = {
    om: 'fa-solid fa-om',
    crescent: 'fa-solid fa-star-and-crescent',
    cross: 'fa-solid fa-cross',
    khanda: 'fa-solid fa-khanda',
    lotus: 'fa-solid fa-spa',
    dharma: 'fa-solid fa-dharmachakra',
    rings: 'fa-solid fa-ring'
  };

  const VALID_TEMPLATE_IDS = new Set(WF_TEMPLATES.map(t => t.id));
  const TEMPLATE_BY_ID = new Map(WF_TEMPLATES.map(t => [t.id, t]));
  const RELIGION_BY_ID = new Map(WF_RELIGIONS.map(r => [r.id, r]));
  const TEMPLATES_BY_RELIGION = new Map();
  WF_RELIGIONS.forEach(r => TEMPLATES_BY_RELIGION.set(r.id, []));
  WF_TEMPLATES.forEach(t => {
    const arr = TEMPLATES_BY_RELIGION.get(t.religion);
    if (arr) arr.push(t);
  });
  const DOM_CACHE = Object.create(null);

  let state = {
    design: { religion: 'hindu', templateId: 'hin-royal-marigold' },
    top: {
      ganesh: '|| Shri Ganeshay Namah ||',
      showShlok: true,
      shlok: 'वक्रतुंड महाकाय सूर्यकोटि समप्रभः। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
      quote: 'Two souls, one sacred journey — blessed by the divine.',
      hosts: 'Smt. Kamla & Sh. Rajender Kumar',
      inviteLine: 'Solicit your gracious presence at the auspicious wedding of their beloved son',
      eventsTitle: 'Shubh Vivah Programme'
    },
    couple: {
      groom: 'Chirag',
      groomDet: 'Grand S/o Late Sh. Ram Lal',
      bride: 'Simran',
      brideDet: 'D/o Smt. Sunita & Sh. Manoj Gupta',
      brideAddr: 'R/o Civil Lines, Jaipur'
    },
    events: [
      { name: 'Lagan Sagai', date: '2026-02-10', time: '04:00 PM', visible: true },
      { name: 'Dinner', date: '2026-02-10', time: '07:00 PM', visible: true },
      { name: 'Ghurchari', date: '2026-02-14', time: '04:00 PM', visible: true },
      { name: 'Barat Departure', date: '2026-02-14', time: '08:00 PM', visible: true }
    ],
    bottom: {
      venueName: 'Golden Galaxy Resort',
      venueAddr: 'GT Road, Karnal, Haryana',
      rsvp: 'Darshan Lal - 9876543210\nMukesh Kumar - 9876543210',
      compliments: 'Gupta Family & Friends',
      kids: 'Mamu ki shadi me jalul jalul aana — Ananya'
    }
  };

  let activeReligionFilter = 'hindu';
  let zoomLevel = 0.72;
  let toastTimer = null;
  let historyDebounce = null;

  function get(id) { return DOM_CACHE[id] || (DOM_CACHE[id] = document.getElementById(id)); }

  function showToast(msg) {
    const t = get('wf-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function currentTpl() {
    return TEMPLATE_BY_ID.get(state.design.templateId) || WF_TEMPLATES[0];
  }

  function currentRel() {
    const tpl = currentTpl();
    return RELIGION_BY_ID.get(tpl.religion) || WF_RELIGIONS[0];
  }

  function updateHistoryButtons() {
    const u = get('btn-undo');
    const r = get('btn-redo');
    if (u) u.disabled = !WFHistory.canUndo();
    if (r) r.disabled = !WFHistory.canRedo();
  }

  function recordHistory() {
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => {
      WFHistory.push(state);
      updateHistoryButtons();
    }, 280);
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const panel = get(tabId);
    if (panel) panel.classList.add('active');
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
  }

  function setMode(mode) {
    document.body.className = `mode-${mode}`;
    get('btn-mode-edit').classList.toggle('active', mode === 'edit');
    get('btn-mode-preview').classList.toggle('active', mode === 'preview');
    if (mode === 'preview') fitZoomToViewport();
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    const ico = get('theme-icon');
    if (ico) ico.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    try { localStorage.setItem('wf-theme', next); } catch (e) {}
  }

  function applyZoom() {
    const card = get('main-card');
    if (card) card.style.zoom = zoomLevel;
    const r = get('zoom-readout');
    if (r) r.textContent = Math.round(zoomLevel * 100) + '%';
  }

  function adjustZoom(delta) {
    zoomLevel = Math.max(0.35, Math.min(1.25, Math.round((zoomLevel + delta) * 20) / 20));
    applyZoom();
  }

  function fitZoomToViewport() {
    const stage = get('card-stage');
    if (!stage) return;
    const availW = Math.max(280, stage.clientWidth - 28);
    const availH = Math.max(380, stage.clientHeight - 40);
    zoomLevel = Math.max(0.38, Math.min(0.88, Math.round(Math.min(availW / 794, availH / 1123) * 20) / 20));
    applyZoom();
  }

  function renderReligionPills() {
    const host = get('religion-pills');
    const frag = document.createDocumentFragment();
    WF_RELIGIONS.forEach(rel => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rel-pill' + (rel.id === activeReligionFilter ? ' active' : '');
      const ico = document.createElement('i');
      ico.className = rel.icon;
      const lbl = document.createElement('span');
      lbl.textContent = rel.name;
      btn.append(ico, lbl);
      btn.addEventListener('click', () => {
        activeReligionFilter = rel.id;
        renderReligionPills();
        renderTemplateGrid();
      });
      frag.appendChild(btn);
    });
    host.textContent = '';
    host.appendChild(frag);
  }

  function renderTemplateGrid() {
    const host = get('tpl-grid');
    const frag = document.createDocumentFragment();
    const list = TEMPLATES_BY_RELIGION.get(activeReligionFilter) || [];
    const relObj = RELIGION_BY_ID.get(activeReligionFilter) || WF_RELIGIONS[0];

    list.forEach(tpl => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'tpl-card' + (tpl.id === state.design.templateId ? ' active' : '');

      const thumb = document.createElement('div');
      thumb.className = 'tpl-thumb';
      thumb.style.background = tpl.bg;
      thumb.style.color = tpl.gold;

      const frame = document.createElement('div');
      frame.className = 'tpl-thumb-frame' + (tpl.frame === 'arch' ? ' is-arch' : tpl.frame === 'royal' ? ' is-royal' : tpl.frame === 'minimal' ? ' is-minimal' : '');
      frame.style.borderColor = tpl.gold;

      const icoWrap = document.createElement('div');
      icoWrap.className = 'tpl-thumb-icon';
      const ico = document.createElement('i');
      ico.className = relObj.icon;
      icoWrap.appendChild(ico);

      const mono = document.createElement('div');
      mono.className = 'tpl-thumb-mono';
      mono.style.color = tpl.primary;
      mono.textContent = 'C & S';

      const bar = document.createElement('div');
      bar.className = 'tpl-thumb-bar';
      bar.style.background = tpl.gold;

      thumb.append(frame, icoWrap, mono, bar);

      const meta = document.createElement('div');
      meta.className = 'tpl-meta';
      const nameEl = document.createElement('span');
      nameEl.className = 'tpl-name';
      nameEl.textContent = tpl.name;
      const dot = document.createElement('span');
      dot.className = 'tpl-dot';
      dot.style.background = tpl.primary;
      meta.append(nameEl, dot);

      card.append(thumb, meta);
      card.addEventListener('click', () => selectTemplate(tpl.id, false));
      frag.appendChild(card);
    });
    host.textContent = '';
    host.appendChild(frag);
  }

  function applyTemplateVisuals(tpl, rel) {
    const card = get('main-card');
    card.className = `shadi-card frame-${tpl.frame}` + (tpl.dark ? ' is-dark-card' : '');
    card.style.setProperty('--c-bg', tpl.bg);
    card.style.setProperty('--c-surface', tpl.surface);
    card.style.setProperty('--c-primary', tpl.primary);
    card.style.setProperty('--c-gold', tpl.gold);
    card.style.setProperty('--c-ink', tpl.ink);
    card.style.setProperty('--c-muted', tpl.muted);

    const emblemEl = get('out-emblem');
    emblemEl.textContent = '';
    if (rel.emblem === 'shuangxi') {
      const sp = document.createElement('span');
      sp.style.cssText = 'font-size:2rem;font-weight:700;line-height:1;font-family:serif;';
      sp.textContent = '囍';
      emblemEl.appendChild(sp);
    } else {
      const i = document.createElement('i');
      i.className = EMBLEMS[rel.emblem] || EMBLEMS.om;
      emblemEl.appendChild(i);
    }
    get('active-tpl-badge').textContent = `${rel.name} • ${tpl.name}`;
  }

  function selectTemplate(templateId, skipTextApply) {
    const tpl = WF_TEMPLATES.find(t => t.id === templateId) || WF_TEMPLATES[0];
    const rel = WF_RELIGIONS.find(r => r.id === tpl.religion) || WF_RELIGIONS[0];
    const changedReligion = state.design.religion !== tpl.religion;

    state.design.templateId = tpl.id;
    state.design.religion = tpl.religion;
    activeReligionFilter = tpl.religion;

    const applyTextEl = get('check-apply-text');
    if (!skipTextApply && changedReligion && applyTextEl && applyTextEl.checked && rel.defaultTop) {
      state.top.ganesh = rel.defaultTop.ganesh;
      state.top.shlok = rel.defaultTop.shlok;
      state.top.quote = rel.defaultTop.quote;
      state.top.inviteLine = rel.defaultTop.inviteLine;
      state.top.eventsTitle = rel.defaultTop.eventsTitle;
      populateInputs();
    }

    applyTemplateVisuals(tpl, rel);
    renderReligionPills();
    renderTemplateGrid();
    paintPreview();
    recordHistory();
    WFStorage.saveDebounced(state);
  }

  function syncFromInputs() {
    state.top.ganesh = get('in-ganesh').value;
    state.top.showShlok = get('check-shlok').checked;
    state.top.shlok = get('in-shlok').value;
    state.top.quote = get('in-quote').value;
    state.top.hosts = get('in-host-parents').value;
    state.top.inviteLine = get('in-invite-line').value;
    state.top.eventsTitle = get('in-events-title').value;

    state.couple.groom = get('in-groom').value;
    state.couple.groomDet = get('in-groom-details').value;
    state.couple.bride = get('in-bride').value;
    state.couple.brideDet = get('in-bride-details').value;
    state.couple.brideAddr = get('in-bride-addr').value;

    state.bottom.venueName = get('in-venue-name').value;
    state.bottom.venueAddr = get('in-venue-addr').value;
    state.bottom.rsvp = get('in-rsvp').value;
    state.bottom.compliments = get('in-compliments').value;
    state.bottom.kids = get('in-kids').value;

    paintPreview();
    recordHistory();
    WFStorage.saveDebounced(state);
  }

  function paintPreview() {
    get('out-ganesh').textContent = state.top.ganesh;
    get('out-shlok').textContent = state.top.showShlok ? state.top.shlok : '';
    get('out-shlok').style.display = state.top.showShlok ? 'block' : 'none';
    get('out-quote').textContent = state.top.quote;
    get('out-host-parents').textContent = state.top.hosts;
    get('out-invite-line').textContent = state.top.inviteLine;
    get('out-events-title').textContent = state.top.eventsTitle;

    get('out-groom').textContent = state.couple.groom;
    get('out-groom-details').textContent = state.couple.groomDet;
    get('out-bride').textContent = state.couple.bride;
    get('out-bride-details').textContent = state.couple.brideDet;
    get('out-bride-addr').textContent = state.couple.brideAddr;

    renderEventsPreview();

    get('out-venue-name').textContent = state.bottom.venueName;
    get('out-venue-addr').textContent = state.bottom.venueAddr;
    get('out-rsvp').textContent = state.bottom.rsvp;
    get('out-compliments').textContent = state.bottom.compliments;
    get('out-kids').textContent = state.bottom.kids;

    paintReadiness();
  }

  function paintReadiness() {
    const audit = WFValidator.auditState(state);
    get('meter-pct').textContent = audit.score + '%';
    get('meter-fill').style.width = audit.score + '%';
    const host = get('meter-issues');
    host.textContent = '';
    audit.issues.slice(0, 2).forEach(iss => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'issue-chip';
      chip.textContent = iss.msg;
      chip.addEventListener('click', () => switchTab(iss.tab));
      host.appendChild(chip);
    });
  }

  function renderEventsEditor() {
    const container = get('events-container');
    container.textContent = '';
    state.events.forEach((ev, index) => {
      const item = document.createElement('div');
      item.className = 'list-item';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-remove';
      delBtn.setAttribute('aria-label', 'Remove event');
      const delIco = document.createElement('i');
      delIco.className = 'fa-solid fa-trash';
      delBtn.appendChild(delIco);
      delBtn.addEventListener('click', () => {
        state.events.splice(index, 1);
        renderEventsEditor();
        paintPreview();
        recordHistory();
        WFStorage.saveDebounced(state);
      });

      const row1 = document.createElement('div');
      row1.className = 'row';
      row1.style.paddingRight = '28px';

      const nameCol = document.createElement('div');
      nameCol.className = 'col';
      nameCol.style.flex = '2';
      const nameIn = document.createElement('input');
      nameIn.type = 'text';
      nameIn.value = ev.name;
      nameIn.placeholder = 'Event Name';
      nameIn.maxLength = 80;
      nameIn.addEventListener('input', () => {
        state.events[index].name = nameIn.value;
        paintPreview();
        recordHistory();
        WFStorage.saveDebounced(state);
      });
      nameCol.appendChild(nameIn);

      const togWrap = document.createElement('label');
      togWrap.className = 'toggle-switch';
      const togIn = document.createElement('input');
      togIn.type = 'checkbox';
      togIn.checked = ev.visible !== false;
      togIn.addEventListener('change', () => {
        state.events[index].visible = togIn.checked;
        paintPreview();
        recordHistory();
        WFStorage.saveDebounced(state);
      });
      const slider = document.createElement('span');
      slider.className = 'slider';
      togWrap.append(togIn, slider);
      row1.append(nameCol, togWrap);

      const row2 = document.createElement('div');
      row2.className = 'row';
      row2.style.marginTop = '7px';

      const dateIn = document.createElement('input');
      dateIn.type = 'date';
      dateIn.className = 'col';
      dateIn.value = ev.date || '';
      dateIn.addEventListener('input', () => {
        state.events[index].date = dateIn.value;
        paintPreview();
        recordHistory();
        WFStorage.saveDebounced(state);
      });

      const timeIn = document.createElement('input');
      timeIn.type = 'text';
      timeIn.className = 'col';
      timeIn.value = ev.time || '';
      timeIn.placeholder = 'Time';
      timeIn.maxLength = 32;
      timeIn.addEventListener('input', () => {
        state.events[index].time = timeIn.value;
        paintPreview();
        recordHistory();
        WFStorage.saveDebounced(state);
      });

      row2.append(dateIn, timeIn);
      item.append(delBtn, row1, row2);
      container.appendChild(item);
    });
  }

  function renderEventsPreview() {
    const container = get('out-events-list');
    container.textContent = '';
    state.events.filter(e => e.visible).forEach(ev => {
      const card = document.createElement('div');
      card.className = 'event-card';
      let dateStr = '';
      if (ev.date) {
        const d = new Date(ev.date + 'T00:00:00');
        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      const nameEl = document.createElement('span');
      nameEl.className = 'event-name';
      nameEl.textContent = ev.name || 'Event';
      const metaEl = document.createElement('span');
      metaEl.className = 'event-meta';
      metaEl.textContent = [dateStr, ev.time].filter(Boolean).join(' • ');
      card.append(nameEl, metaEl);
      container.appendChild(card);
    });
  }

  function populateInputs() {
    get('in-ganesh').value = state.top.ganesh || '';
    get('check-shlok').checked = state.top.showShlok !== false;
    get('in-shlok').value = state.top.shlok || '';
    get('in-quote').value = state.top.quote || '';
    get('in-host-parents').value = state.top.hosts || '';
    get('in-invite-line').value = state.top.inviteLine || '';
    get('in-events-title').value = state.top.eventsTitle || '';
    get('in-groom').value = state.couple.groom || '';
    get('in-groom-details').value = state.couple.groomDet || '';
    get('in-bride').value = state.couple.bride || '';
    get('in-bride-details').value = state.couple.brideDet || '';
    get('in-bride-addr').value = state.couple.brideAddr || '';
    get('in-venue-name').value = state.bottom.venueName || '';
    get('in-venue-addr').value = state.bottom.venueAddr || '';
    get('in-rsvp').value = state.bottom.rsvp || '';
    get('in-compliments').value = state.bottom.compliments || '';
    get('in-kids').value = state.bottom.kids || '';
  }

  function applySnapshot(snap) {
    if (!snap) return;
    state = snap;
    const tpl = currentTpl();
    activeReligionFilter = tpl.religion;
    applyTemplateVisuals(tpl, currentRel());
    renderReligionPills();
    renderTemplateGrid();
    populateInputs();
    renderEventsEditor();
    paintPreview();
    updateHistoryButtons();
    WFStorage.saveDebounced(state);
  }

  function handleFileUpload(file) {
    if (!file) return;
    if (file.size > WFValidator.MAX_FILE_BYTES) {
      showToast('File too large (max 512 KB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const parsed = WFValidator.safeParseJSON(e.target.result);
      if (!parsed.ok) {
        showToast(parsed.error);
        return;
      }
      const res = WFValidator.sanitizePreset(parsed.data, VALID_TEMPLATE_IDS);
      Object.assign(state.top, res.preset.top);
      Object.assign(state.couple, res.preset.couple);
      if (res.preset.events) state.events = res.preset.events;
      Object.assign(state.bottom, res.preset.bottom);
      if (res.preset.design.templateId) {
        state.design.templateId = res.preset.design.templateId;
        state.design.religion = currentTpl().religion;
        activeReligionFilter = state.design.religion;
      }
      applyTemplateVisuals(currentTpl(), currentRel());
      renderReligionPills();
      renderTemplateGrid();
      populateInputs();
      renderEventsEditor();
      paintPreview();
      WFHistory.push(state);
      updateHistoryButtons();
      WFStorage.saveDebounced(state);
      showToast(`Loaded preset: ${file.name}`);
    };
    reader.readAsText(file);
  }

  function openExportModal(open) {
    const m = get('export-modal');
    if (m) m.hidden = !open;
  }

  function wireEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    get('btn-mode-edit').addEventListener('click', () => setMode('edit'));
    get('btn-mode-preview').addEventListener('click', () => setMode('preview'));
    get('btn-theme').addEventListener('click', toggleTheme);

    get('btn-undo').addEventListener('click', () => {
      const prev = WFHistory.undo();
      if (prev) { applySnapshot(prev); showToast('Undone'); }
    });
    get('btn-redo').addEventListener('click', () => {
      const next = WFHistory.redo();
      if (next) { applySnapshot(next); showToast('Redone'); }
    });

    const triggerUpload = () => get('file-input').click();
    get('btn-upload-top').addEventListener('click', triggerUpload);
    get('btn-upload-panel').addEventListener('click', triggerUpload);
    get('file-input').addEventListener('change', ev => {
      handleFileUpload(ev.target.files[0]);
      ev.target.value = '';
    });

    get('btn-save-top').addEventListener('click', () => {
      WFExportEngine.exportJSON(state);
      showToast('JSON preset downloaded');
    });

    get('btn-zoom-out').addEventListener('click', () => adjustZoom(-0.1));
    get('btn-zoom-in').addEventListener('click', () => adjustZoom(0.1));
    get('btn-zoom-fit').addEventListener('click', fitZoomToViewport);

    get('btn-add-event').addEventListener('click', () => {
      if (state.events.length >= 24) { showToast('Maximum 24 events reached'); return; }
      state.events.push({ name: 'New Ceremony', date: '', time: '06:00 PM', visible: true });
      renderEventsEditor();
      paintPreview();
      recordHistory();
      WFStorage.saveDebounced(state);
    });

    ['in-ganesh', 'in-shlok', 'in-quote', 'in-host-parents', 'in-invite-line', 'in-events-title',
      'in-groom', 'in-groom-details', 'in-bride', 'in-bride-details', 'in-bride-addr',
      'in-venue-name', 'in-venue-addr', 'in-rsvp', 'in-compliments', 'in-kids'].forEach(id => {
      get(id).addEventListener('input', syncFromInputs);
    });
    get('check-shlok').addEventListener('change', syncFromInputs);

    // Export Modal
    get('btn-export-open').addEventListener('click', () => openExportModal(true));
    get('btn-export-close').addEventListener('click', () => openExportModal(false));
    get('export-modal').addEventListener('click', ev => {
      if (ev.target === get('export-modal')) openExportModal(false);
    });

    get('exp-pdf').addEventListener('click', async () => {
      const bytes = await WFExportEngine.exportPDF(state, currentTpl(), currentRel());
      openExportModal(false);
      showToast(`Exported A4 PDF (${Math.round(bytes / 1024)} KB)`);
    });
    get('exp-png').addEventListener('click', async () => {
      const bytes = await WFExportEngine.exportPNG(state, currentTpl(), currentRel(), 'a4');
      openExportModal(false);
      showToast(`Exported High-DPI PNG (${Math.round(bytes / 1024)} KB)`);
    });
    get('exp-story').addEventListener('click', async () => {
      const bytes = await WFExportEngine.exportPNG(state, currentTpl(), currentRel(), 'story');
      openExportModal(false);
      showToast(`Exported 9:16 Story PNG (${Math.round(bytes / 1024)} KB)`);
    });
    get('exp-json').addEventListener('click', () => {
      WFExportEngine.exportJSON(state);
      openExportModal(false);
      showToast('JSON preset downloaded');
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') openExportModal(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        WFExportEngine.exportJSON(state);
        showToast('JSON preset downloaded');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        triggerUpload();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
        e.preventDefault();
        const prev = WFHistory.undo();
        if (prev) { applySnapshot(prev); showToast('Undone'); }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
        e.preventDefault();
        const next = WFHistory.redo();
        if (next) { applySnapshot(next); showToast('Redone'); }
      }
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => { if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; fitZoomToViewport(); }); }, { passive: true });
  }

  // Expose safe testing/inspection API
  window.WFPro = {
    getState: () => WFHistory.clone(state),
    selectTemplate,
    exportPDFBlob: () => {
      const canvas = WFCanvasRenderer.renderToCanvas(state, currentTpl(), currentRel(), { width: 1654, height: 2339 });
      return WFPdfEngine.compileFromCanvas(canvas, 0.94);
    },
    validator: WFValidator
  };

  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (localStorage.getItem('wf-theme') === 'dark') toggleTheme();
    } catch (e) {}

    const saved = WFStorage.load();
    if (saved) {
      const res = WFValidator.sanitizePreset(saved, VALID_TEMPLATE_IDS);
      Object.assign(state.top, res.preset.top);
      Object.assign(state.couple, res.preset.couple);
      if (res.preset.events) state.events = res.preset.events;
      Object.assign(state.bottom, res.preset.bottom);
      if (res.preset.design.templateId) {
        state.design.templateId = res.preset.design.templateId;
        state.design.religion = currentTpl().religion;
        activeReligionFilter = state.design.religion;
      }
    }

    wireEvents();
    renderReligionPills();
    renderTemplateGrid();
    populateInputs();
    renderEventsEditor();
    applyTemplateVisuals(currentTpl(), currentRel());
    paintPreview();
    WFHistory.push(state);
    updateHistoryButtons();
    fitZoomToViewport();
  });
})();
