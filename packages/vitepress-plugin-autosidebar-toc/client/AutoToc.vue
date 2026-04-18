// Copyright (c) 2024-present Neko Ayaka. MIT License.
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter, useData, useRoute } from "vitepress";
import { useBlogHome } from "./useBlogHome";
import { useTocEntries } from "./useTocEntries";
import { useIndexTagsStore } from "./useIndexTagsStore";
import { useTocSidebarConfig } from "./useTocSidebarConfig";
import TagsCloud from "./TagsCloud.vue";
import ThumbHashImage from "./ThumbHashImage.vue";

const route = useRoute();
const router = useRouter();
const { isDark, site, page } = useData();
const cfg = useTocSidebarConfig();

const isHomePage = computed(() => {
  const p = route.path;
  return p === "/" || p === "/index.html" || p === "/index";
});

const PAGE_SIZE = computed(() => cfg.value.tocPageSize ?? 10);
const MAX_PAGE_BUTTONS = computed(() => cfg.value.tocMaxPageButtons ?? 9);
const TAG_SHOW_LIMIT = 20;

const {
  articles,
  pagedArticles,
  allTags,
  selectedTags: homeTags,
  currentPage: homeCurrentPage,
  totalPages: homeTotalPages,
  selectTag: homeSelectTag,
  goToPage: homeGoToPage,
} = useBlogHome();

const { fileItems: fileEntries } = useTocEntries({ rootKeyStrategy: "currentDir" });
const { selectedTag } = useIndexTagsStore();

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

function tagStyle(name: string, isActive = false) {
  if (isActive) return {};
  const palette = isDark.value ? TAG_COLORS_DARK : TAG_COLORS_LIGHT;
  const c = palette[hashStr(name) % palette.length];
  return { "--tag-bg": c.bg, "--tag-color": c.color, "--tag-border": c.border };
}

const filteredEntries = computed(() => {
  if (!selectedTag.value) return fileEntries.value;
  return fileEntries.value.filter((item) => item.tags.includes(selectedTag.value!));
});

const dirCurrentPage = ref(1);

const dirTotalPages = computed(() =>
  Math.ceil(filteredEntries.value.length / PAGE_SIZE.value),
);

const dirStartIdx = computed(() => (dirCurrentPage.value - 1) * PAGE_SIZE.value);

const dirCurrentItems = computed(() =>
  filteredEntries.value.slice(dirStartIdx.value, dirStartIdx.value + PAGE_SIZE.value),
);

watch(
  fileEntries,
  (items) => {
    selectedTag.value = null;
    const activeIdx = items.findIndex((item) => item.active);
    dirCurrentPage.value = activeIdx !== -1
      ? Math.floor(activeIdx / PAGE_SIZE.value) + 1
      : 1;
  },
  { immediate: true },
);

watch(selectedTag, () => { dirCurrentPage.value = 1; });

function getPaginationRange(
  current: number,
  total: number,
  maxButtons: number,
): (number | "...")[] {
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
  const wing = Math.max(1, Math.floor((maxButtons - 3) / 2));
  const pages: (number | "...")[] = [1];
  if (current > wing + 2) pages.push("...");
  for (let i = Math.max(2, current - wing); i <= Math.min(total - 1, current + wing); i++)
    pages.push(i);
  if (current < total - wing - 1) pages.push("...");
  pages.push(total);
  return pages;
}

const dirPaginationRange = computed(() =>
  getPaginationRange(dirCurrentPage.value, dirTotalPages.value, MAX_PAGE_BUTTONS.value),
);

const homePaginationRange = computed(() =>
  getPaginationRange(homeCurrentPage.value, homeTotalPages.value, MAX_PAGE_BUTTONS.value),
);

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault();
  router.go(link);
}

function toSafeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function absoluteUrl(link: string): string {
  const base = (site.value.base ?? "/").replace(/\/$/, "");
  const pathStr = link.startsWith("/") ? link : `/${link}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${base}${pathStr}`;
  }
  return `${base}${pathStr}`;
}

const jsonLdString = computed(() => {
  if (isHomePage.value) {
    return toSafeJsonLd({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: site.value.title ?? "",
      url: absoluteUrl("/"),
      blogPost: pagedArticles.value.slice(0, 20).map((a, i) => ({
        "@type": "BlogPosting",
        position: i + 1,
        headline: a.title,
        url: absoluteUrl(a.link),
        ...(a.date ? { dateModified: a.date } : {}),
      })),
    });
  }
  return toSafeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.value.title ?? "",
    url: absoluteUrl(route.path),
    numberOfItems: filteredEntries.value.length,
    itemListElement: filteredEntries.value.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.text,
      url: absoluteUrl(item.link),
    })),
  });
});
</script>

<template>
  <Teleport to="head">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <component :is="'script'" type="application/ld+json" v-html="jsonLdString" />
  </Teleport>

  <!-- Home page layout -->
  <div
    v-if="isHomePage"
    class="article-list article-list--home"
    itemscope
    itemtype="https://schema.org/Blog"
    role="main"
  >
    <div class="article-list__main">
      <div class="article-list__articles">
        <div v-if="homeTags.size > 0" class="filter-bar" role="status" aria-live="polite">
          <div class="filter-bar__tags">
            <span class="filter-bar__label">Filter</span>
            <span
              v-for="tag in homeTags"
              :key="tag"
              class="filter-bar__chip"
              role="button"
              tabindex="0"
              @click="homeSelectTag(tag)"
              @keydown.enter="homeSelectTag(tag)"
            >
              {{ tag }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </div>
          <span class="filter-bar__count">{{ articles.length }} articles</span>
          <button class="filter-bar__clear" @click="homeSelectTag(null)">Clear all</button>
        </div>

        <article
          v-for="item in pagedArticles"
          :key="item.link"
          class="article-card"
          itemscope
          itemtype="https://schema.org/BlogPosting"
        >
          <div class="article-card__content">
            <h2 class="article-card__title" itemprop="headline">
              <a :href="item.link" itemprop="url" @click="(e) => handleClick(e, item.link)">{{ item.title }}</a>
            </h2>
            <div class="article-card__meta">
              <time v-if="item.date" class="article-card__date" :datetime="item.date" itemprop="dateModified">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </time>
              <span v-if="item.tags.length" class="article-card__tags" role="list">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="article-card__tag"
                  :style="tagStyle(tag, homeTags.has(tag))"
                  :class="{ 'is-active': homeTags.has(tag) }"
                  role="listitem"
                  tabindex="0"
                  :aria-pressed="homeTags.has(tag)"
                  @click="homeSelectTag(tag)"
                  @keydown.enter="homeSelectTag(tag)"
                >#{{ tag }}</span>
              </span>
            </div>
            <p v-if="item.description" class="article-card__desc" itemprop="description">{{ item.description }}</p>
          </div>
          <div v-if="item.cover" class="article-card__cover">
            <ThumbHashImage :src="item.cover" :alt="item.title ?? ''" :hash="item.coverHash" itemprop="image" />
          </div>
        </article>

        <div v-if="!pagedArticles.length" class="article-list__empty" role="status">No articles found</div>

        <nav v-if="homeTotalPages > 1" class="article-list__pagination" aria-label="Article pages">
          <button class="page-btn page-btn--nav" :disabled="homeCurrentPage <= 1" aria-label="Previous" @click="homeGoToPage(homeCurrentPage - 1)">&lsaquo;</button>
          <template v-for="p in homePaginationRange" :key="p">
            <span v-if="p === '...'" class="page-ellipsis" aria-hidden="true">&hellip;</span>
            <button v-else :class="['page-btn', { 'is-active': p === homeCurrentPage }]" :aria-current="p === homeCurrentPage ? 'page' : undefined" @click="homeGoToPage(Number(p))">{{ p }}</button>
          </template>
          <button class="page-btn page-btn--nav" :disabled="homeCurrentPage >= homeTotalPages" aria-label="Next" @click="homeGoToPage(homeCurrentPage + 1)">&rsaquo;</button>
        </nav>
      </div>
    </div>

    <aside class="article-list__sidebar">
      <div class="sidebar-card">
        <div class="sidebar-card__stats">
          <div class="stat-item">
            <span class="stat-item__number">{{ articles.length }}</span>
            <span class="stat-item__label">Posts</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__number">{{ allTags.length }}</span>
            <span class="stat-item__label">Tags</span>
          </div>
        </div>
      </div>
      <div v-if="allTags.length" class="sidebar-card">
        <TagsCloud :tags="allTags" :selected="homeTags" :limit="TAG_SHOW_LIMIT" title="Tags" @select="homeSelectTag" />
      </div>
    </aside>
  </div>

  <!-- Directory page layout -->
  <nav
    v-else-if="fileEntries.length"
    class="article-list article-list--dir"
    itemscope
    itemtype="https://schema.org/ItemList"
  >
    <header class="article-list__header">
      <h2 class="article-list__title" itemprop="name">Articles</h2>
      <span class="article-list__count" role="status">
        <template v-if="selectedTag">{{ filteredEntries.length }} / {{ fileEntries.length }}</template>
        <template v-else>{{ fileEntries.length }}</template>
      </span>
    </header>

    <div class="article-list__cards">
      <article
        v-for="(item, idx) in dirCurrentItems"
        :key="item.link"
        class="article-card"
        :class="{ 'is-active': item.active }"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        <meta :content="String(dirStartIdx + idx + 1)" itemprop="position" />
        <div class="article-card__content">
          <h2 class="article-card__title">
            <a :href="item.link" itemprop="url" @click="(e) => handleClick(e, item.link)">
              <span itemprop="name">{{ item.text }}</span>
            </a>
          </h2>
          <div class="article-card__meta">
            <time v-if="item.date" class="article-card__date" :datetime="item.date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {{ item.date }}
            </time>
            <span v-if="item.tags.length" class="article-card__tags" role="list">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="article-card__tag"
                :style="tagStyle(tag)"
                :class="{ 'is-active': selectedTag === tag }"
                role="listitem"
                tabindex="0"
                :aria-pressed="selectedTag === tag"
                @click="selectedTag = selectedTag === tag ? null : tag"
                @keydown.enter="selectedTag = selectedTag === tag ? null : tag"
              >#{{ tag }}</span>
            </span>
          </div>
          <p v-if="item.description" class="article-card__desc">{{ item.description }}</p>
        </div>
        <div v-if="item.cover" class="article-card__cover">
          <ThumbHashImage :src="item.cover" :alt="item.text" :hash="item.coverHash" />
        </div>
      </article>

      <div v-if="dirCurrentItems.length === 0" class="article-list__empty" role="status">No articles found</div>
    </div>

    <nav v-if="dirTotalPages > 1" class="article-list__pagination" aria-label="Article pages">
      <button class="page-btn page-btn--nav" :disabled="dirCurrentPage <= 1" aria-label="Previous" @click="dirCurrentPage--">&lsaquo;</button>
      <template v-for="p in dirPaginationRange" :key="p">
        <span v-if="p === '...'" class="page-ellipsis" aria-hidden="true">&hellip;</span>
        <button v-else :class="['page-btn', { 'is-active': p === dirCurrentPage }]" :aria-current="p === dirCurrentPage ? 'page' : undefined" @click="dirCurrentPage = Number(p)">{{ p }}</button>
      </template>
      <button class="page-btn page-btn--nav" :disabled="dirCurrentPage >= dirTotalPages" aria-label="Next" @click="dirCurrentPage++">&rsaquo;</button>
    </nav>
  </nav>
</template>

<style scoped>
.article-list {
  width: 100%;
  box-sizing: border-box;
}

.article-list--home {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.article-list__main {
  flex: 1;
  min-width: 0;
}

.article-list__sidebar {
  flex-shrink: 0;
  width: 300px;
}

.article-list--dir {
  margin: 32px 0;
  display: block;
}

.article-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.article-list__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.article-list__count {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.article-list__cards {
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.filter-bar__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-bar__label {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-right: 2px;
}

.filter-bar__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-soft) 40%, transparent);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-bar__chip:hover { background: color-mix(in srgb, var(--vp-c-brand-soft) 70%, transparent); }
.filter-bar__chip svg { opacity: 0.5; transition: opacity 0.2s; }
.filter-bar__chip:hover svg { opacity: 1; }

.filter-bar__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.filter-bar__clear {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-bar__clear:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.article-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.article-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.article-card.is-active {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-soft) 6%, var(--vp-c-bg));
}

.article-card__content {
  flex: 1;
  min-width: 0;
}

.article-card__title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.article-card__title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.article-card__title a:hover { color: var(--vp-c-brand-1); }

.article-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.article-card__date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.article-card__tag {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--tag-color, var(--vp-c-brand-1));
  background: var(--tag-bg, color-mix(in srgb, var(--vp-c-brand-soft) 25%, transparent));
  border: 1px solid var(--tag-border, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.article-card__tag:hover { filter: brightness(0.93); }

.article-card__tag.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.article-card__desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card__cover {
  flex-shrink: 0;
  width: 180px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.article-list__empty {
  padding: 60px 0;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

.article-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 34px;
}

.page-btn:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-btn.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.page-btn--nav { font-size: 18px; font-weight: 400; }

.page-ellipsis {
  padding: 0 4px;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.sidebar-card {
  padding: 20px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.sidebar-card__stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item { display: flex; flex-direction: column; gap: 4px; }

.stat-item__number {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-item__label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

@media (max-width: 960px) {
  .article-list--home {
    flex-direction: column;
    padding: 16px;
  }

  .article-list__sidebar {
    width: 100%;
    order: -1;
  }

  .article-card__cover {
    width: 140px;
    height: 96px;
  }
}

@media (max-width: 640px) {
  .article-list--dir {
    margin: 20px 0;
  }

  .article-card {
    flex-direction: column;
    padding: 16px;
  }

  .article-card__cover {
    width: 100%;
    height: 160px;
    order: -1;
  }

  .article-card__title {
    font-size: 16px;
  }
}
</style>
