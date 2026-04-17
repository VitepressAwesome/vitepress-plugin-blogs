# @knewbeing/vitepress-plugin-remove-sidebar

[![npm version](https://img.shields.io/npm/v/@knewbeing/vitepress-plugin-remove-sidebar.svg)](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-remove-sidebar)
[![license](https://img.shields.io/npm/l/@knewbeing/vitepress-plugin-remove-sidebar.svg)](./LICENSE)

> Vite plugin for VitePress that replaces auto-generated sidebar entries with empty placeholders, keeping the sidebar panel visible for custom slot components.

将 VitePress 自动生成的侧边栏条目替换为空占位组，让侧边栏面板保持可见，同时允许自定义 slot 组件完全接管导航内容。

---

## 背景 / Background

`@knewbeing/vitepress-plugin-autosidebar-toc` 在 `config` 阶段会把扫描到的目录树写入 VitePress 的 `themeConfig.sidebar`。

在某些布局方案中，我们希望：

- VitePress **仍然渲染侧边栏面板**（这样 `sidebar-nav-after` slot 才能挂载自定义的 `<SidebarArticleList />` 组件）
- 但**不显示任何自动生成的导航项**，导航完全由自定义组件接管

若直接把 sidebar 置为空对象或 `undefined`，VitePress 不会渲染侧边栏面板，slot 也就无法挂载。

**本插件的解法**：在 autosidebar-toc 写入 sidebar 之后（`enforce: 'post'`），将每个路径的 sidebar 值替换为 `[{ text: '', items: [] }]`（单个空占位组）：

- VitePress 认为 sidebar 非空，**会渲染侧边栏面板**
- 占位组没有任何导航项，配合 CSS `display: none` 可完全隐藏原始条目
- `sidebar-nav-after` slot 正常挂载，自定义组件可正常渲染

---

## 安装 / Installation

```bash
npm install @knewbeing/vitepress-plugin-remove-sidebar
# or
pnpm add @knewbeing/vitepress-plugin-remove-sidebar
```

---

## 使用 / Usage

在 `.vitepress/config.ts` 中注册插件，**必须放在 autosidebar-toc 插件之后**：

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { createTocSidebarVitePlugin } from '@knewbeing/vitepress-plugin-autosidebar-toc'
import { createRemoveSidebarPlugin } from '@knewbeing/vitepress-plugin-remove-sidebar'

export default defineConfig({
  vite: {
    plugins: [
      // 1. 先生成 sidebar
      createTocSidebarVitePlugin({ dir: './docs' }),
      // 2. 再清空显示内容（保留面板结构）
      createRemoveSidebarPlugin(),
    ],
  },
})
```

然后在布局组件中使用 `sidebar-nav-after` slot 挂载自定义导航：

```vue
<!-- .vitepress/theme/MyLayout.vue -->
<template>
  <Layout>
    <template #sidebar-nav-after>
      <SidebarArticleList />
    </template>
  </Layout>
</template>
```

---

## API

### `createRemoveSidebarPlugin(): VitePlugin`

创建"移除侧边栏显示内容"Vite 插件，无需任何参数。

| 属性 | 值 |
|------|-----|
| 插件名 | `knewbeing:remove-vitepress-sidebar` |
| enforce | `'post'`（在所有 normal/pre 插件之后执行） |

**行为说明：**

- 遍历 `site.themeConfig.sidebar` 的所有 key
- 将每个 key 的值替换为 `[{ text: '', items: [] }]`
- 同时处理所有 i18n locale 下的 `themeConfig.sidebar`

---

## 与其他插件配合 / Works With

| 插件 | 说明 |
|------|------|
| [`@knewbeing/vitepress-plugin-autosidebar-toc`](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-autosidebar-toc) | 自动生成侧边栏（本插件在其之后执行） |

---

## 许可证 / License

[MIT](./LICENSE)

## 相关链接 / Links

- [npm](https://www.npmjs.com/package/@knewbeing/vitepress-plugin-remove-sidebar)
- [源码仓库](https://github.com/VitepressAwesome/vitepress-plugin-blogs)
- [问题反馈](https://github.com/VitepressAwesome/vitepress-plugin-blogs/issues)
