# @knewbeing/vitepress-plugin-nolebase

Vendored nolebase integrations for VitePress — a local, fork-free copy of the nolebase plugin suite, rewritten to resolve all cross-package imports locally.

## Attribution

Source code derived from [@nolebase/integrations](https://github.com/nolebase/integrations) (MIT).  
See [NOTICE.md](./NOTICE.md) for full attribution details.

## Included Packages

| Local module | Original package |
|---|---|
| `vitepress/client` | `@nolebase/integrations/vitepress/client` |
| `vitepress/vite` | `@nolebase/integrations/vitepress/vite` |
| `vitepress/markdown-it` | `@nolebase/integrations/vitepress/markdown-it` |
| `meta/vitepress` | `@nolebase/vitepress-plugin-meta` |
| `enhanced-readabilities/*` | `@nolebase/vitepress-plugin-enhanced-readabilities` |
| `highlight-targeted-heading/*` | `@nolebase/vitepress-plugin-highlight-targeted-heading` |
| `git-changelog/*` | `@nolebase/vitepress-plugin-git-changelog` |
| `inline-link-preview/*` | `@nolebase/vitepress-plugin-inline-link-preview` |
| `index-plugin/*` | `@nolebase/vitepress-plugin-index` |
| `enhanced-mark/*` | `@nolebase/vitepress-plugin-enhanced-mark` |
| `ui` | `@nolebase/ui` |

## Usage

```ts
// .vitepress/config.ts
import { presetVite } from '@knewbeing/vitepress-plugin-nolebase/vitepress/vite'
import { transformHeadMeta } from '@knewbeing/vitepress-plugin-nolebase/meta/vitepress'

// .vitepress/theme/index.ts
import { presetClient } from '@knewbeing/vitepress-plugin-nolebase/vitepress/client'

// markdown config
import { presetMarkdownIt } from '@knewbeing/vitepress-plugin-nolebase/vitepress/markdown-it'
```
