import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TemplateConfig } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** バンドルされたテンプレートのルートディレクトリ */
const TEMPLATES_DIR = path.join(__dirname, '../templates')

/**
 * バンドルされたテンプレートファイルを文字列として読み込む。
 * @param relativePath - テンプレートルートからの相対パス
 */
export function readTemplate(relativePath: string): string {
  const filePath = path.join(TEMPLATES_DIR, relativePath)
  return readFileSync(filePath, 'utf8')
}

/**
 * バリアントの template.json を読み込んでパースする。
 * @param variant - バリアント名
 */
export function fetchTemplateConfig(variant: string): TemplateConfig {
  const content = readTemplate(`nodejs/${variant}/template.json`)
  return JSON.parse(content) as TemplateConfig
}
