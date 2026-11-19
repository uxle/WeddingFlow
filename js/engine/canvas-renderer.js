/* =====================================================================
 * WeddingFlow Engine — High-DPI Canvas Card Rendering Engine
 * Pure HTML5 Canvas2D vector + typographic renderer (zero html2canvas bugs,
 * 100% immune to color-mix() / CSS zoom issues, works completely offline).
 * ===================================================================== */
const WFCanvasRenderer = (function () {
  'use strict';

  function wrapLines(ctx, text, maxWidth) {
    if (!text) return [];
    const paragraphs = String(text).split('\n');
    const lines = [];
    paragraphs.forEach(p => {
      const words = p.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return;
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = line + ' ' + words[i];
        if (ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      lines.push(line);
    });
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = typeof r === 'number' ? [r, r, r, r] : r;
    ctx.beginPath();
    ctx.moveTo(x + rad[0], y);
    ctx.lineTo(x + w - rad[1], y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
    ctx.lineTo(x + w, y + h - rad[2]);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
    ctx.lineTo(x + rad[3], y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
    ctx.lineTo(x, y + rad[0]);
    ctx.quadraticCurveTo(x, y, x + rad[0], y);
    ctx.closePath();
  }

  function drawEmblemVector(ctx, emblem, cx, cy, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (emblem === 'crescent') {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, 0.35 * Math.PI, 1.65 * Math.PI, false);
      ctx.arc(cx + r * 0.28, cy, r * 0.56, 1.55 * Math.PI, 0.45 * Math.PI, true);
      ctx.closePath();
      ctx.fill();
      // Small star
      ctx.beginPath();
      ctx.arc(cx + r * 0.45, cy - r * 0.1, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else if (emblem === 'cross') {
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.8);
      ctx.lineTo(cx, cy + r * 0.85);
      ctx.moveTo(cx - r * 0.55, cy - r * 0.22);
      ctx.lineTo(cx + r * 0.55, cy - r * 0.22);
      ctx.stroke();
    } else if (emblem === 'lotus') {
      for (let a = -2; a <= 2; a++) {
        ctx.save();
        ctx.translate(cx, cy + r * 0.3);
        ctx.rotate(a * 0.34);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.45, r * 0.22, r * 0.52, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (emblem === 'dharma') {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r * 0.22, cy + Math.sin(ang) * r * 0.22);
        ctx.lineTo(cx + Math.cos(ang) * r * 0.85, cy + Math.sin(ang) * r * 0.85);
        ctx.stroke();
      }
    } else if (emblem === 'shuangxi') {
      ctx.font = `700 ${Math.round(r * 1.5)}px "Noto Serif", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('囍', cx, cy + 2);
    } else if (emblem === 'rings') {
      ctx.beginPath();
      ctx.arc(cx - r * 0.32, cy, r * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r * 0.32, cy, r * 0.48, 0, Math.PI * 2);
      ctx.stroke();
    } else if (emblem === 'khanda') {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.85);
      ctx.lineTo(cx, cy + r * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - r * 0.15, cy + r * 0.05, r * 0.72, 0.75 * Math.PI, 1.35 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r * 0.15, cy + r * 0.05, r * 0.72, -0.35 * Math.PI, 0.25 * Math.PI);
      ctx.stroke();
    } else {
      // Sacred Om glyph (clean vector text fallback)
      ctx.font = `700 ${Math.round(r * 1.55)}px "Tiro Devanagari Hindi", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ॐ', cx, cy + 3);
    }
    ctx.restore();
  }

  function renderToCanvas(state, tpl, rel, opts) {
    const o = opts || {};
    const W = o.width || 1654;  // 210mm @ 200 DPI
    const H = o.height || 2339; // 297mm @ 200 DPI
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const S = W / 794; // scale factor relative to 96dpi A4 width

    // 1. Background Base
    ctx.fillStyle = tpl.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient Radial Glow
    const g1 = ctx.createRadialGradient(W * 0.5, H * 0.1, 10, W * 0.5, H * 0.1, W * 0.65);
    g1.addColorStop(0, tpl.dark ? 'rgba(232,199,122,0.16)' : 'rgba(180,120,40,0.09)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    if (tpl.frame === 'celestial') {
      ctx.fillStyle = 'rgba(255, 244, 210, 0.65)';
      [[0.18, 0.22, 3], [0.84, 0.19, 2.5], [0.78, 0.58, 3], [0.22, 0.70, 2.5], [0.14, 0.46, 2], [0.88, 0.42, 2]].forEach(([px, py, rad]) => {
        ctx.beginPath();
        ctx.arc(W * px, H * py, rad * S, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Architectural Frame
    const m = Math.round(42 * S);
    const fw = W - m * 2;
    const fh = H - m * 2;
    ctx.save();
    ctx.strokeStyle = tpl.gold;

    if (tpl.frame === 'minimal') {
      ctx.fillStyle = tpl.primary;
      ctx.fillRect(m, m, 5 * S, fh);
    } else if (tpl.frame === 'arch') {
      const archR = fw * 0.48;
      ctx.lineWidth = 3 * S;
      roundRect(ctx, m, m, fw, fh, [archR, archR, 10 * S, 10 * S]);
      ctx.stroke();
      ctx.lineWidth = 1.2 * S;
      ctx.globalAlpha = 0.55;
      roundRect(ctx, m + 9 * S, m + 9 * S, fw - 18 * S, fh - 18 * S, [archR - 9 * S, archR - 9 * S, 6 * S, 6 * S]);
      ctx.stroke();
    } else {
      const r = tpl.frame === 'royal' ? [18 * S, 18 * S, 6 * S, 6 * S] : tpl.frame === 'botanical' || tpl.frame === 'temple' ? 14 * S : 4 * S;
      ctx.lineWidth = (tpl.frame === 'lattice' ? 3.5 : 2.5) * S;
      roundRect(ctx, m, m, fw, fh, r);
      ctx.stroke();
      ctx.lineWidth = 1.2 * S;
      ctx.globalAlpha = 0.52;
      if (tpl.frame === 'gala') ctx.setLineDash([7 * S, 5 * S]);
      roundRect(ctx, m + 8 * S, m + 8 * S, fw - 16 * S, fh - 16 * S, r);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.85;
      // Corner brackets
      const cLen = 28 * S;
      ctx.lineWidth = 3.5 * S;
      const corners = [
        [m - 2 * S, m + cLen, m - 2 * S, m - 2 * S, m + cLen, m - 2 * S],
        [W - m - cLen, m - 2 * S, W - m + 2 * S, m - 2 * S, W - m + 2 * S, m + cLen],
        [m - 2 * S, H - m - cLen, m - 2 * S, H - m + 2 * S, m + cLen, H - m + 2 * S],
        [W - m - cLen, H - m + 2 * S, W - m + 2 * S, H - m + 2 * S, W - m + 2 * S, H - m - cLen]
      ];
      corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();
      });
    }
    ctx.restore();

    const cx = tpl.frame === 'minimal' ? m + 36 * S : W * 0.5;
    const align = tpl.frame === 'minimal' ? 'left' : 'center';
    const contentW = fw - 96 * S;
    let y = m + (tpl.frame === 'arch' ? 76 * S : 48 * S);

    ctx.textAlign = align;
    ctx.textBaseline = 'top';

    // 4. Emblem
    drawEmblemVector(ctx, rel.emblem, tpl.frame === 'minimal' ? cx + 22 * S : cx, y + 18 * S, 22 * S, tpl.gold);
    y += 50 * S;

    // 5. Sacred Invocation
    ctx.fillStyle = tpl.primary;
    ctx.font = `700 ${Math.round(19 * S)}px "Playfair Display", Georgia, serif`;
    wrapLines(ctx, state.top.ganesh, contentW * 0.85).forEach(line => {
      ctx.fillText(line, cx, y);
      y += 26 * S;
    });

    // 6. Shloka / Verse
    if (state.top.showShlok && state.top.shlok) {
      y += 4 * S;
      ctx.fillStyle = tpl.muted;
      ctx.font = `400 ${Math.round(13.5 * S)}px "Tiro Devanagari Hindi", "Noto Serif", serif`;
      wrapLines(ctx, state.top.shlok, contentW * 0.82).forEach(line => {
        ctx.fillText(line, cx, y);
        y += 20 * S;
      });
    }

    // 7. Quote
    if (state.top.quote) {
      y += 12 * S;
      ctx.fillStyle = tpl.muted;
      ctx.font = `italic 400 ${Math.round(14 * S)}px "Noto Serif", Georgia, serif`;
      wrapLines(ctx, state.top.quote, contentW * 0.8).forEach(line => {
        ctx.fillText(line, cx, y);
        y += 21 * S;
      });
    }

    // 8. Hosts & Invite Line
    y += 18 * S;
    ctx.fillStyle = tpl.gold;
    ctx.font = `700 ${Math.round(15 * S)}px "Playfair Display", Georgia, serif`;
    ctx.fillText((state.top.hosts || '').toUpperCase(), cx, y);
    y += 24 * S;

    ctx.fillStyle = tpl.muted;
    ctx.font = `400 ${Math.round(22 * S)}px "Great Vibes", "Playfair Display", cursive`;
    wrapLines(ctx, state.top.inviteLine, contentW * 0.85).forEach(line => {
      ctx.fillText(line, cx, y);
      y += 27 * S;
    });

    // 9. Couple Showcase (Groom | Weds Seal | Bride)
    y += 26 * S;
    const coupleY = y;
    const colOffset = contentW * 0.32;
    const leftX = W * 0.5 - colOffset;
    const rightX = W * 0.5 + colOffset;

    ctx.textAlign = 'center';
    ctx.fillStyle = tpl.primary;
    ctx.font = `400 ${Math.round(52 * S)}px "Great Vibes", "Playfair Display", cursive`;
    ctx.fillText(state.couple.groom || 'Groom', leftX, coupleY);
    ctx.fillText(state.couple.bride || 'Bride', rightX, coupleY);

    // Weds Seal
    ctx.save();
    ctx.fillStyle = tpl.gold;
    ctx.beginPath();
    ctx.arc(W * 0.5, coupleY + 34 * S, 28 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tpl.dark ? '#19140E' : '#FFFFFF';
    ctx.font = `400 ${Math.round(22 * S)}px "Great Vibes", Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('Weds', W * 0.5, coupleY + 35 * S);
    ctx.restore();

    ctx.textBaseline = 'top';
    ctx.fillStyle = tpl.muted;
    ctx.font = `400 ${Math.round(13.5 * S)}px "Noto Serif", Georgia, serif`;
    let ly = coupleY + 62 * S;
    wrapLines(ctx, state.couple.groomDet, contentW * 0.36).forEach(line => {
      ctx.fillText(line, leftX, ly);
      ly += 19 * S;
    });
    let ry = coupleY + 62 * S;
    wrapLines(ctx, state.couple.brideDet, contentW * 0.36).forEach(line => {
      ctx.fillText(line, rightX, ry);
      ry += 19 * S;
    });
    if (state.couple.brideAddr) {
      ctx.font = `italic 400 ${Math.round(12.5 * S)}px "Noto Serif", Georgia, serif`;
      ctx.fillText(state.couple.brideAddr, rightX, ry + 2 * S);
      ry += 18 * S;
    }

    y = Math.max(ly, ry) + 22 * S;

    // 10. Ornamental Rule
    ctx.save();
    ctx.strokeStyle = tpl.gold;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.4 * S;
    ctx.beginPath();
    ctx.moveTo(W * 0.5 - 110 * S, y);
    ctx.lineTo(W * 0.5 - 14 * S, y);
    ctx.moveTo(W * 0.5 + 14 * S, y);
    ctx.lineTo(W * 0.5 + 110 * S, y);
    ctx.stroke();
    ctx.fillStyle = tpl.gold;
    ctx.translate(W * 0.5, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4 * S, -4 * S, 8 * S, 8 * S);
    ctx.restore();

    // 11. Events Grid (2x2)
    y += 18 * S;
    ctx.textAlign = 'center';
    ctx.fillStyle = tpl.gold;
    ctx.font = `400 ${Math.round(32 * S)}px "Great Vibes", "Playfair Display", cursive`;
    ctx.fillText(state.top.eventsTitle || 'Programme', W * 0.5, y);
    y += 44 * S;

    const visibleEvents = state.events.filter(e => e.visible).slice(0, 6);
    const gridGap = 12 * S;
    const cardW = (contentW - gridGap) / 2;
    const cardH = 62 * S;
    const startX = (W - contentW) / 2;

    visibleEvents.forEach((ev, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ex = startX + col * (cardW + gridGap);
      const ey = y + row * (cardH + gridGap);

      ctx.save();
      ctx.fillStyle = tpl.surface;
      roundRect(ctx, ex, ey, cardW, cardH, 10 * S);
      ctx.fill();
      ctx.strokeStyle = tpl.gold;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2 * S;
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = tpl.primary;
      ctx.font = `700 ${Math.round(16 * S)}px "Playfair Display", Georgia, serif`;
      ctx.fillText(ev.name || 'Event', ex + cardW / 2, ey + 12 * S);

      let dateStr = '';
      if (ev.date) {
        const d = new Date(ev.date + 'T00:00:00');
        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      const meta = [dateStr, ev.time].filter(Boolean).join(' • ');
      ctx.fillStyle = tpl.ink;
      ctx.font = `600 ${Math.round(13 * S)}px "Noto Serif", Georgia, serif`;
      ctx.fillText(meta, ex + cardW / 2, ey + 35 * S);
    });

    const rowsCount = Math.max(1, Math.ceil(visibleEvents.length / 2));
    y += rowsCount * (cardH + gridGap) + 22 * S;

    // 12. Venue
    ctx.textAlign = 'center';
    ctx.fillStyle = tpl.gold;
    ctx.font = `700 ${Math.round(11 * S)}px Inter, sans-serif`;
    ctx.fillText('V E N U E', W * 0.5, y);
    y += 18 * S;
    ctx.fillStyle = tpl.ink;
    ctx.font = `700 ${Math.round(20 * S)}px "Playfair Display", Georgia, serif`;
    ctx.fillText(state.bottom.venueName || '', W * 0.5, y);
    y += 26 * S;
    ctx.fillStyle = tpl.muted;
    ctx.font = `400 ${Math.round(13.5 * S)}px "Noto Serif", Georgia, serif`;
    ctx.fillText(state.bottom.venueAddr || '', W * 0.5, y);

    // 13. Footer Grid (anchored neatly above bottom margin)
    const footY = Math.max(y + 34 * S, H - m - 148 * S);
    ctx.save();
    ctx.strokeStyle = tpl.gold;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.2 * S;
    ctx.beginPath();
    ctx.moveTo(startX, footY);
    ctx.lineTo(startX + contentW, footY);
    ctx.stroke();
    ctx.restore();

    const fLeft = W * 0.5 - contentW * 0.25;
    const fRight = W * 0.5 + contentW * 0.25;

    ctx.textAlign = 'center';
    ctx.fillStyle = tpl.gold;
    ctx.font = `700 ${Math.round(12.5 * S)}px Inter, sans-serif`;
    ctx.fillText('R.S.V.P.', fLeft, footY + 14 * S);
    ctx.fillText('WITH BEST COMPLIMENTS', fRight, footY + 14 * S);

    ctx.fillStyle = tpl.muted;
    ctx.font = `400 ${Math.round(12.5 * S)}px "Noto Serif", Georgia, serif`;
    wrapLines(ctx, state.bottom.rsvp, contentW * 0.44).slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, fLeft, footY + 34 * S + i * 18 * S);
    });
    wrapLines(ctx, state.bottom.compliments, contentW * 0.44).slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, fRight, footY + 34 * S + i * 18 * S);
    });

    // 14. Kids Message
    if (state.bottom.kids) {
      ctx.fillStyle = tpl.primary;
      ctx.font = `400 ${Math.round(19 * S)}px "Great Vibes", Georgia, serif`;
      ctx.fillText(state.bottom.kids, W * 0.5, H - m - 42 * S);
    }

    return canvas;
  }

  return { renderToCanvas };
})();
