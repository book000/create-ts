import { describe, expect, it } from 'vitest'
import {
  generateGitignore,
  patchDockerWorkflow,
  patchPackageJson,
  patchTsConfig,
  updateDepcheck,
} from '../src/generate.js'

// ---- テスト用フィクスチャ ----

/** テンプレートの tsconfig.json に相当するベースオブジェクト */
const BASE_TSCONFIG = {
  compilerOptions: {
    target: 'es2020',
    module: 'commonjs',
    moduleResolution: 'bundler',
    lib: ['ESNext'],
    types: ['node'],
  },
  include: ['src/**/*'],
}

/** テンプレートの package.json に相当するベースオブジェクト */
const BASE_PACKAGE_JSON = {
  name: '@book000/template',
  version: '1.0.0',
  description: '',
  license: 'MIT',
  author: 'book000',
  scripts: {
    preinstall: 'npx only-allow pnpm',
    start: 'tsx ./src/main.ts',
    test: 'jest --runInBand --passWithNoTests',
  },
  devDependencies: {
    jest: '*',
    '@types/jest': '*',
    'ts-jest': '*',
  },
  engines: { node: '>=24' },
  repository: { type: 'git', url: 'git+https://github.com/book000/template.git' },
  bugs: { url: 'https://github.com/book000/template/issues' },
  jest: {
    preset: 'ts-jest',
    testEnvironment: 'node',
  },
}

// ---- patchPackageJson ----

describe('patchPackageJson', () => {
  const baseOptions = {
    name: 'my-app',
    org: 'book000',
    repo: 'my-app',
    description: 'My application',
    author: 'book000',
    license: 'MIT',
    homepage: '',
    bugUrl: 'https://github.com/book000/my-app/issues',
    esm: false,
    test: false,
  }

  it('org が大文字でも name が小文字化される', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, org: 'Book000' }, 20)
    expect(result.name).toBe('@book000/my-app')
  })

  it('--esm: type が "module" になる', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, esm: true, test: false },
      20
    )
    expect(result.type).toBe('module')
  })

  it('--esm --test: jest フィールドが ESM 用設定になる', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, esm: true, test: true },
      20
    )
    expect((result.jest as Record<string, unknown>).preset).toBe(
      'ts-jest/presets/default-esm'
    )
    expect(
      (result.jest as Record<string, string[]>).extensionsToTreatAsEsm
    ).toContain('.ts')
  })

  it('--no-test: scripts.test と jest フィールドが削除される', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, test: false }, 20)
    expect((result.scripts as Record<string, string>).test).toBeUndefined()
    expect(result.jest).toBeUndefined()
  })

  it('--no-test --esm: jest フィールドが追加されない', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, esm: true, test: false },
      20
    )
    expect(result.jest).toBeUndefined()
  })

  it('homepage が空文字: homepage フィールドが追加されない', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, homepage: '' }, 20)
    expect(result.homepage).toBeUndefined()
  })

  it('homepage が指定済み: homepage フィールドが追加される', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, homepage: 'https://example.com' },
      20
    )
    expect(result.homepage).toBe('https://example.com')
  })
})

// ---- patchTsConfig ----

describe('patchTsConfig', () => {
  it('CJS（デフォルト）: module が "commonjs" のまま', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: false, test: false })
    const options = (result as typeof BASE_TSCONFIG).compilerOptions
    expect(options.module).toBe('commonjs')
    expect(options.moduleResolution).toBe('bundler')
  })

  it('ESM: module が "es2015" になり moduleResolution は "bundler" のまま', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: true, test: false })
    const options = (result as typeof BASE_TSCONFIG).compilerOptions
    expect(options.module).toBe('es2015')
    expect(options.moduleResolution).toBe('bundler')
  })

  it('--test: types に "jest" が追加される', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: false, test: true })
    const types = (result as typeof BASE_TSCONFIG).compilerOptions.types
    expect(types).toContain('node')
    expect(types).toContain('jest')
  })

  it('--no-test: types が ["node"] のまま', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: false, test: false })
    const types = (result as typeof BASE_TSCONFIG).compilerOptions.types
    expect(types).toEqual(['node'])
  })
})

// ---- patchDockerWorkflow ----

describe('patchDockerWorkflow', () => {
  const DOCKER_YML = `
  targets: >-
    [
      { imageName: "tomacheese/twitter-dm-memo", context: ".", file: "Dockerfile", packageName: "twitter-dm-memo" }
    ]
`.trim()

  it('imageName が正しく置換される', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'book000', 'my-app')
    expect(result).toContain('book000/my-app')
    expect(result).not.toContain('tomacheese/twitter-dm-memo')
  })

  it('org が大文字でも GHCR パスが小文字化される', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'Book000', 'my-app')
    expect(result).toContain('book000/my-app')
    expect(result).not.toContain('Book000')
  })

  it('packageName が正しく置換される', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'book000', 'my-app')
    expect(result).toContain('packageName: "my-app"')
    expect(result).not.toContain('packageName: "twitter-dm-memo"')
  })
})

// ---- generateGitignore ----

describe('generateGitignore', () => {
  it('基本: pnpm セクションが含まれる', () => {
    const result = generateGitignore(false)
    expect(result).toContain('node_modules/')
    expect(result).toContain('# pnpm')
    expect(result).toContain('pnpm-debug.log*')
    expect(result).not.toContain('data/')
  })

  it('--ignore-data: さらに data/ セクションが追記される', () => {
    const result = generateGitignore(true)
    expect(result).toContain('# pnpm')
    expect(result).toContain('# データディレクトリ')
    expect(result).toContain('data/')
  })
})

// ---- updateDepcheck ----

describe('updateDepcheck', () => {
  const BASE_DEPCHECK = {
    ignores: ['@types/node', 'run-z'],
  }

  it('depcheckIgnore のパッケージが ignores に追加される', () => {
    const result = updateDepcheck(
      BASE_DEPCHECK,
      ['typescript-json-schema'],
      false
    )
    expect((result as typeof BASE_DEPCHECK).ignores).toContain(
      'typescript-json-schema'
    )
  })

  it('--test: @types/jest が ignores に追加される', () => {
    const result = updateDepcheck(BASE_DEPCHECK, [], true)
    expect((result as typeof BASE_DEPCHECK).ignores).toContain('@types/jest')
  })

  it('同一パッケージを 2 回渡しても重複しない', () => {
    const result = updateDepcheck(
      BASE_DEPCHECK,
      ['typescript-json-schema', 'typescript-json-schema'],
      false
    )
    const ignores = (result as typeof BASE_DEPCHECK).ignores
    const count = ignores.filter((index) => index === 'typescript-json-schema').length
    expect(count).toBe(1)
  })
})
