<template>
  <router-link :to="`/${item.path}`" :class="['artist-card', `artist-card--${mode}`]">
    <!-- Custom image -->
    <div v-if="item.preview?.image" class="artist-card__image">
      <img :src="item.preview.image" :alt="item.display_name || item.preview.title" />
    </div>

    <!-- Custom p5 sigil -->
    <div v-else-if="item.preview?.sigil" class="artist-card__image">
      <RadiantForgeSigil
        :sigil-id="item.preview.sigil.id || 'node-001'"
        :options="item.preview.sigil.options"
      />
    </div>

    <!-- Generative default sigil -->
    <div v-else class="artist-card__image">
      <RadiantForgeSigil
        sigil-id="node-001"
        :options="defaultSigilOptions"
      />
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

// Debug: log item data
console.log('[ArtistCard] Item:', props.item);

// Hash function to generate consistent seed from artist name
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate unique sigil options based on artist name
const defaultSigilOptions = computed(() => {
  const name = props.item.display_name || props.item.preview?.title || props.item.slug || 'unknown';
  const seed = hashString(name);
  
  // Use seed to pick variant and colors
  const variants = ['orbit', 'pulse', 'spiral'];
  const variant = variants[seed % variants.length];
  
  // Generate hue from seed (0-360)
  const hue = seed % 360;
  
  return {
    seed,
    variant,
    accentColor: `hsl(${hue}, 70%, 60%)`,
    particleCount: 20 + (seed % 30), // 20-50 particles
    speed: 0.5 + ((seed % 100) / 200), // 0.5-1.0 speed
  };
});
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

