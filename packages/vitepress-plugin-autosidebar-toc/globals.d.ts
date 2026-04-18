// Type stubs for optional peer dependencies (installed conditionally by users).
declare module 'sharp' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharp: any
  export default sharp
}
declare module 'thumbhash' {
  export function rgbaToThumbHash(w: number, h: number, rgba: Uint8Array): Uint8Array
  export function thumbHashToDataURL(hash: Uint8Array): string
}

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
