<template>
  <div class="collection-grid-wrapper" :style="wrapperStyles">
    <div class="collection-grid" :style="gridStyles">
      <component
        v-for="item in items"
        :key="item.path || item.filename"
        :is="cardComponent"
        :item="item"
        :visualizer="visualizer"
        :thumbnail="thumbnail"
        :collection-metadata="collectionMetadata"
        mode="grid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

interface CollectionGridProps {
  items: CollectionItem[];
  layout: {
    mode: 'grid';
    columns?: Record<string, number>;
    gap?: {
      row?: string;
      column?: string;
    };
    align?: {
      horizontal?: string;
      vertical?: string;
    };
  };
  card?: string;
  visualizer?: {
    id?: string;
    seed_from?: string[];
    options?: Record<string, any>;
  };
  thumbnail?: {
    seedImage?: string;
    colorMode?: 'duotone_generate' | 'colorize_bw' | 'extract_and_vary' | 'manual_palette';
    palette?: string[];
    pattern?: 'none' | 'geometric' | 'waves' | 'particles' | 'grid' | 'organic';
    blendSeed?: boolean;
    blendMode?: 'multiply' | 'overlay' | 'screen' | 'difference' | 'add';
    patternOpacity?: number;
    animationSpeed?: number;
  };
  collectionMetadata?: {
    source: string;
    path: string;
    pattern?: string;
  };
}

const props = withDefaults(defineProps<CollectionGridProps>(), {
  card: 'artist',
});

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
      return ArtistCard; // fallback
  }
});

// Wrapper styles (not needed anymore, but keeping for compatibility)
const wrapperStyles = computed(() => {
  return {};
});

// Build responsive grid CSS
const gridStyles = computed(() => {
  const columns = props.layout.columns || { xl: 5, lg: 4, md: 3, sm: 2, xs: 1 };
  const gap = props.layout.gap || { row: '1.5rem', column: '1.5rem' };
  const align = props.layout.align || { horizontal: 'stretch', vertical: 'start' };
  
  // Cap columns at item count - never show more columns than items
  const itemCount = props.items.length;
  const cappedColumns = {
    xs: Math.min(columns.xs || 1, itemCount),
    sm: Math.min(columns.sm || 2, itemCount),
    md: Math.min(columns.md || 3, itemCount),
    lg: Math.min(columns.lg || 4, itemCount),
    xl: Math.min(columns.xl || 5, itemCount),
  };
  
  // Map horizontal align to CSS justify-content for the grid
  const justifyContent = align.horizontal === 'center' ? 'center' :
                         align.horizontal === 'start' ? 'start' :
                         'stretch';
  
  return {
    '--grid-columns-xs': cappedColumns.xs,
    '--grid-columns-sm': cappedColumns.sm,
    '--grid-columns-md': cappedColumns.md,
    '--grid-columns-lg': cappedColumns.lg,
    '--grid-columns-xl': cappedColumns.xl,
    '--grid-gap-row': gap.row || '1.5rem',
    '--grid-gap-column': gap.column || '1.5rem',
    '--grid-justify-content': justifyContent,
    '--grid-align-items': align.vertical || 'start',
  };
});
</script>

<style scoped>
.collection-grid-wrapper {
  display: flex;
  justify-content: var(--wrapper-justify);
  width: 100%;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns-xs), 1fr);
  gap: var(--grid-gap-row) var(--grid-gap-column);
  width: var(--grid-width);
  max-width: 100%;
  justify-items: var(--grid-justify-items);
  align-items: var(--grid-align-items);
}

/* Responsive breakpoints matching base.css */
@media (min-width: 640px) {
  .collection-grid {
    grid-template-columns: repeat(var(--grid-columns-sm), 1fr);
  }
}

@media (min-width: 768px) {
  .collection-grid {
    grid-template-columns: repeat(var(--grid-columns-md), 1fr);
  }
}

@media (min-width: 1024px) {
  .collection-grid {
    grid-template-columns: repeat(var(--grid-columns-lg), 1fr);
  }
}

@media (min-width: 1280px) {
  .collection-grid {
    grid-template-columns: repeat(var(--grid-columns-xl), 1fr);
  }
}
</style>

