# @knewbeing/vitepress-plugin-autosidebar-toc

自动生成 VitePress 侧边栏、导航栏和文章列表的一站式插件。

支持自动扫描 Markdown 文档、生成目录树、创建侧边栏配置、提取元数据，并提供开箱即用的 BlogHome 和 AutoToc 组件。

## 功能特性

- 🚀 **自动侧边栏生成** - 根据目录结构自动生成 VitePress 侧边栏配置
- 📚 **文章索引** - 提取 Frontmatter 元数据，生成文章列表和目录树
- 🏠 **博客首页组件** - 开箱即用的 BlogHome 组件，支持封面、摘要、标签展示
- 📝 **TOC 组件** - AutoToc 和 SidebarArticleList 组件用于文章导航
- 🔍 **虚拟模块** - 通过虚拟模块访问 doctree 数据，实现实时更新
- 🛠️ **高度可定制** - 支持自定义排序、过滤、导航插件等
- 📦 **增量更新** - 开发模式支持增量更新，提升开发体验

## 安装

```bash
npm install @knewbeing/vitepress-plugin-autosidebar-toc
# 或
pnpm add @knewbeing/vitepress-plugin-autosidebar-toc
```

## 快速开始

### 在 VitePress Config 中使用

```typescript
// .vitepress/config.ts
import { createTocSidebarVitePlugin } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  vite: {
    plugins: [
      createTocSidebarVitePlugin({
        baseDir: resolve(__dirname, '../'),
        scanDirs: ['docs/', 'posts/'],
        docMetadataFileName: 'frontmatter',
      }),
    ],
  },
  // ... 其他配置
}
```

### 在主题中注册组件

```typescript
// .vitepress/theme/index.ts
import { createTocSidebarComponentResolver } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import Components from 'unplugin-vue-components/vite'

export default {
  enhanceApp({ app }) {
    app.use(Components, {
      resolvers: [createTocSidebarComponentResolver()],
    })
  },
}
```

## 核心导出 API

### 插件主入口

#### `createTocSidebarVitePlugin(options: TocSidebarBuildOptions): Plugin`

创建用于 VitePress 的自动侧边栏与导航生成插件。

该插件会扫描 Markdown 文档目录，构建目录树、sidebar、可选 nav，并在开发阶段支持增量更新与调试 doctree 输出。

**参数：**

- `options` - 插件配置选项

**返回：** 标准 Vite 插件实例

### 组件解析器

#### `createTocSidebarComponentResolver(options?: TocSidebarComponentResolverOptions): ComponentResolver`

创建插件所有组件的统一按需自动导入解析器。

可通过 `options` 按组件名单独覆盖注册别名 (`componentName`) 或来源路径 (`from`)。

**示例：**

```typescript
// 使用默认配置
Components({ resolvers: [createTocSidebarComponentResolver()] })

// 自定义某个组件的来源路径
Components({
  resolvers: [
    createTocSidebarComponentResolver({
      BlogHome: { from: 'my-pkg/BlogHome.vue' },
    }),
  ],
})
```

## 提供的组件

### BlogHome (推荐)

博客首页组件，展示文章卡片列表。

**属性：**

- `entries` - 文章元数据数组
- `maxDisplayArticles` - 最多显示的文章数（可选）

**示例：**

```vue
<template>
  <BlogHome :entries="articles" :maxDisplayArticles="12" />
</template>

<script setup>
import { useBlogHome } from '@knewbeing/vitepress-plugin-autosidebar-toc/client/useBlogHome'

const articles = useBlogHome()
</script>
```

### AutoToc

文章目录导航组件，显示当前文档的标题层级。

**属性：**

- `entries` - 目录条目数组

**示例：**

```vue
<template>
  <AutoToc :entries="tocEntries" />
</template>

<script setup>
import { useTocEntries } from '@knewbeing/vitepress-plugin-autosidebar-toc/client/useTocEntries'

const tocEntries = useTocEntries()
</script>
```

### SidebarArticleList

侧边栏文章列表组件，显示特定分类的文章。

## 类型定义

### `TocSidebarBuildOptions`

插件主配置选项接口。

```typescript
export interface TocSidebarBuildOptions {
  /** 扫描的基础目录 */
  baseDir: string

  /** 要扫描的子目录列表 */
  scanDirs?: string[]

  /** 虚拟模块输出路径 */
  outputVirtualModule?: boolean

  // ... 更多选项见源码
}
```

### `TocSidebarComponentResolverOptions`

组件解析器配置选项。

```typescript
export interface TocSidebarComponentResolverOptions {
  AutoToc?: AutoTocResolverOptions
  SidebarArticleList?: AutoTocResolverOptions
  BlogHome?: AutoTocResolverOptions
}
```

### 文章元数据

```typescript
export interface TocSidebarFileEntry {
  title: string | null
  path: string
  createdAt: string | null
  updatedAt: string | null
  excerpt: string | null
  cover: string | null
}
```

## 虚拟模块

通过虚拟模块访问构建时生成的 doctree：

```typescript
import doctree from 'virtual:@knewbeing/toc-sidebar-doctree'

console.log(doctree)  // 完整的目录树和文章元数据
```

## TypeScript 支持

本包完全采用 TypeScript 编写，提供完整的类型定义文件。所有导出类型和函数均带有详细的 JSDoc 注释。

## 配置示例

更详细的配置示例见 [VitePress 官方文档](https://vitepress.dev)。

## 许可证

MIT

## 相关链接

- [项目仓库](https://github.com/calmripple/calmripple.github.io)
- [VitePress 官方文档](https://vitepress.dev)
- [Nolebase 集成文档](https://nolebase.vercel.app)
