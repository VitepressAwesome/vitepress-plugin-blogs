<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useData } from "vitepress";
import { useBlogHome } from "./useBlogHome";
import TagsCloud from "./TagsCloud.vue";

const router = useRouter();
const { isDark } = useData();
const {
  articles,
  pagedArticles,
  allTags,
  selectedTags,
  currentPage,
  totalPages,
  selectTag,
  goToPage,
} = useBlogHome();

function handleClick(e: MouseEvent, link: string) {
  e.preventDefault();
  router.go(link);
}

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 5) pages.push("...");
  for (
    let i = Math.max(2, current - 3);
    i <= Math.min(total - 1, current + 3);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 4) pages.push("...");
  pages.push(total);
  return pages;
}

const TAG_SHOW_LIMIT = 20;

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
  <div class="blog-home">
    <div class="blog-home__main">
      <!-- Article List -->
      <div class="blog-home__articles">
        <div v-if="selectedTags.size > 0" class="blog-home__filter-info">
          <div class="blog-home__filter-tags">
            <span class="blog-home__filter-label">筛选</span>
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="blog-home__filter-chip"
              @click="selectTag(tag)"
            >
              {{ tag }}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </div>
          <span class="blog-home__filter-count">{{ articles.length }} 篇</span>
          <button class="blog-home__filter-clear" @click="selectTag(null)">
            清除全部
          </button>
        </div>

        <article
          v-for="item in pagedArticles"
          :key="item.link"
          class="blog-card"
        >
          <div class="blog-card__content">
            <h2 class="blog-card__title">
              <a :href="item.link" @click="(e) => handleClick(e, item.link)">
                {{ item.title }}
              </a>
            </h2>
            <div class="blog-card__meta">
              <span v-if="item.date" class="blog-card__date">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </span>
              <span v-if="item.tags.length" class="blog-card__tags-inline">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="blog-card__tag"
                  :style="tagStyle(tag, false)"
                  @click="selectTag(tag)"
                >
                  #{{ tag }}
                </span>
              </span>
            </div>
            <p v-if="item.description" class="blog-card__desc">
              {{ item.description }}
            </p>
          </div>
          <div v-if="item.cover" class="blog-card__cover">
            <img :src="item.cover" :alt="item.title" loading="lazy" />
          </div>
        </article>

        <div v-if="!pagedArticles.length" class="blog-home__empty">
          暂无文章
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="blog-home__pagination">
          <button
            class="pagination__btn"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>
          <template
            v-for="p in getPaginationRange(currentPage, totalPages)"
            :key="p"
          >
            <span v-if="p === '...'" class="pagination__ellipsis">…</span>
            <button
              v-else
              :class="['pagination__btn', { 'is-active': p === currentPage }]"
              @click="goToPage(p as number)"
            >
              {{ p }}
            </button>
          </template>
          <button
            class="pagination__btn"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="blog-home__sidebar">
      <!-- Stats -->
      <div class="sidebar-card">
        <div class="sidebar-card__stats">
          <div class="stat-item">
            <span class="stat-item__number">{{ articles.length }}</span>
            <span class="stat-item__label">文章</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__number">{{ allTags.length }}</span>
            <span class="stat-item__label">标签</span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="allTags.length" class="sidebar-card">
        <TagsCloud
          :tags="allTags"
          :selected="selectedTags"
          :limit="TAG_SHOW_LIMIT"
          title="🏷️ 标签"
          @select="selectTag"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.blog-home {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.blog-home__main {
  flex: 1;
  min-width: 0;
}

.blog-home__sidebar {
  flex-shrink: 0;
  width: 300px;
}

.blog-home__filter-info {
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

.blog-home__filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.blog-home__filter-label {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-right: 2px;
}

.blog-home__filter-chip {
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

.blog-home__filter-chip:hover {
  background: color-mix(in srgb, var(--vp-c-brand-soft) 70%, transparent);
}

.blog-home__filter-chip svg {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.blog-home__filter-chip:hover svg {
  opacity: 1;
}

.blog-home__filter-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.blog-home__filter-clear {
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

.blog-home__filter-clear:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

/* Article Card */
.blog-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.blog-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.blog-card__content {
  flex: 1;
  min-width: 0;
}

.blog-card__title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.blog-card__title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.blog-card__title a:hover {
  color: var(--vp-c-brand-1);
}

.blog-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.blog-card__date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.blog-card__tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.blog-card__tag {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--tag-color, var(--vp-c-brand-1));
  background: var(
    --tag-bg,
    color-mix(in srgb, var(--vp-c-brand-soft) 25%, transparent)
  );
  border: 1px solid var(--tag-border, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.blog-card__tag:hover {
  filter: brightness(0.93);
}

.blog-card__desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-card__cover {
  flex-shrink: 0;
  width: 180px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.blog-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Pagination */
.blog-home__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.pagination__btn {
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
}

.pagination__btn:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__btn.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.pagination__ellipsis {
  padding: 0 4px;
  color: var(--vp-c-text-3);
}

.blog-home__empty {
  padding: 60px 0;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

/* Sidebar */
.sidebar-card {
  padding: 20px;
  margin-bottom: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.sidebar-card__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.sidebar-card__stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item__number {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-item__label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.sidebar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sidebar-tag {
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

.sidebar-tag:hover {
  filter: brightness(0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.sidebar-tag.is-active {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sidebar-tag__count {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  min-width: 16px;
  text-align: center;
  line-height: 1.6;
}

.sidebar-tag.is-active .sidebar-tag__count {
  background: rgba(255, 255, 255, 0.25);
}

.sidebar-tags__toggle {
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

.sidebar-tags__toggle:hover {
  color: var(--vp-c-brand-1);
}

/* Responsive */
@media (max-width: 960px) {
  .blog-home {
    flex-direction: column;
    padding: 16px;
  }

  .blog-home__sidebar {
    width: 100%;
    order: -1;
  }

  .blog-card__cover {
    width: 140px;
    height: 96px;
  }
}

@media (max-width: 640px) {
  .blog-card {
    flex-direction: column;
    padding: 16px;
  }

  .blog-card__cover {
    width: 100%;
    height: 160px;
    order: -1;
  }

  .blog-card__title {
    font-size: 16px;
  }
}
</style>
