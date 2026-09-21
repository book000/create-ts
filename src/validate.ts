/**
 * プロジェクト名を検証する。
 * npm パッケージ名規則: 小文字英数字・ハイフン・アンダースコア・ドット、214 文字以下。
 */
export function validateProjectName(
  value: string | undefined
): string | undefined {
  if (!value) return 'プロジェクト名は必須です'
  return value.length > 214 || !/^[a-z0-9][a-z0-9\-_.]*$/.test(value)
    ? 'プロジェクト名は小文字英数字・ハイフン・アンダースコア・ドットのみ使用できます（最大 214 文字）'
    : undefined
}

/**
 * GitHub 組織 / ユーザー名を検証する。
 * 英数字・ハイフン・ドットのみ許容。
 */
export function validateOrgName(value: string | undefined): string | undefined {
  if (!value) return '組織 / ユーザー名は必須です'
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]*$/.test(value)
    ? undefined
    : '組織 / ユーザー名は英数字・ハイフン・ドットのみ使用できます'
}

/**
 * リポジトリ名を検証する。
 * 英数字・ハイフン・アンダースコア・ドットのみ許容。先頭はアンダースコア可。
 */
export function validateRepoName(
  value: string | undefined
): string | undefined {
  if (!value) return 'リポジトリ名は必須です'
  return /^[a-zA-Z0-9_][a-zA-Z0-9\-_.]*$/.test(value)
    ? undefined
    : 'リポジトリ名は英数字・ハイフン・アンダースコア・ドットのみ使用できます'
}

/**
 * SPDX ライセンス識別子を検証する。
 * 英数字・ドット・ハイフンのみ許容。
 */
export function validateLicense(value: string | undefined): string | undefined {
  if (!value) return 'ライセンス識別子は必須です'
  return /^[a-zA-Z0-9.-]+$/.test(value)
    ? undefined
    : 'ライセンス識別子は英数字・ドット・ハイフンのみ使用できます（例: MIT, Apache-2.0）'
}
