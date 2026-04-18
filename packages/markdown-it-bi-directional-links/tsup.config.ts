import { builtinModules } from 'node:module'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: './src/index.ts' },
  tsconfig: './tsconfig.json',
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // Externalize all npm packages; only bundle Node.js built-ins via tsup/esbuild shims.
  external: [
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`),
    /^[^.]/,
  ],
  target: 'node18',
  platform: 'node',
})
