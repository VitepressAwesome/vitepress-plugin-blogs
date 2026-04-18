// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

// This package is CSS-only; no JS build is needed.
// The CSS files are served directly from src/client/.
export default defineBuildConfig({
  entries: [
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.css'], loaders: ['postcss'] },
  ],
  clean: true,
  declaration: false,
})
