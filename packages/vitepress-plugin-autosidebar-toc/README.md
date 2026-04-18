# @knewbeing/vitepress-plugin-autosidebar-toc

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-autosidebar-toc.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-autosidebar-toc)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-autosidebar-toc.svg)](./LICENSE)

> All-in-one VitePress plugin: auto-generate sidebar, navigation, and blog components from your Markdown files.

自动生成 VitePress 侧边栏、导航栏和文章列表的一站式插件。支持自动扫描 Markdown 文档、生成目录树、创建侧边栏配置、提取元数据，并提供开箱即用的 AutoToc 组件。

---

## 功能特性 / Features

- 🚀 **自动侧边栏** — 根据目录结构自动生成 VitePress `themeConfig.sidebar`
- 🗺 **自动导航** — 可选自动生成 `themeConfig.nav`，支持多级下拉
- 📚 **文章索引** — 提取 Frontmatter 元数据（标题、日期、标签、摘要、封面）
- 📝 **AutoToc 组件** — 博客首页文章列表（分页、标签过滤）+ 文章内目录导航
- 📋 **SidebarArticleList 组件** — 侧边栏文章列表，可按目录过滤
- 🖼 **ThumbHash 封面占位** — 自动为本地封面图生成低清占位（~30 bytes），渐进加载
- 🔍 **虚拟模块** — `virtual:@knewbeing/toc-sidebar-doctree`，按需获取目录树数据
- 📦 **增量更新** — dev 模式支持增量更新，文件变更后自动重计算
- 🛠 **高度可定制** — 支持自定义排序、过滤规则、导航插件等

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-autosidebar-toc
# or
pnpm add @knewbeing/vitepress-plugin-autosidebar-toc
```

### 可选：ThumbHash 封面占位

若需要为**本地封面图**生成低清占位（ThumbHash），需额外安装 `sharp`：

```bash
npm install sharp
# or
pnpm add sharp
```

`sharp` 是可选 peerDependency。未安装时封面图退化为普通 `loading="lazy"` 懒加载，不影响其他功能。

---

## 快速开始 / Quick Start

### 1. 注册 Vite 插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { createTocSidebarVitePlugin } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  vite: {
    plugins: [
      createTocSidebarVitePlugin({
        dir: resolve(__dirname, '../'),     // 文档根目录
        roots: ['zh-CN/posts'],             // 作为侧边栏根的目录
        includeGlobs: ['**/*.md'],
        excludeGlobs: ['**/node_modules/**'],
        collapsed: false,
        debug: false,
        nav: {
          navBuilder: [
            { text: '首页', link: '/' },
            { navDir: 'zh-CN/posts', level: 1 },
          ],
        },
      }),
    ],
  },
})
```

### 2. 注册 Vue 组件（按需自动导入）

```ts
// .vitepress/config.ts（vite.plugins 中）
import { createTocSidebarComponentResolver } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import Components from 'unplugin-vue-components/vite'

plugins: [
  createTocSidebarVitePlugin({ ... }),
  Components({
    resolvers: [createTocSidebarComponentResolver()],
  }),
]
```

或在主题中手动注册：

```ts
// .vitepress/theme/index.ts
import AutoToc from '@knewbeing/vitepress-plugin-autosidebar-toc/client/AutoToc.vue'
import SidebarArticleList from '@knewbeing/vitepress-plugin-autosidebar-toc/client/SidebarArticleList.vue'

export default {
  enhanceApp({ app }) {
    app.component('AutoToc', AutoToc)
    app.component('SidebarArticleList', SidebarArticleList)
  }
}
```

---

## 插件配置 / Plugin Options

### `TocSidebarBuildOptions`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `dir` | `string` | ✅ | — | 文档根目录（绝对路径） |
| `roots` | `string[]` | — | `[]` | 作为侧边栏独立根节点的子目录 |
| `includeGlobs` | `string[]` | — | `['**/*.md']` | 参与扫描的 glob 规则 |
| `excludeGlobs` | `string[]` | — | `[]` | 扫描时排除的 glob 规则 |
| `showMarkdownLinks` | `boolean` | — | `false` | 链接是否保留 `.md` 后缀 |
| `includeDotFiles` | `boolean` | — | `false` | 是否包含点文件/点目录 |
| `collapsed` | `boolean` | — | `false` | 侧边栏目录节点默认是否折叠 |
| `debug` | `boolean` | — | `false` | 在 dev 阶段写入 doctree 调试 JSON |
| `nav` | `TocSidebarNavOptions` | — | — | 顶部导航生成配置 |

### `TocSidebarNavOptions`

| 参数 | 类型 | 说明 |
|------|------|------|
| `insertMode` | `'replace' \| number` | `'replace'` 替换已有 nav；`number` 在指定位置插入 |
| `navBuilder` | `(NavItem \| AutoNavOption)[]` | 按顺序构建 nav 的混合数组 |
| `order` | `string[]` | 按 text 字段排序 nav 项的顺序 |

### `AutoNavOption`

| 参数 | 类型 | 说明 |
|------|------|------|
| `navDir` | `string` | 要扫描的目录路径（相对于 `dir`） |
| `level` | `number` | 子目录层级，用于生成下拉菜单 |
| `subMenuIncludeGlobs` | `string[]` | 子菜单包含的 glob |
| `subMenuExcludeGlobs` | `string[]` | 子菜单排除的 glob |
| `navOrder` | `'navOrder'` | 设为 `'navOrder'` 时按 frontmatter `navOrder` 字段排序 |

---

## 提供的组件 / Client Components

### `AutoToc`

在首页展示博客文章卡片列表（分页、标签过滤），在文章页展示目录导航，自动跟踪当前阅读标题。

```vue
<template>
  <AutoToc />
</template>
```

封面图（frontmatter 中的 `cover` 或 `image` 字段）会自动生成 **ThumbHash 低清占位**，在图片加载前渲染模糊预览，加载完成后渐入（0.4s）。

### `SidebarArticleList`

侧边栏文章列表，适合挂载在 `sidebar-nav-after` slot。

```vue
<template>
  <Layout>
    <template #sidebar-nav-after>
      <SidebarArticleList />
    </template>
  </Layout>
</template>
```

### `ThumbHashImage`

带 ThumbHash 低清占位的渐进式图片组件，可单独使用：

```vue
<ThumbHashImage
  src="/covers/abc.jpg"
  alt="封面"
  :hash="thumbHashBase64"
/>
```

| prop | 类型 | 说明 |
|------|------|------|
| `src` | `string` | 真实图片 URL |
| `alt` | `string` | 图片 alt 文本 |
| `hash` | `string \| null` | ThumbHash base64 字符串 |

---

## Composables

### `useBlogHome()`

```ts
import { useBlogHome } from '@knewbeing/vitepress-plugin-autosidebar-toc/client/useBlogHome'

const { pagedArticles, allTags, currentPage, totalPages, selectTag, goToPage } = useBlogHome()
```

返回的 `pagedArticles` 每项类型 `BlogArticle`：

```ts
interface BlogArticle {
  title: string
  link: string
  date: string | null
  tags: string[]
  description: string
  cover: string | null
  coverHash: string | null  // ThumbHash base64
}
```

### `useTocEntries()`

```ts
import { useTocEntries } from '@knewbeing/vitepress-plugin-autosidebar-toc/client/useTocEntries'

const tocEntries = useTocEntries()
```

---

## 虚拟模块 / Virtual Module

```ts
import doctree from 'virtual:@knewbeing/toc-sidebar-doctree'
// doctree: TocSidebarDoctreePayload
// 包含所有目录的文件树、文章元数据

// 按需加载单个目录
import { loadNode } from '@knewbeing/vitepress-plugin-autosidebar-toc/client/useTocEntries'
const node = await loadNode('/zh-CN/posts')
```

---

## Frontmatter 约定 / Frontmatter Convention

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 文章标题（覆盖 H1 自动提取） |
| `date` | `string` | 发布日期（ISO 格式） |
| `tags` | `string[]` | 文章标签 |
| `cover` / `image` | `string` | 封面图（相对路径或绝对路径或 URL） |
| `description` / `excerpt` | `string` | 文章摘要 |
| `navOrder` | `number` | 导航项排序权重 |

---

## ThumbHash 封面占位 / ThumbHash Cover Placeholder

插件在构建时自动为**本地封面图**（相对路径）生成 ThumbHash：

1. 使用 `sharp` 将图片缩至 100px 内并解码为 RGBA
2. 用 `thumbhash.rgbaToThumbHash()` 生成约 30 bytes 的 hash
3. 以 base64 字符串存入 doctree，随虚拟模块传给客户端
4. 客户端 `ThumbHashImage.vue` 在 `onMounted` 中解码为 data URL，作为 CSS `background-image` 占位
5. 真实图片加载完成后以 0.4s 过渡渐入

外链（`https://`）和绝对路径（`/`）的封面不生成 hash，直接作为普通懒加载图片。

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-autosidebar-toc)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [问题反馈](https://github.com/VitepressAwesome/vitepress-plugin-blogs/issues)
- [配合使用：vitepress-plugin-remove-sidebar](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-remove-sidebar)
- [配合使用：vitepress-plugin-page-properties](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-page-properties)

