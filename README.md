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

Builds the site and runs the Playwright tests in `tests/` against `astro preview`.

## Check

```sh
npm run lint
npm run format:check
```

`npm run format` rewrites files in place. A pre-commit hook runs both checks on staged files.

## Deploy

Cloudflare Pages builds `main` with `npm run build` and serves `dist/`.
