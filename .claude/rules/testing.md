# Testing

Tests live in `tests/*.spec.ts` and run with `npm test`.

- `playwright.config.ts` builds the site and starts `astro preview` on http://localhost:4321 before the tests; tests drive that server in Chromium and never import from `src/`.
- One spec per user story, named after the story, written and seen failing before the story's code.
- Assert what a visitor sees: text, roles, labels, and navigation. Do not assert on CSS classes or markup structure beyond what the story names.
