import { computed, type ComputedRef } from 'vue'
import { useData } from 'vitepress'

export interface TocSidebarClientConfig {
  /** SidebarArticleList 每页显示文章数，默认 10 */
  sidebarPageSize?: number
  /** SidebarArticleList 页码按钮数量（少于此值时全显），默认 3 */
  sidebarMaxPageButtons?: number
  /** AutoToc 每页显示文章数，默认 10 */
  tocPageSize?: number
  /** AutoToc 页码按钮数量（少于此值时全显），默认 9 */
  tocMaxPageButtons?: number
}

// 模块级缓存：themeConfig 在整个 SPA 生命周期中不变，
// 共用一个 computed 避免多组件重复订阅 theme ref。
let _cfg: ComputedRef<TocSidebarClientConfig> | null = null

export function useTocSidebarConfig(): ComputedRef<TocSidebarClientConfig> {
  if (!_cfg) {
    const { theme } = useData()
    _cfg = computed<TocSidebarClientConfig>(
      () => (theme.value?.tocSidebar as TocSidebarClientConfig | undefined) ?? {},
    )
  }
  return _cfg
}
