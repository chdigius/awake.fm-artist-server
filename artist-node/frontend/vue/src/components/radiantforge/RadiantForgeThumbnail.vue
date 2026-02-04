<template>
  <div ref="containerRef" class="radiantforge-thumbnail">
    <!-- p5.js canvas will be mounted here -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { renderCanvasThumbnail, type CanvasThumbnailOptions } from '@awake/radiantforge'

interface Props {
  /** Track/album identifier (used for seeding) */
  trackId: string

  /** Thumbnail configuration */
  config: {
    seedImage?: string
    colorMode?: 'duotone_generate' | 'colorize_bw' | 'extract_and_vary' | 'manual_palette'
    colorSource?: 'seed' | 'theme'
    palette?: string[]
    pattern?: 'none' | 'geometric' | 'waves' | 'particles' | 'mandelbrot' | 'julia' | 'fractal_noise' | 'sierpinski' | 'burning_ship' | 'tricorn'
    blendSeed?: boolean
    blendMode?: 'multiply' | 'overlay' | 'screen' | 'difference' | 'add'

    // Visual controls
    patternOpacity?: number
    seedImageAlpha?: number
    saturation?: number
    lightness?: number

    // Fractal detail
    maxIterations?: number

    // Color mapping
    hueRange?: number

    // Viewport controls
    zoom?: number
    offsetX?: number
    offsetY?: number
    rotation?: number

    // Julia-specific
    juliaC?: { re: number; im: number }

    // Fractal Noise-specific
    octaves?: number
    persistence?: number
    noiseScale?: number

    // Transforms
    transforms?: any[]  // Transform configs from YAML

    // Legacy
    animationSpeed?: number
  }

  /** Size in pixels (width and height, thumbnails are square) */
  size?: number

  /** Enable lazy loading (won't animate until visible) */
  lazy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 200,
  lazy: true
})

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isVisible = ref(false)

/**
 * Hash string to number for seeding.
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Extract theme colors from CSS variables.
 */
function getThemeColors(): { primary: string; accent: string } | null {
  try {
    const styles = getComputedStyle(document.documentElement)
    const primary = styles.getPropertyValue('--color-primary').trim()
    const accent = styles.getPropertyValue('--color-accent').trim()

    if (primary && accent) {
      return { primary, accent }
    }
  } catch (err) {
    console.warn('[RadiantForgeThumbnail] Failed to read theme colors:', err)
  }
  return null
}

/**
 * Render the Canvas 2D thumbnail (static, no animation).
 */
async function renderThumbnail() {
  if (!containerRef.value) return

  const seed = hashString(props.trackId)

  // Get actual container size
  const rect = containerRef.value.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height, 200) // Minimum 200px

  // Create canvas at actual display size for crisp rendering
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'

  containerRef.value.appendChild(canvas)
  canvasRef.value = canvas

  // Extract theme colors if using theme-based coloring
  const themeColors = props.config.colorSource === 'theme' ? getThemeColors() : null

  // Build options for RadiantForge
  const options: CanvasThumbnailOptions = {
    seed,
    seedImage: props.config.seedImage,
    pattern: props.config.pattern,
    colorMode: props.config.colorMode,
    colorSource: props.config.colorSource,
    themeColors,
    palette: props.config.palette,
    blendSeed: props.config.blendSeed,
    blendMode: props.config.blendMode,
    patternOpacity: props.config.patternOpacity,
    seedImageAlpha: props.config.seedImageAlpha,
    saturation: props.config.saturation,
    lightness: props.config.lightness,
    maxIterations: props.config.maxIterations,
    hueRange: props.config.hueRange,
    zoom: props.config.zoom,
    offsetX: props.config.offsetX,
    offsetY: props.config.offsetY,
    rotation: props.config.rotation,
    juliaC: props.config.juliaC,
    octaves: props.config.octaves,
    persistence: props.config.persistence,
    noiseScale: props.config.noiseScale,
    transforms: props.config.transforms
  }

  // Render using RadiantForge
  try {
    await renderCanvasThumbnail(canvas, options)
  } catch (err) {
    console.error('[RadiantForgeThumbnail] Render failed:', err)
  }
}

// All rendering logic moved to @awake/radiantforge package!

/**
 * Setup Intersection Observer for lazy loading.
 */
let observer: IntersectionObserver | null = null

function setupLazyLoading() {
  if (!props.lazy || !containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          renderThumbnail()
          // Stop observing once loaded
          if (observer && containerRef.value) {
            observer.unobserve(containerRef.value)
          }
        }
      })
    },
    {
      root: null, // viewport
      rootMargin: '100px', // Load slightly before visible
      threshold: 0.01
    }
  )

  observer.observe(containerRef.value)
}

/**
 * Setup ResizeObserver to handle container size changes.
 */
let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (!containerRef.value) return

  resizeObserver = new ResizeObserver(() => {
    // Canvas 2D thumbnails are responsive via CSS, no need to re-render
  })

  resizeObserver.observe(containerRef.value)
}

onMounted(() => {
  if (props.lazy) {
    setupLazyLoading()
  } else {
    renderThumbnail()
  }

  setupResizeObserver()
})

onBeforeUnmount(() => {
  // Cleanup canvas
  if (canvasRef.value && containerRef.value) {
    containerRef.value.removeChild(canvasRef.value)
  }

  if (observer) {
    observer.disconnect()
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// Watch for config changes and re-render
watch(() => [props.trackId, props.config], () => {
  if (containerRef.value && isVisible.value) {
    // Clear existing canvas
    if (canvasRef.value) {
      containerRef.value.removeChild(canvasRef.value)
    }
    renderThumbnail()
  }
}, { deep: true })
</script>

<style scoped>
.radiantforge-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.radiantforge-thumbnail canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
