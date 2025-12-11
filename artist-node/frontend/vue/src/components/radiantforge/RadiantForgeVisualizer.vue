<template>
  <div
    ref="host"
    class="radiantforge-visualizer"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  mountSigil,
  unmountSigil,
  mountVisualizer,
  unmountVisualizer,
  getVisualizerAnalyzer,
  type VisualizerOptions,
} from '@awake/radiantforge'

const props = defineProps<{
  /** Registered sigil ID (e.g., 'spectrum-bars') */
  sigilId: string
  /** HTML audio element to visualize (optional - shows preview animation if null) */
  audioElement?: HTMLAudioElement | null
  /** Sigil options (sensitivity, colorMode, etc.) */
  options?: Omit<VisualizerOptions, '_getAudioData' | '_analyzer'>
}>()

const host = ref<HTMLElement | null>(null)

/**
 * Mount/remount the visualizer when props change.
 * If no audio element, mounts as a static sigil (shows preview animation).
 */
function renderVisualizer() {
  if (!host.value || !props.sigilId) return
  
  // Clean up previous (try both unmount functions)
  unmountVisualizer(host.value)
  unmountSigil(host.value)
  
  if (props.audioElement) {
    // Mount with audio analysis
    mountVisualizer(
      props.sigilId,
      host.value,
      props.audioElement,
      props.options
    )
  } else {
    // Mount as static sigil (preview mode)
    mountSigil(props.sigilId, host.value, props.options)
  }
}

/**
 * Resume the audio analyzer (call after user gesture like play button click).
 * This is required due to browser autoplay policy.
 */
function resumeAnalyzer() {
  if (host.value) {
    const analyzer = getVisualizerAnalyzer(host.value)
    if (analyzer) {
      analyzer.ensureResumed()
    }
  }
}

// Expose resumeAnalyzer so parent components can call it
defineExpose({ resumeAnalyzer })

onMounted(() => {
  renderVisualizer()
})

onBeforeUnmount(() => {
  if (host.value) {
    unmountVisualizer(host.value)
    unmountSigil(host.value)
  }
})

// Re-render when sigilId, audioElement, or options change
watch(
  () => [props.sigilId, props.audioElement, props.options] as const,
  () => {
    renderVisualizer()
  },
  { deep: true }
)
</script>

<style scoped>
.radiantforge-visualizer {
  width: 100%;
  height: 100%;
  min-height: 100px;
  position: relative;
  overflow: hidden;
  
  /* Default styling - can be overridden */
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.2);
}
</style>

