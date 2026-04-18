/**
 * 虚拟模块类型声明
 * @knewbeing/vitepress-plugin-page-properties
 */

declare module 'virtual:knewbeing-page-properties' {
  import type { PagePropertiesData } from '@knewbeing/vitepress-plugin-page-properties'
  const data: PagePropertiesData
  export default data
}
