# Changelog

## [2.0.0] — Pro Engine Release
- **80 Art-Directed Templates**: Added 10 distinct luxury templates for each of 8 religions/traditions (Hindu, Muslim, Christian, Sikh, Jain, Buddhist, Chinese, Modern/Interfaith).
- **Native Binary PDF 1.4 Compiler (`js/engine/pdf-engine.js`)**: Pure-JS offline A4 PDF generator replacing fragile `html2canvas` / `html2pdf` exports.
- **High-DPI Canvas Renderer (`js/engine/canvas-renderer.js`)**: Supports 1654×2339 A4 PNG and 1080×1920 Story PNG exports.
- **Security Hardening (`js/engine/validator.js`)**: Prototype pollution protection, 512 KB upload cap, strict schema sanitization, and zero-`innerHTML` DOM rendering.
- **Studio Productivity**: Added 50-step Undo/Redo (`js/engine/history-engine.js`), debounced autosave (`js/engine/storage-engine.js`), live Card Readiness meter, Export modal, and top header **Upload JSON** button.
- **Mobile & UI Polish**: Top header Pen-in-Box | Eye view switcher on mobile, side-by-side workspace on desktop, Font Awesome 6.7.2 Solid icons, and WCAG AAA dark mode contrast.

## [1.0.0] — Single Card Edition
- Initial single-card A4 wedding invitation editor with Top, Couple, Events, and Bottom tabs, dark mode, JSON save/load, and `html2pdf` export.
