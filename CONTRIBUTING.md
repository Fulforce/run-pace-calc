# Contributing

Target Pace is mainly a personal project, but small improvements are welcome.
The project should stay simple, fast, and easy to host on GitHub Pages.

## Local Development

Run a local static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, but a local server is a
closer match to GitHub Pages.

## Project Constraints

- No external runtime dependencies.
- No build step unless there is a very strong reason.
- No server, database, analytics service, or dynamic API.
- Keep the site fast on low-powered phones.
- Keep calculations instant as users type, tap, or change controls.
- Preserve the static GitHub Pages deployment model.

## Before Opening a Pull Request

- Test the page in a desktop browser.
- Test a narrow mobile layout with browser responsive design mode.
- Run:

```bash
node --check app.js
```

- Check common distances and both modes:
  - goal time to pace
  - known pace to finish time
  - km splits
  - mile splits

## Style

- Prefer plain HTML, CSS, and JavaScript.
- Keep copy short and practical.
- Avoid adding dependencies for formatting, icons, UI components, or tests.
- Favor accessible native controls where they work well.
