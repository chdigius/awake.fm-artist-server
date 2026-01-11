<template>
  <div class="collection-block">
    <!-- Loading state -->
    <div v-if="loading" class="collection-block__loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="collection-block__error">
      <p>{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="collection-block__empty">
      <h3>{{ emptyState?.heading || 'No items found' }}</h3>
      <p v-if="emptyState?.body">{{ emptyState.body }}</p>
    </div>

    <!-- Collection content -->
    <div v-else class="collection-block__content">
      <component
        :is="layoutComponent"
        :items="items"
        :layout="layout"
        :card="card"
      />

      <!-- Pagination controls -->
      <div v-if="paging?.enabled && paging.has_more" class="collection-block__pagination">
        <button
          v-if="paging.mode === 'load_more'"
          @click="loadMore"
          :disabled="loadingMore"
          class="collection-block__load-more"
        >
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>

        <div v-else-if="paging.mode === 'pages'" class="collection-block__pages">
          <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            @click="goToPage(pageNum)"
            :class="{ active: pageNum === paging.page }"
            class="collection-block__page-btn"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CollectionGrid from '@/components/collections/CollectionGrid.vue';
import CollectionList from '@/components/collections/CollectionList.vue';
import CollectionCarousel from '@/components/collections/CollectionCarousel.vue';

interface CollectionItem {
  path: string;
  layout: string;
  slug?: string;
  display_name?: string;
  preview?: {
    title?: string;
    subtitle?: string;
    image?: string;
    badge?: string;
    blurb?: string;
  };
}

interface CollectionBlockProps {
  source: string;
  path: string;
  layout?: any;
  card?: string;
  sort?: string;
  limit?: number;
  paging?: {
    enabled: boolean;
    page_size?: number;
    mode?: 'load_more' | 'pages';
  };
  empty_state?: {
    heading?: string;
    body?: string;
  };
  // If items are pre-embedded in page payload, use those instead of fetching
  items?: CollectionItem[];
}

const props = withDefaults(defineProps<CollectionBlockProps>(), {
  card: 'artist',
  source: 'folder',
});

const items = ref<CollectionItem[]>(props.items || []);
const layout = ref(props.layout || { mode: 'grid' });
const paging = ref<any>(null);
const loading = ref(!props.items); // If items provided, skip loading
const loadingMore = ref(false);
const error = ref<string | null>(null);
const emptyState = computed(() => props.empty_state);

// Map layout mode to component
const layoutComponent = computed(() => {
  switch (layout.value.mode) {
    case 'grid':
      return CollectionGrid;
    case 'list':
      return CollectionList;
    case 'carousel':
      return CollectionCarousel;
    default:
      return CollectionGrid;
  }
});

// Fetch collection data from API
async function fetchCollection(page: number = 1) {
  try {
    const params = new URLSearchParams({
      source: props.source,
      path: props.path,
      page: page.toString(),
    });

    if (props.card) params.set('card', props.card);
    if (props.sort) params.set('sort', props.sort);
    if (props.limit) params.set('limit', props.limit.toString());
    if (props.paging?.page_size) params.set('page_size', props.paging.page_size.toString());
    if (layout.value.mode) params.set('mode', layout.value.mode);

    const response = await fetch(`/api/collection?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch collection: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Collection fetch error:', err);
    throw err;
  }
}

// Load initial data
async function loadInitial() {
  if (props.items) {
    // Items already provided in page payload
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await fetchCollection(1);
    items.value = data.items || [];
    layout.value = data.layout || layout.value;
    paging.value = data.paging || null;
  } catch (err: any) {
    error.value = err.message || 'Failed to load collection';
  } finally {
    loading.value = false;
  }
}

// Load more items (for load_more pagination mode)
async function loadMore() {
  if (!paging.value || loadingMore.value) return;

  loadingMore.value = true;
  error.value = null;

  try {
    const nextPage = (paging.value.page || 1) + 1;
    const data = await fetchCollection(nextPage);
    
    // Append new items
    items.value = [...items.value, ...(data.items || [])];
    paging.value = data.paging || null;
  } catch (err: any) {
    error.value = err.message || 'Failed to load more items';
  } finally {
    loadingMore.value = false;
  }
}

// Go to specific page (for pages pagination mode)
async function goToPage(pageNum: number) {
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchCollection(pageNum);
    items.value = data.items || [];
    paging.value = data.paging || null;
    
    // Scroll to top of collection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err: any) {
    error.value = err.message || 'Failed to load page';
  } finally {
    loading.value = false;
  }
}

// Compute visible page numbers for pagination
const visiblePages = computed(() => {
  if (!paging.value) return [];
  
  const current = paging.value.page || 1;
  const total = paging.value.total_pages || 1;
  const range = 2; // Show 2 pages on each side of current
  
  const pages: number[] = [];
  for (let i = Math.max(1, current - range); i <= Math.min(total, current + range); i++) {
    pages.push(i);
  }
  
  return pages;
});

onMounted(() => {
  console.log('[CollectionBlock] Mounted with props:', {
    source: props.source,
    path: props.path,
    hasItems: !!props.items,
    itemCount: props.items?.length || 0,
  });
  loadInitial();
});
</script>

<style scoped>
.collection-block {
  width: 100%;
  padding: 2rem 0;
}

.collection-block__loading,
.collection-block__error,
.collection-block__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.collection-block__loading .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.collection-block__error {
  color: var(--color-error, #ff4444);
}

.collection-block__empty h3 {
  margin: 0 0 0.5rem;
  color: var(--color-text-secondary);
}

.collection-block__empty p {
  margin: 0;
  color: var(--color-text-tertiary);
}

.collection-block__content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.collection-block__pagination {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

.collection-block__load-more {
  padding: 0.75rem 2rem;
  background: var(--color-accent);
  color: var(--color-text-on-accent, white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collection-block__load-more:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
}

.collection-block__load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.collection-block__pages {
  display: flex;
  gap: 0.5rem;
}

.collection-block__page-btn {
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collection-block__page-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}

.collection-block__page-btn.active {
  background: var(--color-accent);
  color: var(--color-text-on-accent, white);
  border-color: var(--color-accent);
}
</style>

