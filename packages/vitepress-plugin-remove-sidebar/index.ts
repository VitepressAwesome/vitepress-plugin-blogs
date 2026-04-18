// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
/**
 * @knewbeing/vitepress-plugin-remove-sidebar
 *
 * 将 `@knewbeing/vitepress-plugin-autosidebar-toc` 插件注入的 sidebar 条目
 * 替换为空占位组的 Vite 插件。
 *
 * ## 背景
 *
 * `vitepress-plugin-autosidebar-toc` 在 `config` 阶段会把扫描到的目录树写入
 * VitePress 的 `themeConfig.sidebar`（以及各 locale 的 sidebar）。
 *
 * 在某些布局方案中，我们希望：
 *   - VitePress **仍然渲染侧边栏面板**（这样 `sidebar-nav-after` slot 才能挂载
 *     自定义的 `<SidebarArticleList />` 组件）
 *   - 但**不显示任何自动生成的导航项**，导航完全由自定义组件接管
 *
 * 若直接把 sidebar 置为空对象或 `undefined`，VitePress 不会渲染侧边栏面板，
 * slot 也就无法挂载。
 *
 * ## 解决方案
 *
 * 本插件在 autosidebar-toc 写入 sidebar 之后（`enforce: 'post'`），将每个路径
 * 的 sidebar 值替换为 `[{ text: '', items: [] }]`（单个空占位组）：
 *   - VitePress 认为 sidebar 非空，**会渲染侧边栏面板**
 *   - 占位组没有任何导航项，配合 CSS `display: none` 可完全隐藏原始条目
 *   - `sidebar-nav-after` slot 正常挂载，自定义组件可正常渲染
 *
 * ## 使用方式
 *
 * ```ts
 * // .vitepress/config.ts
 * import { createRemoveSidebarPlugin } from '@knewbeing/vitepress-plugin-remove-sidebar'
 *
 * export default defineConfig({
 *   vite: {
 *     plugins: [
 *       createTocSidebarVitePlugin(options), // 先生成 sidebar
 *       createRemoveSidebarPlugin(),          // 再清空显示内容
 *     ],
 *   },
 * })
 * ```
 *
 * @module @knewbeing/vitepress-plugin-remove-sidebar
 */

import type { Plugin as VitePlugin } from 'vite'

/**
 * 创建"移除侧边栏显示内容"Vite 插件。
 *
 * 插件在 `enforce: 'post'` 阶段执行，确保在 autosidebar-toc 写入 sidebar 之后
 * 再做替换。替换逻辑：
 *   - 遍历 `site.themeConfig.sidebar` 的所有 key
 *   - 将每个 key 的值替换为 `[{ text: '', items: [] }]`（空占位组）
 *   - 同时处理所有 locale 下的 `themeConfig.sidebar`
 *
 * @returns 标准 Vite 插件实例
 */
export function createRemoveSidebarPlugin(): VitePlugin {
  return {
    name: 'knewbeing:remove-vitepress-sidebar',
    /**
     * `enforce: 'post'` 保证本插件在所有 `normal` 和 `pre` 插件（包括
     * autosidebar-toc）执行完 `config` 钩子后再运行，避免被后续插件覆盖。
     */
    enforce: 'post',

    config(config) {
      /**
       * VitePress 把站点配置挂载在 Vite config 的 `vitepress.site` 上。
       * 若不存在（非 VitePress 环境）则直接跳过。
       */
      const site = (config as any).vitepress?.site
      if (!site)
        return

      /**
       * 将 sidebar 的每个路径条目替换为只含一个空占位组的数组。
       * 占位组必须是非空数组，否则 VitePress 会认为该路径没有 sidebar
       * 而不渲染侧边栏面板，导致 `sidebar-nav-after` slot 无法挂载。
       */
      const replaceWithPlaceholder = (sidebar: Record<string, any> | undefined) => {
        if (!sidebar)
          return
        for (const key of Object.keys(sidebar)) {
          sidebar[key] = [{ text: '', items: [] }]
        }
      }

      // 处理根 locale 的 sidebar
      replaceWithPlaceholder(site.themeConfig?.sidebar)

      // 处理所有 i18n locale 各自的 sidebar
      if (site.locales) {
        for (const localeKey of Object.keys(site.locales)) {
          replaceWithPlaceholder(site.locales[localeKey].themeConfig?.sidebar)
        }
      }
    },
  }
}
