# Copilot code review instructions

Follow `AGENTS.md` at the repository root for the project overview, structure and conventions. Review against the checklist below.

## Language

Deliverables (code comments, JSDoc, test descriptions, docs, commit messages, PR text) are English. The existing Japanese CLI strings are intentional; do not flag them. See the Language section of `AGENTS.md`.

## Scope

- `src/**` is the primary review target.
- `templates/**` is payload copied verbatim into generated projects and is intentionally excluded from this repository's ESLint, Prettier and vitest. Do not flag it for violating this repository's lint or style rules.

## Checklist

- Local imports use explicit `.js` extensions; Node built-ins use the `node:` prefix.
- `generate.ts` / `validate.ts` stay free of side effects other than the template read in `generateGitignore`; I/O belongs in `index.ts`.
- User-facing output goes through `@clack/prompts`, not raw `console.*`.
- `src/index.ts` keeps its `#!/usr/bin/env node` first line.
- No unused symbols or unhandled switch / return paths (strict TypeScript).
- Behavior changes in `generate.ts` / `validate.ts` come with `test/*.test.ts` changes.
- No manual version bumps in `package.json` or manual `pnpm publish`; no hand-edited Renovate-pinned versions.
- Do not comment on formatting that Prettier and ESLint already enforce.
