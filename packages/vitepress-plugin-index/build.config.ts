// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import Yaml from '@rollup/plugin-yaml'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // mkdist preserves Vue SFC structure in dist/client/
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.vue'], loaders: ['vue'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'cjs', loaders: ['js'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.ts'], format: 'esm', loaders: ['js'] },
    { builder: 'mkdist', input: './src/client', outDir: './dist/client', pattern: ['**/*.css'], loaders: ['postcss'] },
    { builder: 'rollup', input: './src/locales/index', outDir: './dist/locales' },
    { builder: 'rollup', input: './src/vitepress/index', outDir: 'dist/vitepress/' },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['vue', 'vitepress', 'gray-matter', 'defu', 'execa', 'tinyglobby', 'globby'],
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
  hooks: {
    'rollup:options': (_, options) => {
      if (Array.isArray(options.plugins))
        options.plugins.push(Yaml() as any)
    },
  },
})
