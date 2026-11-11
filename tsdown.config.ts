import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
})

// Keep `#!/usr/bin/env node` as the first line of src/index.ts.
// tsdown detects the shebang, preserves it in the output and runs chmod +x (no banner option needed).
