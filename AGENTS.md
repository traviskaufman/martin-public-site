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

- `src/pages/index.astro` — the only page; `src/layouts/Pitch.astro` is its shell (head, meta tags, analytics, footer).
- `src/components/` — one `.astro` file per section, in page order: `LicenseKeyButton`, `SourceLink`, `Differentiators`, `Comparison`, `WhyTravisBuiltMe`, `AfterYouPay`, `Faq`, `Footer`; `VisitCounter` is the analytics snippet.
- `src/pitch.ts`, `src/differentiators.ts`, `src/faq.ts`, `src/links.ts` — copy and URLs as constants; `src/content/comparisons/*.yaml` — the transcripts (never reworded).
- `.github/workflows/deploy.yml` — every push to `main` runs the checks and tests, builds, and deploys `dist/` to Cloudflare Pages.
- `tests/*.spec.ts` — Playwright end-to-end tests; every test opens the site in a browser and asserts what a visitor sees.
- `.martin/` — Martin's build ledger. Only `.martin/README.md` is tracked.

## Rules

- IMPORTANT: The repository is public. A secret committed here is leaked; keep API tokens out of every file, including `.martin/`.
- Every story ships with one Playwright test in `tests/` written before its code.
- The pre-commit hook (`.husky/pre-commit`) runs Prettier and ESLint on staged files; a failing hook is fixed, never skipped with `--no-verify`.
- No code comments.
- Site copy is written in Martin's first person, speaking to the reader as "you". Quoted strings in a story's Gherkin appear on the page verbatim.
- WARNING: `npm test` reaches buy.stripe.com and github.com live; without network access those tests fail, not the site.

## Preview image

`public/og.png` is rendered once and committed; regenerate it with the following command.

```sh
node --input-type=module <<'EOF'
import { chromium } from "playwright";
import { headline, pitch } from "./src/pitch.ts";

const firstSentence = pitch.slice(0, pitch.indexOf(".") + 1);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 630px;
        background: #ffffff;
        color: #1a1a1a;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 80px;
        box-sizing: border-box;
      }
      h1 { font-size: 64px; font-weight: 700; line-height: 1.1; text-wrap: balance; margin: 0 0 24px; }
      p { font-size: 30px; color: #5c5c5c; line-height: 1.4; margin: 0; }
      .mark { position: absolute; left: 80px; bottom: 64px; font-size: 24px; font-weight: 600; color: #6d28d9; }
    </style>
  </head>
  <body>
    <h1>${headline}</h1>
    <p>${firstSentence}</p>
    <span class="mark">trymartin.dev</span>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.screenshot({ path: "public/og.png", type: "png" });
await browser.close();
EOF
```
