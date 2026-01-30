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
    historyIndex: -1, // Current position in history (-1 = no history)
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
    // Can go next if we're not at the end of history
    canGoNext: (state) => state.historyIndex < state.history.length - 1,
    // Can go previous if we're not at the start of history
    canGoPrevious: (state) => state.historyIndex > 0,
  },

  actions: {
    // Play a new track (or resume current if no track provided)
    async play(track?: AudioTrack, addToHistory: boolean = true) {
      if (track) {
        // Stop current track if playing
        if (this.currentTrack && this.isPlaying) {
          this.pause();
        }

        if (addToHistory) {
          // If we're in the middle of history (went back), truncate future history
          if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
          }

          // Add new track to history
          this.history.push(track);
          this.historyIndex = this.history.length - 1;

          // Keep history limited to last 50 tracks
          if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex = this.history.length - 1;
          }
        }

        this.currentTrack = track;
        this.currentTime = 0;
        this.isLoading = true;
      }

      this.isPlaying = true;
      this.isPaused = false;

      console.log('[PlayerStore] Playing track:', this.currentTrack?.title, 'historyIndex:', this.historyIndex);
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
      // Move forward in history
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        const nextTrack = this.history[this.historyIndex];

        this.currentTrack = nextTrack;
        this.currentTime = 0;
        this.isLoading = true;
        this.isPlaying = true;
        this.isPaused = false;

        console.log('[PlayerStore] Next - historyIndex:', this.historyIndex);
      } else {
        console.warn('[PlayerStore] No next track in history');
      }
    },

    previous() {
      // Move backward in history
      if (this.historyIndex > 0) {
        this.historyIndex--;
        const previousTrack = this.history[this.historyIndex];

        this.currentTrack = previousTrack;
        this.currentTime = 0;
        this.isLoading = true;
        this.isPlaying = true;
        this.isPaused = false;

        console.log('[PlayerStore] Previous - historyIndex:', this.historyIndex);
      } else {
        console.warn('[PlayerStore] No previous track in history');
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
