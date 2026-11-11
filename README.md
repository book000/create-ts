# create-ts

A CLI that scaffolds book000-style TypeScript / Node.js projects. It copies the bundled template for the chosen variant into a directory, fills in the project metadata, and runs `pnpm install`.

## Requirements

- Node.js v20 or later (the CLI exits with an error otherwise)
- pnpm (generated projects reject other package managers with `only-allow`)
- Network access: dependencies are installed with `pnpm install`, the `LICENSE` text is fetched from the GitHub licenses API (skipped with a warning on failure), and `fixpack` / `fixdevcontainer` are run through `npx` (skipped on failure)

## Usage

```bash
pnpm create @book000/ts [outdir] [options]
```

`outdir` defaults to the current directory and is created if it does not exist. Any value not given as an option is asked interactively. The directory name is offered as the default project name when it is a valid package name.

To run without prompts, pass every option:

```bash
pnpm create @book000/ts my-app \
  --name my-app --org book000 --repo my-app \
  --description "My app" --author book000 --license MIT --homepage "" \
  --bug-url https://github.com/book000/my-app/issues \
  --variant base --no-esm --no-test --no-docker \
  --no-ignore-data --no-add-reviewer --overwrite
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `--name <name>` | Project name (npm package name rule: lowercase, up to 214 characters) | Asked |
| `--org <org>` | GitHub organization / user name. The package is named `@<org lowercased>/<name>` | Asked (`book000`) |
| `--repo <repo>` | Repository name | Asked |
| `--description <desc>` | Project description | Asked |
| `--author <author>` | Author name | Asked |
| `--license <spdx>` | SPDX license identifier (for example `MIT`, `Apache-2.0`) | Asked (`MIT`) |
| `--homepage <url>` | Homepage URL. An empty string omits the field | Asked |
| `--bug-url <url>` | Bug report URL | Asked |
| `--variant <variant>` | `base`, `config-batch`, `fastify` or `discord-bot` | Asked (`base`) |
| `--esm` / `--no-esm` | ES Modules / CommonJS | Asked (CommonJS) |
| `--test` / `--no-test` | Add / do not add Jest tests | Asked (no) |
| `--docker` / `--no-docker` | Add / do not add `Dockerfile`, `entrypoint.sh` and the Docker workflow | Asked (no) |
| `--ignore-data` / `--no-ignore-data` | Add / do not add `data/` to `.gitignore` | Asked (no) |
| `--add-reviewer` / `--no-add-reviewer` | Add / do not add the add-reviewer workflow | Asked (no) |
| `--overwrite` | Overwrite existing files without asking. Without it, you are asked when `package.json`, `tsconfig.json` or `src` already exists | Off |

Invalid values for `--name`, `--org`, `--repo`, `--license` or `--variant` make the CLI exit with an error. The prompts and most CLI messages are in Japanese.

### Variants

| Variant | Contents |
| --- | --- |
| `base` | Minimal setup: `src/main.ts` |
| `config-batch` | Batch job with a JSON config (`ConfigFramework` from `@book000/node-utils`) and a `generate-schema` script |
| `fastify` | Fastify HTTP server with `@fastify/cors` |
| `discord-bot` | discord.js bot with a config and a `generate-schema` script |

### Generated project

Every project gets `tsconfig.json`, `.prettierrc.yml`, `eslint.config.mjs`, `renovate.json`, `.depcheckrc.json`, `.fixpackrc`, `pnpm-workspace.yaml`, `.devcontainer/devcontainer.json`, `.gitignore`, `.node-version` (the Node.js version used to run the CLI), `LICENSE` (when it can be fetched), `package.json`, `pnpm-lock.yaml`, `.github/workflows/nodejs-ci-pnpm.yml` and the variant's `src/` files. With `--test`, the variant's test files and `tsconfig.test.json` are added. Without it, Jest packages are removed after install.

Inside the generated project, `pnpm run lint`, `pnpm run test` (with `--test`), `pnpm start` and `pnpm run dev` are available.

## Development

```bash
pnpm install
pnpm build   # bundle src/index.ts to dist/index.mjs with tsdown
pnpm lint    # prettier --check src, eslint, tsc
pnpm test    # vitest
node dist/index.mjs --help
```

The Node.js version is pinned in `.node-version` and pnpm in `package.json`. See [AGENTS.md](AGENTS.md) for the code structure and conventions.

## Release

Every push to `main` or `master` runs `.github/workflows/release.yml`, which bumps the version from the Conventional Commit types, tags it, and publishes `@book000/create-ts` to npm. Do not bump the version or publish manually.

## License

MIT
