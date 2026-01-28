/**
 * @awake/audio-player
 * Modular audio player for Awake.fm network
 */

export { usePlayerStore } from './store/playerStore';
export type { AudioTrack, VisualizerConfig, PlayerState, PlayerActions, PlayerStore } from './types';

// Components
export { default as GlobalPlayerBar } from './components/GlobalPlayerBar.vue';
