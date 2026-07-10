# Copilot code review instructions

`@book000/create-ts` is a CLI (commander + `@clack/prompts`) that scaffolds
book000-style TypeScript projects by copying `templates/nodejs/<variant>` into a
target directory and patching its config. Review changes with the points below.

## Scope

- `src/**` is the CLI application code and is the primary review target.
- `templates/**` is scaffolding payload copied verbatim into generated projects.
  It is intentionally excluded from this repo's ESLint, Prettier, and vitest.
  Do NOT flag template files for violating this repo's lint/style rules, and do
  not suggest "fixing" them to match `src/` conventions — they follow the
  generated project's own rules.

## What to check

- **ESM correctness**: local imports must use explicit `.js` extensions on `.ts`
  sources (e.g. `from './template.js'`); Node built-ins must use the `node:`
  prefix (`node:fs`). Flag missing extensions or bare `fs`/`path` imports.
- **Purity of `generate.ts` / `validate.ts`**: these are pure, unit-tested
  transform/validation helpers. Flag any new I/O, global state, or side effects
  added to them — side effects belong in `index.ts`.
- **User-facing output**: messages go through `@clack/prompts` (`log.error`,
  `outro`, `cancel`), not raw `console.log` / `console.error`. Flag raw console
  calls in the CLI flow.
- **Shebang**: `src/index.ts` must keep its `#!/usr/bin/env node` first line
  (tsdown relies on it to set the executable bit). Flag its removal.
- **Strictness**: the project uses `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Flag
  unused symbols and unhandled switch/return paths.
- **Test coverage**: new/changed pure helpers in `generate.ts` / `validate.ts`
  should have matching `test/*.test.ts` cases. Note when they are missing.
- **Version management**: do not approve manual version bumps in `package.json`
  or manual `pnpm publish` steps — `release.yml` handles versioning on merge to
  `main`. Do not hand-edit Renovate-pinned dependency versions.

## Style already enforced by tooling

Prettier (no semicolons, single quotes, `trailingComma: es5`, `printWidth: 80`)
and ESLint (`@book000/eslint-config`) run in CI. Do not spend review comments on
formatting the tools already enforce; focus on logic, correctness, and the
project-specific points above.

## Conventions

- Code comments and JSDoc are written in Japanese, matching the existing source.
- Commit messages follow Conventional Commits with Japanese descriptions.
