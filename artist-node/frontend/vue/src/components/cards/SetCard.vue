<template>
  <a
    :id="`track-${trackId}`"
    :href="`#track-${trackId}`"
    :class="['set-card', `set-card--${mode}`, { 'set-card--highlighted': isHighlighted }]"
    @click.prevent="handleClick"
  >
    <!-- Thumbnail: generative or placeholder -->
    <div class="set-card__thumbnail">
      <!-- Generative thumbnail if config provided -->
      <RadiantForgeThumbnail
        v-if="thumbnail"
        :trackId="trackId"
        :config="thumbnail"
        :lazy="true"
      />
      <!-- Fallback placeholder if no thumbnail config -->
      <div v-else class="set-card__placeholder">
        <!-- Empty placeholder - visualizer will appear in active player -->
      </div>
      <div class="set-card__play-overlay">
        <div class="set-card__play-icon">▶</div>
      </div>
    </div>

    <div class="set-card__content">
      <h3 class="set-card__title">{{ displayTitle }}</h3>
      <p v-if="displayDate" class="set-card__date">{{ displayDate }}</p>
      <p v-if="displayDuration" class="set-card__duration">{{ displayDuration }}</p>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { usePlayerStore } from '@awake/audio-player';
import { useAudioCard } from '@/composables/useAudioCard';
import RadiantForgeThumbnail from '@/components/radiantforge/RadiantForgeThumbnail.vue';

interface MediaFile {
  type: 'media_file';
  filename: string;
  path: string;
  title?: string;
  extension: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SetCardProps {
  item: MediaFile;
  mode?: 'grid' | 'list' | 'carousel';
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

const props = withDefaults(defineProps<SetCardProps>(), {
  mode: 'list',
});

// Parse filename for display info
// Generic parsing - works with any artist's naming conventions
const displayTitle = computed(() => {
  if (props.item.title) return props.item.title;

  // Remove extension from filename
  let name = props.item.filename.replace(props.item.extension, '');

  // Replace common separators with spaces
  name = name.replace(/[_-]+/g, ' ');

  // Remove date patterns (YYYY_M_D, YYYY-M-D, YYYYMMDD, etc.)
  name = name.replace(/\d{4}[\s_-]*\d{1,2}[\s_-]*\d{1,2}/g, '');
  name = name.replace(/\d{8}/g, ''); // YYYYMMDD format

  // Clean up multiple spaces and trim
  name = name.replace(/\s+/g, ' ').trim();

  return name || props.item.filename; // Fallback to full filename if nothing left
});

// Extract date from filename if present
const displayDate = computed(() => {
  // Try to match YYYY_M_D or YYYY-M-D pattern
  const dateMatch = props.item.filename.match(/(\d{4})[_-](\d{1,2})[_-](\d{1,2})/);
  if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
  return null;
});

// Format duration if available
const displayDuration = computed(() => {
  if (!props.item.duration) return null;

  const seconds = Math.floor(props.item.duration);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Use shared audio card logic (deep linking, player integration, visualizer config)
const { trackId, visualizerConfig, handleClick: originalHandleClick } = useAudioCard({
  item: props.item,
  collectionMetadata: props.collectionMetadata,
  visualizer: props.visualizer,
  displayTitle: displayTitle,
  displayDate: displayDate,
});

// Get player store to track current track
const playerStore = usePlayerStore();

// Computed: highlight if this track is currently playing
const isHighlighted = computed(() => {
  const currentTrack = playerStore.currentTrack;
  if (!currentTrack) return false;

  // Match by filename - check both id and path
  const isCurrentTrack = currentTrack.id === props.item.filename ||
                         currentTrack.path.includes(props.item.filename);

  return isCurrentTrack;
});

// Wrap handleClick
const handleClick = () => {
  originalHandleClick();
};
</script>

<style scoped>
/* Base card styles */
.set-card {
  display: flex;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  text-decoration: none; /* Remove underline from link */
  color: inherit; /* Inherit text color */
  scroll-margin-top: 100px; /* Space from top when scrolled to (for fixed player) */
}

.set-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.set-card:hover .set-card__play-overlay {
  opacity: 1;
}

/* Highlighted state for deep-linked tracks */
.set-card--highlighted {
  animation: highlight-pulse 2s ease-in-out infinite !important;
  box-shadow: 0 0 0 3px var(--color-accent), 0 4px 16px rgba(0, 0, 0, 0.3) !important;
  position: relative;
  z-index: 10;
}

.set-card--highlighted::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-accent);
  opacity: 0.15;
  pointer-events: none;
  border-radius: var(--radius-md);
  animation: highlight-fade 2s ease-in-out infinite;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px var(--color-accent), 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px var(--color-accent), 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}

@keyframes highlight-fade {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.25;
  }
}

/* === LIST MODE (horizontal layout) === */
.set-card--list {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
}

.set-card--list .set-card__thumbnail {
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

.set-card--list .set-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

/* === GRID MODE (vertical layout) === */
.set-card--grid {
  flex-direction: column;
  height: 100%;
}

.set-card--grid .set-card__thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.set-card--grid .set-card__content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  flex: 1;
}

/* === CAROUSEL MODE === */
.set-card--carousel {
  flex-direction: column;
  height: 100%;
}

.set-card--carousel .set-card__thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--color-bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.set-card--carousel .set-card__content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  flex: 1;
}

/* === THUMBNAIL & PLAY OVERLAY === */
.set-card__placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.1);
}

.set-card__play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.set-card__play-icon {
  width: 40px;
  height: 40px;
  background: var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  padding-left: 3px; /* Visual centering for play icon */
}

/* === TEXT STYLES === */
.set-card__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.set-card--list .set-card__title {
  font-size: 0.9375rem;
}

.set-card__date,
.set-card__duration {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.set-card--list .set-card__date,
.set-card--list .set-card__duration {
  font-size: 0.75rem;
}
</style>
