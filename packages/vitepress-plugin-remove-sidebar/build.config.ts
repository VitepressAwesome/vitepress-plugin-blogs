// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'rollup', input: './index', outDir: 'dist/' },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vue', 'vite', 'vitepress'],
  rollup: {
    emitCJS: true,
  },
})
