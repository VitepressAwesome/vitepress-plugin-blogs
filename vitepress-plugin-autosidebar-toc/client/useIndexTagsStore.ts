import { ref } from 'vue'

// Module-level singleton: shared between AutoToc and IndexTagsAside on the same page
const selectedTag = ref<string | null>(null)

export function useIndexTagsStore() {
  return { selectedTag }
}
