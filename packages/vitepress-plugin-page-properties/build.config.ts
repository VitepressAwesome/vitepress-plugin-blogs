// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'rollup', input: './index', outDir: 'dist/' },
    // Client Vue SFCs — mkdist preserves component structure
    { builder: 'mkdist', input: './client', outDir: './dist/client', pattern: ['**/*.vue'], loaders: ['vue'] },
    { builder: 'mkdist', input: './client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'cjs', loaders: ['js'] },
    { builder: 'mkdist', input: './client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'esm', loaders: ['js'] },
    { builder: 'mkdist', input: './client', outDir: './dist/client', pattern: ['**/*.css'], loaders: ['postcss'] },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vue', 'vite', 'vitepress', '@vueuse/core'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
})
