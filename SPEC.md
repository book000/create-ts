# `@book000/create-ts` 仕様書

## 目的

`pnpm create @book000/ts` で book000 流 TypeScript / Node.js プロジェクトをセットアップする CLI ツール。
`book000/templates` リポジトリの `nodejs/` テンプレート群をベースに、クロスプラットフォーム対応・対話 UX・フラグによる無人実行を実現する。

---

## 基本情報

| 項目 | 値 |
|---|---|
| npm パッケージ名 | `@book000/create-ts` |
| GitHub リポジトリ | `book000/create-ts` |
| 実行方法 | `pnpm create @book000/ts [出力ディレクトリ]` |
| 最低 Node.js バージョン | v20 |
| パッケージマネージャ | pnpm |

---

## 技術スタック

| 役割 | ライブラリ | バージョン | 選定理由 |
|---|---|---|---|
| 対話プロンプト | `@clack/prompts` | v1.5.1 | create-vite・create-svelte 採用。モダンな UX（スピナー、グループ化）。ESM only |
| テンプレート取得 | `fetch()`（Node.js 組み込み） | — | Node.js v18 以降でグローバル利用可。個別ファイル取得のみのため外部ライブラリ不要 |
| CLI フレームワーク | `commander` | v15.0.0 | 事実上の標準。`--no-*` ネゲーションが組み込みで動作。v15 より ESM only |
| プロセス実行 | `execa` | v9.6.1 | Promise ベースで扱いやすい。エラー時に stdout/stderr を含む例外を投げる。ESM only。Node.js `>=20.5` |
| ビルド | `tsdown` | latest | tsup の後継。Rolldown（Rust）ベースで高速。tsup 作者が新規プロジェクトに推奨。設定互換性あり |
| 言語 | TypeScript | — | |
| テスト | `vitest` | v4.1.9 | Node.js `>=20` 必須。create-ts の要件と一致 |

全ライブラリが ESM only であり、create-ts（`"type": "module"`）と完全に整合する。

---

## リポジトリ構造

```
book000/create-ts/
├── src/
│   ├── index.ts           # CLI エントリポイント（先頭行: #!/usr/bin/env node、commander の Command）
│   ├── prompts.ts         # @clack/prompts を使った対話フロー
│   ├── template.ts        # fetch() によるテンプレート取得ロジック
│   ├── generate.ts        # ファイル生成・修正ロジック（package.json パッチ等）
│   ├── validate.ts        # 入力バリデーション関数
│   └── types.ts           # 型定義（ProjectOptions 等）
├── test/
│   ├── validate.test.ts   # バリデーション関数の単体テスト
│   └── generate.test.ts   # ファイル生成ロジックの単体テスト（fetch モック使用）
├── .github/
│   └── workflows/
│       ├── nodejs-ci-pnpm.yml  # CI（reusable workflow 参照）
│       └── release.yml         # main/master push 時に自動バージョンバンプ → npm publish
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── renovate.json
└── SPEC.md                # 本ファイル
```

---

## テンプレートソース

テンプレートファイルはすべて `book000/templates` リポジトリの `nodejs/` ディレクトリから取得する。

```
https://raw.githubusercontent.com/book000/templates/master/nodejs/
  common/
    tsconfig.json
    .prettierrc.yml
    eslint.config.mjs
    renovate.json
    .depcheckrc.json
    .fixpackrc
    pnpm-workspace.yaml
    .devcontainer/devcontainer.json
    Dockerfile                    # --docker 時のみ使用
    entrypoint.sh                 # --docker 時のみ使用
  base/
    template.json
    package.json
    pnpm-lock.yaml
    src/main.ts
  config-batch/
    template.json
    package.json
    pnpm-lock.yaml
    src/main.ts
    src/config.ts
  fastify/
    template.json
    package.json
    pnpm-lock.yaml
    src/main.ts
  discord-bot/
    template.json
    package.json
    pnpm-lock.yaml
    src/main.ts
    src/config.ts
    src/discord.ts

https://raw.githubusercontent.com/book000/templates/master/workflows/
  nodejs-ci-pnpm.yml
  docker.yml                      # --docker 時のみ使用
  add-reviewer.yml                # --add-reviewer 時のみ使用
```

### template.json のスキーマ

各バリアントの `template.json` が持つフィールド：

```typescript
interface TemplateConfig {
  configSchema: boolean          // schema/ ディレクトリを作成するか
  dependencies?: string[]        // 参照用メタデータ（処理には使用しない。variant の package.json に既に含まれる）
  devDependencies?: string[]     // 参照用メタデータ（処理には使用しない。variant の package.json に既に含まれる）
  scripts?: Record<string, string> // 参照用メタデータ（処理には使用しない。variant の package.json に既に含まれる）
  depcheckIgnore?: string[]      // .depcheckrc.json の ignores に追加するパッケージ
  src: string[]                  // 取得する src ファイルのパス一覧
}
```

> **注意**: `dependencies` / `devDependencies` / `scripts` フィールドは人間可読なメタデータとして定義されているが、
> CLI 処理では一切使用しない。これらの内容はすでに各バリアントの `package.json` に組み込まれているため、
> 改めてマージする処理は不要。CLI が使用するのは `configSchema`・`depcheckIgnore`・`src` の 3 フィールドのみ。

各バリアントの実際の値：

| バリアント | configSchema | 追加 deps | 追加 devDeps | src ファイル |
|---|---|---|---|---|
| `base` | false | なし | なし | `src/main.ts` |
| `config-batch` | true | `@book000/node-utils` | `typescript-json-schema` | `src/main.ts`, `src/config.ts` |
| `fastify` | false | `fastify`, `@fastify/cors` | `fastify-raw-body` | `src/main.ts` |
| `discord-bot` | true | `discord.js`, `@book000/node-utils` | `typescript-json-schema` | `src/main.ts`, `src/config.ts`, `src/discord.ts` |

---

## UX 方針

- `@clack/prompts` の `intro()` / `outro()` でツールの開始・終了を明示する
- 各処理ステップは `spinner()` で進捗を表示する。開始・完了メッセージは具体的に書く（例: `共通ファイルを取得しています...` → `共通ファイルを取得しました (8 ファイル)`）
- プロンプト入力後は Ctrl+C（`isCancel()`）を必ずチェックし、`cancel('キャンセルしました')` でグレースフルに終了する
- エラーは `log.error()` / `outro()` を通じて統一されたフォーマットで表示する。`console.error()` は使わない
- フラグをすべて指定した場合も、処理開始前に選択内容のサマリーを表示する
- `--version` フラグは commander の `.version()` で自動対応する

---

## CLI インターフェース

### 基本構文

```
pnpm create @book000/ts [出力ディレクトリ] [オプション]
```

出力ディレクトリを省略した場合はカレントディレクトリを使用する。

出力ディレクトリが指定された場合、そのディレクトリ名（basename）を `--name` のデフォルト値として使用する。
例: `pnpm create @book000/ts my-app` → プロジェクト名の初期値が `my-app` になる。

### フラグ一覧

| フラグ | 型 | 説明 |
|---|---|---|
| `--name <name>` | string | プロジェクト名（npm パッケージ名規則） |
| `--org <org>` | string | GitHub 組織 / ユーザー名（デフォルト: `book000`） |
| `--repo <repo>` | string | リポジトリ名（デフォルト: `--name` の値） |
| `--description <desc>` | string | プロジェクトの説明 |
| `--author <author>` | string | 作者名（デフォルト: `--org` の値） |
| `--license <spdx>` | string | SPDX ライセンス識別子（デフォルト: `MIT`） |
| `--homepage <url>` | string | ホームページ URL（省略可） |
| `--bug-url <url>` | string | バグ報告 URL（デフォルト: `https://github.com/<org>/<repo>/issues`、`--org` と `--repo` から自動計算） |
| `--variant <variant>` | string | `base` / `config-batch` / `fastify` / `discord-bot` |
| `--esm` / `--no-esm` | boolean | ESM 有効（デフォルト: 無効 = CommonJS） |
| `--test` / `--no-test` | boolean | Jest テスト追加（デフォルト: 無効） |
| `--docker` / `--no-docker` | boolean | Dockerfile 追加（デフォルト: 無効） |
| `--ignore-data` / `--no-ignore-data` | boolean | `data/` を .gitignore に追加（デフォルト: 無効） |
| `--add-reviewer` / `--no-add-reviewer` | boolean | add-reviewer ワークフロー追加（デフォルト: 無効） |
| `--overwrite` | boolean | 既存ファイルを確認なしで上書き |

フラグが指定された項目は対話をスキップする。未指定の項目のみ対話で聞く。

---

## 対話プロンプトフロー

`@clack/prompts` の `group()` を使い、以下の順番で質問する。
フラグで指定済みの項目は対応する質問をスキップする。

### グループ 1: プロジェクト情報

1. **プロジェクト名** (`--name`)
   - プレースホルダー: `my-app`
   - バリデーション: `^[a-z0-9][a-z0-9\-_\.]*$` かつ 214 文字以下
   - エラーメッセージ: `プロジェクト名は小文字英数字・ハイフン・アンダースコア・ドットのみ使用できます（最大 214 文字）`
   - バリデーション失敗時は同じプロンプトを再表示（`@clack/prompts` の `validate` オプション）

2. **GitHub 組織 / ユーザー名** (`--org`)
   - デフォルト: `book000`
   - バリデーション: `^[a-zA-Z0-9][a-zA-Z0-9\-\.]*$`
   - エラーメッセージ: `組織 / ユーザー名は英数字・ハイフン・ドットのみ使用できます`

3. **リポジトリ名** (`--repo`)
   - デフォルト: プロジェクト名
   - バリデーション: `^[a-zA-Z0-9_][a-zA-Z0-9\-_\.]*$`
   - エラーメッセージ: `リポジトリ名は英数字・ハイフン・アンダースコア・ドットのみ使用できます`

4. **プロジェクトの説明** (`--description`)
   - 自由入力・空文字も許容

5. **作者名** (`--author`)
   - デフォルト: 組織 / ユーザー名

6. **ライセンス** (`--license`)
   - デフォルト: `MIT`
   - バリデーション: `^[a-zA-Z0-9.\-]+$`
   - エラーメッセージ: `ライセンス識別子は英数字・ドット・ハイフンのみ使用できます（例: MIT, Apache-2.0）`

7. **ホームページ URL** (`--homepage`)
   - 任意。空入力でスキップ

8. **バグ報告 URL** (`--bug-url`)
   - デフォルト: `https://github.com/<org>/<repo>/issues`

### グループ 2: テンプレート選択

9. **バリアント** (`--variant`) — `select`
   ```
   base          - 最小構成（TypeScript + lint）
   config-batch  - 設定ファイルありのバッチ処理
   fastify       - Fastify HTTP サーバー
   discord-bot   - Discord Bot
   ```
   - デフォルト: `base`

10. **モジュール形式** (`--esm` / `--no-esm`) — `select`
    ```
    CommonJS  - 既定・現行の標準（--no-esm）
    ESM       - ES Modules（--esm）
    ```
    - デフォルト: CommonJS

### グループ 3: オプション

11. **Jest テスト** (`--test` / `--no-test`) — `confirm`
    - デフォルト: `false`

12. **Dockerfile** (`--docker` / `--no-docker`) — `confirm`
    - デフォルト: `false`

13. **`data/` を .gitignore に追加** (`--ignore-data`) — `confirm`
    - デフォルト: `false`

14. **add-reviewer ワークフロー** (`--add-reviewer`) — `confirm`
    - デフォルト: `false`

### キャンセル処理

各 `text()` / `select()` / `confirm()` の戻り値を `isCancel()` でチェックする。
キャンセルされた場合は `cancel('キャンセルしました')` を呼んで `process.exit(0)` で終了する。

### 選択内容のサマリー表示

全プロンプト（および既存ファイル確認）の完了後、処理開始前に以下のサマリーを表示する。
フラグをすべて指定して対話をスキップした場合も同様に表示する。

```
┌ セットアップ内容
│
│  プロジェクト  @book000/my-app
│  出力先        ./my-app
│  バリアント    base
│  モジュール    CommonJS
│  テスト        なし
│  Dockerfile    あり
│  data/無視     なし
│  add-reviewer  なし
│
└─
```

`@clack/prompts` の `note()` を使って表示する。

### 既存ファイルの確認

全質問の後、出力ディレクトリに `package.json`・`tsconfig.json`・`src/` のいずれかが存在する場合：
- `--overwrite` フラグがある場合はスキップ
- ない場合は `confirm` で上書き確認を取る
- キャンセル / 拒否されたら `cancel('セットアップを中断しました')` を呼んで `process.exit(0)` で終了

---

## セットアップ処理フロー

以下の処理を順番に実行する。`@clack/prompts` の `spinner()` でステップごとに進捗表示する。

処理全体を `intro('create-ts')` で開始し、完了時は `outro('セットアップ完了！...')` で終了する。
エラー時は `log.error(...)` を表示して `process.exit(1)` する。

### spinner メッセージ例

```
◆  共通ファイルを取得しています...  →  ◇  共通ファイルを取得しました (8 ファイル)
◆  src ファイルを取得しています...  →  ◇  src ファイルを取得しました (2 ファイル)
◆  package.json を生成しています... →  ◇  package.json を生成しました
◆  pnpm install を実行しています... →  ◇  依存パッケージをインストールしました
```

### ステップ 1: 前提チェック

- `node` コマンドの存在確認
  - 不在: エラー終了 `Error: node not found. Please install Node.js v20 or later.`
- `pnpm` コマンドの存在確認
  - 不在: エラー終了 `Error: pnpm not found. Run "corepack enable" or "npm install -g pnpm".`
- Node.js バージョンが v20 未満の場合はエラー終了

### ステップ 2: template.json の取得

`https://raw.githubusercontent.com/book000/templates/master/nodejs/<variant>/template.json`
をフェッチして JSON としてパースする。

### ステップ 3: 共通テンプレートファイルの取得

以下のファイルを `nodejs/common/` から `fetch()` で個別取得し、出力ディレクトリに配置する：

```
tsconfig.json
.prettierrc.yml
eslint.config.mjs
renovate.json
.depcheckrc.json
.fixpackrc
pnpm-workspace.yaml
.devcontainer/devcontainer.json
```

`--docker` が有効な場合はさらに追加：
```
Dockerfile
entrypoint.sh
```

取得元 URL: `https://raw.githubusercontent.com/book000/templates/master/nodejs/common/<ファイル名>`

必要に応じて親ディレクトリを作成する（`.devcontainer/` 等）。

### ステップ 4: バリアント src ファイルの取得

`template.json` の `src` フィールドに列挙されたファイルを `fetch()` で個別取得して出力ディレクトリに配置する。

取得元 URL: `https://raw.githubusercontent.com/book000/templates/master/nodejs/<variant>/<srcFile>`

必要に応じて親ディレクトリを作成する（`src/` 等）。

### ステップ 5: tsconfig.json のパッチ

取得した `tsconfig.json` を読み込み、以下の条件で上書きして保存する。

**ESM 選択時**（`--esm`）のみパッチが必要:
```json
{
  "compilerOptions": {
    "module": "es2015"
  }
}
```

`moduleResolution` は `bundler` のままで変更しない（テンプレートデフォルトが `bundler`、ESM でも同じ）。

**CommonJS 選択時**（デフォルト）: パッチ不要。
`common/tsconfig.json` のテンプレートは既に `module: "commonjs"` + `moduleResolution: "bundler"` であるため、書き換えは行わない。

**テストあり**（`--test`）: `compilerOptions.types` 配列に `"jest"` を追加する。
元の `tsconfig.json` の `types` は `["node"]` であるため、追加後は `["node", "jest"]` になる。
ESM / CJS 問わず適用する。

保存は BOM なし UTF-8 で行う（後述）。

### ステップ 6: .gitignore / .node-version の生成

**.gitignore**:
1. `https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore` を取得
2. 末尾に以下を追記：
   ```
   
   
   # pnpm
   pnpm-debug.log*
   ```
3. `--ignore-data` が有効な場合、さらに追記：
   ```
   
   
   # データディレクトリ
   data/
   ```
4. BOM なし UTF-8 で保存

**.node-version**:
- `node --version` の出力から先頭の `v` を除いた文字列（例: `24.1.0`）を保存

### ステップ 7: LICENSE の生成

1. `https://api.github.com/licenses/<ライセンス識別子の小文字>` を取得
2. レスポンス JSON の `body` フィールドを取得
3. `[year]` を現在年（`new Date().getFullYear()`）に置換
4. `[fullname]` を `--author` の値に置換
5. BOM なし UTF-8 で `LICENSE` として保存
6. 取得失敗時は警告メッセージを表示してスキップ（`LICENSE` ファイルは生成しない）

### ステップ 8: ワークフローファイルの取得

`.github/workflows/` ディレクトリを作成する（なければ）。

**nodejs-ci-pnpm.yml**（常時）:
- `https://raw.githubusercontent.com/book000/templates/master/workflows/nodejs-ci-pnpm.yml`
- そのまま配置

**docker.yml**（`--docker` 時のみ）:
- `https://raw.githubusercontent.com/book000/templates/master/workflows/docker.yml`
- 以下の文字列置換を行ってから保存:
  - `tomacheese/twitter-dm-memo` → `<org小文字>/<repo小文字>`
  - `packageName: "twitter-dm-memo"` → `packageName: "<repo>"`
- 置換後に置換結果が含まれているか確認し、含まれない場合は警告を表示

**add-reviewer.yml**（`--add-reviewer` 時のみ）:
- `https://raw.githubusercontent.com/book000/templates/master/workflows/add-reviewer.yml`
- そのまま配置

### ステップ 9: package.json の生成

#### 9-1. バリアントの package.json を取得

`https://raw.githubusercontent.com/book000/templates/master/nodejs/<variant>/package.json`
を取得し、JSON としてパース。

このファイルは CI テスト済みのテンプレート。`name` や `description` 等はプレースホルダー値。

#### 9-2. プロジェクト固有の値を上書き

```typescript
packageJson.name        = `@${org.toLowerCase()}/${name}`
packageJson.description = description
packageJson.license     = license
packageJson.author      = author
packageJson.engines.node = `>=${nodeMajor}`  // node --version の メジャーバージョン
packageJson.repository.url = `git+https://github.com/${org}/${repo}.git`
packageJson.bugs.url    = bugUrl
```

`homepage` は入力がある場合のみ追加する。

#### 9-3. ESM 対応

`--esm` が有効な場合：
- `packageJson.type = "module"` を追加
- `packageJson.jest` を以下の ESM 用設定で上書き（テストあり時のみ）：
  ```json
  {
    "preset": "ts-jest/presets/default-esm",
    "extensionsToTreatAsEsm": [".ts"],
    "transform": {
      "^.+\\.tsx?$": ["ts-jest", { "useESM": true }]
    }
  }
  ```

#### 9-4. テストなし時の scripts / jest config 除去

`--no-test`（デフォルト）の場合：
- `packageJson.scripts.test` を削除
- `packageJson.jest` を削除

> **注意**: `devDependencies` からの jest 除去はこの時点では行わない。
> lockfile と完全一致させて `--frozen-lockfile` を通すために後の pnpm remove で行う。

#### 9-5. .depcheckrc.json の更新

`template.json` の `depcheckIgnore` が空でない、またはテストありの場合：
1. 配置済みの `.depcheckrc.json` を読み込む
2. `depcheckIgnore` のエントリを `ignores` 配列に追加（重複は除く）
3. テストありかつ `@types/jest` が未追加の場合は `@types/jest` も追加
4. BOM なし UTF-8 で保存

#### 9-6. schema/ ディレクトリの作成

`template.json` の `configSchema` が `true` の場合（config-batch・discord-bot）:
- 出力ディレクトリに `schema/` ディレクトリを作成する

#### 9-7. package.json の保存

BOM なし UTF-8 で保存する。

### ステップ 10: pnpm-lock.yaml の取得

`https://raw.githubusercontent.com/book000/templates/master/nodejs/<variant>/pnpm-lock.yaml`
を取得して出力ディレクトリに保存する。

このファイルは CI テスト済みの固定バージョン lockfile。次の `pnpm install --frozen-lockfile` の前提条件。

### ステップ 11: pnpm install

```sh
pnpm install --frozen-lockfile
```

このコマンドを出力ディレクトリ内で実行する（`cwd` オプション指定）。

`--frozen-lockfile` により lockfile に記録された正確なバージョンのみをインストールする。
package.json と pnpm-lock.yaml が一致しているため失敗しない（jest の devDependencies も含んだまま）。

**出力の扱い**: spinner を停止した上で `execa` の `stdio: 'inherit'` で pnpm の出力をそのままターミナルに流す。
インストール完了後に spinner を再開して次のステップに進む。
これにより進行状況（`Progress: resolved X, reused Y...`）がユーザーに見える。

### ステップ 12: jest 関連の除去（テストなし時）

`--no-test`（デフォルト）の場合、以下を実行する：

```sh
pnpm remove jest @types/jest ts-jest
```

これにより:
- `package.json` の `devDependencies` から削除される
- `pnpm-lock.yaml` が更新される
- `node_modules` から削除される

### ステップ 13: fixpack / fixdevcontainer

```sh
npx --yes fixpack
npx --yes fixdevcontainer
```

それぞれ失敗してもスキップして続行する。

### ステップ 14: 完了メッセージ

```
=== セットアップ完了！ ===

プロジェクト : @<org>/<name>
バリアント   : <variant>
モジュール   : CommonJS / ESM

次のステップ:
  1. git init && git add . && git commit -m "feat: 初期コミット"
  2. pnpm run lint
```

`configSchema` が true の場合: `  3. pnpm run generate-schema`
`--test` の場合: `  3. pnpm run test`

---

## 生成される成果物

### 全バリアント共通

```
<出力ディレクトリ>/
├── package.json              # プロジェクト情報・依存パッケージ（生成）
├── pnpm-lock.yaml            # CI テスト済みの固定バージョン（取得）
├── tsconfig.json             # モジュール形式・test 設定済み（取得+パッチ）
├── .prettierrc.yml           # 取得
├── eslint.config.mjs         # 取得
├── renovate.json             # 取得
├── .depcheckrc.json          # 取得+更新
├── .fixpackrc                # 取得
├── pnpm-workspace.yaml       # 取得
├── .node-version             # 生成
├── .gitignore                # 生成
├── LICENSE                   # 生成（取得失敗時はなし）
├── node_modules/             # pnpm install で生成
├── src/
│   └── main.ts               # 取得
├── .github/
│   └── workflows/
│       └── nodejs-ci-pnpm.yml  # 取得
└── .devcontainer/
    └── devcontainer.json       # 取得
```

### バリアント別追加ファイル

| バリアント | 追加ファイル |
|---|---|
| `config-batch` | `src/config.ts`, `schema/`（空ディレクトリ） |
| `fastify` | なし |
| `discord-bot` | `src/config.ts`, `src/discord.ts`, `schema/`（空ディレクトリ） |

### オプション別追加ファイル

| オプション | 追加ファイル |
|---|---|
| `--docker` | `Dockerfile`, `entrypoint.sh`, `.github/workflows/docker.yml` |
| `--add-reviewer` | `.github/workflows/add-reviewer.yml` |

---

## エラーハンドリング

| 状況 | 対応 |
|---|---|
| node / pnpm が見つからない | エラーメッセージを表示して `process.exit(1)` |
| Node.js が v20 未満 | エラーメッセージを表示して `process.exit(1)` |
| ネットワークエラー（テンプレート取得） | エラーをスローして処理中断 |
| LICENSE 取得失敗 | 警告表示してスキップ（致命的エラーとしない） |
| docker.yml の文字列置換失敗 | 警告表示して続行 |
| fixpack / fixdevcontainer の失敗 | 警告表示してスキップ（致命的エラーとしない） |
| pnpm install 失敗 | エラーをスローして処理中断 |

---

## ファイル書き込みルール

全ファイルは **BOM なし UTF-8** で書き込む。Node.js の `fs.writeFileSync` のデフォルト（`'utf8'`）は BOM なしなので特別な対応は不要。

---

## package.json の内容

```json
{
  "name": "@book000/create-ts",
  "version": "0.1.0",
  "description": "Create book000-style TypeScript projects",
  "license": "MIT",
  "author": "book000",
  "type": "module",
  "packageManager": "pnpm@11.6.0",
  "bin": {
    "create-ts": "dist/index.js"
  },
  "main": "dist/index.js",
  "files": ["dist"],
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "tsdown",
    "dev": "tsdown --watch",
    "lint": "run-z lint:prettier,lint:eslint,lint:tsc",
    "lint:prettier": "prettier --check src",
    "lint:eslint": "eslint . -c eslint.config.mjs",
    "lint:tsc": "tsc",
    "fix": "run-z fix:prettier fix:eslint",
    "fix:eslint": "eslint . -c eslint.config.mjs --fix",
    "fix:prettier": "prettier --write src",
    "test": "vitest run"
  },
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@clack/prompts": "latest",
    "commander": "latest",
    "execa": "latest"
  },
  "devDependencies": {
    "@book000/eslint-config": "latest",
    "@types/node": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "run-z": "latest",
    "tsdown": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

---

## tsdown.config.ts

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
})

// 注意: src/index.ts の先頭行に `#!/usr/bin/env node` を記載すること。
// tsdown がシェバンを検出し、出力ファイルへの保持と chmod +x を自動で行う（banner オプション不要）。
```

---

## CI/CD 設定

### nodejs-ci-pnpm.yml（CI）

`book000/templates` の reusable workflow を参照する。`lint` / `build` / `test` スクリプトの有無を自動検出して実行する。

```yaml
name: Node CI

on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master
  merge_group:

jobs:
  node-ci:
    name: Node CI
    uses: book000/templates/.github/workflows/reusable-nodejs-ci-pnpm.yml@master
```

### release.yml（自動バージョンバンプ → npm publish）

`main` / `master` への push をトリガーに、Conventional Commits のコミットメッセージから自動でバージョンをバンプしタグを打ち、npm に publish する。`book000/node-utils` と同じフロー。

トリガー: `push` on branches `main`, `master`

ステップ:
1. `actions/checkout` （`fetch-depth: 0`）
2. `pnpm/action-setup@v6`
3. `actions/setup-node@v6`（`node-version-file: .node-version`, `registry-url: https://registry.npmjs.org`）
4. pnpm store キャッシュ（`actions/cache@v5`）
5. `npm install -g npm@^11.5.1`（OIDC Trusted Publishing に必要）
6. `pnpm install --frozen-lockfile --prefer-frozen-lockfile`
7. `mathieudutour/github-tag-action@v6.2` でタグ自動生成
   - `default_bump: minor`
   - `initial_version: 0.1.0`（タグなしリポジトリの初回バンプ先）
   - `custom_release_rules`: `feat:minor`, `fix:patch`, `docs:patch`, `chore:patch`, `refactor:patch`, `build:patch`, `ci:patch`, `revert:patch`, `style:patch`, `test:patch`（`release:major` は除外 — v0 フェーズ中はメジャーバンプなし）
8. `pnpm version --no-git-tag-version ${{ steps.tag-version.outputs.new_version }}`（package.json のバージョンを更新）
9. `pnpm run build`
10. `dist/index.js` の存在確認
11. `pnpm pack` で tarball を作成し `dist/index.js` が含まれることを確認
12. `pnpm run lint`
13. `pnpm publish --access public --no-git-checks --ignore-scripts`（環境変数 `NPM_CONFIG_PROVENANCE: "true"` を設定して実行）
14. `ncipollo/release-action@v1.21.0` で GitHub Release を作成

パーミッション: `contents: write`, `issues: write`, `pull-requests: write`, `id-token: write`

---

## テスト方針

`vitest` を使った単体テスト。テスト対象は `validate.ts`（バリデーション）と `generate.ts`（ファイル生成ロジック）の 2 モジュール。
`generate.ts` のテストでは `fetch()` を `vi.stubGlobal()` でモックし、ネットワーク不要で実行できるようにする。

E2E テスト（実際に `pnpm install` まで走らせる）は CI 上での手動確認とする。

### `validate.ts` のテストケース

`validateProjectName`:
- `my-app` → 有効
- `MyApp` → 無効（大文字）
- `-bad-start` → 無効（ハイフン始まり）
- `has space` → 無効（空白）
- `'a'.repeat(215)` → 無効（215 文字）
- `'a'.repeat(214)` → 有効

`validateOrgName`:
- `book000` → 有効
- `Book.000` → 有効（大文字・ドット許容）
- `bad org!` → 無効（空白・記号）

`validateRepoName`:
- `my-repo` → 有効
- `_private` → 有効（アンダースコア始まり）
- `-bad` → 無効（ハイフン始まり）

### `generate.ts` のテストケース

**package.json パッチ（`patchPackageJson`）**:
- `org` が大文字でも `name` が `@book000/my-app` と小文字化される
- `--esm`: `type: "module"` が追加される
- `--esm --test`: `jest` フィールドが ESM 用設定（`ts-jest/presets/default-esm`）に差し替わる
- `--no-test`: `scripts.test` と `jest` フィールドが削除される
- `--no-test --esm`: `jest` フィールドが追加されない（ESM jest config は `--test` 時のみ）
- `homepage` が空文字: `homepage` フィールドが追加されない
- `homepage` が指定済み: `homepage` フィールドが追加される

**tsconfig.json パッチ（`patchTsConfig`）**:
- CJS（デフォルト）: `module: "commonjs"`, `moduleResolution: "bundler"` のまま変化しない（パッチなし）
- ESM: `module` が `"es2015"` に変わる。`moduleResolution` は `"bundler"` のまま
- `--test`: `compilerOptions.types` に `"jest"` が追加される（`["node", "jest"]`）
- `--no-test`: `compilerOptions.types` が `["node"]` のまま変わらない

**docker.yml 置換（`patchDockerWorkflow`）**:
- `tomacheese/twitter-dm-memo` → `book000/my-app` に置換される
- `org` が大文字（`Book000`）でも GHCR パスが小文字化される（`book000/my-app`）
- `packageName: "twitter-dm-memo"` → `packageName: "my-app"` に置換される

**.gitignore 生成（`generateGitignore`）**:
- 基本: 末尾に `# pnpm` セクションが追記される
- `--ignore-data`: さらに `# データディレクトリ\ndata/` セクションが追記される

**.depcheckrc.json 更新（`updateDepcheck`）**:
- `depcheckIgnore: ["typescript-json-schema"]` のバリアントで該当パッケージが `ignores` に追加される
- `--test`: `@types/jest` が `ignores` に追加される
- 同一パッケージを 2 回渡しても重複が生まれない

---

## リリースプロセス

`main` / `master` ブランチへの PR マージが自動でリリースをトリガーする。手動のバージョンバンプや `git tag` は不要。

1. Conventional Commits に従ったコミットメッセージで PR を作成・マージ
2. `release.yml` が自動実行:
   - コミットメッセージの種別（`feat` → minor, `fix` / `chore` / etc. → patch）からバージョンを決定
   - git タグを打ち、`package.json` のバージョンを更新
   - ビルド・lint・検証後に `pnpm publish` で npm に公開
   - GitHub Release を自動生成

> **バージョンルール（v0 フェーズ）**: `feat` → minor バンプ（例: `0.1.0` → `0.2.0`）、それ以外（`fix`, `chore`, `docs`, `refactor` 等）→ patch バンプ。`release:major` ルールは除外しており、v1 への自動昇格は発生しない。v1 に上げる際は `initial_version` を変更するか手動タグで対応する。

---

## Renovate 設定

create-ts 自身の依存パッケージを Renovate で自動更新する。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "github>book000/templates//renovate/base-public"
  ]
}
```

`book000/templates:renovate/public.json` を継承することで、book000 標準の更新ポリシー（最小リリース猶予期間・グループ化等）が適用される。

---

## 参考: setup.ps1 との対応表

| setup.ps1 処理 | create-ts 対応 |
|---|---|
| `Invoke-WebRequest` でファイル取得 | `fetch()`（Node.js 組み込み） |
| `Read-Host` による対話 | `@clack/prompts` |
| `-cnotmatch '^[a-z0-9]...'` バリデーション | `validate.ts` の関数 |
| `Write-Utf8NoBom` | `fs.writeFileSync(path, content, 'utf8')` |
| `pnpm install --frozen-lockfile` | `execa('pnpm', ['install', '--frozen-lockfile'], { cwd: outDir })` |
| `pnpm remove jest ...` | `execa('pnpm', ['remove', 'jest', '@types/jest', 'ts-jest'], { cwd: outDir })` |
| `npx fixpack` / `npx fixdevcontainer` | `execa('npx', ['--yes', 'fixpack'], { cwd: outDir })` 等 |
