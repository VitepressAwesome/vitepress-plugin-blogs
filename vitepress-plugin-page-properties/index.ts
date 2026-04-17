/**
 * @knewbeing/vitepress-plugin-page-properties
 *
 * 对 `@nolebase/vitepress-plugin-page-properties` 的封装增强包。
 *
 * ## 背景
 *
 * `@nolebase/vitepress-plugin-page-properties` 提供了两个核心能力：
 *   - **Vite 插件**（`/vite` 子路径）：在 Vite build/serve 阶段扫描每个 `.md` 文件的
 *     frontmatter，把字数统计、标签、时间戳等属性注入虚拟模块
 *     `virtual:nolebase-page-properties`，供客户端组件消费。
 *   - **Vue 客户端组件**（默认导出 `/client`）：`<PageProperties>` 等组件，在文章
 *     顶部展示属性面板（字数、阅读时间、标签等）。
 *
 * ## 已知问题（上游 Bug）
 *
 * 在 `vitepress dev`（Vite serve 模式）下，虚拟模块 `virtual:nolebase-page-properties`
 * 会在任意 `.md` 文件被 transform 之前就被首次请求并缓存为空对象 `{}`。
 * 之后即使上游插件的 `transform(pre)` 已把字数统计写入内存，浏览器也拿不到更新，
 * 因为 Vite 不会再次发送该虚拟模块的 HMR 通知。
 *
 * 具体表现：页面刷新后属性面板为空；手动切换路由后偶尔才能看到数据。
 *
 * ## 解决方案（Dev 补丁插件）
 *
 * `createPagePropertiesDevPatch()` 是一个仅在 `serve` 模式下生效的微型 Vite 插件：
 *   1. 监听每个 `.md` 文件的 `transform` 完成事件（`enforce: 'post'`）。
 *   2. 通过 `server.moduleGraph` 找到已缓存的虚拟模块节点。
 *   3. 调用 `server.reloadModule(mod)` —— 该方法会先使缓存失效，再向浏览器发送
 *      HMR `full-reload` 通知，让客户端重新请求虚拟模块，此时上游 `load()` 已能
 *      返回真实数据。
 *
 * ## 统一入口
 *
 * `createPagePropertiesPlugin()` 把上游 `PageProperties()` 与补丁插件合并为一个
 * 插件数组，调用方只需展开该数组即可，无需关心内部实现细节：
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

import type { Plugin as VitePlugin, ViteDevServer } from 'vite'
import { PageProperties, PagePropertiesMarkdownSection } from '@nolebase/vitepress-plugin-page-properties/vite'

// ── 上游插件重导出 ────────────────────────────────────────────────────────────
// 直接透传 @nolebase 的 Vite 插件工厂函数与类型，让调用方无需直接依赖 @nolebase 包。

export {
  /** 主 Vite 插件：扫描 frontmatter 并注入虚拟模块 */
  PageProperties,
  /** Markdown 节段钩子：在 md 解析阶段提取属性 */
  PagePropertiesMarkdownSection,
}

// ── Dev 补丁插件 ──────────────────────────────────────────────────────────────

/**
 * 创建 dev 模式 HMR 补丁插件。
 *
 * 该插件仅在 `vitepress dev`（Vite serve）模式下激活，在每个 `.md` 文件 transform
 * 完成后，主动触发虚拟模块 `virtual:nolebase-page-properties` 的 HMR 更新，修复
 * 上游插件因虚拟模块缓存过早导致数据为空的问题。
 *
 * @returns 标准 Vite 插件实例（仅 serve 阶段生效）
 */
export function createPagePropertiesDevPatch(): VitePlugin {
  /**
   * 虚拟模块的已解析 ID。
   * Vite 约定：被 resolveId 返回带 `\0` 前缀的 ID 视为"虚拟模块"，
   * moduleGraph 中的 key 也带此前缀。
   */
  const VIRTUAL_ID = '\0virtual:nolebase-page-properties'

  /** 保存 Vite 开发服务器实例，用于后续调用 moduleGraph / reloadModule */
  let server: ViteDevServer | undefined

  return {
    name: 'knewbeing:page-properties-dev-patch',
    /**
     * `enforce: 'post'` 确保本插件的 transform 钩子在上游插件（pre/normal）之后执行，
     * 即此时上游已把字数统计写入内存，reloadModule 能拿到最新数据。
     */
    enforce: 'post',
    /** 仅在 serve 模式下激活，build 阶段不产生任何副作用 */
    apply: 'serve',

    configureServer(s) {
      server = s
    },

    transform: async (_code: string, id: string) => {
      // 只关心 Markdown 文件，其他模块不处理
      if (!id.endsWith('.md') || !server)
        return null

      const mod = server.moduleGraph.getModuleById(VIRTUAL_ID)
      if (mod) {
        /**
         * `server.reloadModule(mod)` 做两件事：
         *   1. 调用 `invalidateModule` 清除该模块的 transform 缓存
         *   2. 向浏览器发送 HMR 通知（`full-reload` 类型）
         * 浏览器收到通知后重新 fetch 该虚拟模块，此时上游 `load()` 已能返回
         * 包含最新字数统计的真实数据。
         */
        await server.reloadModule(mod)
      }

      return null
    },
  }
}

// ── 统一工厂函数 ──────────────────────────────────────────────────────────────

/**
 * 创建完整的 Page Properties 插件组合（上游插件 + dev 补丁）。
 *
 * 使用方式：展开返回数组后放入 `vite.plugins`：
 *
 * ```ts
 * plugins: [
 *   ...createPagePropertiesPlugin(),
 * ]
 * ```
 *
 * @returns 插件数组，顺序为：`[PageProperties(), devPatch]`
 */
export function createPagePropertiesPlugin(): VitePlugin[] {
  return [
    /** 上游核心插件：扫描 frontmatter → 注入虚拟模块 */
    PageProperties(),
    /** dev 补丁：修复虚拟模块首次加载为空的 HMR 问题 */
    createPagePropertiesDevPatch(),
  ]
}
