NOTICE
======

This package (@knewbeing/vitepress-plugin-nolebase) contains source code derived from the
following open-source project:

  Project:    nolebase/integrations
  Repository: https://github.com/nolebase/integrations
  License:    MIT
  Copyright:  Copyright (c) 2023 Nólëbase Contributors

The following packages were vendored from the nolebase/integrations monorepo:
  - @nolebase/integrations
  - @nolebase/vitepress-plugin-enhanced-readabilities
  - @nolebase/vitepress-plugin-highlight-targeted-heading
  - @nolebase/vitepress-plugin-git-changelog
  - @nolebase/vitepress-plugin-inline-link-preview
  - @nolebase/vitepress-plugin-index
  - @nolebase/vitepress-plugin-enhanced-mark
  - @nolebase/vitepress-plugin-meta
  - @nolebase/markdown-it-bi-directional-links
  - @nolebase/markdown-it-unlazy-img
  - @nolebase/markdown-it-element-transform
  - @nolebase/ui

Source files were modified to:
  1. Rewrite cross-package imports to local relative paths
  2. Remove unused plugin integrations (page-properties, thumbnail-hash)
  3. Update ssr.noExternal patterns for the new package name

Full MIT license text is included below in LICENSE.
