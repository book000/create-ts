import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
})

// 注意: src/index.ts の先頭行に `#!/usr/bin/env node` を記載すること。
// tsdown がシェバンを検出し、出力ファイルへの保持と chmod +x を自動で行う（banner オプション不要）。
