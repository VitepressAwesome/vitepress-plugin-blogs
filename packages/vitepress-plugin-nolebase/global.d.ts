// Type declarations for virtual modules and asset imports in @knewbeing/vitepress-plugin-nolebase

declare module 'virtual:nolebase-git-changelog' {
  import type { Commit } from './src/git-changelog/types'
  const changelog: Record<string, Commit[]>
  export default changelog
}

declare module '*.yaml' {
  const content: Record<string, any>
  export default content
}

declare module '*.yml' {
  const content: Record<string, any>
  export default content
}
