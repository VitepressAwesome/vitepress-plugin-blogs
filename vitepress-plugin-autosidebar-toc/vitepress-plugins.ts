import type { Plugin as VitePlugin } from 'vite'

/**
 * 最小补丁：将 autosidebar-toc 插件注入的 sidebar 条目替换为空占位组，
 * 使 VitePress 仍然渲染侧边栏面板（`sidebar-nav-after` slot 才能挂载），
 * 但不显示任何原始导航项。占位组通过 CSS 隐藏。
 */
export function createRemoveSidebarPlugin(): VitePlugin {
  return {
    name: 'remove-vitepress-sidebar',
    enforce: 'post',
    config(config) {
      const site = (config as any).vitepress?.site
      if (!site)
        return

      const replaceWithPlaceholder = (sidebar: Record<string, any> | undefined) => {
        if (!sidebar)
          return
        for (const key of Object.keys(sidebar)) {
          sidebar[key] = [{ text: '', items: [] }]
        }
      }

      replaceWithPlaceholder(site.themeConfig?.sidebar)
      if (site.locales) {
        for (const localeKey of Object.keys(site.locales)) {
          replaceWithPlaceholder(site.locales[localeKey].themeConfig?.sidebar)
        }
      }
    },
  }
}
