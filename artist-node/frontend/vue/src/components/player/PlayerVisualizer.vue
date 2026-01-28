<template>
  <div ref="host" class="player-visualizer-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  mountVisualizerShared,
  unmountVisualizer,
  getGlobalAnalyzer,
  type VisualizerOptions,
} from '@awake/radiantforge';

const props = defineProps<{
  visualizerId: string;
  audioElement: HTMLAudioElement;
  options?: Omit<VisualizerOptions, '_getAudioData' | '_analyzer'>;
}>();

const host = ref<HTMLElement | null>(null);
const globalAnalyzer = getGlobalAnalyzer();
const hasConnected = ref(false);

function renderVisualizer() {
  if (!host.value || !props.visualizerId) return;

  console.log('[PlayerVisualizer] Rendering with global analyzer:', props.visualizerId);

  // Clean up previous
  unmountVisualizer(host.value);

  // Connect audio element to global analyzer (safe to call multiple times)
  globalAnalyzer.connectElement(props.audioElement);

  // Resume analyzer on first render (browser autoplay policy)
  if (!hasConnected.value) {
    console.log('[PlayerVisualizer] Resuming global analyzer for first time');
    globalAnalyzer.ensureResumed();
    hasConnected.value = true;
  }

  // Mount visualizer using the shared global analyzer
  mountVisualizerShared(
    props.visualizerId,
    host.value,
    globalAnalyzer,
    props.options
  );
}

onMounted(() => {
  renderVisualizer();
});

onBeforeUnmount(() => {
  if (host.value) {
    unmountVisualizer(host.value);
  }
});

// Re-render when visualizer ID or options change
watch(
  () => [props.visualizerId, props.options] as const,
  () => {
    renderVisualizer();
  },
  { deep: true }
);
</script>

<style scoped>
.player-visualizer-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
