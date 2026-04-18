// Copyright (c) 2024-present 知在 (zz@dmsrs.org). MIT License.
import { ref } from 'vue'

// Module-level singleton: shared between AutoToc and IndexTagsAside on the same page
const selectedTag = ref<string | null>(null)

export function useIndexTagsStore() {
  return { selectedTag }
}
