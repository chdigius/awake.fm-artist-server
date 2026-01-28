import { defineStore } from 'pinia';
import type { AudioTrack, PlayerState } from '../types';

export const usePlayerStore = defineStore('audioPlayer', {
  state: (): PlayerState => ({
    currentTrack: null,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    queue: [],
    history: [],
    repeatMode: 'off',
    shuffleEnabled: false,
  }),

  getters: {
    hasTrack: (state) => state.currentTrack !== null,
    progress: (state) => {
      if (!state.duration) return 0;
      return (state.currentTime / state.duration) * 100;
    },
    queueLength: (state) => state.queue.length,
    canGoNext: (state) => state.queue.length > 0 || state.repeatMode !== 'off',
    canGoPrevious: (state) => state.history.length > 0,
  },

  actions: {
    // Play a new track (or resume current if no track provided)
    async play(track?: AudioTrack) {
      if (track) {
        // Stop current track if playing
        if (this.currentTrack && this.isPlaying) {
          this.pause();
        }

        // Add current track to history
        if (this.currentTrack) {
          this.history.push(this.currentTrack);
          // Keep history limited to last 50 tracks
          if (this.history.length > 50) {
            this.history.shift();
          }
        }

        this.currentTrack = track;
        this.currentTime = 0;
        this.isLoading = true;
      }

      this.isPlaying = true;
      this.isPaused = false;

      console.log('[PlayerStore] Playing track:', this.currentTrack?.title);
    },

    pause() {
      this.isPlaying = false;
      this.isPaused = true;
      console.log('[PlayerStore] Paused');
    },

    resume() {
      this.isPlaying = true;
      this.isPaused = false;
      console.log('[PlayerStore] Resumed');
    },

    stop() {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentTime = 0;
      console.log('[PlayerStore] Stopped');
    },

    close() {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentTime = 0;
      this.duration = 0;
      this.currentTrack = null;
      this.activePlayerType = null;
      this.activeEmbeddedId = null;
      console.log('[PlayerStore] Closed');
    },

    seek(time: number) {
      this.currentTime = Math.max(0, Math.min(time, this.duration));
      console.log('[PlayerStore] Seek to:', this.currentTime);
    },

    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(1, volume));
      if (this.volume > 0) {
        this.isMuted = false;
      }
    },

    toggleMute() {
      this.isMuted = !this.isMuted;
    },

    // Update current time (called by audio element timeupdate)
    updateTime(time: number) {
      this.currentTime = time;
    },

    // Update duration (called by audio element loadedmetadata)
    updateDuration(duration: number) {
      this.duration = duration;
      this.isLoading = false;
    },

    // Handle track ended
    onTrackEnded() {
      console.log('[PlayerStore] Track ended');

      if (this.repeatMode === 'one') {
        // Replay current track
        this.currentTime = 0;
        this.play();
      } else if (this.queue.length > 0) {
        // Play next in queue
        this.next();
      } else if (this.repeatMode === 'all' && this.history.length > 0) {
        // Restart from first track in history
        const firstTrack = this.history[0];
        this.history = [];
        this.play(firstTrack);
      } else {
        // Nothing to play, stop
        this.stop();
      }
    },

    next() {
      if (this.queue.length === 0) {
        console.warn('[PlayerStore] No tracks in queue');
        return;
      }

      const nextTrack = this.queue.shift();
      if (nextTrack) {
        this.play(nextTrack);
      }
    },

    previous() {
      if (this.history.length === 0) {
        console.warn('[PlayerStore] No tracks in history');
        return;
      }

      const previousTrack = this.history.pop();
      if (previousTrack) {
        // Add current track back to front of queue
        if (this.currentTrack) {
          this.queue.unshift(this.currentTrack);
        }
        this.play(previousTrack);
      }
    },

    addToQueue(track: AudioTrack) {
      this.queue.push(track);
      console.log('[PlayerStore] Added to queue:', track.title);
    },

    removeFromQueue(trackId: string) {
      const index = this.queue.findIndex(t => t.id === trackId);
      if (index !== -1) {
        this.queue.splice(index, 1);
        console.log('[PlayerStore] Removed from queue:', trackId);
      }
    },

    clearQueue() {
      this.queue = [];
      console.log('[PlayerStore] Queue cleared');
    },

    toggleRepeat() {
      const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
      const currentIndex = modes.indexOf(this.repeatMode);
      this.repeatMode = modes[(currentIndex + 1) % modes.length];
      console.log('[PlayerStore] Repeat mode:', this.repeatMode);
    },

    toggleShuffle() {
      this.shuffleEnabled = !this.shuffleEnabled;
      console.log('[PlayerStore] Shuffle:', this.shuffleEnabled);

      // TODO: Implement shuffle logic (reorder queue randomly)
    },
  },
});
