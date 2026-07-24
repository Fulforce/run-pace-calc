# AGENTS.md

Guidance for AI coding agents working on Target Pace.

## Project Shape

Target Pace is a dependency-free static website served from the repository root.
It should remain suitable for GitHub Pages without a build step.

Primary files:

- `index.html` for structure
- `styles.css` for styling
- `app.js` for calculator behavior
- `favicon.svg` for the site icon
- `README.md`, `CONTRIBUTING.md`, and `SPEC.md` for project docs

## Guardrails

- Do not add external dependencies unless explicitly requested.
- Do not introduce a framework or bundler unless explicitly requested.
- Do not add server-side code, API calls, or storage.
- Keep calculations client-side and instant.
- Keep edits small and readable.
- Preserve GitHub Pages compatibility from the repository root.
- Prefer native browser controls and accessible markup.

## Verification

After JavaScript changes, run:

```bash
node --check app.js
```

After layout or interaction changes, manually check:

- desktop width
- narrow mobile width
- goal time mode
- known pace mode
- split toggles
- tap/hold stepper buttons

## Product Intent

The app should feel quick, clean, ad-free, and lightweight. It is primarily a personal utility, not a large community project.
