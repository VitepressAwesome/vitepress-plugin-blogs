import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import type { TocSidebarFileEntry } from '../types'
import { collectAllFileEntries, loadNode } from './useTocEntries'

export interface BlogArticle {
  title: string
  link: string
  date: string | null
  tags: string[]
  description: string
  cover: string | null
}

function parseDate(dateStr: string | null | undefined): string | null {
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

function entryToArticle(entry: TocSidebarFileEntry): BlogArticle {
  const fm = entry.frontmatter ?? {}
  const tags: string[] = Array.isArray(fm.tags)
    ? fm.tags.filter((t: unknown): t is string => typeof t === 'string')
    : typeof fm.tags === 'string'
      ? [fm.tags]
      : []

  return {
    title: entry.displayText,
    link: entry.link,
    date: parseDate(entry.updatedAt ?? fm.date ?? fm.createdAt ?? null),
    tags,
    description: entry.excerpt ?? fm.description ?? fm.excerpt ?? fm.summary ?? '',
    cover: entry.cover ?? null,
  }
}

const PAGE_SIZE = 10

export function useBlogHome() {
  const route = useRoute()
  const router = useRouter()
  const articles = shallowRef<BlogArticle[]>([])
  const selectedTags = ref<Set<string>>(new Set())
  const currentPage = ref(1)

  function readQueryParams() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tagParam = params.get('tag')
    selectedTags.value = tagParam ? new Set(tagParam.split(',').filter(Boolean)) : new Set()
    const p = Number.parseInt(params.get('page') ?? '', 10)
    currentPage.value = Number.isNaN(p) || p < 1 ? 1 : p
  }

  function updateUrl() {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (selectedTags.value.size > 0)
      url.searchParams.set('tag', [...selectedTags.value].join(','))
    else
      url.searchParams.delete('tag')

    if (currentPage.value > 1)
      url.searchParams.set('page', String(currentPage.value))
    else
      url.searchParams.delete('page')

    window.history.replaceState(null, '', url.toString())
  }

  async function loadAllArticles() {
    const rootNode = await loadNode('/')
    if (!rootNode) return

    const allDirKeys = rootNode.directoryItems.map(d => d.path)
    const allEntries: TocSidebarFileEntry[] = []

    const rootFiles = rootNode.fileItems.filter(f => f.name !== 'index.md')
    allEntries.push(...rootFiles)

    const results = await Promise.all(allDirKeys.map(k => collectAllFileEntries(k)))
    for (const entries of results) {
      allEntries.push(...entries)
    }

    const arts = allEntries
      .map(entryToArticle)
      .sort((a, b) => {
        if (a.date && b.date) return b.date.localeCompare(a.date)
        if (a.date) return -1
        if (b.date) return 1
        return 0
      })

    articles.value = arts
  }

  const filteredArticles = computed(() => {
    if (selectedTags.value.size === 0) return articles.value
    return articles.value.filter(a => [...selectedTags.value].every(t => a.tags.includes(t)))
  })

  const visibleTags = computed(() => {
    const source = filteredArticles.value
    const tagMap = new Map<string, number>()
    for (const art of source) {
      for (const tag of art.tags) {
        if (!selectedTags.value.has(tag)) {
          tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
        }
      }
    }
    return [...selectedTags.value].map(name => ({ name, count: -1 }))
      .concat(
        [...tagMap.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      )
  })

  const totalPages = computed(() => Math.ceil(filteredArticles.value.length / PAGE_SIZE) || 1)

  const pagedArticles = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredArticles.value.slice(start, start + PAGE_SIZE)
  })

  function selectTag(tag: string | null) {
    const next = new Set(selectedTags.value)
    if (tag === null) {
      next.clear()
    } else if (next.has(tag)) {
      next.delete(tag)
    } else {
      next.add(tag)
    }
    selectedTags.value = next
    currentPage.value = 1
    updateUrl()
  }

  function goToPage(page: number) {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
    updateUrl()
  }

  watch(() => route.path, () => {
    readQueryParams()
    loadAllArticles()
  }, { immediate: true })

  return {
    articles: filteredArticles,
    pagedArticles,
    allTags: visibleTags,
    selectedTags,
    currentPage,
    totalPages,
    selectTag,
    goToPage,
  }
}
