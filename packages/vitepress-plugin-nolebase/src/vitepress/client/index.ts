import type { PresetClientOptions } from './types'
import type { PresetClient, Slots } from './utils/index'

import defu from 'defu'

import {
  LayoutMode,
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesPlugin,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from '@knewbeing/vitepress-plugin-enhanced-readabilities/client'
import {
  NolebaseHighlightTargetedHeading,
  NolebaseNolebaseHighlightTargetedHeadingPlugin,
} from '@knewbeing/vitepress-plugin-highlight-targeted-heading/client'
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
        await import('@knewbeing/vitepress-plugin-enhanced-readabilities/client/style.css')

        const enhancedReadabilitiesOptions = opts.enhancedReadabilities?.options ? [opts.enhancedReadabilities.options] : []
        app.use(NolebaseEnhancedReadabilitiesPlugin, ...enhancedReadabilitiesOptions)
      }

      if (opts.highlightTargetedHeading) {
        await import('@knewbeing/vitepress-plugin-highlight-targeted-heading/client/style.css')

        app.use(NolebaseNolebaseHighlightTargetedHeadingPlugin)
      }

      if (opts.inlineLinkPreview) {
        const { NolebaseInlineLinkPreviewPlugin } = await import('@knewbeing/vitepress-plugin-inline-link-preview/client')
        await import('@knewbeing/vitepress-plugin-inline-link-preview/client/style.css')

        const linkPreviewOptions = opts.inlineLinkPreview?.options ? [opts.inlineLinkPreview.options] : []
        app.use(NolebaseInlineLinkPreviewPlugin, ...linkPreviewOptions)
      }

      if (opts.gitChangelog) {
        const { NolebaseGitChangelogPlugin } = await import('@knewbeing/vitepress-plugin-git-changelog/client')
        await import('@knewbeing/vitepress-plugin-git-changelog/client/style.css')

        const gitChangelogOptions = opts.gitChangelog?.options ? [opts.gitChangelog.options] : []
        app.use(NolebaseGitChangelogPlugin, ...gitChangelogOptions)
      }

      if (opts.enhancedMark)
        await import('@knewbeing/vitepress-plugin-enhanced-mark/client/style.css')

      if (opts.index) {
        const { NolebaseIndexPlugin } = await import('@knewbeing/vitepress-plugin-index/client')
        await import('@knewbeing/vitepress-plugin-index/client/style.css')

        app.use(NolebaseIndexPlugin)
      }
    },
  }
}
