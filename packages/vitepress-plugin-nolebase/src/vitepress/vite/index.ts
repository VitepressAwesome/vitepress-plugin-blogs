// Derived from @nolebase/integrations (MIT) https://github.com/nolebase/integrations
import type { Plugin } from 'vite'

import type { PresetVite, PresetViteOptions } from './types'

import { join } from 'node:path'

import defu from 'defu'

import { GitChangelog, GitChangelogMarkdownSection } from '../../git-changelog/vite/index.ts'

export function presetVite(options: PresetViteOptions): PresetVite {
  const opts = defu<PresetViteOptions, PresetViteOptions[]>(options, {
    gitChangelog: {
      options: {
        gitChangelog: {
          maxGitLogCount: 2000,
        },
        markdownSection: {
          excludes: [
            join('pages', 'en', 'index.md'),
            join('pages', 'zh-CN', 'index.md'),
            join('README.md'),
            join('index.md'),
          ],
        },
      },
    },
  })

  const plugins: Plugin[] = []

  if (opts.gitChangelog) {
    plugins.push(GitChangelog(opts.gitChangelog.options.gitChangelog))
    plugins.push(GitChangelogMarkdownSection(opts.gitChangelog.options.markdownSection))
  }

  return {
    name: 'nolebase:vitepress',
    plugins: () => plugins || [],
    config: () => {
      return {
        optimizeDeps: {
          exclude: [
            'vitepress',
            '@knewbeing/vitepress-plugin-nolebase',
          ],
        },
        ssr: {
          noExternal: [
            '@knewbeing/vitepress-plugin-nolebase',
          ],
        },
      }
    },
  }
}
