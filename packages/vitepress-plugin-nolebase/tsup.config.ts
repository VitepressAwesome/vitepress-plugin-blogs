import { builtinModules } from 'node:module'
import { defineConfig } from 'tsup'

export default defineConfig({
  // Build only the preset entries (vitepress/vite and vitepress/markdown-it).
  // Client / UI parts remain as TypeScript source processed by the Vite pipeline.
  // meta, index-plugin are now in their own packages.
  entry: {
    'vitepress/vite': './src/vitepress/vite/index.ts',
    'vitepress/markdown-it': './src/vitepress/markdown-it/index.ts',
  },
  tsconfig: './tsconfig.json',
  outDir: 'dist',
  format: ['esm'],
  dts: false,  // Types served via source files in exports map
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // Keep Node built-ins and peer deps external; everything else is bundled.
  external: [
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`),
    /^[^.]/,
  ],
  target: 'node18',
  platform: 'node',
})
