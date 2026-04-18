// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
/**
 * @knewbeing/vitepress-plugin-page-properties
 *
 * 完全自包含的 VitePress 页面属性插件，无任何外部依赖（仅 gray-matter）。
 *
 * ## 功能
 *
 * ### 1. PageProperties —— Vite 核心插件
 *
 * 扫描每个 `.md` 文件的正文内容，统计字数与预计阅读时间，并将结果注入
 * 虚拟模块 `virtual:knewbeing-page-properties`，客户端 Vue 组件通过该模块
 * 读取数据并渲染文章属性面板。
 *
 * 支持多语言字数统计：
 *   - **中文**：基于 Unicode Han 脚本匹配，300 字/分钟
 *   - **日文**：基于平假名/片假名匹配，400 字/分钟
 *   - **拉丁/西里尔**：基于词组匹配，160 词/分钟
 *
 * ### 2. PagePropertiesMarkdownSection —— Markdown 转换插件
 *
 * 在每个 `.md` 文件的 H1 标题之后（或文件开头）自动注入属性组件标签：
 *   - dev 模式：注入 `<KnewbeingPagePropertiesEditor />`（可扩展为可编辑）
 *   - build 模式：注入 `<KnewbeingPageProperties />`（只读展示）
 *
 * 需在主题 `enhanceApp` 中全局注册这两个客户端 Vue 组件：
 * ```ts
 * import PageProperties from '@knewbeing/vitepress-plugin-page-properties/client/PageProperties.vue'
 * import PagePropertiesEditor from '@knewbeing/vitepress-plugin-page-properties/client/PagePropertiesEditor.vue'
 * app.component('KnewbeingPageProperties', PageProperties)
 * app.component('KnewbeingPagePropertiesEditor', PagePropertiesEditor)
 * ```
 *
 * ### 3. createPagePropertiesDevPatch —— HMR 补丁插件
 *
 * **背景**：在 `vitepress dev` 模式下，虚拟模块
 * `virtual:knewbeing-page-properties` 会在任意 `.md` transform 之前被首次
 * 请求并缓存为空对象 `{}`。之后即使 `PageProperties` 的 `transform` 已把
 * 字数写入内存，Vite 也不会再推送 HMR 通知。
 *
 * **解决方案**：本插件监听每个 `.md` 的 `transform` 完成事件（`enforce: 'post'`），
 * 调用 `server.reloadModule()` 主动使缓存失效并通知浏览器重新请求，
 * 让客户端拿到最新字数数据。
 *
 * ### 4. createPagePropertiesPlugin —— 统一工厂函数
 *
 * 将上面三个插件合并为一个数组，调用方只需展开即可：
 *
 * ```ts
 * // .vitepress/config.ts
 * import { createPagePropertiesPlugin } from '@knewbeing/vitepress-plugin-page-properties'
 *
 * export default defineConfig({
 *   vite: {
 *     plugins: [
 *       ...createPagePropertiesPlugin(),
 *     ],
 *   },
 * })
 * ```
 *
 * @module @knewbeing/vitepress-plugin-page-properties
 */

import { extname, relative } from 'node:path'
import { env } from 'node:process'
import GrayMatter from 'gray-matter'
import { normalizePath } from 'vite'
import type { Plugin as VitePlugin, ViteDevServer } from 'vite'

// ── 工具函数 ─────────────────────────────────────────────────────────────────

function pathEndsWith(path: string, endsWith: string): boolean {
  return normalizePath(path).endsWith(normalizePath(endsWith))
}

function pathEquals(path: string, equals: string): boolean {
  return normalizePath(path) === normalizePath(equals)
}

function pathStartsWith(path: string, startsWith: string): boolean {
  return normalizePath(path).startsWith(normalizePath(startsWith))
}

// ── 多语言字数统计 ────────────────────────────────────────────────────────────

/**
 * 各语言的 Unicode 正则与阅读速度（字/词·每分钟）。
 * 阅读速度参考常见研究文献的平均值。
 */
const LANGUAGE_HANDLERS = {
  /** 日文：平假名 + 片假名，400 字/分钟 */
  japanese: {
    regex: /\p{Script=Hiragana}|\p{Script=Katakana}/gu,
    wordsPerMinute: 400,
  },
  /** 中文：CJK 统一汉字，300 字/分钟 */
  chinese: {
    regex: /\p{Script=Han}/gu,
    wordsPerMinute: 300,
  },
  /** 拉丁 / 西里尔：以词组为单位，160 词/分钟 */
  latinCyrillic: {
    regex: /[\p{Script=Latin}\p{Script=Cyrillic}\p{Mark}\p{Punctuation}\p{Number}]+/gu,
    wordsPerMinute: 160,
  },
} as const

type LanguageKey = keyof typeof LANGUAGE_HANDLERS

/**
 * 统计各语言字/词数。
 * @param content 纯文本内容（去除 frontmatter 后）
 */
function countWordsByLanguage(content: string): Record<LanguageKey, number> {
  return (Object.keys(LANGUAGE_HANDLERS) as LanguageKey[]).reduce(
    (acc, lang) => {
      const matches = content.match(LANGUAGE_HANDLERS[lang].regex)
      acc[lang] = matches ? matches.length : 0
      return acc
    },
    {} as Record<LanguageKey, number>,
  )
}

/**
 * 根据多语言字数计算总字数与预计阅读时间（向上取整到分钟）。
 */
function calculateWordsCountAndReadingTime(content: string): {
  wordsCount: number
  readingTime: number
} {
  const wordsCounts = countWordsByLanguage(content)
  const wordsCount = (Object.values(wordsCounts) as number[]).reduce((s, c) => s + c, 0)
  const readingTime = Math.ceil(
    (Object.keys(wordsCounts) as LanguageKey[]).reduce(
      (sum, lang) => sum + wordsCounts[lang] / LANGUAGE_HANDLERS[lang].wordsPerMinute,
      0,
    ),
  )
  return { wordsCount, readingTime }
}

// ── 虚拟模块常量 ──────────────────────────────────────────────────────────────

/**
 * 客户端通过 `import data from 'virtual:knewbeing-page-properties'` 访问。
 * 类型声明见包根目录 `client.d.ts`。
 */
const VIRTUAL_MODULE_ID = 'virtual:knewbeing-page-properties'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

/** HMR 事件：客户端页面挂载时发送，服务端收到后推送最新数据 */
const HMR_EVENT_CLIENT_MOUNTED = 'knewbeing-page-properties:client-mounted'
/** HMR 事件：服务端推送更新后的属性数据给客户端 */
const HMR_EVENT_UPDATED = 'knewbeing-page-properties:updated'

/**
 * 将绝对路径规范化为相对于 srcDir 的小写 POSIX 路径，用作数据索引 key。
 * 客户端的 `page.filePath` 也经过同样的小写/规范化处理。
 */
function normalizeKey(srcDir: string, filePath: string): string {
  return normalizePath(relative(srcDir, filePath)).toLowerCase()
}

// ── 类型 ──────────────────────────────────────────────────────────────────────

/** 单文件页面属性数据结构 */
export interface PagePropertyData {
  wordsCount: number
  readingTime: number
}

/** 虚拟模块导出的数据映射（相对路径小写 → 属性数据）*/
export type PagePropertiesData = Record<string, PagePropertyData>

// ── 插件 1：PageProperties —— Vite 核心插件 ─────────────────────────────────

/**
 * 创建页面属性核心 Vite 插件。
 *
 * 该插件：
 *   1. 在 `transform` 阶段扫描每个 `.md` 文件，计算字数与阅读时间。
 *   2. 通过虚拟模块 `virtual:knewbeing-page-properties` 将数据暴露给客户端。
 *   3. 在 dev 模式下监听 `knewbeing-page-properties:client-mounted` HMR 事件，
 *      实时更新当前页数据并通知客户端（兼容 Vite 5 的 `environments` API）。
 *
 * @returns 标准 Vite 插件实例
 */
export function PageProperties(): VitePlugin {
  let srcDir = ''
  /** 存储所有已扫描文件的属性数据，key 为 normalizeKey() 产生的小写相对路径 */
  const pageData: PagePropertiesData = {}
  /** dev 模式下缓存已确认存在的文件路径（小写），避免重复 stat */
  const knownMarkdownFiles = new Set<string>()

  return {
    name: 'knewbeing:page-properties',
    /**
     * `enforce: 'pre'` 确保在 VitePress 自身的 Markdown 处理插件之前执行，
     * 以拿到原始 `.md` 内容（含完整 frontmatter）。
     */
    enforce: 'pre',

    configResolved(config: any) {
      // VitePress 把 srcDir 挂载在 config.vitepress.srcDir
      srcDir = config.vitepress?.srcDir ?? config.root ?? ''
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID)
        return RESOLVED_VIRTUAL_MODULE_ID
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID)
        return null
      // 每次 load 时序列化最新数据，dev 模式通过 reloadModule 触发重新 load
      return `export default ${JSON.stringify(pageData)}`
    },

    transform(code: string, id: string) {
      if (!id.endsWith('.md'))
        return null

      const parsed = GrayMatter(code)
      pageData[normalizeKey(srcDir, id)] = calculateWordsCountAndReadingTime(parsed.content)

      // 不修改原始代码，只做数据收集
      return null
    },

    configureServer(server: any) {
      /**
       * 兼容 Vite 5 的 `environments` API（多环境架构）与旧版单 server 模式。
       * 在每个环境中注册 HMR 事件处理器，当客户端页面挂载时更新当前页数据。
       */
      const registerHandler = (envObj: any) => {
        const hot = envObj.hot ?? server.hot
        if (!hot)
          return

        /**
         * 收到客户端发来的 `client-mounted` 事件后，重新读取并解析对应 `.md` 文件，
         * 更新内存数据，使虚拟模块失效，并推送 `updated` 事件通知客户端重渲染。
         */
        hot.on(HMR_EVENT_CLIENT_MOUNTED, async (data: any) => {
          if (!data?.page?.filePath)
            return
          const filePath: string = data.page.filePath
          if (extname(filePath) !== '.md')
            return

          // 检查文件是否存在（首次访问时缓存结果）
          const lowerFilePath = filePath.toLowerCase()
          if (!knownMarkdownFiles.has(lowerFilePath)) {
            try {
              const { existsSync, lstatSync } = await import('node:fs')
              if (!existsSync(filePath) || !lstatSync(filePath).isFile())
                return
              knownMarkdownFiles.add(lowerFilePath)
            }
            catch {
              return
            }
          }

          // 重新读取并解析当前文件，使用与 transform 一致的 normalizeKey
          const { readFileSync } = await import('node:fs')
          const content = readFileSync(filePath, 'utf-8')
          const parsed = GrayMatter(content)
          const key = normalizePath(filePath).toLowerCase().replace(
            normalizePath(srcDir).toLowerCase() + '/',
            '',
          )
          pageData[key] = calculateWordsCountAndReadingTime(parsed.content)

          // 使虚拟模块缓存失效并通知客户端
          const moduleGraph = envObj.moduleGraph ?? server.moduleGraph
          const virtualModule = moduleGraph?.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
          if (virtualModule)
            moduleGraph.invalidateModule(virtualModule)

          hot.send({
            type: 'custom',
            event: HMR_EVENT_UPDATED,
            data: pageData,
          })
        })
      }

      if ('environments' in server && server.environments) {
        // Vite 5+ 多环境模式
        Object.values(server.environments).forEach(registerHandler)
      }
      else {
        registerHandler(server)
      }
    },
  }
}

// ── 插件 2：PagePropertiesMarkdownSection —— Markdown 注入插件 ───────────────

/** `PagePropertiesMarkdownSection` 的配置选项 */
export interface PagePropertiesMarkdownSectionOptions {
  /**
   * 按相对路径排除的文件列表（相对于 vite root）。
   * @default ['index.md']
   */
  excludes?: string[]
  /**
   * 自定义排除函数，返回 `true` 则跳过该文件的组件注入。
   */
  exclude?: (id: string, context: { helpers: typeof pathHelpers }) => boolean
}

const pathHelpers = { pathEndsWith, pathEquals, pathStartsWith }

/**
 * 创建 Markdown 节段注入插件。
 *
 * 在每个 `.md` 文件的 H1 标题之后（若无标题则在文件最前）自动插入属性组件：
 *   - dev 模式：`<KnewbeingPagePropertiesEditor />` — 可扩展为内联编辑
 *   - build 模式：`<KnewbeingPageProperties />` — 只读展示
 *
 * 需在主题 `enhanceApp` 中全局注册这两个组件（见模块顶部注释）。
 *
 * 支持通过 frontmatter 禁用单篇文章的属性面板：
 * ```yaml
 * ---
 * pageProperties: false
 * knewbeing:
 *   pageProperties: false
 * ---
 * ```
 *
 * @param options 可选配置
 * @returns 标准 Vite 插件实例
 */
export function PagePropertiesMarkdownSection(
  options?: PagePropertiesMarkdownSectionOptions,
): VitePlugin {
  const { excludes = ['index.md'], exclude = () => false } = options ?? {}
  let root = ''

  return {
    name: 'knewbeing:page-properties-markdown-section',
    enforce: 'pre',

    configResolved(config: any) {
      root = config.root ?? ''
    },

    transform(code: string, id: string) {
      if (!id.endsWith('.md'))
        return null

      const relPath = relative(root, id)

      // 辅助函数：基于当前文件的相对路径进行匹配
      const idEndsWith = (s: string) => pathEndsWith(relPath, s)
      const idEquals = (s: string) => pathEquals(relPath, s)
      const idStartsWith = (s: string) => pathStartsWith(relPath, s)

      const context = {
        helpers: { ...pathHelpers, idEndsWith, idEquals, idStartsWith },
      }

      if (excludes.includes(relPath) || exclude(id, context))
        return null

      // 根据环境选择注入的组件标签
      const componentTag
        = env.NODE_ENV === 'development'
          ? '\n\n<KnewbeingPagePropertiesEditor />\n'
          : '\n\n<KnewbeingPageProperties />\n\n'

      const parsed = GrayMatter(code)
      const hasFrontmatter = Object.keys(parsed.data).length > 0

      // 若 frontmatter 中明确禁用则跳过
      // 同时保留 knewbeing.pageProperties 和 pageProperties 两种写法
      if (parsed.data?.knewbeing?.pageProperties === false)
        return null
      if (parsed.data?.pageProperties === false)
        return null

      // 查找 H1 标题，将组件注入到标题之后
      const headingMatch = parsed.content.match(/^# .*/m)

      if (!headingMatch || headingMatch.index === undefined) {
        // 无 H1：注入到内容最前
        const newContent = `${componentTag}\n${parsed.content}`
        return hasFrontmatter
          ? GrayMatter.stringify(newContent, parsed.data)
          : newContent
      }

      const headingEnd = headingMatch.index + headingMatch[0].length
      const before = parsed.content.slice(0, headingEnd)
      const after = parsed.content.slice(headingEnd)
      const newContent = `${before}\n${componentTag}\n${after}`

      return hasFrontmatter
        ? GrayMatter.stringify(newContent, parsed.data)
        : newContent
    },
  }
}

// ── 插件 3：createPagePropertiesDevPatch —— HMR 补丁插件 ────────────────────

/**
 * 创建 dev 模式 HMR 补丁插件。
 *
 * **问题根源**：VitePress dev 模式下，虚拟模块 `virtual:knewbeing-page-properties`
 * 在 `.md` 文件 transform 之前就被 Vite 缓存为空对象 `{}`。即使后续
 * `PageProperties` 的 `transform` 钩子把字数写入了内存，Vite 也不会再次发送
 * 该虚拟模块的 HMR 通知，导致客户端属性面板始终显示为空。
 *
 * **修复逻辑**：
 *   1. 在每个 `.md` 文件 transform 完成后（`enforce: 'post'`）触发本钩子。
 *   2. 通过 `server.moduleGraph` 找到虚拟模块节点。
 *   3. 调用 `server.reloadModule()` —— 此方法同时完成：
 *      - `invalidateModule`：清除 transform 缓存
 *      - 向浏览器推送 HMR 通知（`full-reload`）
 *   4. 浏览器重新 fetch 虚拟模块，此时 `load()` 已能返回真实字数数据。
 *
 * @returns 标准 Vite 插件实例（仅 serve 阶段生效）
 */
export function createPagePropertiesDevPatch(): VitePlugin {
  let server: ViteDevServer | undefined

  return {
    name: 'knewbeing:page-properties-dev-patch',
    /**
     * `enforce: 'post'` 确保在所有其他插件（包括 PageProperties `pre` 插件）
     * 完成 transform 之后再触发，此时内存数据已是最新。
     */
    enforce: 'post',
    /** 仅在 serve 模式激活，build 阶段 SSG 不需要 HMR */
    apply: 'serve',

    configureServer(s) {
      server = s
    },

    transform: async (_code: string, id: string) => {
      if (!id.endsWith('.md') || !server)
        return null

      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
      if (mod) {
        /**
         * `reloadModule` = invalidateModule + 向浏览器发送 full-reload HMR 通知。
         * 浏览器收到后重新请求虚拟模块，load() 此时返回已更新的字数数据。
         */
        await server.reloadModule(mod)
      }

      return null
    },
  }
}

// ── 插件 4：createPagePropertiesPlugin —— 统一工厂函数 ──────────────────────

/**
 * 创建完整的页面属性插件组合。
 *
 * 返回数组包含（按顺序）：
 *   1. `PagePropertiesMarkdownSection()` — 向 md 注入 `<KnewbeingPageProperties*>` 标签
 *   2. `PageProperties()` — 扫描 frontmatter，注入虚拟模块
 *   3. `createPagePropertiesDevPatch()` — dev 模式 HMR 补丁
 *
 * 使用方式：
 * ```ts
 * plugins: [
 *   ...createPagePropertiesPlugin(),
 * ]
 * ```
 *
 * @param markdownOptions 可选的 `PagePropertiesMarkdownSection` 配置
 * @returns 插件数组（共 3 个插件）
 */
export function createPagePropertiesPlugin(
  markdownOptions?: PagePropertiesMarkdownSectionOptions,
): VitePlugin[] {
  return [
    PagePropertiesMarkdownSection(markdownOptions),
    PageProperties(),
    createPagePropertiesDevPatch(),
  ]
}
