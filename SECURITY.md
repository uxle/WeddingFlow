# Security Policy

## Client-Side Threat Model

WeddingFlow Pro runs 100% in the browser with no backend or telemetry. The primary attack surface is untrusted `.json` preset files uploaded by users.

### Implemented Mitigations

- **Prototype Pollution Prevention**: `WFValidator.safeParseJSON` strips `__proto__`, `constructor`, and `prototype` keys inside the `JSON.parse` reviver.
- **XSS Prevention**: All user-supplied fields, event rows, and template metadata are rendered via `textContent` and `createElement` rather than `innerHTML`.
- **Resource & DoS Caps**: Uploaded presets are capped at **512 KB**, string fields enforce strict length bounds, and event arrays are capped at **24 items**.
- **Template Allowlisting**: `design.templateId` is validated against the known 80-template registry before applying styles.
- **Memory Safety**: Exported Blob URLs are automatically revoked after download via `URL.revokeObjectURL`.

## Reporting a Vulnerability

If you discover a security issue, please open a private security advisory on GitHub or contact the maintainer with reproduction steps and a sample payload.
