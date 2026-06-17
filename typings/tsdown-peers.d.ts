/**
 * tsdown のオプショナルピア依存関係のスタブ宣言。
 * tsdown の型定義がこれらのパッケージを参照するが、
 * 本プロジェクトでは使用しないため空宣言で対応する。
 */

declare module '@vitejs/devtools/cli-commands' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface StartOptions {}
}

declare module '@tsdown/exe' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface ExeExtensionOptions {}
}

declare module '@arethetypeswrong/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface CheckPackageOptions {}
}

declare module 'publint' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Options {}
}

declare module 'publint/utils' {}

declare module '@tsdown/css' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface CssOptions {}
}

declare module 'unplugin-unused' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Options {}
}
