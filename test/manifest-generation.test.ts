import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({
  execa: vi.fn(() => Promise.resolve({ stdout: 'v26.13.1' })),
}))

vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
}))

import { outro } from '@clack/prompts'

const originalArgv = process.argv
const outputDirs: string[] = []

afterEach(() => {
  process.argv = originalArgv
  for (const dir of outputDirs.splice(0))
    rmSync(dir, { recursive: true, force: true })
  vi.resetModules()
  vi.clearAllMocks()
})

describe('generated package manifests', () => {
  it.each(['base', 'config-batch', 'fastify', 'discord-bot'])(
    'preserves dependencies and scripts from the %s variant manifest',
    async (variant) => {
      const outDir = mkdtempSync(path.join(tmpdir(), 'create-ts-manifest-'))
      outputDirs.push(outDir)
      process.argv = [
        'node',
        'create-ts',
        outDir,
        '--name',
        'example',
        '--org',
        'example',
        '--repo',
        'example',
        '--description',
        'Example',
        '--author',
        'Example',
        '--license',
        'MIT',
        '--homepage',
        'https://example.com',
        '--bug-url',
        'https://example.com/issues',
        '--variant',
        variant,
        '--no-esm',
        '--test',
        '--no-docker',
        '--no-ignore-data',
        '--no-add-reviewer',
      ]

      await import('../src/index.js')
      await vi.waitFor(
        () => {
          expect(outro).toHaveBeenCalled()
        },
        { timeout: 10_000 }
      )

      const source = JSON.parse(
        readFileSync(
          path.join('templates', 'nodejs', variant, 'package.json'),
          'utf8'
        )
      ) as Record<string, unknown>
      const generated = JSON.parse(
        readFileSync(path.join(outDir, 'package.json'), 'utf8')
      ) as Record<string, unknown>
      expect(generated.dependencies).toEqual(source.dependencies)
      expect(generated.devDependencies).toEqual(source.devDependencies)
      expect(generated.scripts).toEqual(source.scripts)
    }
  )
})
