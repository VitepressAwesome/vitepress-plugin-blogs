import type { DefaultTheme } from 'vitepress'

/**
 * Markdown frontmatter 数据结构。
 */
export type Frontmatter = Record<string, any>

/**
 * 最小化的 VitePress 主题配置结构。
 */
export interface ThemeConfigLike {
  /** 侧边栏配置。 */
  sidebar?: DefaultTheme.SidebarMulti

  /** 顶部导航配置。 */
  nav?: DefaultTheme.NavItem[]

  /** 允许保留其它主题扩展字段。 */
  [key: string]: unknown
}

/**
 * 自动从目录生成 nav 项的配置。
 */
export interface AutoNavOption {
  /** 要扫描的目录路径（相对于文档根目录）。 */
  navDir: string
  /** 子目录层级深度，用于生成下拉菜单项。 */
  level: number
  /** 子菜单中包含的 glob 规则。 */
  subMenuIncludeGlobs?: string[]
  /** 子菜单中排除的 glob 规则。 */
  subMenuExcludeGlobs?: string[]
  /** 设为 `"navOrder"` 时按 frontmatter 中的 navOrder 字段排序。 */
  navOrder?: 'navOrder'
}

/**
 * 自动生成顶栏导航时的配置项。
 *
 * `navBuilder` 数组中的每个元素可以是：
 * - 一个普通的 `DefaultTheme.NavItem`（静态导航项，如「主页」）
 * - 一个 `AutoNavOption`（根据目录自动生成导航项）
 *
 * 最终 nav 按 `navBuilder` 数组顺序拼接，再可选根据 `order` 进行排序。
 */
export interface TocSidebarNavOptions {
  /**
   * 注入模式：
   * - `'replace'`：替换已有 nav
   * - `number`：在已有 nav 的指定位置插入
   * @default 'replace'
   */
  insertMode?: 'replace' | number
  /**
   * 导航构建器数组，按顺序构建最终的 nav。
   * 每个元素可以是静态 NavItem 或 AutoNavOption。
   */
  navBuilder?: (DefaultTheme.NavItem | AutoNavOption)[]
  /**
   * 定义 nav 项的排列顺序。
   * 数组中的字符串按顺序匹配 nav 项的 `text` 字段。
   * 匹配到的项按此顺序排在前面，未匹配到的项保留原有相对顺序排在后面。
   */
  order?: string[]
}

/**
 * 生成自动侧边栏与 doctree 的主配置项。
 */
export interface TocSidebarBuildOptions {
  /** 文档根目录。 */
  dir: string

  /** 作为侧边栏根节点的目录列表。 */
  roots?: string[]

  /** 参与扫描的 glob 规则。 */
  includeGlobs?: string[]

  /** 扫描时排除的 glob 规则。 */
  excludeGlobs?: string[]

  /** 是否在生成链接时保留 `.md` 后缀。 */
  showMarkdownLinks?: boolean

  /** 是否包含点文件与点目录。 */
  includeDotFiles?: boolean

  /** 侧边栏目录节点默认是否折叠。 */
  collapsed?: boolean

  /**
   * 开启后会在 dev 阶段将当前 doctree JSON 写入到 process.cwd() 目录，
   * 便于排查目录树与侧边栏生成结果。
   */
  debug?: boolean

  /** 顶部导航生成配置。 */
  nav?: TocSidebarNavOptions
}

/**
 * 单个 Markdown 文件解析后的元数据。
 */
export interface MarkdownMeta {
  /** frontmatter 原始对象。 */
  frontmatter: Frontmatter

  /** 文档内提取出的一级标题。 */
  h1?: string

  /** 解析后的页面标题。 */
  title?: string

  /** 解析后的侧边栏标题。 */
  sidebarTitle?: string

  /** 解析后的标签列表；未提供时为空数组。 */
  tags: string[]

  /** 解析后的页面进度值。 */
  progress?: number

  /** 解析后的创建时间。 */
  createdAt?: Date

  /** 解析后的更新时间。 */
  updatedAt?: Date

  /** 解析后的字数统计。 */
  wordsCount?: number

  /** 解析后的阅读时长（分钟）。 */
  readingTime?: number

  /** 从正文提取的摘要文本。 */
  excerpt?: string

  /** 正文中第一张图片的路径。 */
  firstImage?: string
}

/**
 * 目录树中单个目录节点的索引结构。
 */
export interface DirNode {
  /** 当前目录下的子目录集合。 */
  directories: Set<string>

  /** 当前目录下的 Markdown 文件集合。 */
  files: Set<string>
}

/**
 * doctree 原始树中的单个目录节点。
 */
export interface TocSidebarRawTreeNode {
  /** 目录相对路径。 */
  path: string

  /** 目录项列表。 */
  directoryItems: TocSidebarDirectoryEntry[]

  /** 文件项列表。 */
  fileItems: TocSidebarFileEntry[]
}

/**
 * doctree 原始树结构，键为目录相对路径。
 */
export type TocSidebarRawTree = Record<string, TocSidebarRawTreeNode>

/**
 * 侧边栏中的单个文件项。
 */
export interface TocSidebarFileEntry {
  /** 文件名。 */
  name: string

  /** 相对路径。 */
  path: string

  /** 对应的页面链接。 */
  link: string

  /** 用于展示的标题。 */
  displayText: string

  /** 文件 frontmatter。 */
  frontmatter: Frontmatter

  /** 一级标题；不存在时为 `null`。 */
  h1: string | null

  /** 更新时间（ISO 字符串）；不存在时为 `null`。 */
  updatedAt: string | null

  /** 文章摘要。 */
  excerpt: string | null

  /** 封面图片 URL。 */
  cover: string | null
}

/**
 * 侧边栏中的单个目录项。
 */
export interface TocSidebarDirectoryEntry {
  /** 目录名。 */
  name: string

  /** 目录相对路径。 */
  path: string

  /** 目录链接；若目录没有 index 文件则可能为 `null`。 */
  link: string | null

  /** 用于展示的标题。 */
  displayText: string

  /** 目录对应的 index 文件信息。 */
  indexFile: TocSidebarFileEntry | null
}

/**
 * 写入到调试文件中的 doctree 数据载荷。
 */
export interface TocSidebarDoctreePayload {
  /** 目录树结构。 */
  tree: TocSidebarRawTree
}

/**
 * 经过默认值填充与标准化后的插件配置。
 */
export type ResolvedTocSidebarOptions = Required<Omit<TocSidebarBuildOptions, 'dir' | 'roots' | 'nav'>> & {
  /** 标准化后的导航配置。 */
  nav: Required<TocSidebarNavOptions>
}

/**
 * 运行时插件实例的最小接口。
 */
export interface TocSidebarPlugin {
  /** 插件名称。 */
  name: 'vitepress-plugin-autosidebar-toc'

  /** 生效中的标准化配置。 */
  options: ResolvedTocSidebarOptions

  /** 基于当前状态重新构建侧边栏。 */
  buildSidebar: () => DefaultTheme.SidebarMulti
}

/**
 * AutoToc 组件自动解析器的配置项。
 */
export interface AutoTocResolverOptions {
  /** 需要匹配的组件名。 */
  componentName?: string

  /** 组件来源路径。 */
  from?: string
}

/**
 * `AutoTocResolverOptions` 的别名，便于兼容不同命名。
 */
export type TocSidebarResolverOptions = AutoTocResolverOptions

/**
 * `createTocSidebarComponentResolver` 的统一配置项。
 *
 * 可按组件名单独覆盖 `componentName`（注册别名）与 `from`（来源路径）。
 */
export interface TocSidebarComponentResolverOptions {
  /** {@link AutoToc} 组件的覆盖配置。 */
  AutoToc?: AutoTocResolverOptions
  /** {@link SidebarArticleList} 组件的覆盖配置。 */
  SidebarArticleList?: AutoTocResolverOptions
  /** {@link BlogHome} 组件的覆盖配置。 */
  BlogHome?: AutoTocResolverOptions
}

/**
 * 当前插件会读取的最小 Vite 用户配置结构。
 */
export interface ViteUserConfigLike {
  /** 项目根目录。 */
  root?: string

  /** 静态资源目录。 */
  publicDir?: string | false

  /** 注入到构建阶段的常量定义。 */
  define?: Record<string, string>

  /** VitePress 站点配置。 */
  vitepress?: {
    site?: {
      /** 默认主题配置。 */
      themeConfig?: ThemeConfigLike

      /** 多语言主题配置。 */
      locales?: Record<string, { themeConfig?: ThemeConfigLike }>
    }
  }
}

