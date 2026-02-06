<template>
  <router-link :to="`/${item.path}`" :class="['artist-card', `artist-card--${mode}`]">
    <!-- NEW: Thumbnail (static or generative) -->
    <div v-if="item.preview?.thumbnail" class="artist-card__image">
      <ImageRenderer
        :config="item.preview.thumbnail"
        :item-name="item.display_name || item.slug"
        :aspect-ratio="1"
        image-class="artist-card__thumbnail"
      />
    </div>

    <!-- LEGACY: Custom image -->
    <div v-else-if="item.preview?.image" class="artist-card__image">
      <img :src="item.preview.image" :alt="item.display_name || item.preview.title" />
    </div>

    <!-- LEGACY: Custom p5 sigil -->
    <div v-else-if="item.preview?.sigil" class="artist-card__image">
      <RadiantForgeSigil
        :sigil-id="item.preview.sigil.id || 'node-001'"
        :options="item.preview.sigil.options"
      />
    </div>

    <!-- FALLBACK: Static placeholder (no more auto-generated sigils!) -->
    <div v-else class="artist-card__image artist-card__image--placeholder">
      <span class="placeholder-icon">♪</span>
    </div>

    <div class="artist-card__content">
      <h3 class="artist-card__title">
        {{ item.display_name || item.preview?.title || item.slug }}
      </h3>
      <p v-if="item.preview?.subtitle" class="artist-card__subtitle">
        {{ item.preview.subtitle }}
      </p>
      <p v-if="item.preview?.blurb" class="artist-card__blurb">
        {{ item.preview.blurb }}
      </p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RadiantForgeSigil from '@/components/radiantforge/RadiantForgeSigil.vue';
import ImageRenderer from '@/components/shared/ImageRenderer.vue';

interface ArtistCardProps {
  item: {
    path: string;
    layout: string;
    slug?: string;
    display_name?: string;
    preview?: {
      title?: string;
      subtitle?: string;
      image?: string;
      thumbnail?: {
        type: 'static' | 'generative_from_seed';
        src?: string;
        alt?: string;
        seedFrom?: string;
        seed?: number;
        style?: any;
      };
      badge?: string;
      blurb?: string;
      sigil?: {
        type: 'p5' | 'image';
        id?: string;
        src?: string;
        options?: Record<string, any>;
      };
    };
  };
  mode?: 'grid' | 'list' | 'carousel';
}

const props = withDefaults(defineProps<ArtistCardProps>(), {
  mode: 'grid',
});

// No more auto-generated sigils! Artists must define thumbnails explicitly for performance.
</script>

<style scoped>
/* Base card styles */
.artist-card {
  display: flex;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* === GRID MODE (vertical layout) === */
.artist-card--grid {
  flex-direction: column;
  height: 100%;
}

.artist-card--grid .artist-card__image {
  position: relative;
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1 / 1;
  margin: 1rem auto 0;
  background: var(--color-bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-card--grid .artist-card__content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  flex: 1;
}

/* === LIST MODE (horizontal layout) === */
.artist-card--list {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
}

.artist-card--list .artist-card__image {
  position: relative;
  width: 80px;
  height: 80px;
  min-width: 80px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-card--list .artist-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

/* === IMAGE & SIGIL RENDERING === */
.artist-card__image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* RadiantForge sigils fill the container */
.artist-card__image :deep(canvas) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Placeholder when no thumbnail defined */
.artist-card__image--placeholder {
  background: var(--color-surface-dim, rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.3;
  color: var(--color-text-muted);
}

/* === TEXT STYLES === */
.artist-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.artist-card--list .artist-card__title {
  font-size: 1rem;
}

.artist-card__subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.artist-card--list .artist-card__subtitle {
  font-size: 0.8125rem;
}

.artist-card__blurb {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.artist-card--list .artist-card__blurb {
  font-size: 0.75rem;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

/* === CAROUSEL MODE (compact vertical cards for horizontal scroll) === */
.artist-card--carousel {
  flex-direction: column;
  height: 100%;
}

.artist-card--carousel .artist-card__image {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-card--carousel .artist-card__content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
  flex: 1;
}

.artist-card--carousel .artist-card__title {
  font-size: 0.9375rem;
}

.artist-card--carousel .artist-card__subtitle {
  font-size: 0.8125rem;
}

.artist-card--carousel .artist-card__blurb {
  font-size: 0.75rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
</style>

