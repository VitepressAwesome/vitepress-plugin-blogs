# @knewbeing/utils

跨平台、ESM-first 的工具库，为 VitePress 项目提供通用的路径处理、类型检测和文本清洗能力。

## 功能特性

- **路径处理** - 跨平台路径分隔符转换、绝对路径标准化
- **类型检测** - 运行时类型保护、对象记录判断
- **文本清洗** - HTML 标签移除、显示文本清洁
- **ESM 支持** - 完整的 ESM/CJS 双环境支持，包括 `import.meta.url` 安全获取

## 安装

```bash
npm install @knewbeing/utils
# 或
pnpm add @knewbeing/utils
```

## 导出 API

### 路径处理

#### `toPosixPath(path: string): string`

将平台相关的路径分隔符统一转换为 `/`。

```typescript
import { toPosixPath } from '@knewbeing/utils'

toPosixPath('C:\\Users\\project\\file.ts')  // 'C:/Users/project/file.ts'
```

#### `toNormalizedAbsolutePath(path: string): string`

将路径解析为绝对路径，并标准化为小写的 POSIX 风格路径。

适合用于跨平台比较、缓存键生成等需要稳定路径标识的场景。

```typescript
import { toNormalizedAbsolutePath } from '@knewbeing/utils'

toNormalizedAbsolutePath('./src/../utils')  // '/absolute/path/to/utils'
```

### 类型检测

#### `isRecord(value: unknown): value is Record<string, unknown>`

判断一个值是否为普通对象记录。该函数会排除 `null` 和数组，适合在运行时收窄为 `Record<string, unknown>`。

```typescript
import { isRecord } from '@knewbeing/utils'

isRecord({ a: 1 })      // true
isRecord([1, 2])        // false
isRecord(null)          // false
isRecord('string')      // false
```

#### `isESM(): boolean`

判断当前运行环境是否为 ESM 语义环境。

当 `__filename` 或 `__dirname` 不可用时返回 `true`。

```typescript
import { isESM } from '@knewbeing/utils'

if (isESM()) {
  console.log('Running in ESM mode')
}
```

### 文本清洗

#### `removeHtmlLikeTagsSafely(input: string): string`

迭代移除文本中的 HTML-like 标签内容外壳。

适合用于清洗标题、摘要等可能混入简单 HTML 标记的展示文本。

```typescript
import { removeHtmlLikeTagsSafely } from '@knewbeing/utils'

removeHtmlLikeTagsSafely('<b>Bold</b> text')  // 'Bold text'
removeHtmlLikeTagsSafely('<p>Para <b>bold</b></p>')  // 'Para bold'
```

#### `sanitizeTextCandidate(value: unknown): string | undefined`

将任意输入清洗为可展示的文本候选值。

非字符串输入会返回 `undefined`；字符串输入会移除 HTML-like 标签并执行 `trim()`。

```typescript
import { sanitizeTextCandidate } from '@knewbeing/utils'

sanitizeTextCandidate('  <b>Text</b>  ')  // 'Text'
sanitizeTextCandidate(123)                // undefined
sanitizeTextCandidate('')                 // undefined
```

### 目录获取

#### `getDirName(importMetaUrl?: string): string`

获取指定模块 URL 对应的目录名。

- **CJS 环境**：直接返回 `__dirname`
- **ESM 环境**：使用调用方显式传入的 `import.meta.url`；未传入时尝试自动获取

```typescript
import { getDirName } from '@knewbeing/utils'

// ESM - 显式传入（推荐）
const dir = getDirName(import.meta.url)

// ESM - 自动获取（备选）
const dir = getDirName()

// CJS
const dir = getDirName()
```

## TypeScript 支持

本包完全采用 TypeScript 编写，提供完整的类型定义。所有导出函数均带有详细的 JSDoc 注释和类型守护。

## 许可证

MIT

## 相关链接

- [项目仓库](https://github.com/calmripple/calmripple.github.io)
- [VitePress 官方文档](https://vitepress.dev)
