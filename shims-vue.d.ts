// Shim for TypeScript to recognize .vue files when using plain tsc (not vue-tsc).
// vue-tsc handles this automatically; this shim is for the root-level type check.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
