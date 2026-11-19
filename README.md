# WeddingFlow Pro

Design print-ready A4 wedding invitation cards directly in your browser — **80 luxury templates across 8 traditions**, a **native pure-JS Binary PDF 1.4 compiler**, **High-DPI PNG / 9:16 Story exports**, **50-step Undo/Redo**, and **sanitized JSON preset upload/save**.

---

## Highlights

- **80 Art-Directed Templates (10 per Tradition)**:
  - **Hindu** (10) · **Muslim / Nikah** (10) · **Christian** (10) · **Sikh / Anand Karaj** (10)
  - **Jain** (10) · **Buddhist** (10) · **Chinese / East Asian** (10) · **Modern / Interfaith** (10)
- **10 Architectural Card Frame Styles**: Mughal Arch, Royal Beveled, Imperial Lattice, Temple Double, Engraved Double-Rule, Botanical, Celestial Starlight, Champagne Gala, Ornate Corner, and Swiss Editorial Minimal.
- **jsPDF Engine (`js/engine/pdf-engine.js` via [parallax/jsPDF](https://github.com/parallax/jsPDF) v4.2.1 + offline binary fallback)**: Compiles spec-compliant A4 (`595.28 × 841.89 pt`) `%PDF-1.4` files directly in-browser with exact `xref` byte offsets — **100% offline** with zero `html2canvas` or CSS `color-mix()` bugs.
- **High-DPI Canvas Renderer (`js/engine/canvas-renderer.js`)**: Exports crisp **1654×2339 A4 PNG** and **1080×1920 WhatsApp/Instagram Story PNG** cards.
- **JSON Preset Upload & Save**: Upload any `.json` card preset (fully backward-compatible with `WeddingFlow` v1 presets) via the top bar or Designs tab.
- **Responsive Studio UI**: Side-by-side Editor + Live Preview on desktop; single-tap top header **Pen-in-Box | Eye** switcher on mobile (`<= 960px`), light & dark themes, Font Awesome 6 Solid icons, and live Card Readiness meter.

---

## Quick Start

No build step or backend required — open `index.html` in any modern browser or host directly on **GitHub Pages**:

```bash
git clone https://github.com/uxle/WeddingFlow.git
cd WeddingFlow
# Serve locally (optional)
python3 -m http.server 8080
```

Then visit `http://localhost:8080`. To test preset import immediately, click **Upload JSON** and select `preset.sample.json`.

---

## Project Structure

```text
WeddingFlow-pro/
├── index.html                    # Studio shell & Export modal
├── manifest.webmanifest          # PWA metadata
├── preset.sample.json            # Ready-to-upload sample JSON card preset
├── css/
│   └── studio.css                # Minimal studio UI + 10 card frame styles
├── js/
│   ├── app.js                    # Pure-DOM UI controller (zero XSS innerHTML)
│   ├── data/
│   │   └── templates.js          # 80 templates across 8 religions
│   └── engine/
│       ├── validator.js          # Prototype-pollution guard & preset sanitizer
│       ├── history-engine.js     # 50-step immutable Undo / Redo stack
│       ├── storage-engine.js     # Debounced localStorage autosave
│       ├── canvas-renderer.js    # High-DPI Canvas2D A4 & 9:16 card renderer
│       ├── pdf-engine.js         # Native pure-JS Binary PDF 1.4 compiler
│       └── export-engine.js      # Unified PDF / PNG / Story / JSON exporter
├── ARCHITECTURE.md               # Engine internals & data flow
├── SECURITY.md                   # Threat model & security reporting
├── CONTRIBUTING.md               # Guide for adding templates & PRs
├── CHANGELOG.md                  # Release history
└── LICENSE                       # MIT License
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl / Cmd + S` | Save JSON card preset |
| `Ctrl / Cmd + O` | Upload JSON card preset |
| `Ctrl / Cmd + Z` | Undo (up to 50 steps) |
| `Ctrl / Cmd + Y` or `Shift + Z` | Redo |
| `Esc` | Close Export modal |

---

## License

Released under the [MIT License](LICENSE).
