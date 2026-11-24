import { lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectOptions, TemplateConfig } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Root directory of the bundled templates. */
const TEMPLATES_DIR = path.join(__dirname, '../templates')

/**
 * Reads a bundled template file as a string.
 * @param relativePath - Path relative to the templates root
 */
export function readTemplate(relativePath: string): string {
  const filePath = path.join(TEMPLATES_DIR, relativePath)
  return readFileSync(filePath, 'utf8')
}

/**
 * Reads and parses a variant's template.json.
 * @param variant - Variant name
 */
export function fetchTemplateConfig(variant: string): TemplateConfig {
  const content = readTemplate(`nodejs/${variant}/template.json`)
  return JSON.parse(content) as TemplateConfig
}

export function destinationManifest(
  options: ProjectOptions,
  config: TemplateConfig
): { commonFiles: string[]; filesToCopy: string[]; destinations: string[] } {
  const commonFiles = [
    'tsconfig.json',
    '.prettierrc.yml',
    'eslint.config.mjs',
    'renovate.json',
    '.depcheckrc.json',
    '.fixpackrc',
    'pnpm-workspace.yaml',
    '.devcontainer/devcontainer.json',
    ...(options.docker ? ['Dockerfile', 'entrypoint.sh'] : []),
  ]
  const filesToCopy = [
    ...config.src,
    ...(options.test ? (config.testSrc ?? []) : []),
  ]
  return {
    commonFiles,
    filesToCopy,
    destinations: [
      ...commonFiles,
      ...filesToCopy,
      '.gitignore',
      '.node-version',
      'LICENSE',
      'package.json',
      'pnpm-lock.yaml',
      'node_modules',
      '.github/workflows/nodejs-ci-pnpm.yml',
      ...(options.docker ? ['.github/workflows/docker.yml'] : []),
      ...(options.addReviewer ? ['.github/workflows/add-reviewer.yml'] : []),
    ],
  }
}

export function findCollisions(
  outDir: string,
  destinations: string[]
): string[] {
  const collisions = new Set<string>()
  for (const destination of destinations) {
    const parts = destination.split('/')
    for (let i = 1; i <= parts.length; i++) {
      const relative = parts.slice(0, i).join('/')
      try {
        const stat = lstatSync(path.join(outDir, relative))
        if (i === parts.length || !stat.isDirectory()) {
          collisions.add(relative)
        }
        if (!stat.isDirectory() && !stat.isSymbolicLink()) break
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') break
        throw error
      }
    }
  }
  return [...collisions].toSorted((a, b) => a.localeCompare(b))
}
