# Architecture

WeddingFlow Pro is a zero-dependency, client-side invitation studio organized into a strict separation between **data**, **pure-JS engines**, and **DOM presentation**.

## Module Layers

1. **Data Layer (`js/data/templates.js`)**
   - Defines `WF_RELIGIONS` (8 traditions with default blessings, verses, and emblems) and `WF_TEMPLATES` (80 art-directed cards with palette tokens and frame identifiers).
2. **Security & Validation Engine (`js/engine/validator.js`)**
   - `safeParseJSON(rawText)`: Enforces a 512 KB upload ceiling and strips `__proto__`, `constructor`, and `prototype` keys during `JSON.parse` revival.
   - `sanitizePreset(raw, validTemplateIds)`: Validates every field type, trims control characters, caps event lists to 24 entries, and allowlists `templateId`.
   - `auditState(state)`: Computes the live 0–100% Card Readiness score and actionable tab jump issues.
3. **State & Persistence Engines**
   - `js/engine/history-engine.js`: 50-step immutable snapshot ring buffer powering Undo/Redo.
   - `js/engine/storage-engine.js`: Versioned (`v2`) debounced `localStorage` autosave wrapped in `try/catch` for restricted/private browsing contexts.
4. **Rendering & Native PDF Compiler**
   - `js/engine/canvas-renderer.js`: Renders any card directly onto an offscreen HTML5 `<canvas>` at 1654×2339 (A4 200 DPI) or 1080×1920 (9:16 Story), drawing all 10 frame geometries, ambient glows, vector emblems, typography, 2×2 event grids, venue, and RSVP footers.
   - `js/engine/pdf-engine.js`: Pure-JS Binary PDF 1.4 writer. Embeds the high-DPI JPEG stream as an `/XObject` `/Image` (`/DCTDecode`) on an exact A4 `MediaBox [0 0 595.28 841.89]`, computes exact 10-digit `xref` byte offsets, and outputs a spec-compliant `%PDF-1.4` Blob.
   - `js/engine/export-engine.js`: Coordinates PDF, A4 PNG, Story PNG, and JSON downloads with automatic `URL.revokeObjectURL` cleanup.
5. **UI Controller (`js/app.js`)**
   - Uses pure DOM APIs (`createElement`, `textContent`, `addEventListener`) so untrusted text from inputs or uploaded JSON files never passes through `innerHTML`.
