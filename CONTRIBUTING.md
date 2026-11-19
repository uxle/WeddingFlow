# Contributing to WeddingFlow Pro

Contributions are welcome — especially new cultural templates, frame geometries, and accessibility improvements.

## Adding a New Template

1. Open `js/data/templates.js` and add a new entry to `WF_TEMPLATES`:
   ```js
   {
     id: "hin-my-design",
     religion: "hindu",
     name: "My Design",
     frame: "royal", // temple | royal | arch | lattice | minimal | botanical | celestial | engraved | ornate | gala
     bg: "#FFFBF2",
     surface: "#FFF3D9",
     primary: "#B91C1C",
     gold: "#B45309",
     ink: "#291D14",
     muted: "#6B5644",
     dark: false
   }
   ```
2. Verify contrast (WCAG AA ≥ 4.5:1 for body text) in both the live DOM preview and the exported PDF (`WFCanvasRenderer` + `WFPdfEngine`).
3. Keep all UI rendering XSS-safe (`textContent` only, no `innerHTML` with user data).

## Pull Request Checklist

- [ ] Tested on desktop (`>= 1024px`) side-by-side layout and mobile (`390px`) top switch mode.
- [ ] Tested light and dark studio themes.
- [ ] Verified A4 PDF export opens cleanly in a PDF viewer.
- [ ] No console errors or warnings.
