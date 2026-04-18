// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'rollup', input: './src/vitepress/vite/index', outDir: 'dist/vitepress/vite/' },
    { builder: 'rollup', input: './src/vitepress/markdown-it/index', outDir: 'dist/vitepress/markdown-it/' },
    { builder: 'mkdist', input: './src/vitepress/client', outDir: './dist/client', pattern: ['**/*.vue'], loaders: ['vue'] },
    { builder: 'mkdist', input: './src/vitepress/client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'cjs', loaders: ['js'] },
    { builder: 'mkdist', input: './src/vitepress/client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'esm', loaders: ['js'] },
    { builder: 'mkdist', input: './src/vitepress/client', outDir: './dist/client', pattern: ['**/*.css'], loaders: ['postcss'] },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vite', 'vue', 'vitepress', 'markdown-it'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
})
