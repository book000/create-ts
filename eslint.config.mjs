import baseConfig from '@book000/eslint-config'

export default [
  { ignores: ['templates/**'] },
  ...baseConfig,
  {
    // Config files must call defineConfig() at the top level
    files: ['*.config.ts'],
    rules: { 'unicorn/no-top-level-side-effects': 'off' },
  },
]
