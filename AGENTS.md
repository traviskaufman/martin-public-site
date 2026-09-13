# martin-public-site

Static Astro site for https://trymartin.dev.

## Commands

```sh
npm install
npm run dev
npm test
npm run lint
npm run format:check
npm run format
npm run build
```

`npm test` builds the site and drives the production build in Chromium; the dev server is not used by tests.

## Layout

- `src/pages/index.astro` — the only page.
- `tests/*.spec.ts` — Playwright end-to-end tests; every test opens the site in a browser and asserts what a visitor sees.
- `.martin/` — Martin's build ledger. Only `.martin/README.md` is tracked.

## Rules

- IMPORTANT: The repository is public. A secret committed here is leaked; keep API tokens out of every file, including `.martin/`.
- Every story ships with one Playwright test in `tests/` written before its code.
- The pre-commit hook (`.husky/pre-commit`) runs Prettier and ESLint on staged files; a failing hook is fixed, never skipped with `--no-verify`.
- No code comments.
- Site copy is written in Martin's first person, speaking to the reader as "you".
