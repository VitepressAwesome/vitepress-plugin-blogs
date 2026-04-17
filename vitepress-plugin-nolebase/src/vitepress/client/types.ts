// Derived from @nolebase/integrations (MIT) https://github.com/nolebase/integrations
import type { Options as NolebaseEnhancedReadabilitiesOptions } from '../../enhanced-readabilities/client/index.ts'
import type { Options as NolebaseGitChangelogOptions } from '../../git-changelog/client/index.ts'
import type { Options as NolebaseInlineLinkPreviewOptions } from '../../inline-link-preview/client/index.ts'

export interface PresetClientOptions<PagePropertiesObject extends object = any> {
  enhancedMark?: false
  enhancedReadabilities?: false | { options?: NolebaseEnhancedReadabilitiesOptions }
  gitChangelog?: false | { options?: NolebaseGitChangelogOptions }
  highlightTargetedHeading?: false
  index?: false
  inlineLinkPreview?: false | { options?: NolebaseInlineLinkPreviewOptions }
  thumbnailHash?: false
}
