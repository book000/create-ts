import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TemplateConfig } from './types.js'

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
