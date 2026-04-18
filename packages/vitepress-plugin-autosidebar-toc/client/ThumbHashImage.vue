// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
<!--
  ThumbHashImage.vue
  @knewbeing/vitepress-plugin-autosidebar-toc

  带 ThumbHash 低清占位的渐进式图片组件。

  工作原理：
  1. 若提供了 `hash`（base64 ThumbHash），先用 `thumbhash.thumbHashToDataURL()`
     解码为 data URL，作为 CSS background 渲染模糊占位图。
  2. 真实 `<img>` 以 `opacity: 0` 叠在占位层之上，加载完成后渐入至 `opacity: 1`。
  3. 若不提供 `hash`，退化为普通 `loading="lazy"` 图片，无占位效果。
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  src: string
  alt?: string
  /** ThumbHash base64 字符串，由服务端 `doctree.ts` 生成 */
  hash?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  hash: null,
})

/** 占位图 data URL，仅在客户端 mount 后解码（避免 SSR 问题） */
const placeholderDataUrl = ref<string | null>(null)
const loaded = ref(false)

onMounted(async () => {
  if (!props.hash) return
  try {
    // thumbhash 是纯 ESM 包，动态 import 保证只在客户端执行
    const { thumbHashToDataURL } = await import('thumbhash')
    const bytes = Uint8Array.from(atob(props.hash), c => c.charCodeAt(0))
    placeholderDataUrl.value = thumbHashToDataURL(bytes)
  }
  catch {
    // hash 解码失败时静默降级
  }
})

const placeholderStyle = computed(() => {
  if (!placeholderDataUrl.value) return {}
  return {
    backgroundImage: `url(${placeholderDataUrl.value})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})
</script>

<template>
  <div class="thumbhash-image" :style="placeholderStyle">
    <img
      :src="src"
      :alt="alt"
      loading="lazy"
      :class="['thumbhash-image__img', { 'thumbhash-image__img--loaded': loaded }]"
      @load="loaded = true"
    />
  </div>
</template>

<style scoped>
.thumbhash-image {
  position: relative;
  width: 100%;
  height: 100%;
  /* 占位层：图片加载前显示模糊 thumbhash 渐变 */
  filter: blur(0);
}

.thumbhash-image__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.thumbhash-image__img--loaded {
  opacity: 1;
}
</style>
