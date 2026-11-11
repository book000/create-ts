/** Supported project variants. */
export type Variant = 'base' | 'config-batch' | 'fastify' | 'discord-bot'

/** All options for a project setup. */
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

/** Schema of a variant's template.json. */
export interface TemplateConfig {
  configSchema: boolean
  dependencies?: string[]
  devDependencies?: string[]
  scripts?: Record<string, string>
  depcheckIgnore?: string[]
  /** Files always copied (paths relative to the variant directory). */
  src: string[]
  /** Files copied only with --test. */
  testSrc?: string[]
}
