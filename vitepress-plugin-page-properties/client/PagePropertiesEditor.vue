<!--
  PagePropertiesEditor.vue
  @knewbeing/vitepress-plugin-page-properties

  dev 模式下渲染的属性面板组件。
  目前与只读组件 `PageProperties.vue` 等价，额外发送
  `knewbeing-page-properties:client-mounted` 事件触发服务端即时更新。
  如后续需要内联 frontmatter 编辑功能，可在此组件中扩展。
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useData } from 'vitepress'
import PageProperties from './PageProperties.vue'

const { page } = useData()

onMounted(() => {
  if (!import.meta.hot)
    return
  import.meta.hot.send('knewbeing-page-properties:client-mounted', {
    page: { filePath: page.value.filePath },
  })
})
</script>

<template>
  <!-- dev 模式下与只读面板相同；可在此处追加编辑 UI -->
  <PageProperties />
</template>
