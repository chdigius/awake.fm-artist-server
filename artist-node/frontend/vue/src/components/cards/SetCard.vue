<template>
  <div :class="['set-card', `set-card--${mode}`]" @click="handleClick">
    <!-- Placeholder thumbnail (visualizer only shown when playing) -->
    <div class="set-card__thumbnail">
      <div class="set-card__placeholder">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from '@awake/audio-player';
import type { AudioTrack } from '@awake/audio-player';

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
}

const props = withDefaults(defineProps<SetCardProps>(), {
  mode: 'list',
});

const playerStore = usePlayerStore();

console.log('[SetCard] Item:', props.item);
console.log('[SetCard] Visualizer config:', props.visualizer);

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

// Hash function for seeding visualizer
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Build visualizer config from props + item metadata
const visualizerConfig = computed(() => {
  const config = props.visualizer || {};
  const id = config.id || 'nebula-flight';
  const options = { ...config.options };

  // If seed_from specified, generate seed from item metadata
  if (config.seed_from) {
    let seedSource = '';
    config.seed_from.forEach(source => {
      if (source === 'filename') {
        seedSource += props.item.filename;
      } else if (source === 'duration' && props.item.duration) {
        seedSource += props.item.duration.toString();
      }
    });

    if (seedSource) {
      options.seed = hashString(seedSource);
    }
  }

  return { id, options };
});

// Handle card click - play this set
function handleClick() {
  // Normalize path: convert Windows backslashes to forward slashes for URLs
  const normalizedPath = props.item.path.replace(/\\/g, '/');

  const track: AudioTrack = {
    id: props.item.filename,
    path: `/content/${normalizedPath}`,
    title: displayTitle.value,
    duration: props.item.duration,
    visualizer: visualizerConfig.value,
    metadata: {
      filename: props.item.filename,
      extension: props.item.extension,
      date: displayDate.value,
    },
  };

  console.log('[SetCard] Playing track:', track);
  playerStore.play(track);
}
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
}

.set-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.set-card:hover .set-card__play-overlay {
  opacity: 1;
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
