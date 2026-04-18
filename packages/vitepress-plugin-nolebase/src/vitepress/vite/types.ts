import type { GitChangelogMarkdownSectionOptions, GitChangelogOptions } from '@knewbeing/vitepress-plugin-git-changelog/vite/types'
import type { Plugin } from 'vite'

export interface PresetVite extends Plugin {
  plugins: () => Plugin[]
}

export interface PresetViteOptions {
  gitChangelog: false | {
    options: {
      gitChangelog: GitChangelogOptions
      markdownSection?: GitChangelogMarkdownSectionOptions
    }
  }
}
