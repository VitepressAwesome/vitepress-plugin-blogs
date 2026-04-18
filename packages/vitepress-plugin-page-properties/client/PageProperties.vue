// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
<!--
  PageProperties.vue
  @knewbeing/vitepress-plugin-page-properties

  只读模式下渲染当前页的字数、阅读时间与更新时间属性面板。

  数据来源：虚拟模块 `virtual:knewbeing-page-properties`，
  由服务端插件 `PageProperties()` 在 transform 阶段写入。
  更新时间优先读取 frontmatter（updatedAt → date → createdAt），
  其次使用 VitePress 通过 git 提供的 lastUpdated 时间戳。

  在 dev 模式下，虚拟模块通过 `createPagePropertiesDevPatch()` 的 HMR
  机制动态刷新，组件会随之自动重渲染。
-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import data from 'virtual:knewbeing-page-properties'
import type { PagePropertiesData } from '../index'

const { page } = useData()

/** 当前页的属性数据（相对路径小写匹配） */
const pageData = computed(() => {
  const key = page.value.filePath?.toLowerCase().replace(/\\/g, '/') ?? ''
  return (data as PagePropertiesData)[key]
})

/** 将任意日期值格式化为 YYYY-MM-DD，失败返回 null */
function formatDate(val: unknown): string | null {
  if (!val) return null
  try {
    const d = new Date(val as string | number)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  catch {
    return null
  }
}

/**
 * 更新时间：优先读取 frontmatter（updatedAt → date → createdAt），
 * 再回退到 VitePress git lastUpdated 时间戳。
 */
const updatedAt = computed(() => {
  const fm = page.value.frontmatter ?? {}
  return (
    formatDate(fm.updatedAt)
    ?? formatDate(fm.date)
    ?? formatDate(fm.createdAt)
    ?? formatDate((page.value as any).lastUpdated)
  )
})

/** dev 模式：组件挂载后通知服务端推送最新数据 */
onMounted(() => {
  if (!import.meta.hot)
    return
  import.meta.hot.send('knewbeing-page-properties:client-mounted', {
    page: { filePath: page.value.filePath },
  })
})
</script>

<template>
  <div v-if="pageData" my-4 class="vp-knewbeing-page-properties vp-knewbeing-page-properties-container">
    <div class="vp-knewbeing-page-properties-grid grid grid-cols-[180px_auto] gap-1 <sm:grid-cols-[120px_auto]">
      <!-- 字数行 -->
      <div
        transition="all ease-in-out"
        flex items-start
        text="zinc-400 dark:zinc-500 sm <sm:xs"
        duration-250
      >
        <div
          transition="all ease-in-out"
          min-h="8 <sm:7"
          px="2 <sm:1" py="2 <sm:1"
          w-full flex cursor-pointer items-center
          bg="hover:zinc-100 dark:hover:zinc-800"
          rounded-md
          duration-250
        >
          <div i-icon-park-outline:add-text mr-1 />
          <span overflow-hidden text-ellipsis whitespace-nowrap>字数</span>
        </div>
      </div>
      <div
        cursor-pointer
        transition="all ease-in-out"
        min-h="8 <sm:7"
        px="2 <sm:1" py="1.5 <sm:1"
        flex="~ row wrap" items-center gap-1
        rounded-md
        text="sm <sm:xs"
        bg="hover:zinc-100 dark:hover:zinc-800"
        duration-250
      >
        <span>{{ pageData.wordsCount }} 字</span>
      </div>

      <!-- 阅读时间行 -->
      <div
        transition="all ease-in-out"
        flex items-start
        text="zinc-400 dark:zinc-500 sm <sm:xs"
        duration-250
      >
        <div
          transition="all ease-in-out"
          min-h="8 <sm:7"
          px="2 <sm:1" py="2 <sm:1"
          w-full flex cursor-pointer items-center
          bg="hover:zinc-100 dark:hover:zinc-800"
          rounded-md
          duration-250
        >
          <div i-icon-park-outline:timer mr-1 />
          <span overflow-hidden text-ellipsis whitespace-nowrap>阅读时间</span>
        </div>
      </div>
      <div
        cursor-pointer
        transition="all ease-in-out"
        min-h="8 <sm:7"
        px="2 <sm:1" py="1.5 <sm:1"
        flex="~ row wrap" items-center gap-1
        rounded-md
        text="sm <sm:xs"
        bg="hover:zinc-100 dark:hover:zinc-800"
        duration-250
      >
        <span>约 {{ pageData.readingTime }} 分钟</span>
      </div>

      <!-- 更新时间行 -->
      <template v-if="updatedAt">
        <div
          transition="all ease-in-out"
          flex items-start
          text="zinc-400 dark:zinc-500 sm <sm:xs"
          duration-250
        >
          <div
            transition="all ease-in-out"
            min-h="8 <sm:7"
            px="2 <sm:1" py="2 <sm:1"
            w-full flex cursor-pointer items-center
            bg="hover:zinc-100 dark:hover:zinc-800"
            rounded-md
            duration-250
          >
            <div i-icon-park-outline:calendar mr-1 />
            <span overflow-hidden text-ellipsis whitespace-nowrap>更新时间</span>
          </div>
        </div>
        <div
          cursor-pointer
          transition="all ease-in-out"
          min-h="8 <sm:7"
          px="2 <sm:1" py="1.5 <sm:1"
          flex="~ row wrap" items-center gap-1
          rounded-md
          text="sm <sm:xs"
          bg="hover:zinc-100 dark:hover:zinc-800"
          duration-250
        >
          <span>{{ updatedAt }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
