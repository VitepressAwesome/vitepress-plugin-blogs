// Derived from @nolebase/vitepress-plugin-highlight-targeted-heading (MIT) https://github.com/nolebase/integrations
import type { Plugin } from 'vue'

import NolebaseHighlightTargetedHeading from './components/HighlightTargetedHeading.vue'

export {
  NolebaseHighlightTargetedHeading,
}

const components = {
  NolebaseHighlightTargetedHeading,
}

export const NolebaseNolebaseHighlightTargetedHeadingPlugin: Plugin<any[], any[]> = {
  install(app) {
    for (const key of Object.keys(components))
      app.component(key, components[key as keyof typeof components])
  },
}
