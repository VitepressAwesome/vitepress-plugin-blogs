// Derived from @nolebase/integrations (MIT) https://github.com/nolebase/integrations
import type { PresetClientOptions } from './types'
import type { PresetClient, Slots } from './utils/index.ts'

import defu from 'defu'

import { LayoutMode, NolebaseEnhancedReadabilitiesMenu, NolebaseEnhancedReadabilitiesScreenMenu } from '../../enhanced-readabilities/client/index.ts'
import { NolebaseHighlightTargetedHeading } from '../../highlight-targeted-heading/client/index.ts'
import { h } from 'vue'

function newArrayOfOrPush<K extends PropertyKey, V>(object: Record<K, V[]>, property: K, item: V) {
  if (object[property]) {
    object[property].push(item)
    return
  }

  object[property] = [item]
}

export function presetClient<PagePropertiesObject extends object = any>(options?: PresetClientOptions<PagePropertiesObject>): PresetClient {
  const opts = defu<PresetClientOptions, PresetClientOptions[]>(options, {
    enhancedMark: true as any,
    enhancedReadabilities: {
      options: {
        layoutSwitch: { defaultMode: LayoutMode.SidebarWidthAdjustableOnly },
        spotlight: { defaultToggle: true },
      },
    },
    gitChangelog: {
      options: {
        commitsRelativeTime: true,
      },
    },
    highlightTargetedHeading: true as any,
    index: true as any,
    inlineLinkPreview: true as any,
  })

  return {
    enhanceLayout() {
      const slots: Record<string, Array<() => Slots[number]>> = {}

      if (opts.highlightTargetedHeading)
        newArrayOfOrPush(slots, 'doc-top', () => h(NolebaseHighlightTargetedHeading))

      if (opts.enhancedReadabilities) {
        newArrayOfOrPush(slots, 'nav-bar-content-after', () => h(NolebaseEnhancedReadabilitiesMenu))
        newArrayOfOrPush(slots, 'nav-screen-content-after', () => h(NolebaseEnhancedReadabilitiesScreenMenu))
      }

      return slots
    },
    async enhanceApp({ app }) {
      if (opts.enhancedReadabilities) {
        const { NolebaseEnhancedReadabilitiesPlugin } = await import('../../enhanced-readabilities/client/index')
        await import('../../enhanced-readabilities/client/style.css')

        const enhancedReadabilitiesOptions = opts.enhancedReadabilities?.options ? [opts.enhancedReadabilities.options] : []
        app.use(NolebaseEnhancedReadabilitiesPlugin, ...enhancedReadabilitiesOptions)
      }

      if (opts.highlightTargetedHeading) {
        const { NolebaseNolebaseHighlightTargetedHeadingPlugin } = await import('../../highlight-targeted-heading/client/index')
        await import('../../highlight-targeted-heading/client/style.css')

        app.use(NolebaseNolebaseHighlightTargetedHeadingPlugin)
      }

      if (opts.inlineLinkPreview) {
        const { NolebaseInlineLinkPreviewPlugin } = await import('../../inline-link-preview/client/index')
        await import('../../inline-link-preview/client/style.css')

        const linkPreviewOptions = opts.inlineLinkPreview?.options ? [opts.inlineLinkPreview.options] : []
        app.use(NolebaseInlineLinkPreviewPlugin, ...linkPreviewOptions)
      }

      if (opts.gitChangelog) {
        const { NolebaseGitChangelogPlugin } = await import('../../git-changelog/client/index')
        await import('../../git-changelog/client/style.css')

        const gitChangelogOptions = opts.gitChangelog?.options ? [opts.gitChangelog.options] : []
        app.use(NolebaseGitChangelogPlugin, ...gitChangelogOptions)
      }

      if (opts.enhancedMark)
        await import('../../enhanced-mark/client/style.css')

      if (opts.index) {
        const { NolebaseIndexPlugin } = await import('../../index-plugin/client/index')
        await import('../../index-plugin/client/style.css')

        app.use(NolebaseIndexPlugin)
      }
    },
  }
}
