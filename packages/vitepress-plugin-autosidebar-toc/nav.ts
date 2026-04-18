// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import type { DefaultTheme } from 'vitepress'
import type { AutoNavOption, DirNode, MarkdownMeta } from './types'
import { toVitePressDirectoryRoute, toVitePressPageRoute } from './routing'
import { computeDirectoryDisplayTitle } from './markdown'

// Escape special regex characters in a directory path so it can be used in activeMatch.
function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build an activeMatch pattern that matches any URL under the given directory path.
function buildActiveMatch(directoryPath: string): string {
  return `^/${escapeForRegex(directoryPath)}/`
}

// 类型守卫：判断 navBuilder 元素是否为 AutoNavOption。
export function isAutoNavOption(item: DefaultTheme.NavItem | AutoNavOption): item is AutoNavOption {
  return 'navDir' in item && typeof (item as AutoNavOption).navDir === 'string'
}

// 字符串去重并排序。
function toSortedUniqueStrings(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

// 为目录解析可用的导航链接（优先 index）。
export function resolveDirectoryNavLink(
  directoryPath: string,
  tree: Map<string, DirNode>,
): string | undefined {
  const node = tree.get(directoryPath)
  if (!node) {
    return undefined
  }

  if (node.files.has('index.md')) {
    return toVitePressDirectoryRoute(`${directoryPath}/index.md`)
  }

  const directMarkdownFiles = [...node.files]
    .filter(fileName => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort((left, right) => left.localeCompare(right))

  if (directMarkdownFiles.length > 0) {
    return toVitePressPageRoute(`${directoryPath}/${directMarkdownFiles[0]}`)
  }

  const children = [...node.directories].sort((left, right) => left.localeCompare(right))
  for (const childName of children) {
    const childPath = `${directoryPath}/${childName}`
    const nestedLink = resolveDirectoryNavLink(childPath, tree)
    if (nestedLink) {
      return nestedLink
    }
  }

  return undefined
}

// 根据文件路径与层级规则收集 nav 目录候选。
export function collectCandidateNavDirectories(
  scannedFiles: string[],
  roots: string[],
  navLevel: number,
): string[] {
  const candidates = new Set<string>()

  for (const filePath of scannedFiles) {
    const segments = filePath.split('/').filter(Boolean)
    if (segments.length < 2) {
      continue
    }

    const directorySegments = segments.slice(0, -1)
    if (directorySegments.length === 0) {
      continue
    }

    if (roots.length > 0) {
      for (const root of roots) {
        const rootSegments = root.split('/').filter(Boolean)
        const startsWithRoot = rootSegments.every(
          (segment, index) => directorySegments[index] === segment,
        )

        if (!startsWithRoot) {
          continue
        }

        const absoluteLevel = rootSegments.length + navLevel - 1
        if (directorySegments.length < absoluteLevel) {
          continue
        }

        const candidate = directorySegments.slice(0, absoluteLevel).join('/')
        if (candidate) {
          candidates.add(candidate)
        }
      }
      continue
    }

    if (directorySegments.length >= navLevel) {
      const candidate = directorySegments.slice(0, navLevel).join('/')
      if (candidate) {
        candidates.add(candidate)
      }
    }
  }

  return toSortedUniqueStrings(candidates)
}

// 构建单个目录对应的 nav 项。
export async function buildNavItemForDirectory(
  directoryPath: string,
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<DefaultTheme.NavItemWithLink | undefined> {
  if (!sourceTree.has(directoryPath)) {
    return undefined
  }

  const link = resolveDirectoryNavLink(directoryPath, sourceTree)
  if (!link) {
    return undefined
  }

  const directoryName = directoryPath.split('/').filter(Boolean).at(-1) ?? directoryPath
  const hasIndex = sourceTree.get(directoryPath)?.files.has('index.md') === true
  const text = await computeDirectoryDisplayTitle(baseDir, directoryPath, directoryName, hasIndex, cache)
  return { text, link, activeMatch: buildActiveMatch(directoryPath) }
}

// 全量重建自动 nav 状态。
export async function rebuildAutoNavState(
  sourceMarkdownFiles: string[],
  sourceTree: Map<string, DirNode>,
  roots: string[],
  navLevel: number,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<{ nav: DefaultTheme.NavItem[]; directories: string[] }> {
  const navDirectoryPaths = collectCandidateNavDirectories(sourceMarkdownFiles, roots, navLevel)
  const nav: DefaultTheme.NavItem[] = []

  // 把所有 level 2 的目录作为一级菜单，其 level 3 的子目录作为下拉项
  for (const directoryPath of navDirectoryPaths) {
    const navItem = await buildNavItemForDirectory(directoryPath, sourceTree, baseDir, cache)
    if (!navItem) {
      continue
    }

    // 收集该目录的所有子目录作为下拉菜单项
    const node = sourceTree.get(directoryPath)
    if (node && node.directories.size > 0) {
      const items: DefaultTheme.NavItemWithLink[] = []
      const childDirs = [...node.directories].sort()

      for (const childDirName of childDirs) {
        const childPath = `${directoryPath}/${childDirName}`
        const childNode = sourceTree.get(childPath)
        if (!childNode) {
          continue
        }

        const childLink = resolveDirectoryNavLink(childPath, sourceTree)
        if (childLink) {
          const childText = await computeDirectoryDisplayTitle(baseDir, childPath, childDirName, childNode.files.has('index.md'), cache)
          items.push({
            text: childText,
            link: childLink,
            activeMatch: buildActiveMatch(childPath),
          })
        }
      }

      if (items.length > 0) {
        // 下拉菜单不需要 link，只需要 text 和 items
        nav.push({
          text: navItem.text,
          items,
          activeMatch: navItem.activeMatch,
        })
      } else {
        // 如果没有子目录，保持为普通链接
        nav.push(navItem)
      }
    } else {
      nav.push(navItem)
    }
  }

  return {
    nav,
    directories: navDirectoryPaths.filter(directoryPath => sourceTree.has(directoryPath)),
  }
}

/**
 * 按 insertMode 策略将生成的 nav 注入到已有 nav 中。
 * - `'replace'`：完全替换
 * - `number`：在指定位置插入
 */
export function insertNavItems(
  existingNav: DefaultTheme.NavItem[] | undefined,
  generatedNav: DefaultTheme.NavItem[],
  insertMode: 'replace' | number,
): DefaultTheme.NavItem[] {
  if (insertMode === 'replace' || !existingNav || existingNav.length === 0) {
    return generatedNav
  }

  const position = Math.max(0, Math.min(insertMode, existingNav.length))
  const result = [...existingNav]
  result.splice(position, 0, ...generatedNav)
  return result
}

// 按用户定义的顺序排列 nav 项。
export function orderNavItems(
  navItems: DefaultTheme.NavItem[],
  order: string[],
): DefaultTheme.NavItem[] {
  if (!order || order.length === 0) {
    return navItems
  }

  const getNavText = (item: DefaultTheme.NavItem): string => {
    if ('text' in item && typeof item.text === 'string') {
      return item.text
    }
    return ''
  }

  const orderMap = new Map<string, number>()
  for (let i = 0; i < order.length; i++) {
    orderMap.set(order[i], i)
  }

  const ordered = [...navItems]
  ordered.sort((a, b) => {
    const textA = getNavText(a)
    const textB = getNavText(b)
    const indexA = orderMap.has(textA) ? orderMap.get(textA)! : Number.MAX_SAFE_INTEGER
    const indexB = orderMap.has(textB) ? orderMap.get(textB)! : Number.MAX_SAFE_INTEGER
    if (indexA === indexB) {
      return 0
    }
    return indexA - indexB
  })

  return ordered
}

/**
 * 根据 navBuilder 数组构建最终的 nav。
 *
 * 遍历 navBuilder 中的每个元素：
 * - 如果是 AutoNavOption，则扫描对应目录生成 nav 项（含子菜单）
 * - 如果是普通 NavItem，则直接追加
 *
 * 返回构建好的 nav 数组和涉及的所有目录路径（用于 sidebar roots）。
 */
export async function buildNavFromBuilder(
  navBuilder: (DefaultTheme.NavItem | AutoNavOption)[],
  sourceMarkdownFiles: string[],
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<{ nav: DefaultTheme.NavItem[]; directories: string[] }> {
  const nav: DefaultTheme.NavItem[] = []
  const directories: string[] = []

  for (const item of navBuilder) {
    if (!isAutoNavOption(item)) {
      // 静态 NavItem，直接加入
      nav.push(item)
      continue
    }

    // AutoNavOption：根据 navDir 和 level 生成 nav 项
    const { navDir, level } = item
    const normalizedDir = navDir.replace(/^\/+/, '').replace(/\/+$/, '')

    // 收集该 navDir 下指定层级的子目录
    const candidateDirs = collectCandidateNavDirectories(
      sourceMarkdownFiles,
      [normalizedDir],
      level,
    )

    for (const directoryPath of candidateDirs) {
      const navItem = await buildNavItemForDirectory(directoryPath, sourceTree, baseDir, cache)
      if (!navItem) {
        continue
      }

      directories.push(directoryPath)

      // 收集子目录作为下拉菜单项
      const node = sourceTree.get(directoryPath)
      if (node && node.directories.size > 0) {
        const items: DefaultTheme.NavItemWithLink[] = []
        const childDirs = [...node.directories].sort()

        for (const childDirName of childDirs) {
          const childPath = `${directoryPath}/${childDirName}`
          const childNode = sourceTree.get(childPath)
          if (!childNode) {
            continue
          }

          const childLink = resolveDirectoryNavLink(childPath, sourceTree)
          if (childLink) {
            const childText = await computeDirectoryDisplayTitle(baseDir, childPath, childDirName, childNode.files.has('index.md'), cache)
            items.push({ text: childText, link: childLink, activeMatch: buildActiveMatch(childPath) })
          }
        }

        if (items.length > 0) {
          nav.push({ text: navItem.text, items, activeMatch: navItem.activeMatch })
        } else {
          nav.push(navItem)
        }
      } else {
        nav.push(navItem)
      }
    }
  }

  return { nav, directories }
}
