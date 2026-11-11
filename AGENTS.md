# AGENTS.md

Guidance for AI coding agents and contributors. `CLAUDE.md` imports this file, and `.github/copilot-instructions.md` adds the review checklist.

## Language

- All deliverables are written in **English**: commit messages, PR/Issue titles and bodies, review comments, code comments and docstrings, test descriptions, and documentation (`README.md`, `AGENTS.md`, etc.).
- Exceptions (keep as is): the Japanese user-facing strings of the CLI (prompts, help text, log and error messages in `src/`), the Japanese text embedded in generated output (the `# データディレクトリ` heading in `.gitignore`, the approval-request PR comment in `templates/workflows/docker.yml`, and the `feat: 初期コミット` hint in the completion message), quotations, technical identifiers, generated files, and external source text.
- New runtime messages (logs, errors) that are not part of the existing Japanese CLI flow are English.
- Do not rewrite Git history to change the language of past commits.

## Overview

`@book000/create-ts` is a CLI that scaffolds book000-style TypeScript / Node.js projects. Users run `pnpm create @book000/ts [outdir] [options]`. It copies the bundled `templates/nodejs/<variant>` files into the target directory, patches `package.json` / `tsconfig.json`, then runs `pnpm install`. It is interactive (`@clack/prompts`) and also supports unattended runs when every option is passed as a flag. See `README.md` for usage and options.

## Commands

```bash
pnpm install   # install dependencies (npm / yarn are rejected by the preinstall hook)
pnpm build     # bundle src/index.ts to dist/index.mjs with tsdown
pnpm dev       # tsdown in watch mode
pnpm lint      # prettier --check src, eslint, and tsc, in parallel via run-z
pnpm fix       # prettier --write src, then eslint --fix
pnpm test      # vitest run
```

Run `pnpm lint` and `pnpm test` before committing. Node.js is pinned in `.node-version` and pnpm in `package.json`. CI (`nodejs-ci-pnpm.yml`) uses the reusable workflow from `book000/templates`.

## Structure

- `src/index.ts`: CLI entry point. Wires commander flags, checks prerequisites, runs the generation steps, and does all file writing. The first line `#!/usr/bin/env node` must stay (tsdown uses it to keep the shebang and set the executable bit).
- `src/prompts.ts`: interactive flow (`collectOptions`, `confirmOverwrite`, `displaySummary`) and validation of flag values. Prompts are skipped for options already given as flags.
- `src/template.ts`: reads bundled templates from disk (`readTemplate`, `fetchTemplateConfig`). Templates ship in the package (`files: ["dist", "templates"]`).
- `src/generate.ts`: patch / transform helpers (`patchPackageJson`, `patchTsConfig`, `patchDockerWorkflow`, `generateGitignore`, `updateDepcheck`). `generateGitignore` reads a template; the others are pure. Keep them free of other side effects so they stay unit-testable.
- `src/validate.ts`: validators for project, organization, repository names and the license identifier.
- `src/types.ts`: `ProjectOptions`, `Variant`, `TemplateConfig`.
- `templates/`: the payload copied into generated projects: `nodejs/common` (shared files), `nodejs/<variant>` (`template.json`, `package.json`, `pnpm-lock.yaml`, sources, tests), `workflows/`, `gitignore/`. Adding a variant means adding its directory with a `template.json` and extending `Variant` (`src/types.ts`), `VALID_VARIANTS` and the prompt options (`src/prompts.ts`).
- `test/`: vitest unit tests for `generate.ts` and `validate.ts`.
- `typings/`: stub declarations for tsdown's optional peer dependencies.
- `.github/workflows/template-docker-build.yml`: generates a `base` project with `--docker` and builds its image.
- `.github/workflows/release.yml`: on every push to `main` / `master`, bumps the version from commit types (the bump rules are the `custom_release_rules` in that workflow), tags, builds, lints and runs `pnpm publish`. Do not bump the version in `package.json` or publish manually.

## templates/ is not linted

`templates/**` is excluded from ESLint (`eslint.config.mjs`), Prettier (`lint:prettier` only checks `src`) and vitest (`vitest.config.ts`). Files there are copied into generated projects and are validated by those projects' own CI. Do not "fix" them to satisfy this repository's lint rules. Each variant's `pnpm-lock.yaml` must match its `package.json`, because the generator runs `pnpm install --frozen-lockfile`.

## Conventions

- ESM only (`"type": "module"`). Local imports use explicit `.js` extensions even for `.ts` sources (`import { readTemplate } from './template.js'`), and Node built-ins use the `node:` prefix.
- Prettier: no semicolons, single quotes, `trailingComma: es5`, `printWidth: 80`, `arrowParens: always`, LF. Run `pnpm fix` before committing. Prettier only covers `src`.
- TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`). Do not introduce unused symbols.
- Output goes through `@clack/prompts` (`log.error`, `log.warn`, `outro`, `cancel`), not raw `console.log` / `console.error`.
- Add or update a test in `test/` for every behavior change in `generate.ts` / `validate.ts`. The end-to-end flow (a real `pnpm install`) is covered only by the Docker workflow above and by running the built CLI by hand: `node dist/index.mjs <dir> ...`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (the type drives the release version bump), and branches follow [Conventional Branch](https://conventional-branch.github.io) short form (`feat/...`, `fix/...`).
- Do not commit to Renovate PRs or hand-edit pinned versions to chase updates. Never commit secrets.
- When you add a `src/` module, change a `package.json` script, or add a variant, update this file and `README.md`.
