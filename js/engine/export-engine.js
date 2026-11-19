/* =====================================================================
 * WeddingFlow Engine — Optimized Export Orchestrator
 * Awaits webfont readiness and immediately frees offscreen canvas RAM.
 * ===================================================================== */
const WFExportEngine = (function () {
  'use strict';

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function releaseCanvas(canvas) {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }

  async function waitFonts() {
    if (document.fonts && document.fonts.ready) {
      try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 800))]); } catch (e) {}
    }
  }

  function slug(name) {
    return (name || 'weddingflow').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card';
  }

  async function exportPDF(state, tpl, rel) {
    await waitFonts();
    const canvas = WFCanvasRenderer.renderToCanvas(state, tpl, rel, { width: 1654, height: 2339 });
    const pdfBlob = WFPdfEngine.compileFromCanvas(canvas, 0.94, { title: `${state.couple.groom || 'Groom'} & ${state.couple.bride || 'Bride'} — Wedding Invitation`, subject: `${rel.name} • ${tpl.name}` });
    releaseCanvas(canvas);
    triggerDownload(pdfBlob, `weddingflow-${slug(state.couple.groom)}-${slug(state.couple.bride)}.pdf`);
    return pdfBlob.size;
  }

  async function exportPNG(state, tpl, rel, mode) {
    await waitFonts();
    const dims = mode === 'story' ? { width: 1080, height: 1920 } : { width: 1654, height: 2339 };
    const canvas = WFCanvasRenderer.renderToCanvas(state, tpl, rel, dims);
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        releaseCanvas(canvas);
        if (blob) {
          const suffix = mode === 'story' ? 'story' : 'a4';
          triggerDownload(blob, `weddingflow-${slug(state.couple.groom)}-${suffix}.png`);
          resolve(blob.size);
        } else {
          resolve(0);
        }
      }, 'image/png');
    });
  }

  function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `weddingflow-preset-${slug(state.couple.groom)}.json`);
    return blob.size;
  }

  return { exportPDF, exportPNG, exportJSON };
})();
