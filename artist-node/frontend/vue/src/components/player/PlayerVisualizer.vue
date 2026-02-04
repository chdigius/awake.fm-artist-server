<template>
  <div ref="host" class="player-visualizer-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  mountVisualizerShared,
  unmountVisualizer,
  resizeVisualizer,
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


  // Clean up previous
  unmountVisualizer(host.value);

  // Connect audio element to global analyzer (safe to call multiple times)
  globalAnalyzer.connectElement(props.audioElement);

  // Resume analyzer on first render (browser autoplay policy)
  if (!hasConnected.value) {
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

// Resize function (exposed for manual calls)
function resize() {
  resizeVisualizer(host.value);
}

// ResizeObserver to handle container size changes (e.g., fullscreen)
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  renderVisualizer();
  
  // Watch for container size changes
  if (host.value) {
    resizeObserver = new ResizeObserver(() => {
      // Small delay to let CSS transitions complete
      setTimeout(() => {
        resize();
      }, 10);
    });
    resizeObserver.observe(host.value);
  }
});

// Expose resize for parent components
defineExpose({
  resize,
  resumeAnalyzer: () => globalAnalyzer.ensureResumed(),
});

onBeforeUnmount(() => {
  if (host.value) {
    unmountVisualizer(host.value);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
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
