import type { TemplateConfig } from './types.js'

/** nodejs/ テンプレートのベース URL（feat/nodejs-template ブランチ） */
export const TEMPLATE_BASE_URL =
  'https://raw.githubusercontent.com/book000/templates/feat/nodejs-template'

/** ワークフローファイルのベース URL（master ブランチ） */
export const WORKFLOW_BASE_URL =
  'https://raw.githubusercontent.com/book000/templates/master/workflows'

/**
 * 指定 URL のテキストコンテンツを取得する。
 * 取得失敗時は Error をスローする。
 */
export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    )
  }
  return response.text()
}

/**
 * バリアントの template.json を取得してパースする。
 */
export async function fetchTemplateConfig(
  variant: string
): Promise<TemplateConfig> {
  const url = `${TEMPLATE_BASE_URL}/nodejs/${variant}/template.json`
  const text = await fetchText(url)
  return JSON.parse(text) as TemplateConfig
}
