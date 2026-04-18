// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { isRecord } from './_utils'
import type { Frontmatter } from './types'

// 将任意 frontmatter 输入安全转换为对象。
export function toFrontmatter(data: unknown): Frontmatter {
  return isRecord(data) ? (data as Frontmatter) : {}
}

// 按键提取 frontmatter 字符串字段。
export function getFrontmatterString(frontmatter: Frontmatter, key: string): string | undefined {
  const value = frontmatter[key]
  return typeof value === 'string' ? value : undefined
}

// 按键提取并解析 frontmatter 数值字段。
export function getFrontmatterNumber(frontmatter: Frontmatter, key: string): number | undefined {
  const value = frontmatter[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

// 按键提取并解析 frontmatter 日期字段。
export function getFrontmatterDate(frontmatter: Frontmatter, key: string): Date | undefined {
  const value = frontmatter[key]
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

// 按键提取并规范化 frontmatter 标签字段。
export function getFrontmatterTags(frontmatter: Frontmatter, key: string): string[] {
  const value = frontmatter[key]
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (typeof item === 'number' && Number.isFinite(item)) {
          return String(item)
        }

        return undefined
      })
      .filter((item): item is string => Boolean(item))
  }

  const singleTag = getFrontmatterString(frontmatter, key)?.trim()
  return singleTag ? [singleTag] : []
}
