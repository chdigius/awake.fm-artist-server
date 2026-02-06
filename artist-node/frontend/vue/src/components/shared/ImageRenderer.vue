<template>
  <!-- Static Image -->
  <img
    v-if="config.type === 'static' && config.src"
    :src="config.src"
    :alt="config.alt || ''"
    :class="imageClass"
    :style="imageStyle"
  />

  <!-- Generative Image -->
  <RadiantForgeImage
    v-else-if="config.type === 'generative_from_seed'"
    :track-id="computedSeed"
    :config="generativeConfig"
    :aspect-ratio="aspectRatio"
    :class="imageClass"
    :style="imageStyle"
  />

  <!-- Fallback: placeholder -->
  <div
    v-else
    :class="['image-placeholder', imageClass]"
    :style="imageStyle"
  >
    <span>No Image</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RadiantForgeImage from '../radiantforge/RadiantForgeImage.vue'

interface ImageConfig {
  type: 'static' | 'generative_from_seed'
  src?: string
  alt?: string
  seedFrom?: 'filename' | 'item_name' | 'artist_name' | 'page' | 'collection_position'
  seed?: number
  style?: any
}

interface Props {
  config: ImageConfig
  itemName?: string      // For seedFrom: 'item_name', 'artist_name', 'filename'
  aspectRatio?: number   // 1 for square, 21/9 for banner, 16/9 for video, etc.
  imageClass?: string    // Additional CSS classes
  imageStyle?: any       // Additional inline styles
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,  // Square by default
})

// Common aspect ratio presets:
// 1 = Square (thumbnails, profile pics)
// 16/9 = 1.778 (video, widescreen)
// 21/9 = 2.333 (ultrawide banner)
// 4/3 = 1.333 (classic photo)
// 3/2 = 1.5 (35mm photo)
// 2/3 = 0.667 (portrait)

// Compute seed for generative images
const computedSeed = computed(() => {
  if (props.config.type !== 'generative_from_seed') return 'static'
  
  // Explicit seed takes precedence
  if (props.config.seed !== undefined) {
    return String(props.config.seed)
  }
  
  // Generate from seedFrom + itemName
  if (props.config.seedFrom && props.itemName) {
    return `${props.config.seedFrom}-${props.itemName}`
  }
  
  // Fallback
  return 'default-seed'
})

// Map ImageConfig.style to RadiantForgeImage config
const generativeConfig = computed(() => {
  if (!props.config.style) return {}
  
  return {
    ...props.config.style,
    // Ensure we have defaults
    seedFrom: 'trackId', // RadiantForgeImage will use trackId prop
  }
})
</script>

<style scoped>
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-dim, #1a1a1a);
  color: var(--color-text-muted, #666);
  font-size: 0.875rem;
  border-radius: var(--radius-sm, 0.25rem);
}
</style>
