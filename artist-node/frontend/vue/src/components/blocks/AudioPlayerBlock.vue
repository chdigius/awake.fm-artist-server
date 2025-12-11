<!-- src/components/blocks/AudioPlayerBlock.vue -->
<template>
  <div class="audio-player-block">
    <!-- Visualizer (if configured) -->
    <div 
      v-if="block.visualizer"
      ref="visualizerContainerRef"
      class="audio-player-visualizer"
      :class="{ 'is-fullscreen': isFullscreen }"
      @dblclick="toggleFullscreen"
    >
      <RadiantForgeVisualizer
        ref="visualizerRef"
        :sigil-id="block.visualizer.id || 'spectrum-bars'"
        :audio-element="audioReady ? audioRef : null"
        :options="block.visualizer.options"
      />
      <button 
        type="button"
        class="fullscreen-toggle"
        @click.stop="toggleFullscreen"
        :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
      >
        {{ isFullscreen ? '⤓' : '⤢' }}
      </button>
    </div>

    <!-- Track Info -->
    <div class="audio-player-info">
      <img
        v-if="block.artwork"
        :src="block.artwork"
        :alt="block.title || 'Track artwork'"
        class="audio-player-artwork"
      />
      <div class="audio-player-meta">
        <h3 v-if="block.title" class="audio-player-title">{{ block.title }}</h3>
        <p v-if="block.artist" class="audio-player-artist">{{ block.artist }}</p>
      </div>
    </div>

    <!-- Audio Controls -->
    <div class="audio-player-controls">
      <button 
        type="button"
        class="audio-player-btn audio-player-btn--play"
        @click="togglePlay"
      >
        {{ isPlaying ? '⏸' : '▶' }}
      </button>

      <div class="audio-player-progress-container">
        <input
          type="range"
          class="audio-player-progress"
          min="0"
          :max="duration"
          :value="currentTime"
          @input="seek"
        />
        <div class="audio-player-time">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div class="audio-player-volume-container">
        <button 
          type="button"
          class="audio-player-btn audio-player-btn--mute"
          @click="toggleMute"
        >
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <input
          type="range"
          class="audio-player-volume"
          min="0"
          max="1"
          step="0.05"
          :value="volume"
          @input="setVolume"
        />
      </div>
    </div>

    <!-- Hidden audio element -->
    <audio
      ref="audioRef"
      :src="block.src"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import RadiantForgeVisualizer from '@/components/radiantforge/RadiantForgeVisualizer.vue'

defineOptions({ name: 'AudioPlayerBlock' })

interface VisualizerConfig {
  type?: 'p5'
  id?: string
  options?: Record<string, unknown>
}

const props = defineProps<{
  block: {
    src: string
    title?: string
    artist?: string
    artwork?: string
    visualizer?: VisualizerConfig
  }
}>()

// Audio element ref
const audioRef = ref<HTMLAudioElement | null>(null)

// Visualizer container ref (for fullscreen)
const visualizerContainerRef = ref<HTMLElement | null>(null)

// Visualizer component ref (to call resumeAnalyzer)
const visualizerRef = ref<InstanceType<typeof RadiantForgeVisualizer> | null>(null)

// Playback state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)

// Track when audio element is ready for visualizer
const audioReady = ref(false)

// Fullscreen state
const isFullscreen = ref(false)

// Playback controls
function togglePlay() {
  if (!audioRef.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    // Resume the audio analyzer (required for browser autoplay policy)
    visualizerRef.value?.resumeAnalyzer()
    audioRef.value.play()
  }
}

function seek(e: Event) {
  if (!audioRef.value) return
  const target = e.target as HTMLInputElement
  audioRef.value.currentTime = parseFloat(target.value)
}

function setVolume(e: Event) {
  if (!audioRef.value) return
  const target = e.target as HTMLInputElement
  const newVolume = parseFloat(target.value)
  audioRef.value.volume = newVolume
  volume.value = newVolume
  isMuted.value = newVolume === 0
}

function toggleMute() {
  if (!audioRef.value) return
  
  if (isMuted.value) {
    audioRef.value.volume = volume.value || 1
    isMuted.value = false
  } else {
    audioRef.value.volume = 0
    isMuted.value = true
  }
}

// Audio event handlers
function onLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
    audioReady.value = true  // Signal that audio element is ready for visualizer
  }
}

function onTimeUpdate() {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

function onPlay() {
  isPlaying.value = true
}

function onPause() {
  isPlaying.value = false
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

// Fullscreen controls
function toggleFullscreen() {
  if (!visualizerContainerRef.value) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    visualizerContainerRef.value.requestFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Listen for fullscreen changes (including Escape key exit)
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

// Format time as MM:SS
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.audio-player-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 0.5rem;
}

/* Visualizer */
.audio-player-visualizer {
  width: 100%;
  height: 150px;
  border-radius: 0.25rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  cursor: pointer;
}

.audio-player-visualizer.is-fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  background: #000;
}

/* Fullscreen toggle button */
.fullscreen-toggle {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: var(--color-fg, #fff);
  font-size: 1rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease, background 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-player-visualizer:hover .fullscreen-toggle {
  opacity: 1;
}

.fullscreen-toggle:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: var(--color-accent, #00ff99);
}

.audio-player-visualizer.is-fullscreen .fullscreen-toggle {
  opacity: 1;
  bottom: 1rem;
  right: 1rem;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
}

/* Track Info */
.audio-player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.audio-player-artwork {
  width: 60px;
  height: 60px;
  border-radius: 0.25rem;
  object-fit: cover;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.audio-player-meta {
  flex: 1;
}

.audio-player-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-fg, #fff);
}

.audio-player-artist {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: var(--color-muted, rgba(255, 255, 255, 0.6));
}

/* Controls */
.audio-player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.audio-player-btn {
  background: transparent;
  border: 1px solid var(--color-accent, #00ff99);
  color: var(--color-accent, #00ff99);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease, transform 100ms ease;
}

.audio-player-btn:hover {
  background: var(--color-accent, #00ff99);
  color: var(--color-on-accent, #050505);
  transform: scale(1.05);
}

.audio-player-btn--play {
  width: 48px;
  height: 48px;
  font-size: 1.2rem;
}

.audio-player-btn--mute {
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
}

/* Progress */
.audio-player-progress-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.audio-player-progress {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  cursor: pointer;
}

.audio-player-progress::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent, #00ff99);
  cursor: pointer;
  box-shadow: 0 0 8px var(--color-accent, #00ff99);
}

.audio-player-progress::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent, #00ff99);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px var(--color-accent, #00ff99);
}

.audio-player-time {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  color: var(--color-muted, rgba(255, 255, 255, 0.5));
}

/* Volume */
.audio-player-volume-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.audio-player-volume {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: pointer;
}

.audio-player-volume::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent, #00ff99);
  cursor: pointer;
}

.audio-player-volume::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent, #00ff99);
  cursor: pointer;
  border: none;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .audio-player-controls {
    flex-wrap: wrap;
  }

  .audio-player-progress-container {
    order: 3;
    width: 100%;
  }

  .audio-player-volume-container {
    display: none;
  }
}
</style>

