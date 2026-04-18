// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'rollup', input: './src/vitepress/index', outDir: 'dist/vitepress/' },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vite', 'vitepress'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
})
