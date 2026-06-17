/**
 * プロジェクト名を検証する。
 * npm パッケージ名規則: 小文字英数字・ハイフン・アンダースコア・ドット、214 文字以下。
 */
export function validateProjectName(
  value: string | undefined
): string | undefined {
  if (!value) return 'プロジェクト名は必須です'
  if (value.length > 214 || !/^[a-z0-9][a-z0-9\-_.]*$/.test(value)) {
    return 'プロジェクト名は小文字英数字・ハイフン・アンダースコア・ドットのみ使用できます（最大 214 文字）'
  }
  return undefined
}

/**
 * GitHub 組織 / ユーザー名を検証する。
 * 英数字・ハイフン・ドットのみ許容。
 */
export function validateOrgName(value: string | undefined): string | undefined {
  if (!value) return '組織 / ユーザー名は必須です'
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-.]*$/.test(value)) {
    return '組織 / ユーザー名は英数字・ハイフン・ドットのみ使用できます'
  }
  return undefined
}

/**
 * リポジトリ名を検証する。
 * 英数字・ハイフン・アンダースコア・ドットのみ許容。先頭はアンダースコア可。
 */
export function validateRepoName(
  value: string | undefined
): string | undefined {
  if (!value) return 'リポジトリ名は必須です'
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9\-_.]*$/.test(value)) {
    return 'リポジトリ名は英数字・ハイフン・アンダースコア・ドットのみ使用できます'
  }
  return undefined
}

/**
 * SPDX ライセンス識別子を検証する。
 * 英数字・ドット・ハイフンのみ許容。
 */
export function validateLicense(value: string | undefined): string | undefined {
  if (!value) return 'ライセンス識別子は必須です'
  if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
    return 'ライセンス識別子は英数字・ドット・ハイフンのみ使用できます（例: MIT, Apache-2.0）'
  }
  return undefined
}
