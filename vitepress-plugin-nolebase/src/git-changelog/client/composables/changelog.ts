// Derived from @nolebase/vitepress-plugin-git-changelog (MIT) https://github.com/nolebase/integrations
/// <reference path="../../types/virtual.d.ts" />
import type { Changelog, Commit, CommitAuthor } from '../../types/index.ts'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { PageData } from 'vitepress'

import changelog from 'virtual:nolebase-git-changelog'

import { useData } from 'vitepress'
import { computed, shallowRef, toValue } from 'vue'

import { isStringArray } from '../utils'

export interface AuthorInfo extends CommitAuthor {
  commitsCount: number
}

export interface CommitWithAuthorInfo extends Omit<Commit, 'authors'> {
  authors: AuthorInfo[]
}

// ─── 模块级单例缓存 ───────────────────────────────────────────────────────────
// 通过比较 page ref 身份来区分不同的 Vue app 实例（SSR 中每页独立）。
// 在客户端 SPA 中，VitePress 的 useData() 始终返回同一个 page ref，
// 因此所有调用 useChangelog() 的组件（如 Changelog.vue 和 Contributors.vue）
// 共享同一套 computed，避免对全量 commit 数据重复过滤。

interface SharedChangelogState {
  page: Ref<PageData>
  gitChangelog: ShallowRef<Changelog>
  commits: ComputedRef<CommitWithAuthorInfo[]>
  authors: ComputedRef<AuthorInfo[]>
}

let _shared: SharedChangelogState | null = null

function getOrCreate(page: Ref<PageData>): SharedChangelogState {
  // 若 page ref 相同则直接复用；ref 不同说明是新的 Vue app 实例（SSR 隔离）
  if (_shared && _shared.page === page)
    return _shared

  const gitChangelog = shallowRef<Changelog>(changelog || { commits: [], authors: [] })

  const _commits = computed<Commit[]>(() => {
    const currentPath = toValue(page.value.filePath)
    const allCommits = gitChangelog.value.commits
    const commits = allCommits.filter(c => c.paths.includes(currentPath))

    return commits
      .sort((a, b) => b.date_timestamp - a.date_timestamp)
      .filter((commit, index) => {
        if (commit.tag && (!commits[index + 1] || commits[index + 1]?.tag))
          return false
        return true
      })
  })

  const authors = computed<AuthorInfo[]>(() => {
    const uniq = new Map<string, AuthorInfo>()

    const authorsFromFrontMatter: string[] = isStringArray(page.value.frontmatter.authors)
      ? page.value.frontmatter.authors
      : []

    ;[..._commits.value.map(c => c.authors), ...authorsFromFrontMatter]
      .flat()
      .forEach((name) => {
        if (!uniq.has(name))
          uniq.set(name, { name, commitsCount: 1 })
        else
          uniq.get(name)!.commitsCount++
      })

    return Array.from(uniq.values())
      .sort((a, b) => b.commitsCount - a.commitsCount)
      .map(a => ({
        ...a,
        ...gitChangelog.value.authors.find(item => item.name === a.name) ?? {
          avatarUrl: `https://gravatar.com/avatar/${a.name}?d=retro`,
        },
      }))
  })

  const commits = computed<CommitWithAuthorInfo[]>(() =>
    _commits.value.map(_c => ({
      ..._c,
      authors: _c.authors.map(_a => authors.value.find(v => v.name === _a)!),
    })),
  )

  _shared = { page, gitChangelog, commits, authors }
  return _shared
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

export function useChangelog() {
  const { page } = useData()
  const state = getOrCreate(page)

  const update = (data: Changelog) => {
    state.gitChangelog.value = data
  }

  const useHmr = () => {
    if (import.meta.hot) {
      import.meta.hot.send('nolebase-git-changelog:client-mounted', {
        page: { filePath: page.value.filePath },
      })

      // Plugin API | Vite
      // https://vitejs.dev/guide/api-plugin.html#handlehotupdate
      import.meta.hot.on('nolebase-git-changelog:updated', (data) => {
        if (data && typeof data === 'object')
          update(data as Changelog)
      })

      // HMR API | Vite
      // https://vitejs.dev/guide/api-hmr.html
      import.meta.hot.accept('virtual:nolebase-git-changelog', (newModule) => {
        if (newModule && 'default' in newModule && newModule.default)
          update(newModule.default as Changelog)
      })
    }
  }

  return {
    commits: state.commits,
    authors: state.authors,
    useHmr,
  }
}
