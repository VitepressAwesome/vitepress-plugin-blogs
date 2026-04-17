/**
 * @knewbeing/vitepress-plugin-autosidebar-toc - VitePress 自动目录和博客插件
 *
 * 核心功能：
 * - 自动扫描 Markdown 文档，生成侧边栏和导航配置
 * - 提取 Frontmatter 元数据，生成文章索引和目录树
 * - 提供开箱即用的组件：BlogHome（博客首页）、AutoToc（文章目录）、SidebarArticleList（文章列表）
 * - 虚拟模块 `virtual:@knewbeing/toc-sidebar-doctree` 用于实时访问生成的数据
 *
 * @module @knewbeing/vitepress-plugin-autosidebar-toc
 *
 * @example
 * // VitePress 配置中使用
 * import { createTocSidebarVitePlugin } from '@knewbeing/vitepress-plugin-autosidebar-toc'
 *
 * export default {
 *   vite: {
 *     plugins: [
 *       createTocSidebarVitePlugin({
 *         baseDir: './docs',
 *         scanDirs: ['posts/', 'notes/'],
 *       }),
 *     ],
 *   },
 * }
 */

import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { toNormalizedAbsolutePath } from '@knewbeing/utils'
import type { DefaultTheme } from 'vitepress'
import type { ConfigEnv, Plugin } from 'vite'
import type {
  DirNode,
  MarkdownMeta,
  ResolvedTocSidebarOptions,
  TocSidebarBuildOptions,
  ViteUserConfigLike,
} from './types'
import { createTocSidebarComponentResolver } from './client/resolvers'
import { invalidateMarkdownMetaCache } from './markdown'
import { scanMarkdownFilesWithDirectoryWalker, buildDirectoryTreeFromFiles } from './scanner'
import { buildFlatSidebarForAllDirectories, normalizeSidebarRootPath, normalizeAutoNavOptions, DEFAULT_OPTIONS } from './sidebar'
import { buildNavFromBuilder, insertNavItems, orderNavItems } from './nav'
import { createDoctreePayload, stringifyDoctreePayload, serializeSingleDirectoryNode } from './doctree'

// ── 导出 - 类型定义 ──────────────────────────────────────────────────────────
// 暴露插件所有配置和数据类型，便于类型推断和 IDE 智能提示

export type {
  /** 导航选项 */
  AutoNavOption,
  /** 组件解析器配置 */
  AutoTocResolverOptions,
  /** 目录树节点 */
  DirNode,
  /** 文件 Frontmatter 元数据 */
  Frontmatter,
  /** 解析后的 Markdown 文件元数据 */
  MarkdownMeta,
  /** 插件配置（已解析）*/
  ResolvedTocSidebarOptions,
  /** VitePress 主题配置 */
  ThemeConfigLike,
  /** 插件构建选项（主要配置接口）*/
  TocSidebarBuildOptions,
  /** 组件解析器统一配置选项 */
  TocSidebarComponentResolverOptions,
  /** 侧边栏目录条目 */
  TocSidebarDirectoryEntry,
  /** 虚拟模块输出的 doctree 完整数据结构 */
  TocSidebarDoctreePayload,
  /** 文件条目（包含元数据） */
  TocSidebarFileEntry,
  /** 导航选项配置 */
  TocSidebarNavOptions,
  /** Vite 插件类型定义 */
  TocSidebarPlugin,
  /** 原始目录树结构 */
  TocSidebarRawTree,
  /** 原始目录树节点 */
  TocSidebarRawTreeNode,
  /** 解析器选项别名 */
  TocSidebarResolverOptions,
  /** Vite 用户配置结构 */
  ViteUserConfigLike,
} from './types'

export type { TocSidebarClientConfig } from './client/useTocSidebarConfig'

// ── 导出 - 核心函数 ──────────────────────────────────────────────────────────

/**
 * 创建组件自动解析器，用于 `unplugin-vue-components` 自动导入。
 * 支持 BlogHome、AutoToc、SidebarArticleList 三个内置组件。
 */
export {
  createTocSidebarComponentResolver,
}

// ── 虚拟模块 ────────────────────────────────────────────────────────────

const VIRTUAL_MODULE_ID = 'virtual:@knewbeing/toc-sidebar-doctree'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`
const VIRTUAL_DIR_PREFIX = `${VIRTUAL_MODULE_ID}/dir/`
const RESOLVED_DIR_PREFIX = `\0${VIRTUAL_DIR_PREFIX}`

// ── 常量 ────────────────────────────────────────────────────────────────

const DOCTREE_DEBUG_FILE_NAME = 'toc-sidebar-doctree.debug.json'
const RECOMPUTE_DEBOUNCE_MS = 30

// ── 内部工具 ────────────────────────────────────────────────────────────

interface ContentSourceSnapshot {
  markdownFiles: string[]
  directoryTree: Map<string, DirNode>
}

async function buildContentSourceSnapshot(
  baseDir: string,
  options: ResolvedTocSidebarOptions,
): Promise<ContentSourceSnapshot> {
  const markdownFiles = await scanMarkdownFilesWithDirectoryWalker(baseDir, options)
  const directoryTree = buildDirectoryTreeFromFiles(markdownFiles)
  return { markdownFiles, directoryTree }
}

function isPathInsideBaseDir(filePath: string, normalizedBaseDir: string): boolean {
  const normalizedFile = toNormalizedAbsolutePath(filePath)
  return normalizedFile === normalizedBaseDir || normalizedFile.startsWith(`${normalizedBaseDir}/`)
}

// ── 插件主入口 ──────────────────────────────────────────────────────────

/**
 * 创建用于 VitePress 的自动侧边栏与导航生成插件。
 *
 * 该插件会扫描 Markdown 文档目录，构建目录树、sidebar、可选 nav，
 * 并在开发阶段支持增量更新与调试 doctree 输出。
 *
 * @param userOptions 用户传入的插件配置。
 * @returns 标准 Vite 插件实例。
 */
export function createTocSidebarVitePlugin(
  userOptions: TocSidebarBuildOptions,
): Plugin {
  const normalizedNav = normalizeAutoNavOptions(userOptions.nav)
  const options: TocSidebarBuildOptions & ResolvedTocSidebarOptions = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    showMarkdownLinks: userOptions.showMarkdownLinks ?? DEFAULT_OPTIONS.showMarkdownLinks,
    nav: normalizedNav,
  }

  const baseDir = resolve(options.dir)
  const normalizedBaseDir = toNormalizedAbsolutePath(baseDir)
  const cache = new Map<string, MarkdownMeta>()
  let isBuildCommand = false
  let sourceMarkdownFiles: string[] = []
  let sourceTree = new Map<string, DirNode>()
  let nav: DefaultTheme.NavItem[] = []
  let sidebar: DefaultTheme.SidebarMulti = {}
  const debugDoctreePath = resolve(process.cwd(), DOCTREE_DEBUG_FILE_NAME)
  const changedMarkdownAbsolutePaths = new Set<string>()
  let shouldResetMetaCache = false
  let pendingRecomputeTimer: ReturnType<typeof setTimeout> | undefined

  async function writeDebugDoctreeSnapshot(content: string): Promise<void> {
    if (isBuildCommand || !options.debug) {
      return
    }

    try {
      await writeFile(debugDoctreePath, content, 'utf-8')
    }
    catch (error) {
      console.warn('[vitepress-plugin-autosidebar-toc] Failed to write debug doctree file:', error)
    }
  }

  async function recomputeSidebarState(): Promise<void> {
    const snapshot = await buildContentSourceSnapshot(baseDir, options)
    sourceMarkdownFiles = snapshot.markdownFiles
    sourceTree = snapshot.directoryTree

    const roots = options.roots && options.roots.length > 0
      ? options.roots.map(normalizeSidebarRootPath)
      : [...(sourceTree.get('')?.directories ?? [])]

    const hasNavBuilder = options.nav.navBuilder.length > 0

    let generatedDirectories: string[] = []
    if (hasNavBuilder) {
      // 使用 navBuilder 构建 nav
      const result = await buildNavFromBuilder(
        options.nav.navBuilder,
        sourceMarkdownFiles,
        sourceTree,
        baseDir,
        cache,
      )
      nav = orderNavItems(result.nav, options.nav.order)
      generatedDirectories = result.directories
    } else {
      nav = []
      generatedDirectories = []
    }

    const sidebarRoots = generatedDirectories.length > 0
      ? generatedDirectories
      : roots

    // 扁平化 sidebar：每个目录只列出当前目录下的文章，不显示子目录名
    const nextSidebar = await buildFlatSidebarForAllDirectories(baseDir, sidebarRoots, cache, sourceTree)

    sidebar = nextSidebar
    await writeDebugDoctreeSnapshot(await stringifyDoctreePayload(sourceTree, baseDir, cache))
  }

  function queueSidebarRecompute(): void {
    if (pendingRecomputeTimer) {
      return
    }

    pendingRecomputeTimer = setTimeout(async () => {
      pendingRecomputeTimer = undefined

      if (shouldResetMetaCache) {
        cache.clear()
      }
      else {
        for (const changedFilePath of changedMarkdownAbsolutePaths) {
          invalidateMarkdownMetaCache(changedFilePath, cache)
        }
      }

      changedMarkdownAbsolutePaths.clear()
      shouldResetMetaCache = false
      await recomputeSidebarState()
    }, RECOMPUTE_DEBOUNCE_MS)
  }

  let publicDir = resolve(process.cwd(), 'public')

  return {
    name: 'vitepress-plugin-autosidebar-toc:inject',
    enforce: 'post',
    configResolved(config: any) {
      if (config.publicDir) {
        publicDir = config.publicDir
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
      if (id.startsWith(VIRTUAL_DIR_PREFIX)) {
        return `\0${id}`
      }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // Use numeric indices as chunk IDs to avoid Unicode/encoding issues
        // in SSR dynamic imports on Windows.
        const dirKeys = [...sourceTree.keys()].map(k => k || '/')
        const entries = dirKeys.map((key, idx) => {
          return `  ${JSON.stringify(key)}: () => import('${VIRTUAL_DIR_PREFIX}${idx}')`
        })
        return [
          `const _loaders = {`,
          entries.join(',\n'),
          `};`,
          `export async function loadDirectoryNode(dirKey) {`,
          `  const loader = _loaders[dirKey];`,
          `  if (!loader) return null;`,
          `  const mod = await loader();`,
          `  return mod.default;`,
          `}`,
        ].join('\n')
      }

      if (id.startsWith(RESOLVED_DIR_PREFIX)) {
        const idxStr = id.slice(RESOLVED_DIR_PREFIX.length)
        const dirKeys = [...sourceTree.keys()].map(k => k || '/')
        const idx = Number.parseInt(idxStr, 10)
        const dirKey = dirKeys[idx]
        if (dirKey == null) return `export default null`
        const node = await serializeSingleDirectoryNode(dirKey, sourceTree, baseDir, cache, publicDir)
        return `export default ${JSON.stringify(node)}`
      }

      return null
    },
    configureServer(server) {
      const refreshForMarkdownFileChange = (filePath: string) => {
        if (!isPathInsideBaseDir(filePath, normalizedBaseDir)) {
          return
        }

        const normalizedFile = toNormalizedAbsolutePath(filePath)
        if (!normalizedFile.endsWith('.md')) {
          return
        }

        changedMarkdownAbsolutePaths.add(normalizedFile)
        queueSidebarRecompute()
      }

      const refreshForDirectoryChange = (directoryPath: string) => {
        if (!isPathInsideBaseDir(directoryPath, normalizedBaseDir)) {
          return
        }

        shouldResetMetaCache = true
        queueSidebarRecompute()
      }

      server.watcher.on('add', refreshForMarkdownFileChange)
      server.watcher.on('unlink', refreshForMarkdownFileChange)
      server.watcher.on('change', refreshForMarkdownFileChange)
      server.watcher.on('addDir', refreshForDirectoryChange)
      server.watcher.on('unlinkDir', refreshForDirectoryChange)
    },
    async config(config, env: ConfigEnv) {
      isBuildCommand = env.command === 'build'
      await recomputeSidebarState()

      const normalizedConfig: ViteUserConfigLike = config
      const site = normalizedConfig.vitepress?.site

      if (!site) {
        return config
      }

      const shouldInjectSidebar = !isBuildCommand || Object.keys(sidebar).length > 0

      if (shouldInjectSidebar) {
        const injectedNav = nav.length > 0
          ? insertNavItems(site.themeConfig?.nav, nav, options.nav.insertMode)
          : (site.themeConfig?.nav ?? [])

        site.themeConfig = {
          ...(site.themeConfig ?? {}),
          sidebar,
          ...(nav.length > 0 ? { nav: injectedNav } : {}),
        }
      }

      if (site.locales && shouldInjectSidebar) {
        for (const localeKey of Object.keys(site.locales)) {
          const locale = site.locales[localeKey]

          const localeNav = nav.length > 0
            ? insertNavItems(locale.themeConfig?.nav, nav, options.nav.insertMode)
            : (locale.themeConfig?.nav ?? [])

          locale.themeConfig = {
            ...(locale.themeConfig ?? {}),
            sidebar,
            ...(nav.length > 0 ? { nav: localeNav } : {}),
          }
        }
      }

      return config
    },
  }
}
