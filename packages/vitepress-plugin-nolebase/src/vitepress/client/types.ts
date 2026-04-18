import type { Options as NolebaseEnhancedReadabilitiesOptions } from '@knewbeing/vitepress-plugin-enhanced-readabilities/client'
import type { Options as NolebaseGitChangelogOptions } from '@knewbeing/vitepress-plugin-git-changelog/client'
import type { Options as NolebaseInlineLinkPreviewOptions } from '@knewbeing/vitepress-plugin-inline-link-preview/client'

export interface PresetClientOptions<PagePropertiesObject extends object = any> {
  enhancedMark?: false
  enhancedReadabilities?: false | { options?: NolebaseEnhancedReadabilitiesOptions }
  gitChangelog?: false | { options?: NolebaseGitChangelogOptions }
  highlightTargetedHeading?: false
  index?: false
  inlineLinkPreview?: false | { options?: NolebaseInlineLinkPreviewOptions }
  thumbnailHash?: false
}
