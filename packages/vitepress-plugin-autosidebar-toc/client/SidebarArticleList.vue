// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useData, useRouter } from "vitepress";
import { useTocEntries } from "./useTocEntries";
import { useTocSidebarConfig } from "./useTocSidebarConfig";

const router = useRouter();
const { theme } = useData();
const cfg = useTocSidebarConfig();

const PAGE_SIZE = computed(() => cfg.value.sidebarPageSize ?? 10);
const MAX_PAGE_BUTTONS = computed(() => cfg.value.sidebarMaxPageButtons ?? 3);

const { fileItems } = useTocEntries({ rootKeyStrategy: "navRoot" });

const activeNavText = computed(() => {
  const nav = theme.value.nav as
    | { text?: string; link?: string; items?: unknown[] }[]
    | undefined;
  if (!nav?.length) return { text: "相关文章", link: "" };
  const routePath = decodeURIComponent(router.route.path)
    .replace(/\/+$/, "")
    .toLowerCase();

  let bestText = "";
  let bestLink = "";
  let bestLen = 0;
  function search(
    items: { text?: string; link?: string; items?: unknown[] }[],
  ) {
    for (const item of items) {
      if (typeof item.link === "string") {
        const link = decodeURIComponent(item.link)
          .replace(/\/+$/, "")
          .toLowerCase();
        if (
          link &&
          link !== "/" &&
          routePath.startsWith(link) &&
          link.length > bestLen
        ) {
          bestText = item.text || "";
          bestLink = item.link;
          bestLen = link.length;
        }
      }
      if (Array.isArray(item.items)) search(item.items as typeof items);
    }
  }
  search(nav);
  return { text: bestText || "相关文章", link: bestLen > 0 ? bestLink : "" };
});

// Pagination
const currentPage = ref(1);

const totalPages = computed(() =>
  Math.ceil(fileItems.value.length / PAGE_SIZE.value),
);

const startIdx = computed(() => (currentPage.value - 1) * PAGE_SIZE.value);

const currentPageItems = computed(() =>
  fileItems.value.slice(startIdx.value, startIdx.value + PAGE_SIZE.value),
);

function getPaginationRange(
  current: number,
  total: number,
  maxButtons: number,
): (number | "...")[] {
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
  const wing = Math.max(1, Math.floor((maxButtons - 3) / 2));
  const pages: (number | "...")[] = [1];
  if (current > wing + 2) pages.push("...");
  for (
    let i = Math.max(2, current - wing);
    i <= Math.min(total - 1, current + wing);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - wing - 1) pages.push("...");
  pages.push(total);
  return pages;
}

const paginationRange = computed(() =>
  getPaginationRange(currentPage.value, totalPages.value, MAX_PAGE_BUTTONS.value),
);

watch(
  fileItems,
  (items) => {
    const activeIndex = items.findIndex((item) => item.active);
    if (activeIndex !== -1) {
      currentPage.value = Math.floor(activeIndex / PAGE_SIZE.value) + 1;
    } else {
      currentPage.value = 1;
    }
  },
  { immediate: true },
);

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault();
  router.go(link);
}
</script>

<template>
  <div
    v-if="fileItems.length"
    class="sidebar-articles"
    data-pagefind-ignore="all"
  >
    <!-- 头部 -->
    <div class="sidebar-articles__header">
      <span class="sidebar-articles__header-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
          />
        </svg>
        <a
          v-if="activeNavText.link"
          :href="activeNavText.link"
          class="sidebar-articles__header-link"
        >
          {{ activeNavText.text }}
        </a>
        <template v-else>{{ activeNavText.text }}</template>
      </span>
    </div>
    <!-- 文章列表 -->
    <ol v-if="currentPageItems.length" class="sidebar-articles__list">
      <li
        v-for="(item, idx) in currentPageItems"
        :key="item.link"
        class="sidebar-articles__item"
      >
        <!-- 序号 -->
        <i class="sidebar-articles__num">{{ startIdx + idx + 1 }}</i>
        <!-- 文章信息 -->
        <div class="sidebar-articles__content">
          <a
            :href="item.link"
            :class="['sidebar-articles__link', { 'is-active': item.active }]"
            @click="(e) => handleClick(e, item.link)"
          >
            <span>{{ item.text }}</span>
          </a>
          <div v-if="item.date" class="sidebar-articles__date">
            {{ item.date }}
          </div>
        </div>
      </li>
    </ol>
    <div v-else class="sidebar-articles__empty">暂无相关文章</div>
    <div v-if="totalPages > 1" class="sidebar-articles__pagination">
      <button
        class="sidebar-articles__page-btn sidebar-articles__page-nav"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >‹</button>
      <template v-for="p in paginationRange" :key="p">
        <span v-if="p === '...'" class="sidebar-articles__ellipsis">…</span>
        <button
          v-else
          :class="['sidebar-articles__page-btn', { 'is-active': p === currentPage }]"
          @click="currentPage = Number(p)"
        >{{ p }}</button>
      </template>
      <button
        class="sidebar-articles__page-btn sidebar-articles__page-nav"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >›</button>
    </div>
  </div>
</template>

<style scoped>
.sidebar-articles {
  padding: 0;
  margin-top: 8px;
}

/* 头部样式 */
.sidebar-articles__header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  box-sizing: border-box;
}

.sidebar-articles__header-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-articles__header-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: opacity 0.25s;
}

.sidebar-articles__header-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.sidebar-articles__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px 4px;
}

.sidebar-articles__page-btn {
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  line-height: 24px;
}

.sidebar-articles__page-btn:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sidebar-articles__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-articles__page-btn.is-active {
  color: #fff;
  background-color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sidebar-articles__page-nav {
  font-size: 14px;
  font-weight: 400;
}

.sidebar-articles__ellipsis {
  padding: 0 2px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  line-height: 26px;
}

/* 空状态 */
.sidebar-articles__list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0 10px 0 0;
  width: 100%;
}

.sidebar-articles__item {
  display: flex;
  margin: 0;
  padding: 0;
}

/* 序号样式 */
.sidebar-articles__num {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-weight: 600;
  font-style: normal;
  margin: 8px 6px 10px 12px;
  width: 20px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* 前三名序号高亮 */
.sidebar-articles__item:nth-child(1) .sidebar-articles__num,
.sidebar-articles__item:nth-child(2) .sidebar-articles__num,
.sidebar-articles__item:nth-child(3) .sidebar-articles__num {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

/* 文章内容区域 */
.sidebar-articles__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  padding: 4px 0;
}

/* 链接样式 */
.sidebar-articles__link {
  font-size: 13px;
  color: var(--vp-c-text-1);
  word-break: break-all;
  white-space: break-spaces;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.25s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.sidebar-articles__link:hover {
  color: var(--vp-c-brand-1);
}

.sidebar-articles__link.is-active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* 日期样式 */
.sidebar-articles__date {
  font-size: 11px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
  font-weight: 400;
  flex-shrink: 0;
}

/* 空状态 */
.sidebar-articles__empty {
  padding: 12px;
  font-size: 13px;
  text-align: center;
  color: var(--vp-c-text-3);
}
</style>
