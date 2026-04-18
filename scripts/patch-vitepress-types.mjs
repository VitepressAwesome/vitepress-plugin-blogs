/**
 * Patch script: creates missing .d.ts stubs for vitepress@2.0.0-alpha.15's
 * internal composables/utilities that lack type declarations.
 *
 * These missing types cause TS7016 errors in vue-tsc because the theme-default
 * .vue components import internal modules that have no corresponding .d.ts files.
 * This is a known limitation of the vitepress alpha release.
 *
 * Run automatically via `postinstall` in package.json.
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../../node_modules/vitepress/dist/client')

const stubs = [
  ['theme-default/composables/flyout.d.ts', 'export declare const useFlyout: (...args: any[]) => any'],
  ['theme-default/composables/data.d.ts', 'export declare const useData: (...args: any[]) => any'],
  ['theme-default/composables/edit-link.d.ts', 'export declare const useEditLink: (...args: any[]) => any'],
  ['theme-default/composables/langs.d.ts', 'export declare const useLangs: (...args: any[]) => any'],
  ['theme-default/composables/layout.d.ts', 'export declare const useLayout: (...args: any[]) => any'],
  ['theme-default/composables/nav.d.ts', 'export declare const useNav: (...args: any[]) => any'],
  ['theme-default/composables/outline.d.ts', 'export declare const useOutline: (...args: any[]) => any'],
  ['theme-default/composables/prev-next.d.ts', 'export declare const usePrevNext: (...args: any[]) => any'],
  ['theme-default/composables/sidebar.d.ts', 'export declare const useSidebar: (...args: any[]) => any'],
  ['theme-default/support/utils.d.ts', 'export declare const normalizeLink: (...args: any[]) => any\nexport declare const isActive: (...args: any[]) => any'],
  ['theme-default/support/lru.d.ts', 'export declare class LRUCache<K, V> { get(key: K): V | undefined; set(key: K, value: V): void }'],
  ['theme-default/support/sidebar.d.ts', 'export declare const getSidebar: (...args: any[]) => any\nexport declare const getFlatSideBarLinks: (...args: any[]) => any'],
  ['theme-default/support/translation.d.ts', 'export declare const defaultTranslations: Record<string, any>'],
  ['shared.d.ts', 'export declare const EXTERNAL_URL_RE: RegExp\nexport declare const isExternal: (path: string) => boolean\nexport declare const isActive: (...args: any[]) => boolean'],
]

let patched = 0
for (const [rel, content] of stubs) {
  const fullPath = resolve(root, rel)
  if (!existsSync(fullPath)) {
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, `// Auto-generated stub for vitepress alpha internal module (no official types)\n${content}\n`)
    patched++
  }
}

if (patched > 0) {
  console.log(`[patch-vitepress-types] Created ${patched} type stub(s) for vitepress@alpha internal modules`)
}
