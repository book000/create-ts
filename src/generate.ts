import type { ProjectOptions } from './types.js'
import { readTemplate } from './template.js'

/**
 * バリアントの package.json にプロジェクト固有の値を適用する。
 * テンプレートのプレースホルダーを実際の値で上書きする。
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
 * tsconfig.json にモジュール形式・テスト設定のパッチを適用する。
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
 * docker.yml のプレースホルダーをプロジェクト固有の値に置換する。
 */
export function patchDockerWorkflow(
  content: string,
  org: string,
  repo: string
): string {
  let result = content
  result = result.replaceAll(
    'tomacheese/twitter-dm-memo',
    `${org.toLowerCase()}/${repo.toLowerCase()}`
  )
  result = result.replaceAll(
    'packageName: "twitter-dm-memo"',
    `packageName: "${repo}"`
  )
  return result
}

/**
 * .gitignore を生成する。
 * バンドルされた Node.gitignore（pnpm セクション付き）をベースに、
 * 任意で data/ セクションを追記する。
 */
export function generateGitignore(ignoreData: boolean): string {
  let result = readTemplate('gitignore/Node.gitignore')

  if (ignoreData) {
    result += '\n\n# データディレクトリ\ndata/'
  }

  return result
}

/**
 * .depcheckrc.json の ignores 配列を更新する。
 * テンプレートの depcheckIgnore と Jest 関連パッケージを追加する（重複除去）。
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
