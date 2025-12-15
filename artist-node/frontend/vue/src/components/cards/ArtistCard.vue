<template>
  <router-link :to="`/${item.path}`" class="artist-card">
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
}

const props = defineProps<ArtistCardProps>();

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
.artist-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.artist-card__image {
  position: relative;
  width: 100%;
  padding-bottom: 5%; /* Minimal height for sigils */
  background: var(--color-bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.artist-card__content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  flex: 1;
}

.artist-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.artist-card__subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
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
</style>

