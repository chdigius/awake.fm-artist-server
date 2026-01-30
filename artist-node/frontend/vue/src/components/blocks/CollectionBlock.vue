<template>
  <div ref="collectionRoot" class="collection-block">
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
        :visualizer="media?.visualizer"
        :collection-metadata="{
          source: source,
          path: path,
          pattern: pattern
        }"
      />

      <!-- Pagination controls -->
      <div v-if="paging?.enabled && paging.total_pages > 1" class="collection-block__pagination">
        <div class="collection-block__pages">
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

const collectionRoot = ref<HTMLElement | null>(null);

// Global flag to ensure only one collection handles deep link
// @ts-ignore
if (!window.__deepLinkHandled) {
  // @ts-ignore
  window.__deepLinkHandled = false;
}

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
  pattern?: string;
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
  media?: {
    type?: 'audio' | 'video';
    visualizer?: {
      id?: string;
      seed_from?: string[];
      options?: Record<string, any>;
    };
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
const loading = ref(!props.items || props.items.length === 0); // Only skip loading if items exist AND have length
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

    if (props.pattern) params.set('pattern', props.pattern);
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

// Check for deep link on mount
async function checkDeepLink() {
  const hash = window.location.hash;
  if (!hash.startsWith('#track-')) return null;

  // Check if another collection already handled this
  // @ts-ignore
  if (window.__deepLinkHandled) {
    console.log(`[CollectionBlock:${props.path}] Deep link already handled by another collection, skipping`);
    return null;
  }

  // Parse hash params
  const hashParams = new URLSearchParams(hash.substring(1)); // Remove # and parse
  const trackId = hashParams.get('track')?.replace('track-', '') || hash.split('&')[0].replace('#track-', '');
  const hashSource = hashParams.get('source');
  const hashPath = hashParams.get('path');
  const hashPattern = hashParams.get('pattern');

  console.log(`[CollectionBlock:${props.path}] Hash params:`, { trackId, hashSource, hashPath, hashPattern });

  // Check if this hash is for THIS collection
  if (hashSource && hashSource !== props.source) {
    console.log(`[CollectionBlock:${props.path}] Source mismatch (${hashSource} vs ${props.source}), skipping`);
    return null;
  }
  if (hashPath && hashPath !== props.path) {
    console.log(`[CollectionBlock:${props.path}] Path mismatch (${hashPath} vs ${props.path}), skipping`);
    return null;
  }

  console.log(`[CollectionBlock:${props.path}] ✅ This collection matches hash params, searching for track:`, trackId);

  try {
    const params = new URLSearchParams({
      track_id: trackId,
      source: props.source,
      path: props.path,
    });

    if (props.pattern) params.set('pattern', props.pattern);
    if (props.paging?.page_size) params.set('page_size', props.paging.page_size.toString());

    const response = await fetch(`/api/collection/find-track?${params}`);
    if (!response.ok) {
      console.warn(`[CollectionBlock:${props.path}] Find track failed:`, response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.found) {
      console.log(`[CollectionBlock:${props.path}] ✅ Track found!`, data);
      // Mark as handled so other collections skip
      // @ts-ignore
      window.__deepLinkHandled = true;
      return data;
    } else {
      console.log(`[CollectionBlock:${props.path}] Track not found in this collection`);
      return null;
    }
  } catch (err) {
    console.error(`[CollectionBlock:${props.path}] Find track error:`, err);
    return null;
  }
}

// Load initial data
async function loadInitial() {
  // Check for deep link first
  const deepLink = await checkDeepLink();

  // If deep link found, ALWAYS fetch from API to get correct page
  if (deepLink) {
    console.log(`[CollectionBlock:${props.path}] Deep link found, loading page ${deepLink.page}...`);
    loading.value = true;
    error.value = null;

    try {
      const data = await fetchCollection(deepLink.page);
      console.log('[CollectionBlock] API response:', data);
      items.value = data.items || [];
      layout.value = data.layout || layout.value;
      paging.value = data.paging || null;
      console.log('[CollectionBlock] After fetch - items:', items.value.length, 'layout:', layout.value.mode);
      console.log('[CollectionBlock] Paging:', paging.value);

      // Scroll to track after items render
      setTimeout(() => scrollToTrack(deepLink), 500);
    } catch (err: any) {
      console.error('[CollectionBlock] Fetch error:', err);
      error.value = err.message || 'Failed to load collection';
    } finally {
      loading.value = false;
    }
    return;
  }

  // No deep link - use embedded items if available
  if (props.items && props.items.length > 0) {
    // Items already provided in page payload
    // Still need to set paging from props if embedded!
    if (props.paging) {
      paging.value = props.paging;
    }
    console.log('[CollectionBlock] Using embedded items:', props.items.length);
    console.log('[CollectionBlock] Embedded paging:', paging.value);
    return;
  }

  // No deep link, no embedded items - fetch page 1
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchCollection(1);
    console.log('[CollectionBlock] API response:', data);
    items.value = data.items || [];
    layout.value = data.layout || layout.value;
    paging.value = data.paging || null;
    console.log('[CollectionBlock] After fetch - items:', items.value.length, 'layout:', layout.value.mode);
    console.log('[CollectionBlock] Paging:', paging.value);
  } catch (err: any) {
    console.error('[CollectionBlock] Fetch error:', err);
    error.value = err.message || 'Failed to load collection';
  } finally {
    loading.value = false;
  }
}

// Scroll to and optionally play track
function scrollToTrack(deepLink: any) {
  const hash = window.location.hash;
  const trackId = hash.replace('#track-', '').split('&')[0];
  const element = document.getElementById(`track-${trackId}`);

  if (element) {
    console.log('[CollectionBlock] Scrolling to track:', trackId);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-play after scroll
    setTimeout(() => {
      console.log('[CollectionBlock] Auto-clicking track:', trackId);
      element.click();
    }, 1000);
  } else {
    console.warn('[CollectionBlock] Track element not found:', trackId);
  }
}

// Go to specific page
async function goToPage(pageNum: number) {
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchCollection(pageNum);
    console.log('[CollectionBlock] Page change - fetched page', pageNum, 'with', data.items?.length, 'items');
    items.value = data.items || []; // Replace, don't append!
    paging.value = data.paging || null;
    console.log('[CollectionBlock] New paging state:', paging.value);
    
    // Scroll to top of this collection block (not top of page)
    if (collectionRoot.value) {
      collectionRoot.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err: any) {
    console.error('[CollectionBlock] Page change error:', err);
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
  const maxVisible = 5; // Always show 5 buttons (or fewer if total < 5)
  
  // If total pages <= maxVisible, show all pages
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  // Calculate sliding window
  const halfWindow = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - halfWindow);
  let end = Math.min(total, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

onMounted(() => {
  console.log('[CollectionBlock] Mounted with props:', {
    source: props.source,
    path: props.path,
    pattern: props.pattern,
    card: props.card,
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

