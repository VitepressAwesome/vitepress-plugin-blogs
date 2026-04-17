<!--
  PageProperties.vue
  @knewbeing/vitepress-plugin-page-properties

  只读模式下渲染当前页的字数与阅读时间属性面板。

  数据来源：虚拟模块 `virtual:knewbeing-page-properties`，
  由服务端插件 `PageProperties()` 在 transform 阶段写入。

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
  <div v-if="pageData" class="vp-knewbeing-page-properties-container">
    <div class="vp-knewbeing-page-properties-grid">
      <div>字数</div>
      <div>{{ pageData.wordsCount }} 字</div>
      <div>阅读时间</div>
      <div>约 {{ pageData.readingTime }} 分钟</div>
    </div>
  </div>
</template>
