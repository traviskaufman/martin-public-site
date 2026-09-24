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

- `src/pages/thanks.astro` — the thank-you page Stripe redirects buyers to: the mark, "Your key is on its way", the inbox line, a "Next steps:" checklist, and the support line; `noindex`, no top bar, no analytics. `src/layouts/Site.astro` is the shell it shares with the pitch (head, theme guard, fonts, footer).
- `src/pages/index.astro` — the pitch: a content column of sections (the hero opens with the mark, 64px tall, above the headline; then one section per entry of `src/sections.ts`, each an `<h2>` and a byline) beside a terminal track, then the closing prompt; `src/layouts/Pitch.astro` builds on `Site.astro` with the pitch's meta tags, analytics, and top bar.
- `src/components/` — one `.astro` file per Figma component, in page order: `LicenseKeyButton`, `SourceLink`, `ComparisonTabs` ("With Martin" | "Without Martin") holding a `Terminal` and a `ComparisonVanilla` (the vanilla panel), `WhyTravisBuiltMe` (its slot takes the phone's terminal), `AfterYouPay` with `Step`, `CodeChip`, `CodeBlock`, `Faq` with `FaqItem`, `ClosingPrompt`, `Footer`; `TerminalTrack` is the desktop column, one `ComparisonTabs` around the one terminal that follows the scroll; on a phone each differentiator section holds its own `ComparisonTabs` and inline `Terminal`; `TopBar` holds `ThemeToggle`; `Mark` is the logo from `src/assets/mark.svg`, teal in the top bar and muted in the footer; `VisitCounter` is the analytics snippet.
- `src/assets/` — the mark and the icons as `.svg` files, imported as components.
- `src/pitch.ts`, `src/sections.ts` (the three differentiator sections and the comparisons each one shows), `src/faq.ts`, `src/links.ts` — copy and URLs as constants; `src/content/comparisons/*.yaml` — the transcripts (never reworded); `src/content/beats/*.yaml` — what the terminal plays under each section, resolved in order by `src/beats.ts` into sessions (`src/session.ts`): an opening beat carries a `title` and `command`, a continuing beat (`continues: true`) is appended to the session on screen.
- `src/scripts/` — the terminal's client code: `terminal-stage.ts` (the DOM), `beat-follower.ts` (which section is in the top third), `playback.ts` (typing; imported lazily), `comparison-tabs.ts` (the tab row).
- `src/styles/global.css` — the Solarized tokens, the `@font-face` rules, and the shared button and link styles; `src/styles/terminal.css` — the terminal chrome and pane, shared by `Terminal` and `ClosingPrompt`.
- `public/fonts/` — Geist and Geist Mono as Latin-subset variable woff2 files (SIL OFL 1.1, licence alongside).
- `public/install.sh` — the installer buyers pipe into `bash`: it reads `MARTIN_API_KEY`, backs up and merges `~/.claude/settings.json` with Perl's `JSON::PP`, installs the plugin, and adds the `martin` alias. It prints plain lines only, so it reads the same without a TTY.
- `functions/index.ts` — the site's one Cloudflare Pages Function: a request for `/` whose `Accept` header names `text/markdown` (Claude Code's fetch sends `text/markdown, text/html, */*`) is answered with `llms.txt`; every other request falls through to the static page. `wrangler pages deploy dist` picks the directory up from the repository root.
- `public/llms.txt` — the install instructions for agents, served in place of the page to an agent that asks for markdown and named in the page head as `<link rel="alternate" type="text/markdown">`; it tells them to read the key from `~/Downloads/martin-api-key.txt` and never ask for it.
- `.github/workflows/deploy.yml` — every push to `main` runs the checks and tests, builds, and deploys `dist/` to Cloudflare Pages.
- `tests/*.spec.ts` — Playwright end-to-end tests; every test opens the site in a browser and asserts what a visitor sees. `tests/posthog.ts` holds the PostHog interception and bot-detection spoof for analytics tests.
- `.claude/skills/testing-stripe-flows/` — how to pay on the Stripe test-mode link and land on the preview at https://preview.trymartin-dev.pages.dev/thanks; run it before changing a payment link.
- `.martin/` — Martin's build ledger. Only `.martin/README.md` is tracked.

## Rules

- IMPORTANT: The repository is public. A secret committed here is leaked; keep API tokens out of every file, including `.martin/`.
- Every story ships with one Playwright test in `tests/` written before its code.
- The pre-commit hook (`.husky/pre-commit`) runs Prettier and ESLint on staged files; a failing hook is fixed, never skipped with `--no-verify`.
- No code comments.
- Site copy is written in Martin's first person, speaking to the reader as "you". Quoted strings in a story's Gherkin appear on the page verbatim.
- Transcripts are verbatim from real sessions: a comparison or a beat is edited only to swap in a new recording. A new beat's recording is saved under `.martin/recordings/` first, then copied into `src/content/beats/` unchanged. A beat may introduce a recorded excerpt with the tool-call line that produced it (`⏺ Write(src/personal_crm/people.py)`), and may start from a line inside the recording (`startAt`).
- `<script>` blocks inside `.astro` files are plain JavaScript; TypeScript lives in `src/scripts/*.ts`, which the blocks import. ESLint parses the blocks without a TypeScript parser.
- WARNING: `npm test` reaches buy.stripe.com and github.com live; without network access those tests fail, not the site.

## Preview image

`public/og.png` is the terminal window asking "> ready to build?", filling the whole card, with the mark in the pane's bottom-right corner — rendered once and committed; regenerate it with the following command after `npm install`.

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
    body { width: 1200px; height: 630px; }
    .terminal { width: 100%; height: 100%; border: none; border-radius: 0; font-size: 5.5rem; line-height: 7rem; }
    .terminal .chrome { padding: 1.75rem 2.5rem; }
    .terminal .lights { gap: 0.75rem; }
    .terminal .lights i { width: 1.125rem; height: 1.125rem; }
    .terminal .terminal-title { font-size: 1.75rem; line-height: 2.25rem; }
    .terminal .pane { position: relative; padding: 3.5rem 4.5rem; }
    .terminal .command { align-items: center; gap: 0.35em; }
    .terminal .pane svg { position: absolute; right: 72px; bottom: 72px; height: 200px; width: auto; color: var(--color-accent); }
  `,
].join("\n");

const mark = readFileSync("src/assets/mark.svg", "utf8");

const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><style>${styles}</style></head>
  <body>
    <div class="terminal" data-state="finished">
      <div class="chrome">
        <span class="lights"><i></i><i></i><i></i></span>
        <span class="terminal-title">claude --agent martin</span>
        <span class="controls"></span>
      </div>
      <div class="pane">
        <p class="command"><span class="prompt">&gt;</span> <span>ready to build?</span></p>
        ${mark}
      </div>
    </div>
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

## Tab icon

`public/favicon.svg` is the mark from `src/assets/mark.svg` in #2aa198, centred in a square viewBox; `public/favicon.ico` is rendered from it once with ImageMagick and committed.

```sh
magick -background none public/favicon.svg -define icon:auto-resize=32 public/favicon.ico
```
