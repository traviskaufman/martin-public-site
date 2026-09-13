# Committing

`.husky/pre-commit` runs `npx lint-staged`, which runs `prettier --write` and `eslint --fix` on staged files per `.lintstagedrc.json`.

- Run `npm test`, `npm run lint`, and `npm run format:check` before committing.
- WARNING: `git commit --no-verify` skips the hook; a commit that fails the hook is fixed and retried instead.
- `.martin/*` is ignored except `.martin/README.md`; never force-add the rest.
