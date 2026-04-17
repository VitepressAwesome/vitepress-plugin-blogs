import { computed } from 'vue'
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

export function useTocSidebarConfig() {
  const { theme } = useData()
  const cfg = computed<TocSidebarClientConfig>(
    () => (theme.value?.tocSidebar as TocSidebarClientConfig | undefined) ?? {},
  )
  return cfg
}
