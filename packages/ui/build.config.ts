// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // mkdist preserves Vue SFC structure in dist/
    { builder: 'mkdist', input: './src', pattern: ['**/*.vue'], loaders: ['vue'] },
    { builder: 'mkdist', input: './src', pattern: ['**/*.ts'], format: 'cjs', loaders: ['js'] },
    { builder: 'mkdist', input: './src', pattern: ['**/*.ts'], format: 'esm', loaders: ['js'] },
  ],
  clean: true,
  declaration: true,
  failOnWarn: false,
  externals: ['vue', '@vueuse/core'],
})
