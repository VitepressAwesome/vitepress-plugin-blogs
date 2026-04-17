import { toPosixPath } from '@knewbeing/utils'

// 将 markdown 相对路径转换为 VitePress 路由路径。
export function toVitePressRoutePath(relativeMdPath: string): string {
  let link = toPosixPath(relativeMdPath)
  if (link.endsWith('.md')) {
    link = link.slice(0, -3)
  }
  if (link.endsWith('/index')) {
    link = link.slice(0, -6)
  }
  if (!link.startsWith('/')) {
    link = `/${link}`
  }
  return link || '/'
}

// 将路径转换为目录路由（以 / 结尾）。
export function toVitePressDirectoryRoute(relativeMdPath: string): string {
  const link = toVitePressRoutePath(relativeMdPath)
  if (link === '/') {
    return '/'
  }
  return link.endsWith('/') ? link : `${link}/`
}

// 根据是否 index 文件生成页面或目录路由。
export function toVitePressPageRoute(relativeMdPath: string): string {
  const normalized = toPosixPath(relativeMdPath)
  const isIndexFile = normalized === 'index.md' || normalized.endsWith('/index.md')
  return isIndexFile ? toVitePressDirectoryRoute(relativeMdPath) : toVitePressRoutePath(relativeMdPath)
}
