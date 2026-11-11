/**
 * Stub declarations for tsdown's optional peer dependencies.
 * tsdown's type definitions reference these packages, but this project does not use them, so they are declared empty.
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
