import { builtinModules } from 'node:module'
import { defineConfig } from 'tsup'

export default defineConfig({
  // Build all entries used at config-load time by Node.js.
  // Client / UI parts remain as TypeScript source and are
  // processed by the Vite pipeline during build.
  entry: {
    'vitepress/vite': './src/vitepress/vite/index.ts',
    'vitepress/markdown-it': './src/vitepress/markdown-it/index.ts',
    'meta/vitepress': './src/meta/vitepress/index.ts',
    'index-plugin/vitepress': './src/index-plugin/vitepress/index.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // Keep Node built-ins and peer deps external; everything else is bundled.
  external: [
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`),
    'vite',
    'vitepress',
    'vue',
    '@vueuse/core',
  ],
  target: 'node18',
  platform: 'node',
})
