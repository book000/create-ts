/** サポートされているプロジェクトバリアント */
export type Variant = 'base' | 'config-batch' | 'fastify' | 'discord-bot'

/** プロジェクトセットアップの全オプション */
export interface ProjectOptions {
  name: string
  org: string
  repo: string
  description: string
  author: string
  license: string
  homepage: string
  bugUrl: string
  variant: Variant
  esm: boolean
  test: boolean
  docker: boolean
  ignoreData: boolean
  addReviewer: boolean
  overwrite: boolean
  outDir: string
}

/** バリアントの template.json スキーマ */
export interface TemplateConfig {
  configSchema: boolean
  dependencies?: string[]
  devDependencies?: string[]
  scripts?: Record<string, string>
  depcheckIgnore?: string[]
  /** 常にコピーする src ファイルのリスト */
  src: string[]
  /** --test 有効時のみコピーするテストファイルのリスト */
  testSrc?: string[]
}
