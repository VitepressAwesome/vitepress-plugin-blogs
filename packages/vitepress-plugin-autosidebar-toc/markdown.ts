// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { readFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import matter from 'gray-matter'
import sanitizeHtml from 'sanitize-html'
import { sanitizeTextCandidate, toNormalizedAbsolutePath } from './_utils'
import type { MarkdownMeta } from './types'
import { toFrontmatter, getFrontmatterString, getFrontmatterNumber, getFrontmatterDate, getFrontmatterTags } from './frontmatter'

// 生成 markdown 元数据缓存键。
export function toMarkdownMetaCacheKey(filePath: string): string {
  return toNormalizedAbsolutePath(filePath)
}

// 提取 markdown 内容中的一级标题。
export function extractPrimaryHeading(markdownBody: string): string | undefined {
  const matched = markdownBody.match(/^#\s+(.+)$/m)
  return matched?.[1]?.trim()
}

// 从 markdown 正文中提取纯文本摘要（去除标题、代码块、链接、图片等）。
export function extractExcerpt(markdownBody: string, maxLength = 200): string | undefined {
  const sanitizedBody = sanitizeHtml(markdownBody, {
    allowedTags: [],
    allowedAttributes: {},
  })

  const lines = sanitizedBody
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/^[-*>]\s*/gm, '')
    .replace(/\|.*\|/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const text = lines.join(' ')
  if (!text) return undefined
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

// 从 markdown 正文中提取第一张图片的路径。
export function extractFirstImage(markdownBody: string): string | undefined {
  // Match ![alt](url) pattern
  const match = markdownBody.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (match?.[1]) return match[1].trim()
  // Match <img src="url"> pattern
  const htmlMatch = markdownBody.match(/<img[^>]+src=["']([^"']+)["']/)
  if (htmlMatch?.[1]) return htmlMatch[1].trim()
  return undefined
}

// 将 markdown 原始数据解析为带有常用 Nolebase 字段的元数据对象。
export function parseMarkdownMeta(data: unknown, markdownBody: string): MarkdownMeta {
  const frontmatter = toFrontmatter(data)

  return {
    frontmatter,
    h1: extractPrimaryHeading(markdownBody),
    title: getFrontmatterString(frontmatter, 'title'),
    sidebarTitle: getFrontmatterString(frontmatter, 'sidebarTitle'),
    tags: getFrontmatterTags(frontmatter, 'tags'),
    progress: getFrontmatterNumber(frontmatter, 'progress'),
    createdAt: getFrontmatterDate(frontmatter, 'createdAt') ?? getFrontmatterDate(frontmatter, 'date'),
    updatedAt: getFrontmatterDate(frontmatter, 'updatedAt'),
    wordsCount: getFrontmatterNumber(frontmatter, 'wordsCount'),
    readingTime: getFrontmatterNumber(frontmatter, 'readingTime'),
    excerpt: getFrontmatterString(frontmatter, 'description')
      ?? getFrontmatterString(frontmatter, 'excerpt')
      ?? getFrontmatterString(frontmatter, 'summary')
      ?? extractExcerpt(markdownBody),
    firstImage: extractFirstImage(markdownBody),
  }
}

// 读取并缓存 markdown 元数据。
export async function readMarkdownMeta(filePath: string, cache: Map<string, MarkdownMeta>): Promise<MarkdownMeta> {
  const resolvedPath = resolve(filePath)
  const cacheKey = toMarkdownMetaCacheKey(resolvedPath)
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  let result: MarkdownMeta = parseMarkdownMeta({}, '')

  try {
    const content = await readFile(resolvedPath, 'utf-8')
    const { data, content: body } = matter(content)
    result = parseMarkdownMeta(data, body)
  }
  catch {
    // Keep safe fallback values if one markdown file cannot be parsed.
  }

  cache.set(cacheKey, result)
  return result
}

// 失效指定文件的元数据缓存。
export function invalidateMarkdownMetaCache(filePath: string, cache: Map<string, MarkdownMeta>): void {
  cache.delete(toMarkdownMetaCacheKey(filePath))
}

// 展示文本统一出口，便于后续定制。
export function finalizeDisplayText(raw: string): string {
  return raw
}

// 按优先级计算最终展示标题。
export function computeDisplayText(options: {
  sidebarTitle?: string
  title?: string
  h1?: string
  fileName?: string
  directoryName?: string
  fallback?: string
}): string {
  const fileStem = options.fileName
    ? basename(options.fileName, extname(options.fileName))
    : undefined

  const computed = sanitizeTextCandidate(options.sidebarTitle)
    ?? sanitizeTextCandidate(options.title)
    ?? sanitizeTextCandidate(options.h1)
    ?? sanitizeTextCandidate(fileStem)
    ?? sanitizeTextCandidate(options.directoryName)
    ?? sanitizeTextCandidate(options.fallback)
    ?? 'Untitled'

  return finalizeDisplayText(computed)
}

// 计算文件在 sidebar/nav 中的展示标题。
export async function computeFileDisplayTitle(filePath: string, fallback: string, cache: Map<string, MarkdownMeta>): Promise<string> {
  const meta = await readMarkdownMeta(filePath, cache)
  return computeDisplayText({
    sidebarTitle: meta.sidebarTitle,
    title: meta.title,
    h1: meta.h1,
    fallback,
  })
}

// 计算目录展示标题，优先使用目录 index 元数据。
export async function computeDirectoryDisplayTitle(
  baseDir: string,
  directoryPath: string,
  fallback: string,
  hasIndex: boolean,
  cache: Map<string, MarkdownMeta>,
): Promise<string> {
  if (!hasIndex) {
    return computeDisplayText({
      directoryName: fallback,
      fallback,
    })
  }

  const indexAbsPath = join(baseDir, directoryPath, 'index.md')
  const indexMeta = await readMarkdownMeta(indexAbsPath, cache)
  return computeDisplayText({
    sidebarTitle: indexMeta.sidebarTitle,
    title: indexMeta.title,
    h1: indexMeta.h1,
    directoryName: fallback,
    fallback,
  })
}
