// Derived from @nolebase/vitepress-plugin-git-changelog (MIT) https://github.com/nolebase/integrations
declare module 'virtual:nolebase-git-changelog' {
  import type { Changelog } from './types'

  const changelog: Changelog
  export default changelog
}
