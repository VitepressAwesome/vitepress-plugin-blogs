// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
<!--
  PagePropertiesEditor.vue
  @knewbeing/vitepress-plugin-page-properties

  dev 模式下渲染的属性面板组件。
  直接复用 PageProperties.vue，HMR 事件由其内部 onMounted 统一处理。
-->
<script setup lang="ts">
import PageProperties from './PageProperties.vue'
</script>

<template>
  <!-- dev 模式下与只读面板相同；可在此处追加编辑 UI -->
  <PageProperties />
</template>
