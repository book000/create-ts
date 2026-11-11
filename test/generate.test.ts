import { describe, expect, it } from 'vitest'
import {
  generateGitignore,
  patchDockerWorkflow,
  patchPackageJson,
  patchTsConfig,
  updateDepcheck,
} from '../src/generate.js'

// ---- Test fixtures ----

/** Base object equivalent to the template tsconfig.json. */
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

/** Base object equivalent to the template package.json. */
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

  it('lowercases the org in name even if it is uppercase', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, org: 'Book000' }, 20)
    expect(result.name).toBe('@book000/my-app')
  })

  it('--esm: type becomes "module"', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, esm: true, test: false },
      20
    )
    expect(result.type).toBe('module')
  })

  it('--esm --test: the jest field gets the ESM config', () => {
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

  it('--no-test: scripts.test and the jest field are removed', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, test: false }, 20)
    expect((result.scripts as Record<string, string>).test).toBeUndefined()
    expect(result.jest).toBeUndefined()
  })

  it('--no-test --esm: the jest field is not added', () => {
    const result = patchPackageJson(
      BASE_PACKAGE_JSON,
      { ...baseOptions, esm: true, test: false },
      20
    )
    expect(result.jest).toBeUndefined()
  })

  it('empty homepage: the homepage field is not added', () => {
    const result = patchPackageJson(BASE_PACKAGE_JSON, { ...baseOptions, homepage: '' }, 20)
    expect(result.homepage).toBeUndefined()
  })

  it('homepage given: the homepage field is added', () => {
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
  it('CJS (default): module stays "commonjs"', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: false, test: false })
    const opts = (result as typeof BASE_TSCONFIG).compilerOptions
    expect(opts.module).toBe('commonjs')
    expect(opts.moduleResolution).toBe('bundler')
  })

  it('ESM: module becomes "es2015" and moduleResolution stays "bundler"', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: true, test: false })
    const opts = (result as typeof BASE_TSCONFIG).compilerOptions
    expect(opts.module).toBe('es2015')
    expect(opts.moduleResolution).toBe('bundler')
  })

  it('--test: "jest" is added to types', () => {
    const result = patchTsConfig(BASE_TSCONFIG, { esm: false, test: true })
    const types = (result as typeof BASE_TSCONFIG).compilerOptions.types
    expect(types).toContain('node')
    expect(types).toContain('jest')
  })

  it('--no-test: types stays ["node"]', () => {
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

  it('replaces imageName', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'book000', 'my-app')
    expect(result).toContain('book000/my-app')
    expect(result).not.toContain('tomacheese/twitter-dm-memo')
  })

  it('lowercases the GHCR path even if org is uppercase', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'Book000', 'my-app')
    expect(result).toContain('book000/my-app')
    expect(result).not.toContain('Book000')
  })

  it('replaces packageName', () => {
    const result = patchDockerWorkflow(DOCKER_YML, 'book000', 'my-app')
    expect(result).toContain('packageName: "my-app"')
    expect(result).not.toContain('packageName: "twitter-dm-memo"')
  })
})

// ---- generateGitignore ----

describe('generateGitignore', () => {
  it('basic: includes the pnpm section', () => {
    const result = generateGitignore(false)
    expect(result).toContain('node_modules/')
    expect(result).toContain('# pnpm')
    expect(result).toContain('pnpm-debug.log*')
    expect(result).not.toContain('data/')
  })

  it('--ignore-data: additionally appends the data/ section', () => {
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

  it('adds the depcheckIgnore packages to ignores', () => {
    const result = updateDepcheck(
      BASE_DEPCHECK,
      ['typescript-json-schema'],
      false
    )
    expect((result as typeof BASE_DEPCHECK).ignores).toContain(
      'typescript-json-schema'
    )
  })

  it('--test: adds @types/jest to ignores', () => {
    const result = updateDepcheck(BASE_DEPCHECK, [], true)
    expect((result as typeof BASE_DEPCHECK).ignores).toContain('@types/jest')
  })

  it('does not duplicate a package passed twice', () => {
    const result = updateDepcheck(
      BASE_DEPCHECK,
      ['typescript-json-schema', 'typescript-json-schema'],
      false
    )
    const ignores = (result as typeof BASE_DEPCHECK).ignores
    const count = ignores.filter((i) => i === 'typescript-json-schema').length
    expect(count).toBe(1)
  })
})
