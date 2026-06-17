#!/usr/bin/env node

import { intro, log, outro, spinner } from '@clack/prompts'
import { Command } from 'commander'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import {
  generateGitignore,
  patchDockerWorkflow,
  patchPackageJson,
  patchTsConfig,
  updateDepcheck,
} from './generate.js'
import { collectOptions, confirmOverwrite, displaySummary } from './prompts.js'
import { fetchTemplateConfig, readTemplate } from './template.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(
  readFileSync(path.join(__dirname, '../package.json'), 'utf8')
) as { version: string }

/** ファイルを書き込む。親ディレクトリが存在しない場合は作成する。 */
function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, content, 'utf8')
}

/** node / pnpm の存在と Node.js バージョンを確認する。メジャーバージョンを返す。 */
async function checkPrerequisites(): Promise<number> {
  let nodeMajor: number

  try {
    const { stdout: nodeVer } = await execa('node', ['--version'])
    nodeMajor = Number.parseInt(
      nodeVer.trim().replace('v', '').split('.', 1)[0],
      10
    )
  } catch {
    log.error('Error: node not found. Please install Node.js v20 or later.')
    process.exit(1)
  }

  if (nodeMajor < 20) {
    log.error(
      `Error: Node.js v${nodeMajor} is too old. Please install Node.js v20 or later.`
    )
    process.exit(1)
  }

  try {
    await execa('pnpm', ['--version'])
  } catch {
    log.error(
      'Error: pnpm not found. Run "corepack enable" or "npm install -g pnpm".'
    )
    process.exit(1)
  }

  return nodeMajor
}

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('create-ts')
    .description('Create book000-style TypeScript projects')
    .version(version)
    .argument('[outdir]', '出力ディレクトリ', '.')
    .option('--name <name>', 'プロジェクト名（npm パッケージ名規則）')
    .option('--org <org>', 'GitHub 組織 / ユーザー名')
    .option('--repo <repo>', 'リポジトリ名')
    .option('--description <desc>', 'プロジェクトの説明')
    .option('--author <author>', '作者名')
    .option('--license <spdx>', 'SPDX ライセンス識別子')
    .option('--homepage <url>', 'ホームページ URL')
    .option('--bug-url <url>', 'バグ報告 URL')
    .option(
      '--variant <variant>',
      'バリアント (base/config-batch/fastify/discord-bot)'
    )
    .option('--esm', 'ESM モジュール形式を有効にする')
    .option('--no-esm', 'CommonJS モジュール形式（デフォルト）')
    .option('--test', 'Jest テストを追加する')
    .option('--no-test', 'Jest テストを追加しない（デフォルト）')
    .option('--docker', 'Dockerfile を追加する')
    .option('--no-docker', 'Dockerfile を追加しない（デフォルト）')
    .option('--ignore-data', 'data/ を .gitignore に追加する')
    .option(
      '--no-ignore-data',
      'data/ を .gitignore に追加しない（デフォルト）'
    )
    .option('--add-reviewer', 'add-reviewer ワークフローを追加する')
    .option(
      '--no-add-reviewer',
      'add-reviewer ワークフローを追加しない（デフォルト）'
    )
    .option('--overwrite', '既存ファイルを確認なしで上書きする')

  program.parse()

  const outDirArg = program.args[0] ?? '.'
  const outDir = path.resolve(outDirArg)
  const opts = program.opts()

  /** CLI で明示的に指定されたかどうか確認して boolean | undefined を返す */
  const getCLIBoolFlag = (name: string): boolean | undefined => {
    const source = program.getOptionValueSource(name)
    if (source === 'cli' || source === 'env') {
      return opts[name] as boolean
    }
    return undefined
  }

  intro('create-ts')

  // ステップ 1: 前提チェック
  const s = spinner()
  s.start('前提条件を確認しています...')
  const nodeMajor = await checkPrerequisites()
  s.stop('前提条件を確認しました')

  // 対話プロンプトでオプション収集
  const options = await collectOptions(outDir, {
    name: opts.name as string | undefined,
    org: opts.org as string | undefined,
    repo: opts.repo as string | undefined,
    description: opts.description as string | undefined,
    author: opts.author as string | undefined,
    license: opts.license as string | undefined,
    homepage: opts.homepage as string | undefined,
    bugUrl: opts.bugUrl as string | undefined,
    variant: opts.variant as string | undefined,
    esm: getCLIBoolFlag('esm'),
    test: getCLIBoolFlag('test'),
    docker: getCLIBoolFlag('docker'),
    ignoreData: getCLIBoolFlag('ignoreData'),
    addReviewer: getCLIBoolFlag('addReviewer'),
    overwrite: opts.overwrite as boolean | undefined,
  })

  // 既存ファイルの確認
  if (!options.overwrite) {
    const hasExisting =
      existsSync(path.join(outDir, 'package.json')) ||
      existsSync(path.join(outDir, 'tsconfig.json')) ||
      existsSync(path.join(outDir, 'src'))

    if (hasExisting) {
      await confirmOverwrite(outDir)
    }
  }

  // サマリー表示
  displaySummary(options)

  // 出力ディレクトリを作成
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  try {
    // ステップ 2: template.json の読み込み
    s.start('テンプレート設定を読み込んでいます...')
    const templateConfig = fetchTemplateConfig(options.variant)
    s.stop('テンプレート設定を読み込みました')

    // ステップ 3: 共通テンプレートファイルのコピー
    const commonFiles = [
      'tsconfig.json',
      '.prettierrc.yml',
      'eslint.config.mjs',
      'renovate.json',
      '.depcheckrc.json',
      '.fixpackrc',
      'pnpm-workspace.yaml',
      '.devcontainer/devcontainer.json',
    ]

    if (options.docker) {
      commonFiles.push('Dockerfile', 'entrypoint.sh')
    }

    s.start('共通ファイルをコピーしています...')
    for (const file of commonFiles) {
      const content = readTemplate(`nodejs/common/${file}`)
      writeFile(path.join(outDir, file), content)
    }
    s.stop(`共通ファイルをコピーしました (${commonFiles.length} ファイル)`)

    // ステップ 4: バリアント src ファイルのコピー
    s.start('src ファイルをコピーしています...')
    for (const srcFile of templateConfig.src) {
      const content = readTemplate(`nodejs/${options.variant}/${srcFile}`)
      writeFile(path.join(outDir, srcFile), content)
    }
    s.stop(
      `src ファイルをコピーしました (${templateConfig.src.length} ファイル)`
    )

    // ステップ 5: tsconfig.json のパッチ
    const tsconfigPath = path.join(outDir, 'tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as Record<
      string,
      unknown
    >
    const patchedTsConfig = patchTsConfig(tsconfig, options)
    writeFileSync(
      tsconfigPath,
      JSON.stringify(patchedTsConfig, null, 2) + '\n',
      'utf8'
    )

    // ステップ 6: .gitignore / .node-version の生成
    s.start('.gitignore を生成しています...')
    const gitignoreContent = generateGitignore(options.ignoreData)
    writeFileSync(path.join(outDir, '.gitignore'), gitignoreContent, 'utf8')

    const { stdout: nodeVersion } = await execa('node', ['--version'])
    const nodeVersionNumber = nodeVersion.trim().replace('v', '')
    writeFileSync(
      path.join(outDir, '.node-version'),
      `${nodeVersionNumber}\n`,
      'utf8'
    )
    s.stop('.gitignore と .node-version を生成しました')

    // ステップ 7: LICENSE の生成
    s.start('LICENSE を生成しています...')
    try {
      const licenseRes = await fetch(
        `https://api.github.com/licenses/${options.license.toLowerCase()}`
      )
      if (!licenseRes.ok) throw new Error(`HTTP ${licenseRes.status}`)
      const licenseJson = (await licenseRes.json()) as { body: string }
      const licenseText = licenseJson.body
        .replaceAll('[year]', String(new Date().getFullYear()))
        .replaceAll('[fullname]', options.author)
      writeFileSync(path.join(outDir, 'LICENSE'), licenseText, 'utf8')
      s.stop('LICENSE を生成しました')
    } catch {
      s.stop('LICENSE の取得をスキップしました（取得失敗）')
      log.warn(
        '警告: LICENSE の取得に失敗しました。後で手動で追加してください。'
      )
    }

    // ステップ 8: ワークフローファイルのコピー
    s.start('ワークフローファイルをコピーしています...')
    const workflowDir = path.join(outDir, '.github', 'workflows')
    mkdirSync(workflowDir, { recursive: true })

    const ciYml = readTemplate('workflows/nodejs-ci-pnpm.yml')
    writeFileSync(path.join(workflowDir, 'nodejs-ci-pnpm.yml'), ciYml, 'utf8')

    if (options.docker) {
      const dockerYml = readTemplate('workflows/docker.yml')
      const patchedDockerYml = patchDockerWorkflow(
        dockerYml,
        options.org,
        options.repo
      )
      const expected = `${options.org.toLowerCase()}/${options.repo.toLowerCase()}`
      if (!patchedDockerYml.includes(expected)) {
        log.warn(
          '警告: docker.yml の文字列置換が正しく行われなかった可能性があります。'
        )
      }
      writeFileSync(
        path.join(workflowDir, 'docker.yml'),
        patchedDockerYml,
        'utf8'
      )
    }

    if (options.addReviewer) {
      const addReviewerYml = readTemplate('workflows/add-reviewer.yml')
      writeFileSync(
        path.join(workflowDir, 'add-reviewer.yml'),
        addReviewerYml,
        'utf8'
      )
    }

    s.stop('ワークフローファイルをコピーしました')

    // ステップ 9: package.json の生成
    s.start('package.json を生成しています...')

    // 9-1: バリアントの package.json を読み込み
    const variantPkgText = readTemplate(
      `nodejs/${options.variant}/package.json`
    )
    const variantPkgJson = JSON.parse(variantPkgText) as Record<string, unknown>

    // 9-2〜9-4: プロジェクト固有の値を適用
    const patchedPkgJson = patchPackageJson(variantPkgJson, options, nodeMajor)

    // 9-5: .depcheckrc.json の更新
    const depcheckIgnore = templateConfig.depcheckIgnore ?? []
    if (depcheckIgnore.length > 0 || options.test) {
      const depcheckPath = path.join(outDir, '.depcheckrc.json')
      const depcheckJson = JSON.parse(
        readFileSync(depcheckPath, 'utf8')
      ) as Record<string, unknown>
      const updatedDepcheck = updateDepcheck(
        depcheckJson,
        depcheckIgnore,
        options.test
      )
      writeFileSync(
        depcheckPath,
        JSON.stringify(updatedDepcheck, null, 2) + '\n',
        'utf8'
      )
    }

    // 9-6: schema/ ディレクトリの作成
    if (templateConfig.configSchema) {
      mkdirSync(path.join(outDir, 'schema'), { recursive: true })
    }

    // 9-7: package.json の保存
    writeFileSync(
      path.join(outDir, 'package.json'),
      JSON.stringify(patchedPkgJson, null, 2) + '\n',
      'utf8'
    )
    s.stop('package.json を生成しました')

    // ステップ 10: pnpm-lock.yaml のコピー
    s.start('pnpm-lock.yaml をコピーしています...')
    const pnpmLock = readTemplate(`nodejs/${options.variant}/pnpm-lock.yaml`)
    writeFileSync(path.join(outDir, 'pnpm-lock.yaml'), pnpmLock, 'utf8')
    s.stop('pnpm-lock.yaml をコピーしました')

    // ステップ 11: pnpm install
    s.start('pnpm install を実行しています...')
    await execa('pnpm', ['install', '--frozen-lockfile'], {
      cwd: outDir,
      stdio: 'inherit',
    })
    s.stop('依存パッケージをインストールしました')

    // ステップ 12: jest 関連の除去（テストなし時）
    if (!options.test) {
      s.start('Jest 関連パッケージを削除しています...')
      await execa('pnpm', ['remove', 'jest', '@types/jest', 'ts-jest'], {
        cwd: outDir,
      })
      s.stop('Jest 関連パッケージを削除しました')
    }

    // ステップ 13: fixpack / fixdevcontainer
    s.start('fixpack を実行しています...')
    try {
      await execa('npx', ['--yes', 'fixpack'], { cwd: outDir })
      s.stop('fixpack を実行しました')
    } catch {
      s.stop('fixpack をスキップしました（失敗）')
    }

    try {
      await execa('npx', ['--yes', 'fixdevcontainer'], { cwd: outDir })
      log.success('fixdevcontainer を実行しました')
    } catch {
      log.warn('fixdevcontainer をスキップしました（失敗）')
    }

    // ステップ 14: 完了メッセージ
    const completionLines = [
      '=== セットアップ完了！ ===',
      '',
      `プロジェクト : @${options.org.toLowerCase()}/${options.name}`,
      `バリアント   : ${options.variant}`,
      `モジュール   : ${options.esm ? 'ESM' : 'CommonJS'}`,
      '',
      '次のステップ:',
      '  1. git init && git add . && git commit -m "feat: 初期コミット"',
      '  2. pnpm run lint',
    ]

    let stepNum = 3
    if (templateConfig.configSchema) {
      completionLines.push(`  ${stepNum}. pnpm run generate-schema`)
      stepNum++
    }
    if (options.test) {
      completionLines.push(`  ${stepNum}. pnpm run test`)
    }

    outro(completionLines.join('\n'))
  } catch (error) {
    log.error(`エラーが発生しました: ${(error as Error).message}`)
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  log.error(`予期しないエラーが発生しました: ${(error as Error).message}`)
  process.exit(1)
})
