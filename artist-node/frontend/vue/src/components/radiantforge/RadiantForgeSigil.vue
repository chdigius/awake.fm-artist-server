<template>
  <div
    ref="host"
    class="radiantforge-sigil"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  mountSigil,
  unmountSigil,
  resizeSigil,
  type SigilOptions,
} from '@awake/radiantforge'

const props = defineProps<{
  sigilId: string
  options?: SigilOptions
}>()

const host = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

/**
 * (Re)mount the sigil for the current props into the host element.
 */
function renderSigil() {
  if (!host.value) return

  // Clean up any previous instance on this element
  unmountSigil(host.value)

  if (!props.sigilId) return

  mountSigil(props.sigilId, host.value, props.options)
}

onMounted(() => {
  renderSigil()

  // Set up ResizeObserver to handle container size changes
  if (host.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (host.value) {
        // Small delay to let CSS finish transitioning
        setTimeout(() => {
          resizeSigil(host.value)
        }, 10)
      }
    })
    resizeObserver.observe(host.value)
  }
})

onBeforeUnmount(() => {
  // Clean up ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (host.value) {
    unmountSigil(host.value)
  }
})

// If sigilId or options change, re-render
watch(
  () => [props.sigilId, props.options] as const,
  () => {
    renderSigil()
  },
  { deep: true }
)
</script>

<style scoped>
.radiantforge-sigil {
  /* Fill parent container - parent controls size */
  width: 100%;
  height: 100%;
  display: block;

  /* make sure p5 canvas fills it nicely */
  position: relative;
  overflow: hidden;

  /* optional: frame styling that themes can override */
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
}
</style>

