import { readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import fg from 'fast-glob'
import { toPosixPath } from '@knewbeing/utils'
import type { DirNode, ResolvedTocSidebarOptions } from './types'

const SIMPLE_INCLUDE_GLOB = '**/*.md'
const SIMPLE_EXCLUDE_DIR_GLOB_RE = /^\*\*\/([^/*{}[\]?]+)\/\*\*$/

// 使用 glob 规则扫描 markdown 文件。
export async function scanMarkdownFilesByGlob(baseDir: string, options: ResolvedTocSidebarOptions): Promise<string[]> {
  const files = await fg(options.includeGlobs, {
    cwd: baseDir,
    ignore: options.excludeGlobs,
    onlyFiles: true,
    dot: options.includeDotFiles,
    followSymbolicLinks: false,
  })

  return files
    .map(file => toPosixPath(file))
    .filter(file => extname(file) === '.md')
}

// 解析简单排除规则中的目录名。
export function parseExcludedDirectoryNameFromSimpleGlob(pattern: string): string | null {
  const normalized = toPosixPath(pattern.trim())
  const match = normalized.match(SIMPLE_EXCLUDE_DIR_GLOB_RE)
  return match?.[1] ?? null
}

// 判断是否可使用快速目录扫描路径。
export function canUseSimpleDirectoryScanner(options: ResolvedTocSidebarOptions): boolean {
  if (options.includeGlobs.length !== 1 || options.includeGlobs[0] !== SIMPLE_INCLUDE_GLOB) {
    return false
  }

  for (const pattern of options.excludeGlobs) {
    if (!parseExcludedDirectoryNameFromSimpleGlob(pattern)) {
      return false
    }
  }

  return true
}

// 按目录遍历扫描 markdown 文件（性能优先）。
export async function scanMarkdownFilesWithDirectoryWalker(baseDir: string, options: ResolvedTocSidebarOptions): Promise<string[]> {
  if (!canUseSimpleDirectoryScanner(options)) {
    return scanMarkdownFilesByGlob(baseDir, options)
  }

  const excludedDirectoryNames = new Set<string>()
  for (const pattern of options.excludeGlobs) {
    const directoryName = parseExcludedDirectoryNameFromSimpleGlob(pattern)
    if (directoryName) {
      excludedDirectoryNames.add(directoryName)
    }
  }

  const files: string[] = []

  async function walkDirectory(absDir: string): Promise<void> {
    let entries: Array<import('node:fs').Dirent<string>> = []
    try {
      entries = await readdir(absDir, { withFileTypes: true, encoding: 'utf8' }) as Array<import('node:fs').Dirent<string>>
    }
    catch {
      return
    }

    for (const entry of entries) {
      const name = entry.name
      if (!options.includeDotFiles && name.startsWith('.')) {
        continue
      }

      if (entry.isDirectory()) {
        if (excludedDirectoryNames.has(name)) {
          continue
        }
        await walkDirectory(join(absDir, name))
        continue
      }

      if (!entry.isFile() || extname(name) !== '.md') {
        continue
      }

      const relativePath = toPosixPath(relative(baseDir, join(absDir, name)))
      if (relativePath) {
        files.push(relativePath)
      }
    }
  }

  await walkDirectory(baseDir)
  return files.sort((left, right) => left.localeCompare(right))
}

// 创建空目录树节点。
export function createEmptyDirNode(): DirNode {
  return {
    directories: new Set<string>(),
    files: new Set<string>(),
  }
}

// 由 markdown 文件列表构建目录树结构。
export function buildDirectoryTreeFromFiles(markdownFiles: string[]): Map<string, DirNode> {
  const tree = new Map<string, DirNode>()
  tree.set('', createEmptyDirNode())

  for (const file of markdownFiles) {
    const parts = file.split('/').filter(Boolean)
    if (parts.length === 0) {
      continue
    }

    let parentDir = ''
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]

      const parentNode = tree.get(parentDir) ?? createEmptyDirNode()
      parentNode.directories.add(dirName)
      tree.set(parentDir, parentNode)

      const currentDir = parentDir ? `${parentDir}/${dirName}` : dirName
      if (!tree.has(currentDir)) {
        tree.set(currentDir, createEmptyDirNode())
      }
      parentDir = currentDir
    }

    const fileName = parts[parts.length - 1]
    const node = tree.get(parentDir) ?? createEmptyDirNode()
    node.files.add(fileName)
    tree.set(parentDir, node)
  }

  return tree
}
