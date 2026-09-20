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

`npm test` builds the site and serves `dist/` with `wrangler pages dev`, so the Pages Function in `functions/` runs as it does in production, and drives it in Chromium; the dev server is not used by tests.

## Layout

- `src/pages/index.astro` — the only page: a content column of sections beside a terminal track, then the closing prompt; `src/layouts/Pitch.astro` is its shell (head, meta tags, the theme guard, analytics, footer, top bar).
- `src/components/` — one `.astro` file per Figma component, in page order: `LicenseKeyButton`, `SourceLink`, `Differentiators` with `DifferentiatorPanel`, `ComparisonVanilla` with `Eyebrow`, `WhyTravisBuiltMe`, `AfterYouPay` with `Step`, `CodeChip`, `CodeBlock`, `Faq` with `FaqItem`, `ClosingPrompt`, `Footer`; `TerminalSheet` wraps `Terminal`; `TopBar` holds `ThemeToggle`; `VisitCounter` is the analytics snippet.
- `src/pitch.ts`, `src/differentiators.ts`, `src/faq.ts`, `src/links.ts` — copy and URLs as constants; `src/content/comparisons/*.yaml` — the transcripts (never reworded); `src/content/scenes/*.yaml` — what the terminal plays under each section, resolved by `src/scenes.ts`.
- `src/scripts/` — the terminal's client code: `terminal-stage.ts` (the DOM), `scene-follower.ts` (which section is in the top third), `playback.ts` (typing; imported lazily).
- `src/styles/global.css` — the Solarized tokens, the `@font-face` rules, and the shared button and link styles; `src/styles/terminal.css` — the terminal chrome and pane, shared by `Terminal` and `ClosingPrompt`.
- `public/fonts/` — Geist and Geist Mono as Latin-subset variable woff2 files (SIL OFL 1.1, licence alongside).
- `public/install.sh` — the installer buyers pipe into `bash`: it reads `MARTIN_API_KEY`, backs up and merges `~/.claude/settings.json` with Perl's `JSON::PP`, installs the plugin, and adds the `martin` alias. It prints plain lines only, so it reads the same without a TTY.
- `functions/index.ts` — the site's one Cloudflare Pages Function: a request for `/` whose `Accept` header names `text/markdown` (Claude Code's fetch sends `text/markdown, text/html, */*`) is answered with `llms.txt`; every other request falls through to the static page. `wrangler pages deploy dist` picks the directory up from the repository root.
- `public/llms.txt` — the install instructions for agents, served in place of the page to an agent that asks for markdown; it tells them to read the key from `~/Downloads/martin-api-key.txt` and never ask for it.
- `.github/workflows/deploy.yml` — every push to `main` runs the checks and tests, builds, and deploys `dist/` to Cloudflare Pages.
- `tests/*.spec.ts` — Playwright end-to-end tests; every test opens the site in a browser and asserts what a visitor sees.
- `.martin/` — Martin's build ledger. Only `.martin/README.md` is tracked.

## Rules

- IMPORTANT: The repository is public. A secret committed here is leaked; keep API tokens out of every file, including `.martin/`.
- Every story ships with one Playwright test in `tests/` written before its code.
- The pre-commit hook (`.husky/pre-commit`) runs Prettier and ESLint on staged files; a failing hook is fixed, never skipped with `--no-verify`.
- No code comments.
- Site copy is written in Martin's first person, speaking to the reader as "you". Quoted strings in a story's Gherkin appear on the page verbatim.
- Transcripts are verbatim from real sessions: a comparison or a scene is edited only to swap in a new recording. A new scene's recording is saved under `.martin/recordings/` first, then copied into `src/content/scenes/` unchanged.
- `<script>` blocks inside `.astro` files are plain JavaScript; TypeScript lives in `src/scripts/*.ts`, which the blocks import. ESLint parses the blocks without a TypeScript parser.
- WARNING: `npm test` reaches buy.stripe.com and github.com live; without network access those tests fail, not the site.

## Preview image

`public/og.png` is the closing prompt — the docked terminal asking "> ready to build?" above the license-key button — rendered once and committed; regenerate it with the following command after `npm install`.

```sh
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const fontAsDataUri = (file) =>
  `data:font/woff2;base64,${readFileSync(`public/fonts/${file}`).toString("base64")}`;
const styles = [
  readFileSync("src/styles/global.css", "utf8").replace(
    /url\("\/fonts\/([^"]+)"\)/g,
    (_, file) => `url("${fontAsDataUri(file)}")`,
  ),
  readFileSync("src/styles/terminal.css", "utf8"),
  `
    body {
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40px;
      padding: 80px;
    }
    .terminal { width: 100%; height: 240px; font-size: 1.25rem; line-height: 2rem; }
    .terminal .chrome { padding: 1rem 1.5rem; }
    .terminal .terminal-title, .terminal .speed { font-size: 1.125rem; line-height: 1.75rem; }
    .terminal .pane { padding: 2rem; }
    .license-key-button { font-size: 1.5rem; line-height: 2rem; padding: 1.25rem 2.25rem; }
    .mark { position: absolute; right: 80px; bottom: 40px; color: var(--color-accent-text); font-family: var(--font-mono); font-size: 1.25rem; }
  `,
].join("\n");

const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><style>${styles}</style></head>
  <body>
    <div class="terminal" data-state="finished">
      <div class="chrome">
        <span class="lights"><i></i><i></i><i></i></span>
        <span class="terminal-title">claude --agent martin</span>
        <span class="controls"><span class="speed">2×</span></span>
      </div>
      <div class="pane">
        <p class="command"><span class="prompt">&gt;</span> <span>ready to build?</span></p>
      </div>
    </div>
    <span class="license-key-button">Get your license key for $5</span>
    <span class="mark">trymartin.dev</span>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og.png", type: "png" });
await browser.close();
EOF
```
