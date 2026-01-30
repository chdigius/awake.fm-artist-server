<template>
  <div class="collection-carousel">
    <!-- Previous Arrow -->
    <button
      v-if="layout.controls?.arrows !== false"
      class="carousel-nav carousel-nav--prev"
      @click="scrollPrev"
      :disabled="!canScrollPrev"
      aria-label="Previous"
    >
      ‹
    </button>

    <!-- Carousel Track -->
    <div
      ref="track"
      class="carousel-track"
      :style="trackStyles"
      @scroll="handleScroll"
    >
      <component
        v-for="item in items"
        :key="item.path || item.filename"
        :is="cardComponent"
        :item="item"
        :visualizer="visualizer"
        :collection-metadata="collectionMetadata"
        mode="carousel"
        class="carousel-slide"
      />
    </div>

    <!-- Next Arrow -->
    <button
      v-if="layout.controls?.arrows !== false"
      class="carousel-nav carousel-nav--next"
      @click="scrollNext"
      :disabled="!canScrollNext"
      aria-label="Next"
    >
      ›
    </button>

    <!-- Dots Navigation -->
    <div v-if="layout.controls?.dots" class="carousel-dots">
      <button
        v-for="(dot, idx) in totalPages"
        :key="idx"
        class="carousel-dot"
        :class="{ active: idx === currentPage }"
        @click="scrollToPage(idx)"
        :aria-label="`Go to page ${idx + 1}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import ArtistCard from '@/components/cards/ArtistCard.vue';
import SetCard from '@/components/cards/SetCard.vue';

interface CollectionItem {
  type?: 'media_file' | string;
  path: string;
  layout?: string;
  slug?: string;
  display_name?: string;
  filename?: string;
  extension?: string;
  title?: string;
  duration?: number;
  metadata?: Record<string, any>;
  preview?: {
    title?: string;
    subtitle?: string;
    image?: string;
    badge?: string;
    blurb?: string;
  };
}

interface CollectionCarouselProps {
  items: CollectionItem[];
  layout: {
    mode: 'carousel';
    slides_per_view?: Record<string, number>;
    spacing?: string;
    loop?: boolean;
    autoplay?: {
      enabled?: boolean;
      interval_ms?: number;
      pause_on_hover?: boolean;
    };
    controls?: {
      arrows?: boolean;
      dots?: boolean;
    };
    snap_align?: 'start' | 'center';
    max_width?: string;
  };
  card?: string;
  visualizer?: {
    id?: string;
    seed_from?: string[];
    options?: Record<string, any>;
  };
  collectionMetadata?: {
    source: string;
    path: string;
    pattern?: string;
  };
}

const props = withDefaults(defineProps<CollectionCarouselProps>(), {
  card: 'artist',
});

console.log('[CollectionCarousel] Layout config:', props.layout);
console.log('[CollectionCarousel] Card type:', props.card);
console.log('[CollectionCarousel] Item count:', props.items.length);

const track = ref<HTMLElement | null>(null);
const currentPage = ref(0);
const canScrollPrev = ref(false);
const canScrollNext = ref(true);
let autoplayInterval: number | null = null;

// Map card type to component
const cardComponent = computed(() => {
  switch (props.card) {
    case 'artist':
      return ArtistCard;
    case 'set':
      return SetCard;
    // Future: case 'album': return AlbumCard;
    // Future: case 'track': return TrackCard;
    default:
      return ArtistCard;
  }
});

// Calculate slides per view for current breakpoint
const slidesPerView = computed(() => {
  const config = props.layout.slides_per_view || { xl: 5, lg: 4, md: 3, sm: 2, xs: 1 };
  // Default to lg for now (could add responsive detection)
  return config.lg || 4;
});

// Total pages for dot navigation
const totalPages = computed(() => {
  return Math.ceil(props.items.length / slidesPerView.value);
});

// Build track styles
const trackStyles = computed(() => {
  const spacing = props.layout.spacing || '1rem';
  const snapAlign = props.layout.snap_align || 'start';
  const maxWidth = props.layout.max_width || '100%';

  return {
    '--carousel-spacing': spacing,
    '--carousel-snap-align': snapAlign,
    '--carousel-max-width': maxWidth,
  };
});

// Scroll navigation
function scrollPrev() {
  if (!track.value) return;
  const slideWidth = track.value.scrollWidth / props.items.length;
  const scrollAmount = slideWidth * slidesPerView.value;
  track.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
}

function scrollNext() {
  if (!track.value) return;
  const slideWidth = track.value.scrollWidth / props.items.length;
  const scrollAmount = slideWidth * slidesPerView.value;
  track.value.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

function scrollToPage(pageIndex: number) {
  if (!track.value) return;
  const slideWidth = track.value.scrollWidth / props.items.length;
  const scrollAmount = slideWidth * slidesPerView.value * pageIndex;
  track.value.scrollTo({ left: scrollAmount, behavior: 'smooth' });
}

// Handle scroll events to update nav state
function handleScroll() {
  if (!track.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = track.value;

  // Update prev/next button states
  canScrollPrev.value = scrollLeft > 10;
  canScrollNext.value = scrollLeft < scrollWidth - clientWidth - 10;

  // Update current page for dots
  const slideWidth = scrollWidth / props.items.length;
  const scrolledSlides = Math.round(scrollLeft / slideWidth);
  currentPage.value = Math.floor(scrolledSlides / slidesPerView.value);
}

// Autoplay functionality
function startAutoplay() {
  const autoplayConfig = props.layout.autoplay;
  if (!autoplayConfig?.enabled) return;

  const interval = autoplayConfig.interval_ms || 8000;

  autoplayInterval = window.setInterval(() => {
    if (!track.value) return;

    // If at end and loop enabled, go back to start
    if (!canScrollNext.value && props.layout.loop) {
      track.value.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (canScrollNext.value) {
      scrollNext();
    }
  }, interval);
}

function stopAutoplay() {
  if (autoplayInterval !== null) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

// Pause on hover
function handleMouseEnter() {
  if (props.layout.autoplay?.pause_on_hover) {
    stopAutoplay();
  }
}

function handleMouseLeave() {
  if (props.layout.autoplay?.pause_on_hover) {
    startAutoplay();
  }
}

onMounted(() => {
  if (track.value) {
    handleScroll(); // Initialize button states

    // Set up autoplay
    startAutoplay();

    // Pause on hover
    if (props.layout.autoplay?.pause_on_hover) {
      track.value.addEventListener('mouseenter', handleMouseEnter);
      track.value.addEventListener('mouseleave', handleMouseLeave);
    }
  }
});

onBeforeUnmount(() => {
  stopAutoplay();

  if (track.value && props.layout.autoplay?.pause_on_hover) {
    track.value.removeEventListener('mouseenter', handleMouseEnter);
    track.value.removeEventListener('mouseleave', handleMouseLeave);
  }
});
</script>

<style scoped>
.collection-carousel {
  position: relative;
  width: 100%;
  max-width: var(--carousel-max-width, 100%);
  margin: 0 auto;
}

/* Carousel Track */
.carousel-track {
  display: flex;
  gap: var(--carousel-spacing);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  padding: 1rem 0;
}

.carousel-track::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* Slides */
.carousel-slide {
  flex: 0 0 auto;
  scroll-snap-align: var(--carousel-snap-align, start);
  width: calc((100% - (var(--carousel-spacing) * 3)) / 4); /* Default 4 slides */
}

/* Responsive slides per view */
@media (max-width: 640px) {
  .carousel-slide {
    width: calc(100% - var(--carousel-spacing));
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .carousel-slide {
    width: calc((100% - var(--carousel-spacing)) / 2);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .carousel-slide {
    width: calc((100% - (var(--carousel-spacing) * 2)) / 3);
  }
}

@media (min-width: 1280px) {
  .carousel-slide {
    width: calc((100% - (var(--carousel-spacing) * 4)) / 5);
  }
}

/* Navigation Arrows */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-nav:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-50%) scale(1.1);
}

.carousel-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-nav--prev {
  left: -24px;
}

.carousel-nav--next {
  right: -24px;
}

/* Dots Navigation */
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border, #444);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.carousel-dot:hover {
  background: var(--color-text-secondary, #888);
}

.carousel-dot.active {
  background: var(--color-accent, #fff);
  transform: scale(1.2);
}
</style>

