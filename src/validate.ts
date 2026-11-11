/**
 * Validates a project name (npm package name rule): lowercase alphanumerics, hyphens, underscores and dots, starting with an alphanumeric, at most 214 characters.
 * Returns an error message, or undefined if valid.
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
 * Validates a GitHub organization / user name: alphanumerics, hyphens and dots, starting with an alphanumeric.
 * Returns an error message, or undefined if valid.
 */
export function validateOrgName(value: string | undefined): string | undefined {
  if (!value) return '組織 / ユーザー名は必須です'
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]*$/.test(value)
    ? undefined
    : '組織 / ユーザー名は英数字・ハイフン・ドットのみ使用できます'
}

/**
 * Validates a repository name: alphanumerics, hyphens, underscores and dots; a leading underscore is allowed.
 * Returns an error message, or undefined if valid.
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
 * Validates an SPDX license identifier by character set only (alphanumerics, dots and hyphens); it does not check that the identifier exists.
 * Returns an error message, or undefined if valid.
 */
export function validateLicense(value: string | undefined): string | undefined {
  if (!value) return 'ライセンス識別子は必須です'
  return /^[a-zA-Z0-9.-]+$/.test(value)
    ? undefined
    : 'ライセンス識別子は英数字・ドット・ハイフンのみ使用できます（例: MIT, Apache-2.0）'
}
