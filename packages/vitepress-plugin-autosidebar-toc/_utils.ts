// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
/**
 * 内部工具函数（原 @knewbeing/utils 包，已内联至此）
 * @internal
 */

import { resolve, sep } from 'node:path'

/** 将平台路径分隔符统一转换为 `/` */
export function toPosixPath(path: string): string {
  return path.split(sep).join('/')
}

/** 将路径解析为绝对路径并规范化为小写 POSIX 风格 */
export function toNormalizedAbsolutePath(path: string): string {
  return toPosixPath(resolve(path)).toLowerCase()
}

/** 判断值是否为普通对象（非 null、非数组） */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 迭代去除文本中的 HTML-like 标签 */
function removeHtmlLikeTagsSafely(input: string): string {
  let previous = ''
  let output = input
  while (output !== previous) {
    previous = output
    output = output.replace(/<[^>]+>/g, '')
  }
  return output
}

/** 将任意输入清洗为可展示的文本候选值；非字符串或空值返回 undefined */
export function sanitizeTextCandidate(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const cleaned = removeHtmlLikeTagsSafely(value).trim()
  return cleaned || undefined
}
