/**
 * Canvas 2D thumbnail renderer for RadiantForge.
 * Generates static generative thumbnails without p5.js overhead.
 */

import {
  generateMandelbrot,
  generateJulia,
  generateFractalNoise,
  generateSierpinski,
  generateGeometric,
  generateWaves,
  generateParticles,
  generateBurningShip,
  generateTricorn,
  seededRandom,
  hslToRgb
} from './fractal-generators'
import { ModulatedValue, ModulationContext, Transform } from './types'
import { applyTransforms } from './transforms'

export interface CanvasThumbnailOptions {
  seed: number
  seedImage?: string
  pattern?: string
  colorMode?: string
  colorSource?: 'seed' | 'theme'
  themeColors?: { primary: string; accent: string } | null
  palette?: string[]
  blendSeed?: boolean
  blendMode?: string

  // Visual controls (can be modulated!)
  patternOpacity?: ModulatedValue      // 0.0-1.0 (default: 0.5)
  seedImageAlpha?: ModulatedValue      // 0.0-1.0 (default: 1.0) - seed image opacity
  saturation?: ModulatedValue          // 0-100 (default: 80)
  lightness?: ModulatedValue           // 0-100 (default: 50)

  // Fractal detail (can be modulated!)
  maxIterations?: ModulatedValue       // 50-200 (default: 100)

  // Color mapping (can be modulated!)
  hueRange?: ModulatedValue            // 0-360 (default: 360)

  // Viewport controls (can be modulated!)
  zoom?: ModulatedValue                // 1.0-5.0 (default: auto-seeded)
  offsetX?: ModulatedValue             // -1.0 to 1.0 (default: auto-seeded)
  offsetY?: ModulatedValue             // -1.0 to 1.0 (default: auto-seeded)
  rotation?: ModulatedValue            // Rotate fractal coordinate space (degrees)

  // Julia-specific (can be modulated!)
  juliaC?: {
    re: ModulatedValue
    im: ModulatedValue
  }

  // Fractal Noise-specific (can be modulated!)
  octaves?: ModulatedValue             // Noise layers (default: 4)
  persistence?: ModulatedValue         // Amplitude decay (default: 0.5)
  noiseScale?: ModulatedValue          // Noise frequency (default: varies)

  // Modulation context (optional, for collection-aware modulation)
  modulationContext?: ModulationContext

  // Transforms (applied after pattern generation)
  transforms?: Transform[]
}

/**
 * Render a generative thumbnail to a canvas element.
 */
export async function renderCanvasThumbnail(
  canvas: HTMLCanvasElement,
  options: CanvasThumbnailOptions
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D context')

  const {
    seed,
    seedImage,
    pattern = 'geometric',
    colorSource = 'seed',
    themeColors,
    patternOpacity = 0.5,
    seedImageAlpha = 1.0,
    blendMode = 'overlay',
    saturation = 80,
    lightness = 50,
    maxIterations = 100,
    hueRange = 360,
    zoom,
    offsetX,
    offsetY,
    rotation,
    juliaC,
    octaves,
    persistence,
    noiseScale
  } = options

  // Generate duotone colors
  let hue: number
  let darkColor: string
  let lightColor: string

  if (colorSource === 'theme' && themeColors) {
    // Extract hue from theme primary color
    hue = extractHueFromColor(themeColors.primary)
    darkColor = `hsl(${hue}, 80%, 20%)`
    lightColor = `hsl(${hue}, 60%, 85%)`
  } else {
    // Default: seed-based random hue
    hue = seed % 360
    darkColor = `hsl(${hue}, 80%, 20%)`
    lightColor = `hsl(${hue}, 60%, 85%)`
  }

  // Load seed image if provided
  if (seedImage) {
    try {
      const img = await loadImage(seedImage)

      // Draw image with alpha
      ctx.globalAlpha = seedImageAlpha
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1.0

      // Apply duotone effect
      applyDuotone(ctx, canvas, darkColor, lightColor)
    } catch (err) {
      console.warn('[RadiantForge] Failed to load seed image, using solid color:', err)
      // Fallback: solid color background
      ctx.fillStyle = darkColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  } else {
    // No seed image: solid color
    ctx.fillStyle = darkColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Draw pattern overlay or fractal
  if (pattern && pattern !== 'none') {
    const fractalOptions = {
      seed,
      baseHue: hue,
      saturation: saturation || 80,
      lightness: lightness || 50,
      maxIterations: maxIterations || 100,
      hueRange: hueRange || 360,
      zoom,
      offsetX,
      offsetY,
      rotation,
      patternOpacity,
      blendMode: blendMode || 'overlay',
      juliaC,
      octaves,
      persistence,
      noiseScale,
      modulationContext: options.modulationContext,
      transforms: options.transforms
    }
    drawPattern(ctx, canvas, lightColor, pattern, fractalOptions)
  }
}

/**
 * Extract hue from CSS color string.
 */
function extractHueFromColor(color: string): number {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    if (delta === 0) return 0

    let hue = 0
    if (max === r) {
      hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      hue = ((b - r) / delta + 2) / 6
    } else {
      hue = ((r - g) / delta + 4) / 6
    }

    return Math.round(hue * 360)
  }

  // Handle hsl/hsla colors
  const hslMatch = color.match(/hsl\((\d+)/)
  if (hslMatch) {
    return parseInt(hslMatch[1])
  }

  // Fallback: return 0
  return 0
}

/**
 * Load image from URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Apply duotone color mapping to canvas.
 */
function applyDuotone(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  darkColor: string,
  lightColor: string
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Parse colors
  const dark = parseHSL(darkColor)
  const light = parseHSL(lightColor)

  for (let i = 0; i < data.length; i += 4) {
    // Get grayscale value (average of RGB)
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255

    // Lerp between dark and light
    data[i] = Math.round(dark.r + (light.r - dark.r) * gray)
    data[i + 1] = Math.round(dark.g + (light.g - dark.g) * gray)
    data[i + 2] = Math.round(dark.b + (light.b - dark.b) * gray)
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Parse HSL color to RGB.
 */
function parseHSL(hsl: string): { r: number; g: number; b: number } {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return { r: 0, g: 0, b: 0 }

  const h = parseInt(match[1])
  const s = parseInt(match[2])
  const l = parseInt(match[3])

  return hslToRgb(h, s, l)
}

interface FractalOptions {
  seed: number
  baseHue: number
  saturation: number
  lightness: number
  maxIterations: number
  hueRange: number
  zoom?: number
  offsetX?: number
  offsetY?: number
  rotation?: number
  patternOpacity: number
  blendMode?: string
  juliaC?: { re: number; im: number }
  octaves?: number
  persistence?: number
  noiseScale?: number
  transforms?: Transform[]
}

/**
 * Draw pattern overlay (geometric or fractal).
 */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string,
  pattern: string,
  options: FractalOptions
): void {
  // Fractal patterns render to temporary canvas, then blend on top
  const isFractalPattern = ['mandelbrot', 'julia', 'fractal_noise', 'burning_ship', 'tricorn'].includes(pattern)

  if (isFractalPattern) {
    // Create temporary canvas for fractal
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    const imageData = tempCtx.createImageData(canvas.width, canvas.height)

    if (pattern === 'mandelbrot') {
      generateMandelbrot(imageData, options)
    } else if (pattern === 'julia') {
      generateJulia(imageData, options)
    } else if (pattern === 'fractal_noise') {
      generateFractalNoise(imageData, options)
    } else if (pattern === 'burning_ship') {
      generateBurningShip(imageData, options)
    } else if (pattern === 'tricorn') {
      generateTricorn(imageData, options)
    }

    tempCtx.putImageData(imageData, 0, 0)

    // Apply transforms if specified
    let finalCanvas = tempCanvas
    if (options.transforms && options.transforms.length > 0) {
      
      // Create a second temp canvas for transformed output
      const transformCanvas = document.createElement('canvas')
      transformCanvas.width = canvas.width
      transformCanvas.height = canvas.height
      const transformCtx = transformCanvas.getContext('2d')
      if (!transformCtx) return

      // Save context state before transforms
      transformCtx.save()
      
      // Apply transforms (modifies the transformation matrix)
      applyTransforms(transformCtx, options.transforms, options.seed, transformCanvas.width, transformCanvas.height)
      
      // Draw the fractal with the transformed matrix
      transformCtx.drawImage(tempCanvas, 0, 0)
      
      // Restore context state
      transformCtx.restore()

      finalCanvas = transformCanvas
    }

    // Blend fractal on top of seed image using specified blend mode
    ctx.globalAlpha = options.patternOpacity
    ctx.globalCompositeOperation = options.blendMode || 'overlay'
    ctx.drawImage(finalCanvas, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    return
  }

  // Geometric patterns use overlay blend
  if (pattern === 'geometric') {
    generateGeometric(ctx, canvas, options.seed, color)
  } else if (pattern === 'waves') {
    generateWaves(ctx, canvas, options.seed, color)
  } else if (pattern === 'particles') {
    generateParticles(ctx, canvas, options.seed, color)
  } else if (pattern === 'sierpinski') {
    generateSierpinski(ctx, canvas, options.seed, color)
  }
}
