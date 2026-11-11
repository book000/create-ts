import type { ProjectOptions } from './types.js'
import { readTemplate } from './template.js'

/**
 * Applies project-specific values to a variant's package.json and returns a new object.
 * Sets name (`@<org lowercased>/<name>`), description, license, author, engines.node (`>=<nodeMajor>`), repository and bugs URLs, and homepage if non-empty.
 * With `esm`, sets `type: "module"` (plus the ts-jest ESM config when `test` is also set).
 * Without `test`, removes the `test` script and the `jest` field.
 */
export function patchPackageJson(
  packageJson: Record<string, unknown>,
  options: Pick<
    ProjectOptions,
    | 'name'
    | 'org'
    | 'repo'
    | 'description'
    | 'author'
    | 'license'
    | 'homepage'
    | 'bugUrl'
    | 'esm'
    | 'test'
  >,
  nodeMajor: number
): Record<string, unknown> {
  const {
    name,
    org,
    repo,
    description,
    author,
    license,
    homepage,
    bugUrl,
    esm,
    test,
  } = options
  const result = structuredClone(packageJson)

  result.name = `@${org.toLowerCase()}/${name}`
  result.description = description
  result.license = license
  result.author = author
  ;(result.engines as Record<string, string>).node = `>=${nodeMajor}`
  ;(result.repository as Record<string, string>).url =
    `git+https://github.com/${org}/${repo}.git`
  ;(result.bugs as Record<string, string>).url = bugUrl

  if (homepage) {
    result.homepage = homepage
  }

  if (esm) {
    result.type = 'module'
    if (test) {
      result.jest = {
        preset: 'ts-jest/presets/default-esm',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
          '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
        },
      }
    }
  }

  if (!test) {
    delete (result.scripts as Record<string, string>).test
    delete result.jest
  }

  return result
}

/**
 * Patches tsconfig.json and returns a new object.
 * With `esm`, sets `compilerOptions.module` to `es2015`; with `test`, adds `jest` to `compilerOptions.types`.
 */
export function patchTsConfig(
  tsconfig: Record<string, unknown>,
  options: Pick<ProjectOptions, 'esm' | 'test'>
): Record<string, unknown> {
  const result = structuredClone(tsconfig)
  const compilerOptions = result.compilerOptions as {
    module?: string
    types?: string[]
  }

  if (options.esm) {
    compilerOptions.module = 'es2015'
  }

  if (options.test) {
    compilerOptions.types ??= ['node']
    if (!compilerOptions.types.includes('jest')) {
      compilerOptions.types.push('jest')
    }
  }

  return result
}

/**
 * Replaces the placeholders of the bundled docker.yml template.
 * The image name `tomacheese/twitter-dm-memo` becomes `<org>/<repo>` lowercased, and `packageName` becomes `repo` as given.
 */
export function patchDockerWorkflow(
  content: string,
  org: string,
  repo: string
): string {
  let result = content
  result = result.replaceAll(
    'tomacheese/twitter-dm-memo',
    () => `${org.toLowerCase()}/${repo.toLowerCase()}`
  )
  result = result.replaceAll(
    'packageName: "twitter-dm-memo"',
    () => `packageName: "${repo}"`
  )
  return result
}

/**
 * Generates .gitignore from the bundled Node.gitignore (which includes a pnpm section), optionally appending a `data/` section.
 */
export function generateGitignore(ignoreData: boolean): string {
  let result = readTemplate('gitignore/Node.gitignore')

  if (ignoreData) {
    result += '\n\n# データディレクトリ\ndata/'
  }

  return result
}

/**
 * Updates the `ignores` array of .depcheckrc.json without duplicates.
 * Adds the variant's depcheckIgnore entries, plus `@types/jest` when `test` is set.
 */
export function updateDepcheck(
  depcheckJson: Record<string, unknown>,
  depcheckIgnore: string[],
  test: boolean
): Record<string, unknown> {
  const result = structuredClone(depcheckJson)
  const ignores: string[] = (result.ignores as string[] | undefined) ?? []
  result.ignores = ignores

  for (const pkg of depcheckIgnore) {
    if (!ignores.includes(pkg)) {
      ignores.push(pkg)
    }
  }

  if (test && !ignores.includes('@types/jest')) {
    ignores.push('@types/jest')
  }

  return result
}
