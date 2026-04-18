// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { dirname, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type {
  DirNode,
  MarkdownMeta,
  TocSidebarDirectoryEntry,
  TocSidebarDoctreePayload,
  TocSidebarFileEntry,
  TocSidebarRawTree,
  TocSidebarRawTreeNode,
} from './types'
import { toVitePressDirectoryRoute, toVitePressPageRoute } from './routing'
import { computeDirectoryDisplayTitle, computeFileDisplayTitle, readMarkdownMeta } from './markdown'
import { getFrontmatterDate } from './frontmatter'
import { getFrontmatterString } from './frontmatter'

/**
 * 将图片 Buffer 解码为 RGBA 像素数据，用于生成 ThumbHash。
 *
 * 使用动态 import 懒加载 `sharp`（仅在 Node.js 构建/dev 阶段使用，不打包进 dist）。
 * `sharp` 声明为可选 peerDependency（`peerDependenciesMeta.sharp.optional = true`）：
 *   - 若用户已安装 `sharp`（>=0.32.0），则生成 ThumbHash 占位图
 *   - 若未安装，此函数返回 `null`，cover 图片退化为普通懒加载，不影响其他功能
 */
async function decodeImageToRgba(
  buf: Buffer,
  targetSize = 100,
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    const sharp = (await import('sharp')).default
    const img = sharp(buf).resize(targetSize, targetSize, { fit: 'inside', withoutEnlargement: true })
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data: new Uint8Array(data), width: info.width, height: info.height }
  }
  catch {
    return null
  }
}

/**
 * 将图片 Buffer 生成 ThumbHash base64 字符串。
 * ThumbHash 是轻量级占位图算法（~30 bytes），可在客户端渲染出低清预览图。
 * @see https://github.com/evanw/thumbhash
 */
async function generateThumbHash(buf: Buffer): Promise<string | null> {
  try {
    const { rgbaToThumbHash } = await import('thumbhash')
    const decoded = await decodeImageToRgba(buf)
    if (!decoded) return null
    const hashBytes = rgbaToThumbHash(decoded.width, decoded.height, decoded.data)
    // 将 Uint8Array 转为 base64 字符串，方便 JSON 传输
    return Buffer.from(hashBytes).toString('base64')
  }
  catch {
    return null
  }
}

interface ResolvedCover {
  url: string | null
  hash: string | null
}

// 解析 cover 图片：将相对路径的图片复制到 public/covers/ 并返回可用的公共 URL 和 ThumbHash。
async function resolveCoverImage(
  cover: string | undefined,
  mdAbsolutePath: string,
  publicDir: string,
): Promise<ResolvedCover> {
  if (!cover) return { url: null, hash: null }
  if (/^https?:\/\//.test(cover)) return { url: cover, hash: null }
  if (cover.startsWith('/')) return { url: cover, hash: null }

  const imgAbsPath = resolve(dirname(mdAbsolutePath), cover)
  try {
    const buf = readFileSync(imgAbsPath)
    const hash = createHash('md5').update(buf).digest('hex').slice(0, 8)
    const ext = cover.replace(/.*\./, '.')
    const destName = `${hash}${ext}`
    const destDir = resolve(publicDir, 'covers')
    await mkdir(destDir, { recursive: true })
    await copyFile(imgAbsPath, resolve(destDir, destName))
    const thumbHash = await generateThumbHash(buf)
    return { url: `/covers/${destName}`, hash: thumbHash }
  }
  catch {
    return { url: null, hash: null }
  }
}

const execFileAsync = promisify(execFile)

// 获取文件的 git 最后提交时间。
async function getGitLastModified(filePath: string): Promise<Date | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd: resolve(filePath, '..'),
    })
    const trimmed = stdout.trim()
    if (!trimmed) return undefined
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  catch {
    return undefined
  }
}

// 从所有候选时间中取最新的一个。
function latestDate(...dates: (Date | undefined)[]): Date | undefined {
  let latest: Date | undefined
  for (const d of dates) {
    if (d && (!latest || d.getTime() > latest.getTime())) {
      latest = d
    }
  }
  return latest
}

// 构建 doctree 中的文件条目。
export async function createDoctreeFileEntry(
  baseDir: string,
  dirKey: string,
  fileName: string,
  cache: Map<string, MarkdownMeta>,
  publicDir?: string,
): Promise<TocSidebarFileEntry> {
  const relativePath = dirKey === '/' ? fileName : `${dirKey}/${fileName}`
  const absolutePath = resolve(baseDir, relativePath)
  const meta = await readMarkdownMeta(absolutePath, cache)

  const fmDate = getFrontmatterDate(meta.frontmatter, 'date')
  const hasFrontmatterDate = !!(meta.updatedAt || meta.createdAt || fmDate)
  const gitDate = hasFrontmatterDate ? undefined : await getGitLastModified(absolutePath)

  const bestDate = latestDate(
    meta.updatedAt,
    meta.createdAt,
    fmDate,
    gitDate,
  )

  const rawCover = getFrontmatterString(meta.frontmatter, 'cover') ?? getFrontmatterString(meta.frontmatter, 'image') ?? meta.firstImage
  const resolvedCover = publicDir
    ? await resolveCoverImage(rawCover, absolutePath, publicDir)
    : { url: rawCover ?? null, hash: null }

  return {
    name: fileName,
    path: relativePath,
    link: toVitePressPageRoute(relativePath),
    displayText: await computeFileDisplayTitle(absolutePath, fileName.replace(/\.md$/i, ''), cache),
    frontmatter: meta.frontmatter,
    h1: meta.h1 ?? null,
    updatedAt: bestDate ? bestDate.toISOString() : null,
    excerpt: meta.excerpt ?? null,
    cover: resolvedCover.url,
    coverHash: resolvedCover.hash,
  }
}

// 构建 doctree 中的目录条目。
export async function createDoctreeDirectoryEntry(
  baseDir: string,
  dirKey: string,
  dirName: string,
  sourceTree: Map<string, DirNode>,
  cache: Map<string, MarkdownMeta>,
  publicDir?: string,
): Promise<TocSidebarDirectoryEntry> {
  const childKey = dirKey === '/' ? dirName : `${dirKey}/${dirName}`
  const childNode = sourceTree.get(childKey)
  const hasIndex = childNode?.files.has('index.md') === true

  const item: TocSidebarDirectoryEntry = {
    name: dirName,
    path: childKey,
    link: null,
    displayText: await computeDirectoryDisplayTitle(baseDir, childKey, dirName, hasIndex, cache),
    indexFile: null,
  }

  if (hasIndex) {
    item.link = toVitePressDirectoryRoute(`${childKey}/index.md`)
    item.indexFile = await createDoctreeFileEntry(baseDir, childKey, 'index.md', cache, publicDir)
  }

  return item
}

// 序列化单个目录节点，用于按需加载。
export async function serializeSingleDirectoryNode(
  dirKey: string,
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
  publicDir?: string,
): Promise<TocSidebarRawTreeNode | null> {
  const lookupKey = dirKey === '/' ? '' : dirKey
  const node = sourceTree.get(lookupKey)
  if (!node) {
    return null
  }

  const directoryItems = await Promise.all(
    [...node.directories].map(dirName =>
      createDoctreeDirectoryEntry(baseDir, dirKey, dirName, sourceTree, cache, publicDir),
    ),
  )
  const fileItems = await Promise.all(
    [...node.files]
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => createDoctreeFileEntry(baseDir, dirKey, fileName, cache, publicDir)),
  )

  return { path: dirKey, directoryItems, fileItems }
}

// 将目录树序列化为 doctree 可传输结构。
export async function serializeDoctreeTree(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
  publicDir?: string,
): Promise<TocSidebarRawTree> {
  const payload: TocSidebarRawTree = {}

  for (const [dirPath, node] of sourceTree.entries()) {
    const key = dirPath || '/'
    const directoryItems = await Promise.all(
      [...node.directories].map(dirName => createDoctreeDirectoryEntry(baseDir, key, dirName, sourceTree, cache, publicDir)),
    )
    const fileItems = await Promise.all(
      [...node.files]
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => createDoctreeFileEntry(baseDir, key, fileName, cache, publicDir)),
    )

    payload[key] = {
      path: key,
      directoryItems,
      fileItems,
    }
  }

  return payload
}

// 构建 doctree 顶层 payload。
export async function createDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<TocSidebarDoctreePayload> {
  return {
    tree: await serializeDoctreeTree(sourceTree, baseDir, cache),
  }
}

// 将 doctree payload 序列化为 JSON 文本。
export async function stringifyDoctreePayload(
  sourceTree: Map<string, DirNode>,
  baseDir: string,
  cache: Map<string, MarkdownMeta>,
): Promise<string> {
  return `${JSON.stringify(await createDoctreePayload(sourceTree, baseDir, cache), null, 2)}\n`
}
