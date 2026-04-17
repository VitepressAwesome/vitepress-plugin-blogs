import { shallowRef, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import type {
  TocSidebarFileEntry,
  TocSidebarRawTreeNode,
} from '../types'

export interface TocFileItem {
  text: string
  link: string
  date: string | null
  tags: string[]
  active: boolean
}

// ── 路径工具 ──

export function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  }
  catch {
    return input
  }
}

export function normalizePath(path: string, preserveTrailingSlash = false): string {
  if (!path) return '/'

  let normalized = safeDecode(path)
  const cutIdx = [normalized.indexOf('?'), normalized.indexOf('#')]
    .filter(i => i >= 0)
    .reduce((min, c) => Math.min(min, c), Infinity)
  if (Number.isFinite(cutIdx)) normalized = normalized.slice(0, cutIdx)

  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  normalized = normalized.replace(/\/+/g, '/')

  if (normalized !== '/' && normalized.endsWith('/index')) {
    normalized = `${normalized.slice(0, -6) || '/'}${normalized === '/index' ? '' : '/'}`
  }

  if (!preserveTrailingSlash && normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized || '/'
}

export function isDirectoryRoutePath(path: string): boolean {
  const normalized = normalizePath(path, true)
  return normalized === '/' || normalized.endsWith('/')
}

export function parentDirectoryPath(routePath: string): string {
  const normalized = normalizePath(routePath)
  if (normalized === '/') return '/'

  const parts = normalized.split('/').filter(Boolean)
  if (isDirectoryRoutePath(routePath)) {
    return `/${parts.join('/')}`
  }

  const parent = parts.slice(0, -1).join('/')
  return parent ? `/${parent}` : '/'
}

export function toRawTreeKeyFromRoutePath(routePath: string): string {
  const normalized = normalizePath(routePath)
  if (normalized === '/') return '/'
  return normalized.replace(/^\/+/, '').replace(/\/+$/, '')
}

export function routeMatches(routePath: string, link: string): boolean {
  return normalizePath(routePath, true) === normalizePath(link, true)
}

export function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  catch {
    return null
  }
}

// ── doctree 加载 ──

const nodeCache = new Map<string, TocSidebarRawTreeNode | null>()

export async function loadNode(dirKey: string): Promise<TocSidebarRawTreeNode | null> {
  if (nodeCache.has(dirKey)) {
    return nodeCache.get(dirKey)!
  }

  try {
    const { loadDirectoryNode } = await import('virtual:@knewbeing/toc-sidebar-doctree')
    const node = await loadDirectoryNode(dirKey)
    nodeCache.set(dirKey, node)
    return node
  }
  catch (error) {
    console.warn('[useTocEntries] Failed to load directory node:', error)
    nodeCache.set(dirKey, null)
    return null
  }
}

export async function collectAllFileEntries(dirKey: string): Promise<TocSidebarFileEntry[]> {
  const node = await loadNode(dirKey)
  if (!node) return []

  const entries: TocSidebarFileEntry[] = node.fileItems.filter(
    f => f.name !== 'index.md',
  )

  const childResults = await Promise.all(
    node.directoryItems.map(dir => collectAllFileEntries(dir.path)),
  )

  for (const childEntries of childResults) {
    entries.push(...childEntries)
  }

  return entries
}

// ── Composable ──

export type RootKeyStrategy = 'currentDir' | 'navRoot'

export interface UseTocEntriesOptions {
  rootKeyStrategy?: RootKeyStrategy
}

export function useTocEntries(options: UseTocEntriesOptions = {}) {
  const { rootKeyStrategy = 'currentDir' } = options
  const route = useRoute()
  const { theme } = useData()
  const fileItems = shallowRef<TocFileItem[]>([])

  function getCurrentDirKey(routePath: string): string {
    const normalizedRoute = normalizePath(routePath, true)
    const targetDirPath = isDirectoryRoutePath(normalizedRoute)
      ? normalizedRoute
      : parentDirectoryPath(normalizedRoute)
    return toRawTreeKeyFromRoutePath(targetDirPath)
  }

  function getNavRootKey(routePath: string): string {
    const nav = theme.value.nav as unknown[] | undefined
    if (!nav?.length) return getCurrentDirKey(routePath)

    const normalized = normalizePath(routePath)
    let bestLink = ''
    for (const link of flattenNavLinks(nav)) {
      const normalizedLink = normalizePath(link)
      if (normalizedLink !== '/' && normalized.startsWith(normalizedLink) && normalizedLink.length > bestLink.length) {
        bestLink = normalizedLink
      }
    }

    if (!bestLink) return getCurrentDirKey(routePath)
    return bestLink.replace(/^\/|\/$/g, '')
  }

  function flattenNavLinks(nav: unknown[]): string[] {
    const links: string[] = []
    for (const item of nav) {
      const navItem = item as Record<string, unknown>
      if (typeof navItem.link === 'string') links.push(navItem.link)
      if (Array.isArray(navItem.items)) links.push(...flattenNavLinks(navItem.items))
    }
    return links
  }

  function resolveDirKey(routePath: string): string {
    if (rootKeyStrategy === 'navRoot') {
      return getNavRootKey(routePath)
    }
    return getCurrentDirKey(routePath)
  }

  watch(
    () => route.path,
    async () => {
      let dirKey = resolveDirKey(route.path)
      let node = await loadNode(dirKey)

      if (!node) {
        const fallbackKey = toRawTreeKeyFromRoutePath(normalizePath(route.path, true))
        if (fallbackKey !== dirKey) {
          node = await loadNode(fallbackKey)
          if (node) dirKey = fallbackKey
        }
      }

      const entries = await collectAllFileEntries(dirKey)
      const currentPath = normalizePath(route.path)
      const currentPathClean = currentPath.replace(/\.html$/, '')

      const seen = new Set<string>()
      fileItems.value = entries
        .map((f) => {
          const date = formatDate(f.updatedAt ?? null)
          const linkNormalized = normalizePath(f.link)
          const linkClean = linkNormalized.replace(/\.html$/, '')
          const active = currentPathClean === linkClean
            || currentPath === linkNormalized
            || currentPath === `${linkNormalized}/`
          const fm = f.frontmatter ?? {}
          const tags: string[] = Array.isArray(fm.tags)
            ? fm.tags.filter((t: unknown): t is string => typeof t === 'string')
            : typeof fm.tags === 'string'
              ? [fm.tags]
              : []
          return { text: f.displayText, link: f.link, date, active, tags }
        })
        .filter((item) => {
          const key = normalizePath(item.link, true)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a, b) => {
          if (a.date && b.date) return b.date.localeCompare(a.date)
          if (a.date) return -1
          if (b.date) return 1
          return 0
        })
    },
    { immediate: true },
  )

  return { fileItems, formatDate }
}
