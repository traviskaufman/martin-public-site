# martin-public-site

The marketing site for Martin at https://trymartin.dev, a static Astro site.

## Install

```sh
npm install
```

## Run

```sh
npm run dev
```

Serves the site at http://localhost:4321.

## Test

```sh
npm test
```

Builds the site and runs the Playwright tests in `tests/` against the build served by `wrangler pages dev`, which runs the Pages Function in `functions/` as production does.

## Check

```sh
npm run lint
npm run format:check
```

`npm run format` rewrites files in place. A pre-commit hook runs both checks on staged files.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: lint, format check, tests, build, then `wrangler pages deploy dist` to the Cloudflare Pages project `trymartin-dev`. The workflow reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the repository's Actions secrets.

## Content

- `src/pitch.ts` — the headline and the pitch paragraph.
- `src/differentiators.ts`, `src/faq.ts` — the differentiators and the FAQ.
- `src/content/comparisons/*.yaml` — verbatim transcripts from real sessions, one per comparison.
- `src/content/scenes/*.yaml` — what the terminal plays under each section; a scene either carries its own verbatim transcript or reuses a comparison's Martin half.
- `src/links.ts` — the checkout and repository URLs.
- `public/fonts/` — Geist and Geist Mono, self-hosted.
- `public/og.png` — the link-preview image; `AGENTS.md` has the command that regenerates it.
