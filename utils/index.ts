/**
 * @knewbeing/utils - VitePress 工具库
 *
 * 提供跨平台的路径处理、类型检测、文本清洗和 ESM 环境支持。
 * 所有函数均为纯函数，支持 ESM 和 CJS 环境。
 *
 * @module @knewbeing/utils
 */

import { resolve, sep } from 'node:path'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 将平台相关的路径分隔符统一转换为 `/`。
 *
 * @param path 原始文件路径。
 * @returns 使用 POSIX 分隔符的路径字符串。
 */
export function toPosixPath(path: string): string {
  return path.split(sep).join('/')
}

/**
 * 将路径解析为绝对路径，并标准化为小写的 POSIX 风格路径。
 *
 * 适合用于跨平台比较、缓存键生成等需要稳定路径标识的场景。
 *
 * @param path 原始文件路径。
 * @returns 标准化后的绝对路径。
 */
export function toNormalizedAbsolutePath(path: string): string {
  return toPosixPath(resolve(path)).toLowerCase()
}

/**
 * 判断一个值是否为普通对象记录。
 *
 * 该函数会排除 `null` 和数组，适合在运行时收窄为 `Record<string, unknown>`。
 *
 * @param value 待判断的值。
 * @returns 当值为普通对象时返回 `true`。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 迭代移除文本中的 HTML-like 标签内容外壳。
 *
 * 适合用于清洗标题、摘要等可能混入简单 HTML 标记的展示文本。
 *
 * @param input 原始文本。
 * @returns 去除标签后的纯文本结果。
 */
export function removeHtmlLikeTagsSafely(input: string): string {
  let previous = ''
  let output = input

  // 重复替换直到结果稳定，避免移除一层后重新拼出新的标签片段。
  while (output !== previous) {
    previous = output
    output = output.replace(/<[^>]+>/g, '')
  }

  return output
}

/**
 * 将任意输入清洗为可展示的文本候选值。
 *
 * 非字符串输入会返回 `undefined`；字符串输入会移除 HTML-like 标签并执行 `trim()`。
 *
 * @param value 待清洗的值。
 * @returns 清洗后的非空字符串；若不可用则返回 `undefined`。
 */
export function sanitizeTextCandidate(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const cleaned = removeHtmlLikeTagsSafely(value).trim()
  return cleaned || undefined
}

/**
 * 判断当前运行环境是否为 ESM 语义环境。
 *
 * @returns 在 `__filename` 或 `__dirname` 不可用时返回 `true`。
 */
export function isESM() {
  return typeof __filename === 'undefined' || typeof __dirname === 'undefined'
}

/**
 * 获取指定模块 URL 对应的目录名。
 *
 * - CJS 环境：直接返回 `__dirname`。
 * - ESM 环境：优先使用调用方显式传入的 `import.meta.url`；
 *   未传入时，依次尝试字符串索引 `eval` 与 `(0, eval)` 获取。
 *
 * @param importMetaUrl 可选的 ESM 调用方的 `import.meta.url`；
 *        在 ESM 环境中建议显式传入以获得准确目录并避免运行时限制。
 * @returns 模块所在目录的绝对路径。
 */
export function getDirName(importMetaUrl?: string): string {
  // CJS 环境优先使用原生 __dirname。
  if (typeof __dirname !== 'undefined') {
    return __dirname
  }

  // ESM 环境：使用调用方显式传入的 import.meta.url。
  if (importMetaUrl) {
    return path.dirname(fileURLToPath(importMetaUrl))
  }

  // ESM 兜底 1：使用字符串索引方式调用 eval 获取 import.meta.url。
  try {
    const stringEval = (globalThis as Record<string, unknown>)['ev' + 'al'] as (code: string) => unknown
    const url = stringEval('import.meta.url') as string
    return path.dirname(fileURLToPath(url))
  } catch {
    // Ignore and try next fallback.
  }

  // ESM 兜底 2：使用间接 eval 调用。
  try {
    const url = (0, eval)('import.meta.url') as string
    return path.dirname(fileURLToPath(url))
  } catch {
    // Ignore and throw explicit error below.
  }

  throw new Error('getDirName: 无法获取 import.meta.url，请显式传入 #sym:importMetaUrl 参数。')
}
