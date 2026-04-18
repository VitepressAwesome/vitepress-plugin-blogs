import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'rollup', input: './src/index', outDir: 'dist/' },
  ],
  clean: true,
  sourcemap: true,
  declaration: true,
  externals: ['markdown-it', 'vite', 'colorette', 'tinyglobby'],
  rollup: {
    emitCJS: true,
  },
})
