// Derived from @nolebase/integrations (MIT) https://github.com/nolebase/integrations
import type { BiDirectionalLinksOptions } from '../../markdown-it-bi-directional-links/index.ts'
import type { UnlazyImagesOptions } from '../../markdown-it-unlazy-img/index.ts'

import type { PresetMarkdownIt } from './types'

import { cwd } from 'node:process'

import defu from 'defu'

interface MarkdownItOptions {
  bidirectionalLinks?: | { options?: BiDirectionalLinksOptions }
  unlazyImages?: false | { options?: UnlazyImagesOptions }
  inlineLinkPreview?: false | { options?: { tag: string } }
}

export function presetMarkdownIt(options?: MarkdownItOptions): PresetMarkdownIt {
  const opts = defu<MarkdownItOptions, MarkdownItOptions[]>(options, {
    bidirectionalLinks: {
      options: {
        dir: cwd(),
      },
    },
    unlazyImages: {
      options: {
        imgElementTag: 'NolebaseUnlazyImg',
      },
    },
    inlineLinkPreview: true as any,
  })

  return {
    async install(md) {
      if (opts.bidirectionalLinks) {
        const { BiDirectionalLinks } = await import('../../markdown-it-bi-directional-links/index')
        md.use(BiDirectionalLinks(opts.bidirectionalLinks.options))
      }
      if (opts.unlazyImages) {
        const { UnlazyImages } = await import('../../markdown-it-unlazy-img/index')
        md.use(UnlazyImages(), opts.unlazyImages.options)
      }

      if (opts.inlineLinkPreview) {
        const { InlineLinkPreviewElementTransform } = await import('../../inline-link-preview/markdown-it/index')
        md.use(InlineLinkPreviewElementTransform, opts.inlineLinkPreview.options)
      }
    },
  }
}
