/**
 * Audio Player Types
 * Generic types that work across artist-node and mothership
 */

export interface AudioTrack {
  id: string;                    // unique identifier (filename, uuid, etc)
  path: string;                  // URL or file path to audio
  title: string;
  artist?: string;
  album?: string;
  duration?: number;             // in seconds
  artwork?: string;              // thumbnail/album art URL
  visualizer?: VisualizerConfig; // OPTIONAL - only if visualizers enabled
  metadata?: Record<string, any>; // extensible for project-specific data
}

export interface VisualizerConfig {
  id: string;                    // visualizer type (nebula-flight, gforce-flow, etc)
  seed?: number;                 // for deterministic generation
  options?: Record<string, any>; // visualizer-specific options
}

export interface PlayerState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;           // in seconds
  duration: number;              // in seconds
  volume: number;                // 0.0 to 1.0
  isMuted: boolean;
  queue: AudioTrack[];           // upcoming tracks
  history: AudioTrack[];         // previously played
  repeatMode: 'off' | 'one' | 'all';
  shuffleEnabled: boolean;
}

export interface PlayerActions {
  play: (track?: AudioTrack) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;
