<template>
  <div class="collection-list" :style="listStyles">
    <component
      v-for="item in items"
      :key="item.path || item.filename"
      :is="cardComponent"
      :item="item"
      :visualizer="visualizer"
      mode="list"
    />
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

interface CollectionListProps {
  items: CollectionItem[];
  layout: {
    mode: 'list';
    max_width?: string;
    gap?: string;
    align?: {
      horizontal?: string;
    };
  };
  card?: string;
  visualizer?: {
    id?: string;
    seed_from?: string[];
    options?: Record<string, any>;
  };
}

const props = withDefaults(defineProps<CollectionListProps>(), {
  card: 'artist',
});

console.log('[CollectionList] Layout config:', props.layout);
console.log('[CollectionList] Item count:', props.items.length);
console.log('[CollectionList] Card type:', props.card);

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

// Build list styles from layout config
const listStyles = computed(() => {
  const gap = props.layout.gap || '1rem';
  const maxWidth = props.layout.max_width || '100%';
  const align = props.layout.align?.horizontal || 'stretch';

  // Map horizontal align to CSS alignment and margin
  let alignItems = 'stretch';
  let marginLeft = '0';
  let marginRight = '0';

  if (align === 'center') {
    alignItems = 'center';
    marginLeft = 'auto';
    marginRight = 'auto';
  } else if (align === 'start' || align === 'left') {
    alignItems = 'flex-start';
    marginLeft = '0';
    marginRight = 'auto';
  } else if (align === 'end' || align === 'right') {
    alignItems = 'flex-end';
    marginLeft = 'auto';
    marginRight = '0';
  }

  return {
    '--list-gap': gap,
    '--list-max-width': maxWidth,
    '--list-align-items': alignItems,
    '--list-margin-left': marginLeft,
    '--list-margin-right': marginRight,
  };
});
</script>

<style scoped>
.collection-list {
  display: flex;
  flex-direction: column;
  gap: var(--list-gap);
  max-width: var(--list-max-width);
  width: 100%;
  margin-left: var(--list-margin-left);
  margin-right: var(--list-margin-right);
  align-items: var(--list-align-items);
}

/* List items get full width by default */
.collection-list > * {
  width: 100%;
}
</style>

