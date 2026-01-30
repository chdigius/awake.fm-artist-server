<template>
  <Transition name="slide-up">
    <div v-if="hasTrack" :class="['global-player-bar', { 'is-minimized': isMinimized }]">
      <!-- Hidden audio element -->
      <audio
        ref="audioElement"
        :src="currentTrack?.path"
        preload="metadata"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @error="onError"
        @play="onPlay"
        @pause="onPause"
        @stalled="onStalled"
        @waiting="onWaiting"
        @canplay="onCanPlay"
        @playing="onPlaying"
      />

      <!-- Visualizer panel (on top) - hidden when minimized -->
      <div 
        v-if="!isMinimized && showVisualizer && currentTrack?.visualizer && audioElement"
        ref="visualizerContainerRef"
        class="player-visualizer"
        :class="{ 'is-fullscreen': isFullscreen }"
        @dblclick="toggleFullscreen"
      >
        <slot
          name="visualizer"
          :config="currentTrack.visualizer"
          :audio-element="audioElement"
          :resume-analyzer="resumeVisualizerAnalyzer"
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

      <!-- Toast notification for copy -->
      <Transition name="fade">
        <div v-if="showCopiedToast" class="copy-toast">
          🔗 Link copied with timestamp!
        </div>
      </Transition>

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
              @click="shareTrack"
              :title="shareButtonTitle"
            >
              🔗
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
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
const visualizerContainerRef = ref<HTMLElement | null>(null);
const isMinimized = ref(false);
const isFullscreen = ref(false);
const showCopiedToast = ref(false);

// Share button tooltip with current timestamp
const shareButtonTitle = computed(() => {
  if (!currentTime.value || !duration.value) return 'Share track';
  const minutes = Math.floor(currentTime.value / 60);
  const seconds = Math.floor(currentTime.value % 60);
  return `Share (at ${minutes}:${seconds.toString().padStart(2, '0')})`;
});

// Function to resume visualizer analyzer (passed to slot)
function resumeVisualizerAnalyzer() {
  console.log('[GlobalPlayerBar] Resuming visualizer analyzer');
  // This will be called by the parent slot consumer
}

// Toggle minimize/maximize
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

// Fullscreen controls
function toggleFullscreen() {
  if (!visualizerContainerRef.value) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    visualizerContainerRef.value.requestFullscreen();
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// Listen for fullscreen changes (including Escape key exit)
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});

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
    emit('audioReady', audioElement.value);

    // Check for pending timestamp from deep link
    // @ts-ignore
    if (window.__pendingSeekTimestamp) {
      // @ts-ignore
      const timestamp = window.__pendingSeekTimestamp;
      console.log('[GlobalPlayerBar] Found pending timestamp, seeking before play:', timestamp);

      // Parse timestamp - support both "47:23" (MM:SS) and "2843" (seconds)
      let seconds = 0;
      if (timestamp.includes(':')) {
        const parts = timestamp.split(':').map(Number);
        if (parts.length === 2) {
          seconds = parts[0] * 60 + parts[1]; // MM:SS
        } else if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        }
      } else {
        seconds = parseInt(timestamp, 10); // Raw seconds
      }

      if (seconds > 0) {
        console.log(`[GlobalPlayerBar] Seeking to ${seconds}s before playback starts`);
        audioElement.value.currentTime = seconds;
        playerStore.updateTime(seconds);
      }

      // Clear the pending timestamp
      // @ts-ignore
      window.__pendingSeekTimestamp = null;
    }

    // Auto-play if store says we should be playing
    if (isPlaying.value) {
      audioElement.value.play().catch((err) => {
        console.error('[GlobalPlayerBar] Autoplay blocked:', err);
      });
    }
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

function onPlay() {
  console.log('[GlobalPlayerBar] Audio element fired PLAY event');
}

function onPause() {
  console.log('[GlobalPlayerBar] Audio element fired PAUSE event');
}

let stallRecoveryAttempts = 0;
let stallRecoveryTimeout: number | null = null;

function onStalled() {
  console.warn('[GlobalPlayerBar] Audio STALLED - network issue or buffering problem');
  
  if (!isPlaying.value || !audioElement.value) return;
  
  const readyState = audioElement.value.readyState;
  const paused = audioElement.value.paused;
  const currentTime = audioElement.value.currentTime;
  console.log('[GlobalPlayerBar] Attempting to recover from stall... readyState:', readyState, 'paused:', paused, 'time:', currentTime);
  
  // Clear any existing recovery timeout
  if (stallRecoveryTimeout) {
    clearTimeout(stallRecoveryTimeout);
    stallRecoveryTimeout = null;
  }
  
  stallRecoveryAttempts = 0;
  
  // Try recovery immediately
  attemptStallRecovery();
}

function attemptStallRecovery() {
  if (!audioElement.value || !isPlaying.value || !currentTrack.value) return;
  
  stallRecoveryAttempts++;
  console.log(`[GlobalPlayerBar] Stall recovery attempt ${stallRecoveryAttempts}/5...`);
  
  const currentTime = audioElement.value.currentTime;
  const audio = audioElement.value;
  const originalSrc = currentTrack.value.path;
  
  console.log('[GlobalPlayerBar] Forcing new range request by reloading src...');
  
  // Force a new HTTP request with cache-busting parameter
  // This triggers a fresh range request from current position
  const cacheBuster = `?t=${Date.now()}`;
  audio.src = originalSrc + cacheBuster;
  
  // Seek to current position (browser will request from this byte offset)
  audio.currentTime = currentTime + 0.1;
  
  // Load and play
  audio.load();
  audio.play().then(() => {
    console.log('[GlobalPlayerBar] Play resumed successfully with fresh request! ✅');
    stallRecoveryAttempts = 0;
    if (stallRecoveryTimeout) {
      clearTimeout(stallRecoveryTimeout);
      stallRecoveryTimeout = null;
    }
  }).catch((err) => {
    console.error('[GlobalPlayerBar] Failed to resume:', err);
    // Try again if we haven't hit max attempts
    if (stallRecoveryAttempts < 5) {
      console.log('[GlobalPlayerBar] Scheduling retry in 3 seconds...');
      stallRecoveryTimeout = window.setTimeout(() => {
        attemptStallRecovery();
      }, 3000);
    } else {
      console.error('[GlobalPlayerBar] Stall recovery failed after 5 attempts');
    }
  });
}

function onWaiting() {
  console.log('[GlobalPlayerBar] Audio WAITING - buffering...');
}

function onCanPlay() {
  const paused = audioElement.value?.paused;
  const readyState = audioElement.value?.readyState;
  console.log('[GlobalPlayerBar] Audio CAN PLAY - enough data buffered (paused:', paused, 'readyState:', readyState, ')');
  // If we're supposed to be playing but audio is paused (due to stall), resume
  if (isPlaying.value && audioElement.value && audioElement.value.paused) {
    console.log('[GlobalPlayerBar] Auto-resuming playback after buffer recovery');
    audioElement.value.play().catch((err) => {
      console.error('[GlobalPlayerBar] Failed to auto-resume:', err);
    });
  }
}

function onPlaying() {
  console.log('[GlobalPlayerBar] Audio PLAYING - playback has started/resumed ✅');
  // Clear stall recovery timeout if playback resumed
  if (stallRecoveryTimeout) {
    console.log('[GlobalPlayerBar] Clearing stall recovery timeout - playback resumed!');
    clearTimeout(stallRecoveryTimeout);
    stallRecoveryTimeout = null;
    stallRecoveryAttempts = 0;
  }
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

async function shareTrack() {
  if (!currentTrack.value) return;

  // Get current timestamp
  const time = audioElement.value?.currentTime || 0;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Get current URL (should already have track hash from when it was clicked)
  let shareUrl = window.location.href;

  // If URL doesn't have a hash (shouldn't happen, but defensive), construct it
  if (!shareUrl.includes('#track-')) {
    const baseUrl = window.location.origin + window.location.pathname;
    // Try to reconstruct from track metadata
    const trackId = currentTrack.value.id || currentTrack.value.metadata?.filename || 'unknown';
    const urlSafeId = trackId
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    shareUrl = `${baseUrl}#track-${urlSafeId}`;

    // Add collection metadata if available
    if (currentTrack.value.metadata?.collectionSource) {
      shareUrl += `&source=${encodeURIComponent(currentTrack.value.metadata.collectionSource)}`;
    }
    if (currentTrack.value.metadata?.collectionPath) {
      shareUrl += `&path=${encodeURIComponent(currentTrack.value.metadata.collectionPath)}`;
    }
    if (currentTrack.value.metadata?.collectionPattern) {
      shareUrl += `&pattern=${encodeURIComponent(currentTrack.value.metadata.collectionPattern)}`;
    }
  }

  // Add/update timestamp parameter
  if (shareUrl.includes('&t=')) {
    // Replace existing timestamp
    shareUrl = shareUrl.replace(/&t=[^&]+/, `&t=${timestamp}`);
  } else {
    // Add timestamp
    shareUrl += `&t=${timestamp}`;
  }

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    console.log('[GlobalPlayerBar] Copied to clipboard:', shareUrl);
    showCopiedToast.value = true;
    setTimeout(() => {
      showCopiedToast.value = false;
    }, 2000);
  } catch (err) {
    console.error('[GlobalPlayerBar] Failed to copy to clipboard:', err);
  }
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
  position: relative;
  cursor: pointer;
}

.player-visualizer.is-fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  background: #000;
  border: none;
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

.player-visualizer:hover .fullscreen-toggle {
  opacity: 1;
}

.fullscreen-toggle:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: var(--color-accent, #00ff99);
}

.player-visualizer.is-fullscreen .fullscreen-toggle {
  opacity: 1;
  bottom: 1rem;
  right: 1rem;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
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

/* Copy toast notification */
.copy-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
