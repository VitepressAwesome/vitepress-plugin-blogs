/**
 * VitePress 自动化组件解析器
 *
 * 用于 `unplugin-vue-components` 的组件自动导入解析。
 * 提供三个内置组件的统一注册方式：
 * - AutoToc: 文章目录导航
 * - BlogHome: 博客首页展示
 * - SidebarArticleList: 侧边栏文章列表
 *
 * @module @knewbeing/vitepress-plugin-autosidebar-toc/client/resolvers
 */

import type { ComponentResolver } from 'unplugin-vue-components/types'
import type { TocSidebarComponentResolverOptions } from '../types'

const COMPONENT_MAP: Record<string, string> = {
  AutoToc: '@knewbeing/vitepress-plugin-autosidebar-toc/client/AutoToc.vue',
  SidebarArticleList: '@knewbeing/vitepress-plugin-autosidebar-toc/client/SidebarArticleList.vue',
  BlogHome: '@knewbeing/vitepress-plugin-autosidebar-toc/client/BlogHome.vue',
  TagsCloud: '@knewbeing/vitepress-plugin-autosidebar-toc/client/TagsCloud.vue',
}

/**
 * 创建插件所有组件的统一按需自动导入解析器。
 *
 * 可通过 `options` 按组件名单独覆盖注册别名（`componentName`）或来源路径（`from`）。
 *
 * @param options 各组件的可选覆盖配置。
 * @returns 可供 `unplugin-vue-components` 使用的组件解析器。
 *
 * @example
 * ```ts
 * // 使用默认配置
 * Components({ resolvers: [createTocSidebarComponentResolver()] })
 *
 * // 自定义某个组件的来源路径
 * Components({
 *   resolvers: [
 *     createTocSidebarComponentResolver({
 *       BlogHome: { from: 'my-pkg/BlogHome.vue' },
 *     }),
 *   ],
 * })
 * ```
 */
export function createTocSidebarComponentResolver(
  options: TocSidebarComponentResolverOptions = {},
): ComponentResolver {
  // 将默认 COMPONENT_MAP 与调用方的覆盖项合并，构建运行时解析表。
  const resolvedMap: Record<string, string> = Object.fromEntries(
    (Object.keys(COMPONENT_MAP) as Array<keyof typeof COMPONENT_MAP>).map((defaultName) => {
      const opt = options[defaultName as keyof TocSidebarComponentResolverOptions]
      const registeredName = opt?.componentName ?? defaultName
      const from = opt?.from ?? COMPONENT_MAP[defaultName]
      return [registeredName, from]
    }),
  )

  return {
    type: 'component',
    resolve(name: string) {
      const from = resolvedMap[name]
      if (!from) return undefined
      return { name: 'default', as: name, from }
    },
  }
}


