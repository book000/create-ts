import {
  cancel,
  confirm,
  group,
  isCancel,
  log,
  note,
  select,
  text,
} from '@clack/prompts'
import path from 'node:path'
import type { ProjectOptions, Variant } from './types.js'
import {
  validateLicense,
  validateOrgName,
  validateProjectName,
  validateRepoName,
} from './validate.js'

/** 有効なバリアント値の一覧 */
const VALID_VARIANTS = ['base', 'config-batch', 'fastify', 'discord-bot']

/**
 * CLI フラグで渡された値をバリデーションし、不正な場合はプロセスを終了する。
 */
function validateCliFlags(flags: CliFlags): void {
  if (flags.name !== undefined) {
    const err = validateProjectName(flags.name)
    if (err) {
      log.error(`Invalid --name: ${err}`)
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }
  }

  if (flags.org !== undefined) {
    const err = validateOrgName(flags.org)
    if (err) {
      log.error(`Invalid --org: ${err}`)
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }
  }

  if (flags.repo !== undefined) {
    const err = validateRepoName(flags.repo)
    if (err) {
      log.error(`Invalid --repo: ${err}`)
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }
  }

  if (flags.license !== undefined) {
    const err = validateLicense(flags.license)
    if (err) {
      log.error(`Invalid --license: ${err}`)
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }
  }

  if (flags.variant !== undefined && !VALID_VARIANTS.includes(flags.variant)) {
    log.error(
      `Invalid --variant: "${flags.variant}". Must be one of: ${VALID_VARIANTS.join(', ')}`
    )
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }
}

/** CLI フラグから渡される部分的なオプション */
export interface CliFlags {
  name?: string
  org?: string
  repo?: string
  description?: string
  author?: string
  license?: string
  homepage?: string
  bugUrl?: string
  variant?: string
  esm?: boolean
  test?: boolean
  docker?: boolean
  ignoreData?: boolean
  addReviewer?: boolean
  overwrite?: boolean
}

/**
 * 対話プロンプトで ProjectOptions を収集する。
 * CLI フラグで指定済みの項目はスキップする。
 */
export async function collectOptions(
  outDir: string,
  flags: CliFlags
): Promise<ProjectOptions> {
  // CLI フラグの値を事前検証する（不正な場合はプロセスを終了）
  validateCliFlags(flags)

  const resolvedDir = path.resolve(outDir)
  const dirBasename = path.basename(resolvedDir)
  const nameDefault =
    dirBasename !== '.' && /^[a-z0-9][a-z0-9\-_.]*$/.test(dirBasename)
      ? dirBasename
      : undefined

  const answers = await group(
    {
      // グループ 1: プロジェクト情報
      name: () =>
        flags.name === undefined
          ? text({
              message: 'プロジェクト名',
              placeholder: 'my-app',
              initialValue: nameDefault,
              validate: validateProjectName,
            })
          : Promise.resolve(flags.name),

      org: () =>
        flags.org === undefined
          ? text({
              message: 'GitHub 組織 / ユーザー名',
              initialValue: 'book000',
              validate: validateOrgName,
            })
          : Promise.resolve(flags.org),

      repo: ({ results }) =>
        flags.repo === undefined
          ? text({
              message: 'リポジトリ名',
              initialValue: results.name ?? nameDefault ?? 'my-app',
              validate: validateRepoName,
            })
          : Promise.resolve(flags.repo),

      description: () =>
        flags.description === undefined
          ? text({ message: 'プロジェクトの説明', placeholder: '' })
          : Promise.resolve(flags.description),

      author: ({ results }) =>
        flags.author === undefined
          ? text({
              message: '作者名',
              initialValue: results.org ?? 'book000',
            })
          : Promise.resolve(flags.author),

      license: () =>
        flags.license === undefined
          ? text({
              message: 'ライセンス (SPDX 識別子)',
              initialValue: 'MIT',
              validate: validateLicense,
            })
          : Promise.resolve(flags.license),

      homepage: () =>
        flags.homepage === undefined
          ? text({
              message: 'ホームページ URL（空白でスキップ）',
              placeholder: '',
            })
          : Promise.resolve(flags.homepage),

      bugUrl: ({ results }) =>
        flags.bugUrl === undefined
          ? text({
              message: 'バグ報告 URL',
              initialValue: `https://github.com/${results.org ?? 'book000'}/${(results.repo as string | undefined) ?? 'my-app'}/issues`,
            })
          : Promise.resolve(flags.bugUrl),

      // グループ 2: テンプレート選択
      variant: () =>
        flags.variant === undefined
          ? select({
              message: 'バリアント',
              options: [
                {
                  value: 'base',
                  label: 'base',
                  hint: '最小構成（TypeScript + lint）',
                },
                {
                  value: 'config-batch',
                  label: 'config-batch',
                  hint: '設定ファイルありのバッチ処理',
                },
                {
                  value: 'fastify',
                  label: 'fastify',
                  hint: 'Fastify HTTP サーバー',
                },
                {
                  value: 'discord-bot',
                  label: 'discord-bot',
                  hint: 'Discord Bot',
                },
              ],
              initialValue: 'base',
            })
          : Promise.resolve(flags.variant),

      esm: () =>
        flags.esm === undefined
          ? select({
              message: 'モジュール形式',
              options: [
                {
                  value: 'cjs',
                  label: 'CommonJS',
                  hint: '既定・現行の標準（--no-esm）',
                },
                { value: 'esm', label: 'ESM', hint: 'ES Modules（--esm）' },
              ],
              initialValue: 'cjs',
            })
          : Promise.resolve(flags.esm ? 'esm' : 'cjs'),

      // グループ 3: オプション
      test: () =>
        flags.test === undefined
          ? confirm({
              message: 'Jest テストを追加しますか？',
              initialValue: false,
            })
          : Promise.resolve(flags.test),

      docker: () =>
        flags.docker === undefined
          ? confirm({
              message: 'Dockerfile を追加しますか？',
              initialValue: false,
            })
          : Promise.resolve(flags.docker),

      ignoreData: () =>
        flags.ignoreData === undefined
          ? confirm({
              message: '`data/` を .gitignore に追加しますか？',
              initialValue: false,
            })
          : Promise.resolve(flags.ignoreData),

      addReviewer: () =>
        flags.addReviewer === undefined
          ? confirm({
              message: 'add-reviewer ワークフローを追加しますか？',
              initialValue: false,
            })
          : Promise.resolve(flags.addReviewer),
    },
    {
      onCancel: () => {
        cancel('キャンセルしました')
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
      },
    }
  )

  return {
    name: answers.name,
    org: answers.org,
    repo: answers.repo as string,
    description: answers.description,
    author: answers.author as string,
    license: answers.license,
    homepage: answers.homepage,
    bugUrl: answers.bugUrl as string,
    variant: answers.variant as Variant,
    esm: answers.esm === 'esm',
    test: answers.test,
    docker: answers.docker,
    ignoreData: answers.ignoreData,
    addReviewer: answers.addReviewer,
    overwrite: flags.overwrite ?? false,
    outDir,
  }
}

/**
 * セットアップ内容のサマリーを note() で表示する。
 */
export function displaySummary(options: ProjectOptions): void {
  const lines = [
    `プロジェクト  @${options.org.toLowerCase()}/${options.name}`,
    `出力先        ${options.outDir}`,
    `バリアント    ${options.variant}`,
    `モジュール    ${options.esm ? 'ESM' : 'CommonJS'}`,
    `テスト        ${options.test ? 'Jest' : 'なし'}`,
    `Dockerfile    ${options.docker ? 'あり' : 'なし'}`,
    `data/無視     ${options.ignoreData ? 'あり' : 'なし'}`,
    `add-reviewer  ${options.addReviewer ? 'あり' : 'なし'}`,
  ]
  note(lines.join('\n'), 'セットアップ内容')
}

/**
 * 既存ファイルの上書き確認を行う。
 * キャンセル / 拒否時はプロセスを終了する。
 */
export async function confirmOverwrite(outDir: string): Promise<void> {
  const confirmed = await confirm({
    message: `${outDir} に既存のファイルがあります。上書きしますか？`,
  })
  if (isCancel(confirmed) || !confirmed) {
    cancel('セットアップを中断しました')
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0)
  }
}
