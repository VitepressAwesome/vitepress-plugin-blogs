// Virtual module for toc-sidebar doctree data (manifest with per-directory lazy loaders).
declare module 'virtual:@knewbeing/toc-sidebar-doctree' {
  import type { TocSidebarRawTreeNode } from './types'
  export function loadDirectoryNode(dirKey: string): Promise<TocSidebarRawTreeNode | null>
}

// Per-directory virtual modules (lazy-loaded chunks).
declare module 'virtual:@knewbeing/toc-sidebar-doctree/dir/*' {
  import type { TocSidebarRawTreeNode } from './types'
  const data: TocSidebarRawTreeNode | null
  export default data
}
