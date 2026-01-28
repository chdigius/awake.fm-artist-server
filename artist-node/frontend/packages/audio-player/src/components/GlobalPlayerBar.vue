<template>
  <Transition name="slide-up">
    <div v-if="hasTrack" :class="['global-player-bar', { 'is-minimized': isMinimized }]">
      <!-- Hidden audio element -->
      <audio
        ref="audioElement"
        :src="currentTrack?.path"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @error="onError"
      />

      <!-- Visualizer panel (on top) - hidden when minimized -->
      <div v-if="!isMinimized && showVisualizer && currentTrack?.visualizer && audioElement" class="player-visualizer">
        <slot
          name="visualizer"
          :config="currentTrack.visualizer"
          :audio-element="audioElement"
          :resume-analyzer="resumeVisualizerAnalyzer"
        />
      </div>

      <!-- Controls container with solid background -->
      <div class="player-controls-container">
        <div class="player-container">
          <!-- Left: Track info -->
          <div class="player-info">
            <div class="track-title">{{ currentTrack?.title || 'No track' }}</div>
            <div v-if="currentTrack?.artist" class="track-artist">{{ currentTrack.artist }}</div>
          </div>

          <!-- Center: Controls -->
          <div class="player-controls">
            <button
              class="control-btn"
              @click="previous"
              :disabled="!canGoPrevious"
              title="Previous"
            >
              ⏮
            </button>

            <button
              class="control-btn control-btn--play"
              @click="togglePlayPause"
              title="Play/Pause"
            >
              {{ isPlaying ? '⏸' : '▶' }}
            </button>

            <button
              class="control-btn"
              @click="next"
              :disabled="!canGoNext"
              title="Next"
            >
              ⏭
            </button>
          </div>

          <!-- Right: Volume & extras -->
          <div class="player-extras">
            <button
              class="control-btn control-btn--small"
              @click="toggleMute"
              title="Mute/Unmute"
            >
              {{ isMuted ? '🔇' : '🔊' }}
            </button>

            <button
              class="control-btn control-btn--small"
              @click="toggleRepeat"
              :class="{ active: repeatMode !== 'off' }"
              :title="`Repeat: ${repeatMode}`"
            >
              🔁
            </button>

            <button
              class="control-btn control-btn--small"
              @click="toggleMinimize"
              :title="isMinimized ? 'Expand player' : 'Minimize player'"
            >
              {{ isMinimized ? '⌃' : '⌄' }}
            </button>

            <button
              class="control-btn control-btn--small"
              @click="stop"
              title="Close player"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="player-progress">
          <span class="progress-time">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="progress-bar"
            :value="currentTime"
            :max="duration || 0"
            @input="onSeek"
          />
          <span class="progress-time">{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../store/playerStore';

interface GlobalPlayerBarProps {
  showVisualizer?: boolean;
}

const props = withDefaults(defineProps<GlobalPlayerBarProps>(), {
  showVisualizer: false,
});

const emit = defineEmits<{
  audioReady: [audioElement: HTMLAudioElement];
  trackChanged: [];
}>();

const playerStore = usePlayerStore();
const {
  currentTrack,
  isPlaying,
  isPaused,
  currentTime,
  duration,
  isMuted,
  repeatMode,
  canGoNext,
  canGoPrevious,
  hasTrack,
} = storeToRefs(playerStore);

const audioElement = ref<HTMLAudioElement | null>(null);
const visualizerRef = ref<any>(null);
const isMinimized = ref(false);

// Function to resume visualizer analyzer (passed to slot)
function resumeVisualizerAnalyzer() {
  console.log('[GlobalPlayerBar] Resuming visualizer analyzer');
  // This will be called by the parent slot consumer
}

// Toggle minimize/maximize
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

// Watch for track changes
watch(currentTrack, (newTrack, oldTrack) => {
  if (newTrack?.id !== oldTrack?.id) {
    emit('trackChanged');
  }
});

// Watch for play/pause state changes
watch(isPlaying, (playing) => {
  if (!audioElement.value) return;

  if (playing) {
    audioElement.value.play().catch((err) => {
      console.error('[GlobalPlayerBar] Play error:', err);
    });
  } else {
    audioElement.value.pause();
  }
});

// Watch for mute state changes
watch(isMuted, (muted) => {
  if (audioElement.value) {
    audioElement.value.muted = muted;
  }
});

// Watch for currentTime changes (from seek)
watch(currentTime, (time) => {
  if (audioElement.value && Math.abs(audioElement.value.currentTime - time) > 0.5) {
    audioElement.value.currentTime = time;
  }
});

// Audio element event handlers
function onLoadedMetadata() {
  if (audioElement.value) {
    playerStore.updateDuration(audioElement.value.duration);
    console.log('[GlobalPlayerBar] Loaded:', currentTrack.value?.title, duration.value);
    console.log('[GlobalPlayerBar] Audio element ready:', audioElement.value);
    emit('audioReady', audioElement.value);
  }
}

function onTimeUpdate() {
  if (audioElement.value) {
    playerStore.updateTime(audioElement.value.currentTime);
  }
}

function onEnded() {
  playerStore.onTrackEnded();
}

function onError(event: Event) {
  console.error('[GlobalPlayerBar] Audio error:', event);
  playerStore.stop();
}

// Control handlers
function togglePlayPause() {
  if (isPlaying.value) {
    playerStore.pause();
  } else if (isPaused.value) {
    playerStore.resume();
  } else {
    playerStore.play();
  }
}

function previous() {
  playerStore.previous();
}

function next() {
  playerStore.next();
}

function toggleMute() {
  playerStore.toggleMute();
}

function toggleRepeat() {
  playerStore.toggleRepeat();
}

function stop() {
  playerStore.close();
}

function onSeek(event: Event) {
  const target = event.target as HTMLInputElement;
  playerStore.seek(parseFloat(target.value));
}

// Time formatting
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.global-player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

/* Minimized state - thin strip */
.global-player-bar.is-minimized {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

.global-player-bar.is-minimized .player-container {
  padding: 0.5rem 1rem;
  gap: 0.5rem;
}

.global-player-bar.is-minimized .player-progress {
  display: none;
}

.global-player-bar.is-minimized .track-title {
  font-size: 0.875rem;
}

.global-player-bar.is-minimized .track-artist {
  font-size: 0.75rem;
}

/* Visualizer panel (on top) */
.player-visualizer {
  width: 100%;
  height: 200px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid var(--color-border);
}

/* Controls container with solid/tinted background */
.player-controls-container {
  background: rgba(var(--color-surface-rgb, 20, 20, 20), 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--color-border);
}

.player-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
}

/* Left: Track info */
.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.track-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Center: Controls */
.player-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn--play {
  background: var(--color-accent);
  color: white;
  font-size: 1.25rem;
  padding-left: 0.6rem; /* Visual centering for play icon */
}

.control-btn--play:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.control-btn--small {
  font-size: 1.25rem;
  min-width: 36px;
  min-height: 36px;
}

.control-btn.active {
  background: rgba(255, 255, 255, 0.15);
}

/* Right: Extras */
.player-extras {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

/* Progress bar */
.player-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
}

.progress-time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 3ch;
}

.progress-bar {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.progress-bar::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.progress-bar::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease;
}

.progress-bar::-moz-range-thumb:hover {
  transform: scale(1.3);
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .player-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 0.75rem;
  }

  .player-info {
    order: 1;
    text-align: center;
  }

  .player-controls {
    order: 2;
  }

  .player-extras {
    order: 3;
    justify-content: center;
  }
}
</style>
