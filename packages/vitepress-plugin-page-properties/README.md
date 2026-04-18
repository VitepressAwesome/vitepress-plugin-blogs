# @knewbeing/vitepress-plugin-page-properties

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-page-properties.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-page-properties)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-page-properties.svg)](./LICENSE)

> Fully self-contained VitePress page-properties plugin. Displays word count and estimated reading time for each Markdown page. No external UI framework dependency.

完全自包含的 VitePress 页面属性插件。自动统计每篇 Markdown 文章的字数与预计阅读时间，并渲染属性面板。无任何外部 UI 框架依赖。

---

## 功能特性 / Features

- 📊 **多语言字数统计** — 中文（300字/分钟）、日文（400字/分钟）、拉丁/西里尔（160词/分钟）
- ⏱ **阅读时间估算** — 基于字数和语言类型自动计算，向上取整到分钟
- 🔌 **虚拟模块** — `virtual:knewbeing-page-properties`，客户端按需访问
- ⚡ **HMR 支持** — dev 模式下修改文章内容后属性面板实时更新
- 🎨 **自有 Vue 组件** — 提供只读的 `PageProperties.vue` 和 dev 模式的 `PagePropertiesEditor.vue`
- 🚫 **无外部依赖** — 不依赖 `@nolebase/vitepress-plugin-page-properties`，完全独立实现
- 📝 **Frontmatter 禁用** — 支持逐篇文章关闭属性面板

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-page-properties
# or
pnpm add @knewbeing/vitepress-plugin-page-properties
```

---

## 快速开始 / Quick Start

### 1. 注册 Vite 插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { createPagePropertiesPlugin } from '@knewbeing/vitepress-plugin-page-properties'

export default defineConfig({
  vite: {
    plugins: [
      ...createPagePropertiesPlugin(),
    ],
  },
})
```

### 2. 注册 Vue 组件

```ts
// .vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PageProperties from '@knewbeing/vitepress-plugin-page-properties/client/PageProperties.vue'
import PagePropertiesEditor from '@knewbeing/vitepress-plugin-page-properties/client/PagePropertiesEditor.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('KnewbeingPageProperties', PageProperties)
    app.component('KnewbeingPagePropertiesEditor', PagePropertiesEditor)
  },
} satisfies Theme
```

完成！插件会自动在每篇文章的 H1 标题下方注入属性面板。

---

## API

### `createPagePropertiesPlugin(options?): VitePlugin[]`

统一工厂函数，返回包含 3 个插件的数组，按顺序展开即可。

```ts
plugins: [
  ...createPagePropertiesPlugin({
    excludes: ['index.md', 'about.md'],
  }),
]
```

**`options` 参数（`PagePropertiesMarkdownSectionOptions`）：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `excludes` | `string[]` | `['index.md']` | 按相对路径排除的文件，不注入组件标签 |
| `exclude` | `(id, ctx) => boolean` | `() => false` | 自定义排除函数，返回 `true` 则跳过 |

---

### `PageProperties(): VitePlugin`

核心数据收集插件（单独使用时）：

- `enforce: 'pre'` — 在 VitePress 的 Markdown 处理之前执行，读取原始 frontmatter
- 通过 `virtual:knewbeing-page-properties` 虚拟模块暴露数据
- dev 模式支持 HMR：监听 `knewbeing-page-properties:client-mounted` 事件

---

### `PagePropertiesMarkdownSection(options?): VitePlugin`

Markdown 注入插件（单独使用时）：

在每个 `.md` 文件的 H1 标题之后自动插入组件标签：

- dev 模式注入 `<KnewbeingPagePropertiesEditor />`
- build 模式注入 `<KnewbeingPageProperties />`

---

### `createPagePropertiesDevPatch(): VitePlugin`

HMR 补丁插件（单独使用时，仅 serve 模式生效）：

解决 dev 模式下虚拟模块被 Vite 缓存为空对象的问题，在每个 `.md` transform 完成后主动触发虚拟模块失效，确保属性面板显示最新数据。

---

## 虚拟模块 / Virtual Module

```ts
import data from 'virtual:knewbeing-page-properties'
// data: Record<string, { wordsCount: number; readingTime: number }>
// key: 相对路径小写，如 'zh-cn/posts/hello.md'
```

TypeScript 类型声明已包含在 `client.d.ts` 中，需在 `tsconfig.json` 中引用：

```json
{
  "compilerOptions": {
    "types": ["@knewbeing/vitepress-plugin-page-properties/client"]
  }
}
```

---

## 按篇禁用 / Per-Page Disable

在文章 frontmatter 中添加以下任意一种即可禁用该页的属性面板：

```yaml
---
pageProperties: false
---
```

或：

```yaml
---
knewbeing:
  pageProperties: false
---
```

---

## 类型导出 / Exported Types

```ts
import type {
  PagePropertyData,    // { wordsCount: number; readingTime: number }
  PagePropertiesData,  // Record<string, PagePropertyData>
  PagePropertiesMarkdownSectionOptions,
} from '@knewbeing/vitepress-plugin-page-properties'
```

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-page-properties)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [问题反馈](https://github.com/VitepressAwesome/vitepress-plugin-blogs/issues)
