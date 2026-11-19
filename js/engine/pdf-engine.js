/* =====================================================================
 * WeddingFlow Engine — jsPDF (parallax/jsPDF v4.2.1) + Offline Fallback
 * Uses official window.jspdf.jsPDF when loaded, with a zero-dependency
 * pure-JS Binary PDF 1.4 fallback for completely offline environments.
 * ===================================================================== */
const WFPdfEngine = (function () {
  'use strict';

  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  function strToBytes(str) {
    if (encoder) return encoder.encode(str);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
    return bytes;
  }

  function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function compileFallbackPDF(dataUrl, imgW, imgH) {
    const jpegBytes = base64ToBytes(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const pageW = 595.28;
    const pageH = 841.89;
    const chunks = [];
    const offsets = [0];
    let bytePos = 0;
    const emit = b => { chunks.push(b); bytePos += b.length; };
    const emitStr = s => emit(strToBytes(s));

    emit(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    offsets.push(bytePos); emitStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets.push(bytePos); emitStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    offsets.push(bytePos); emitStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    offsets.push(bytePos); emitStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    emit(jpegBytes); emitStr('\nendstream\nendobj\n');
    const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets.push(bytePos); emitStr(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
    const xrefPos = bytePos;
    let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    xref += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    emitStr(xref);

    const out = new Uint8Array(bytePos);
    let pos = 0;
    for (let i = 0; i < chunks.length; i++) { out.set(chunks[i], pos); pos += chunks[i].length; }
    return new Blob([out], { type: 'application/pdf' });
  }

  /**
   * Compile an A4 PDF Blob using parallax/jsPDF (primary) or offline fallback.
   * @param {HTMLCanvasElement} canvas
   * @param {number} [quality=0.94]
   * @param {{title?: string, subject?: string}} [meta]
   * @returns {Blob}
   */
  function compileFromCanvas(canvas, quality, meta) {
    const q = typeof quality === 'number' ? quality : 0.94;
    const dataUrl = canvas.toDataURL('image/jpeg', q);

    if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      doc.setProperties({
        title: (meta && meta.title) || 'WeddingFlow Invitation',
        subject: (meta && meta.subject) || 'Wedding Invitation Card',
        creator: 'WeddingFlow Pro (parallax/jsPDF)'
      });
      doc.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      return doc.output('blob');
    }

    return compileFallbackPDF(dataUrl, canvas.width, canvas.height);
  }

  return { compileFromCanvas };
})();
