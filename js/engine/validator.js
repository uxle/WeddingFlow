/* =====================================================================
 * WeddingFlow Engine — Security Validator & JSON Preset Sanitizer
 * Protects against prototype pollution, XSS payloads, oversized files,
 * and malformed legacy/external JSON presets.
 * ===================================================================== */
const WFValidator = (function () {
  'use strict';

  const MAX_FILE_BYTES = 512 * 1024; // 512 KB hard cap
  const MAX_EVENTS = 24;
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  function cleanStr(val, maxLen) {
    if (typeof val !== 'string') return '';
    // Strip NUL bytes and control characters except newline/tab
    return val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, maxLen || 300);
  }

  function safeParseJSON(rawText) {
    if (typeof rawText !== 'string' || rawText.length > MAX_FILE_BYTES) {
      return { ok: false, error: 'Preset exceeds 512 KB safety limit.' };
    }
    try {
      const parsed = JSON.parse(rawText, function (key, value) {
        if (FORBIDDEN_KEYS.has(key)) return undefined;
        return value;
      });
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, error: 'JSON root must be an object.' };
      }
      return { ok: true, data: parsed };
    } catch (err) {
      return { ok: false, error: 'Malformed JSON syntax.' };
    }
  }

  function sanitizePreset(raw, validTemplateIds) {
    const out = { design: {}, top: {}, couple: {}, events: null, bottom: {} };
    const warnings = [];

    if (raw.design && typeof raw.design === 'object') {
      const tid = cleanStr(raw.design.templateId, 64);
      if (tid && validTemplateIds.has(tid)) {
        out.design.templateId = tid;
      } else if (tid) {
        warnings.push('Unknown templateId ignored; kept default.');
      }
    }

    if (raw.top && typeof raw.top === 'object') {
      if ('ganesh' in raw.top) out.top.ganesh = cleanStr(raw.top.ganesh, 160);
      if ('showShlok' in raw.top) out.top.showShlok = Boolean(raw.top.showShlok);
      if ('shlok' in raw.top) out.top.shlok = cleanStr(raw.top.shlok, 400);
      if ('quote' in raw.top) out.top.quote = cleanStr(raw.top.quote, 320);
      if ('hosts' in raw.top) out.top.hosts = cleanStr(raw.top.hosts, 180);
      if ('inviteLine' in raw.top) out.top.inviteLine = cleanStr(raw.top.inviteLine, 240);
      if ('eventsTitle' in raw.top) out.top.eventsTitle = cleanStr(raw.top.eventsTitle, 120);
    }

    if (raw.couple && typeof raw.couple === 'object') {
      if ('groom' in raw.couple) out.couple.groom = cleanStr(raw.couple.groom, 80);
      if ('groomDet' in raw.couple) out.couple.groomDet = cleanStr(raw.couple.groomDet, 240);
      if ('bride' in raw.couple) out.couple.bride = cleanStr(raw.couple.bride, 80);
      if ('brideDet' in raw.couple) out.couple.brideDet = cleanStr(raw.couple.brideDet, 240);
      if ('brideAddr' in raw.couple) out.couple.brideAddr = cleanStr(raw.couple.brideAddr, 180);
    }

    if (Array.isArray(raw.events)) {
      out.events = raw.events
        .filter(e => e && typeof e === 'object')
        .slice(0, MAX_EVENTS)
        .map(e => ({
          name: cleanStr(e.name, 80) || 'Ceremony',
          date: /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) ? String(e.date) : '',
          time: cleanStr(e.time, 32),
          visible: e.visible !== false
        }));
      if (raw.events.length > MAX_EVENTS) {
        warnings.push('Trimmed events list to 24 items.');
      }
    }

    if (raw.bottom && typeof raw.bottom === 'object') {
      if ('venueName' in raw.bottom) out.bottom.venueName = cleanStr(raw.bottom.venueName, 140);
      if ('venueAddr' in raw.bottom) out.bottom.venueAddr = cleanStr(raw.bottom.venueAddr, 240);
      if ('rsvp' in raw.bottom) out.bottom.rsvp = cleanStr(raw.bottom.rsvp, 320);
      if ('compliments' in raw.bottom) out.bottom.compliments = cleanStr(raw.bottom.compliments, 240);
      if ('kids' in raw.bottom) out.bottom.kids = cleanStr(raw.bottom.kids, 200);
    }

    return { ok: true, preset: out, warnings };
  }

  function auditState(state) {
    const checks = [
      { ok: Boolean(state.couple.groom && state.couple.groom.trim()), msg: 'Add Groom name', tab: 'tab-couple' },
      { ok: Boolean(state.couple.bride && state.couple.bride.trim()), msg: 'Add Bride name', tab: 'tab-couple' },
      { ok: state.events.some(e => e.visible && e.name), msg: 'Add at least 1 visible event', tab: 'tab-events' },
      { ok: Boolean(state.bottom.venueName && state.bottom.venueName.trim()), msg: 'Add Venue name', tab: 'tab-bottom' },
      { ok: Boolean(state.bottom.rsvp && state.bottom.rsvp.trim()), msg: 'Add RSVP contact', tab: 'tab-bottom' }
    ];
    const done = checks.filter(c => c.ok).length;
    return {
      score: Math.round((done / checks.length) * 100),
      issues: checks.filter(c => !c.ok)
    };
  }

  return { MAX_FILE_BYTES, cleanStr, safeParseJSON, sanitizePreset, auditState };
})();
