# Target Pace

A simple, fast, ad-free running pace converter and calculator for race goals.

Target Pace is a static website that runs entirely in the browser. Enter either a
goal finish time or a known pace, choose a race distance, and the page updates
instantly with:

- finish time
- pace per km
- pace per mile
- cumulative 1 km or 1 mile splits

Supported preset distances:

- 5K
- 10K
- Half marathon
- Marathon
- 50K
- 100K
- 100 miles

## Hosting

This app does not need a server, database, or dynamic API. It can be hosted for
free with GitHub Pages by publishing the repository root.

In GitHub, go to `Settings` -> `Pages`, then set the source to deploy from the
main branch and the repository root.

## Local use

Go to repo root and run `python3 -m http.server 8000`

Then open `http://localhost:8000`.

## Project Docs

- [Spec](SPEC.md)
- [Contributing](CONTRIBUTING.md)
- [Agent guidance](AGENTS.md)
