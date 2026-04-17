<script setup lang="ts">
import { computed, ref } from "vue";
import { useData } from "vitepress";

export interface TagItem {
  name: string;
  count: number;
}

const props = withDefaults(
  defineProps<{
    tags: TagItem[];
    /** 当前已选中的 tag 名称，支持单个字符串、字符串数组或 Set */
    selected?: string | string[] | Set<string> | null;
    /** 超过该数量时折叠，默认 20 */
    limit?: number;
    /** 卡片标题 */
    title?: string;
  }>(),
  {
    selected: null,
    limit: 20,
    title: "🏷️ 标签",
  },
);

const emit = defineEmits<{
  (e: "select", tag: string): void;
}>();

const { isDark } = useData();
const showAll = ref(false);

const selectedSet = computed<Set<string>>(() => {
  if (!props.selected) return new Set();
  if (props.selected instanceof Set) return props.selected;
  if (Array.isArray(props.selected)) return new Set(props.selected);
  return new Set([props.selected]);
});

const visibleTags = computed(() =>
  showAll.value ? props.tags : props.tags.slice(0, props.limit),
);

const TAG_COLORS_LIGHT = [
  { bg: "#fff0f0", color: "#c9362a", border: "#f5c4c0" },
  { bg: "#fff4e6", color: "#b85c14", border: "#f5d9b3" },
  { bg: "#fff9db", color: "#8a7400", border: "#f0e4a0" },
  { bg: "#ebfbee", color: "#237a34", border: "#b7e4c0" },
  { bg: "#e6fcf5", color: "#087a62", border: "#a3e0d0" },
  { bg: "#e7f5ff", color: "#1564b0", border: "#a5d2f5" },
  { bg: "#edf2ff", color: "#3050c8", border: "#b3c7f5" },
  { bg: "#f3f0ff", color: "#5a36c4", border: "#c4b5f0" },
  { bg: "#fdf0ff", color: "#882ea0", border: "#dfb3f0" },
  { bg: "#fff0f6", color: "#ad1d50", border: "#f0b3cc" },
  { bg: "#f0fffe", color: "#0a6b76", border: "#a3d9df" },
  { bg: "#f4f8e8", color: "#4e6a0c", border: "#c5d99e" },
];

const TAG_COLORS_DARK = [
  { bg: "#3a1c1c", color: "#f5a8a2", border: "#5c2d2d" },
  { bg: "#3a2a14", color: "#f5c88a", border: "#5c4020" },
  { bg: "#3a3510", color: "#e8d56a", border: "#5c5020" },
  { bg: "#1a3320", color: "#82d896", border: "#2a4a32" },
  { bg: "#14322c", color: "#6edcbf", border: "#204a3c" },
  { bg: "#162a3f", color: "#7bbdf5", border: "#203c5c" },
  { bg: "#1c2445", color: "#92a8f5", border: "#2a3660" },
  { bg: "#261c40", color: "#b8a0f0", border: "#3a2c5c" },
  { bg: "#301a38", color: "#d4a0e8", border: "#4a2c56" },
  { bg: "#361a2a", color: "#f09cba", border: "#502a40" },
  { bg: "#14302e", color: "#6ad4dc", border: "#204a46" },
  { bg: "#283210", color: "#b8d47a", border: "#3c4a1c" },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function tagStyle(name: string, isActive: boolean) {
  if (isActive) return {};
  const palette = isDark.value ? TAG_COLORS_DARK : TAG_COLORS_LIGHT;
  const c = palette[hashStr(name) % palette.length];
  return { "--tag-bg": c.bg, "--tag-color": c.color, "--tag-border": c.border };
}
</script>

<template>
  <div v-if="tags.length" class="tags-cloud">
    <h3 v-if="title" class="tags-cloud__title">{{ title }}</h3>
    <div class="tags-cloud__list">
      <button
        v-for="tag in visibleTags"
        :key="tag.name"
        :class="['tags-cloud__tag', { 'is-active': selectedSet.has(tag.name) }]"
        :style="tagStyle(tag.name, selectedSet.has(tag.name))"
        @click="emit('select', tag.name)"
      >
        {{ tag.name }}
        <span v-if="tag.count >= 0" class="tags-cloud__count">{{
          tag.count
        }}</span>
      </button>
    </div>
    <button
      v-if="tags.length > limit"
      class="tags-cloud__toggle"
      @click="showAll = !showAll"
    >
      {{ showAll ? "收起" : `展开全部 ${tags.length} 个标签` }}
    </button>
  </div>
</template>

<style scoped>
.tags-cloud__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.tags-cloud__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tags-cloud__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--tag-color, var(--vp-c-text-2));
  background: var(--tag-bg, var(--vp-c-bg-soft));
  border: 1px solid var(--tag-border, transparent);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.5;
}

.tags-cloud__tag:hover {
  filter: brightness(0.93);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tags-cloud__tag.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.tags-cloud__count {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  min-width: 16px;
  text-align: center;
  line-height: 1.6;
}

.tags-cloud__tag.is-active .tags-cloud__count {
  background: rgba(255, 255, 255, 0.25);
}

.tags-cloud__toggle {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  border-top: 1px dashed var(--vp-c-divider);
  cursor: pointer;
  transition: color 0.2s;
}

.tags-cloud__toggle:hover {
  color: var(--vp-c-brand-1);
}
</style>
