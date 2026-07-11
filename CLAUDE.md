# CLAUDE.md

## Overview

`@book000/create-ts` is a CLI that scaffolds book000-style TypeScript / Node.js
projects. Users run it via `pnpm create @book000/ts [outDir] [options]`. It copies
the bundled `templates/nodejs/<variant>` files into the target directory, patches
`package.json` / `tsconfig.json`, then runs `pnpm install`. It is an interactive
CLI (`@clack/prompts`) that also supports fully unattended runs via flags.

`SPEC.md` is the original design document. Treat the actual source under `src/` and
the config files as the source of truth where the two disagree.

## Commands

- `pnpm build`: bundle `src/index.ts` to `dist/index.mjs` with tsdown.
- `pnpm dev`: tsdown in watch mode.
- `pnpm lint`: runs `lint:prettier` (`prettier --check src`), `lint:eslint`
  (`eslint . -c eslint.config.mjs`), and `lint:tsc` (`tsc`, which type-checks) in
  parallel via run-z (comma-separated tasks run concurrently).
- `pnpm fix`: runs `fix:prettier` (`prettier --write src`) then `fix:eslint`
  (`eslint . -c eslint.config.mjs --fix`) sequentially via run-z.
- `pnpm test`: run the vitest suite once (`vitest run`).

This repo is pnpm-only: a `preinstall` hook (`npx only-allow pnpm`) blocks npm/yarn.
Use `pnpm`, never `npm install` / `yarn`.

## Architecture

- `src/index.ts`: CLI entry point. Starts with `#!/usr/bin/env node` (tsdown detects
  the shebang and sets the executable bit — do not remove it). Wires commander flags,
  runs the setup pipeline, and owns file writing (`writeFile`) and prerequisite checks.
- `src/prompts.ts`: `@clack/prompts` interactive flow (`collectOptions`,
  `confirmOverwrite`, `displaySummary`). Skips prompts for options already given as flags.
- `src/template.ts`: reads the bundled `templates/` files from disk (`readTemplate`,
  `fetchTemplateConfig`). Templates ship in the package (`files: ["dist", "templates"]`).
- `src/generate.ts`: pure patch/transform helpers (`patchPackageJson`, `patchTsConfig`,
  `patchDockerWorkflow`, `generateGitignore`, `updateDepcheck`). Keep these side-effect
  free so they stay unit-testable.
- `src/validate.ts`: input validators (project/org/repo name, etc.).
- `src/types.ts`: `ProjectOptions`, `Variant`, `TemplateConfig`.
- `templates/`: the scaffolding payload copied into generated projects. Not application
  code — see the conventions below.
- `test/`: vitest unit tests (`*.test.ts`).

## Conventions

- ESM only (`"type": "module"`). Local imports use explicit `.js` extensions even for
  `.ts` sources (e.g. `import { readTemplate } from './template.js'`); Node built-ins
  use the `node:` prefix (`node:fs`, `node:path`, `node:url`).
- Code comments and JSDoc are written in Japanese, matching the existing source. Keep
  new comments in Japanese for consistency.
- Prettier config: no semicolons, single quotes, `trailingComma: es5`, `printWidth: 80`,
  `arrowParens: always`, LF line endings. Run `pnpm fix` before committing.
- TypeScript is strict (`strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`). Do not introduce unused symbols.
- The CLI surfaces messages through `@clack/prompts` (`log.error`, `outro`, `cancel`),
  not raw `console.log` / `console.error`.

## templates/ is not linted

`templates/**` is excluded from ESLint (`eslint.config.mjs`), from Prettier
(`lint:prettier` only checks `src`), and from vitest (`vitest.config.ts` excludes it).
Files under `templates/` are copied verbatim into generated projects and are validated
by those projects' own CI, not this repo's lint. Do not "fix" template files to satisfy
this repo's lint rules.

## Testing

- vitest, unit tests in `test/*.test.ts`, matching `patchPackageJson` / `patchTsConfig`
  / `patchDockerWorkflow` / `generateGitignore` / `updateDepcheck` and the validators.
- Keep `generate.ts` / `validate.ts` as pure functions so tests need no I/O.
- End-to-end runs (an actual `pnpm install`) are verified manually / in CI, not in the
  unit suite.

## Release / commits

- Conventional Commits are required; commit descriptions are written in Japanese
  (see the existing git log). The commit type drives the version bump.
- `release.yml` auto-bumps the version, tags, and runs `pnpm publish` on every push to
  `main` / `master` (`feat` → minor, everything else → patch). Do NOT bump the version
  in `package.json` or `pnpm publish` manually.
- Renovate manages dependency updates; do not hand-edit pinned versions to chase updates.

## Documentation updates

- When you add/rename a `src/` module, change a command in `package.json` `scripts`, or
  add a template variant, update this file and (if the behavior changed) `SPEC.md`.
