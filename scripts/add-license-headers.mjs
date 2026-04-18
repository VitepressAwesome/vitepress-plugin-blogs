/**
 * Script: add-license-headers.mjs
 * Adds appropriate MIT license headers to all source files missing them.
 *
 * - Files in nolebase-derived packages get: a generic MIT header (upstream attribution stays in README)
 * - Original packages (autosidebar-toc, page-properties, remove-sidebar, ui) get: MIT copyright notice
 * - build.config.ts files get: MIT copyright notice
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'tinyglobby'

const root = resolve(fileURLToPath(import.meta.url), '../../packages')

// Package → upstream attribution mapping (for nolebase-derived)
const nolebaseDerived = {
  'markdown-it-bi-directional-links': '@nolebase/markdown-it-bi-directional-links',
  'markdown-it-element-transform': '@nolebase/markdown-it-element-transform',
  'markdown-it-unlazy-img': '@nolebase/markdown-it-unlazy-img',
  'vitepress-plugin-enhanced-mark': '@nolebase/vitepress-plugin-enhanced-mark',
  'vitepress-plugin-enhanced-readabilities': '@nolebase/vitepress-plugin-enhanced-readabilities',
  'vitepress-plugin-git-changelog': '@nolebase/vitepress-plugin-git-changelog',
  'vitepress-plugin-highlight-targeted-heading': '@nolebase/vitepress-plugin-highlight-targeted-heading',
  'vitepress-plugin-index': '@nolebase/vitepress-plugin-index',
  'vitepress-plugin-inline-link-preview': '@nolebase/vitepress-plugin-inline-link-preview',
  'vitepress-plugin-meta': '@nolebase/vitepress-plugin-meta',
  'vitepress-plugin-nolebase': '@nolebase/integrations',
}

// Packages that are original work (not derived from nolebase)
const originalPackages = new Set([
  'ui',
  'vitepress-plugin-autosidebar-toc',
  'vitepress-plugin-page-properties',
  'vitepress-plugin-remove-sidebar',
])

const MIT_UPSTREAM_TEMPLATE = () =>
  `// MIT License. Upstream attribution is documented in this package README.\n`

const MIT_ORIGINAL_TEMPLATE =
  `// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.\n`

const BUILD_CONFIG_TEMPLATE =
  `// Build configuration. Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.\n`

function needsHeader(content) {
  const first = content.split('\n')[0].trim()
  return !(first.includes('MIT') || first.includes('Derived from') || first.includes('License') || first.includes('Copyright'))
}

function getHeader(pkgDir, filePath) {
  const pkgName = pkgDir
  if (filePath.endsWith('build.config.ts')) return BUILD_CONFIG_TEMPLATE
  if (originalPackages.has(pkgName)) return MIT_ORIGINAL_TEMPLATE
  const upstream = nolebaseDerived[pkgName]
  if (upstream) return MIT_UPSTREAM_TEMPLATE()
  return MIT_ORIGINAL_TEMPLATE
}

const files = globSync(['**/*.ts', '**/*.vue'], {
  cwd: root,
  ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  absolute: true,
})

let patched = 0
for (const file of files) {
  const rel = relative(root, file)
  const pkgDir = rel.split(/[\\/]/)[0]
  const content = readFileSync(file, 'utf-8')
  if (!needsHeader(content)) continue

  const header = getHeader(pkgDir, file)
  writeFileSync(file, header + content, 'utf-8')
  console.log(`  + ${rel}`)
  patched++
}

console.log(`\n[add-license-headers] Added headers to ${patched} file(s).`)
