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
