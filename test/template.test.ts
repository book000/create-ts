import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { destinationManifest, fetchTemplateConfig, findCollisions } from '../src/template.js'
import type { ProjectOptions, Variant } from '../src/types.js'

const options = { test: false, docker: false, addReviewer: false } as ProjectOptions
const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('destination manifest', () => {
  it.each<Variant>(['base', 'config-batch', 'fastify', 'discord-bot'])(
    'includes selected template files for %s',
    (variant) => {
      const config = fetchTemplateConfig(variant)
      const basic = destinationManifest(options, config).destinations
      expect(basic).toEqual(expect.arrayContaining([...config.src, '.gitignore', '.node-version', 'LICENSE', 'package.json', 'pnpm-lock.yaml', '.github/workflows/nodejs-ci-pnpm.yml']))
      expect(basic).not.toContain('.github/workflows/docker.yml')
      expect(basic).not.toContain('.github/workflows/add-reviewer.yml')
      const testFiles = config.testSrc ?? []
      for (const file of testFiles) expect(basic).not.toContain(file)
      const all = destinationManifest({ ...options, test: true, docker: true, addReviewer: true }, config).destinations
      expect(all).toEqual(expect.arrayContaining([...(config.testSrc ?? []), 'Dockerfile', 'entrypoint.sh', '.github/workflows/docker.yml', '.github/workflows/add-reviewer.yml']))
    }
  )

  it('finds existing destinations and symlinks without treating unrelated files as collisions', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'create-ts-'))
    dirs.push(dir)
    mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true })
    writeFileSync(path.join(dir, '.gitignore'), 'keep')
    writeFileSync(path.join(dir, '.github', 'workflows', 'nodejs-ci-pnpm.yml'), 'keep')
    writeFileSync(path.join(dir, 'unrelated'), 'keep')
    symlinkSync('missing', path.join(dir, 'LICENSE'))
    expect(findCollisions(dir, ['.gitignore', 'LICENSE', '.github/workflows/nodejs-ci-pnpm.yml', 'src/main.ts'])).toEqual(['.github/workflows/nodejs-ci-pnpm.yml', '.gitignore', 'LICENSE'])
  })

  it('detects blocking and symlinked parent paths', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'create-ts-'))
    dirs.push(dir)
    writeFileSync(path.join(dir, 'src'), 'keep')
    symlinkSync('missing', path.join(dir, '.github'))
    expect(findCollisions(dir, ['src/main.ts', '.github/workflows/ci.yml'])).toEqual(['.github', 'src'])
  })
})
