# Testing

Tests live in `tests/*.spec.ts` and run with `npm test`.

- `playwright.config.ts` builds the site and starts `astro preview` on http://localhost:4321 before the tests; tests drive that server in Chromium and never import from `src/`.
- One spec per user story, named after the story, written and seen failing before the story's code.
- Assert what a visitor sees: text, roles, labels, and navigation. Do not assert on CSS classes or markup structure beyond what the story names.
- A test that involves analytics intercepts `https://us.i.posthog.com/**` and applies the bot-detection spoof from `tests/counting-visits.spec.ts`; PostHog's SDK drops every event from an unspoofed headless browser.
- The "Get your license key for $5" button appears four times (the hero, the top bar, "What happens after you pay", and the closing prompt); a test about the hero button uses `.first()` on the role lookup, and a test about another scopes the lookup to that section or to the bar (`getByRole("banner")`).
- The terminal is the region inside `getByRole("complementary", { name: "Terminal" })`; its accessible name is the terminal's title. A story about a full transcript uses `page.emulateMedia({ reducedMotion: "reduce" })`, under which every scene renders finished at once; a story about typing waits with `expect.poll` or a longer `timeout`, since scenes type at 80 characters per second.
- A story stated for a 1440px window uses `test.use({ viewport: { width: 1440, height: 900 } })`; a phone story uses `390×844`. Theme stories use `page.emulateMedia({ colorScheme })`; the no-JavaScript story uses `request.get("/")` and a `javaScriptEnabled: false` context.
