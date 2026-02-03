// src/thumbnails/generative-thumbnail.ts
//
// Generative thumbnail system for track/album art.
// Uses seed images with color variations and geometric patterns.
//

import type p5 from 'p5'
import type { P5Factory } from '../engine/registry'

/**
 * Options for generative thumbnail generation.
 */
export interface ThumbnailOptions {
  /** Seed value for deterministic randomization (usually hash of track title/filename) */
  seed?: number

  /** Path to seed image (relative to public/assets or absolute URL) */
  seedImage?: string

  /** Color mode for generation */
  colorMode?: 'duotone_generate' | 'colorize_bw' | 'extract_and_vary' | 'manual_palette'

  /** Manual color palette (used with manual_palette mode) */
  palette?: string[]

  /** Pattern type for overlay */
  pattern?: 'none' | 'geometric' | 'waves' | 'particles' | 'grid' | 'organic'

  /** Blend seed image with pattern */
  blendSeed?: boolean

  /** Blend mode if blendSeed is true */
  blendMode?: 'multiply' | 'overlay' | 'screen' | 'difference' | 'add'

  /** Pattern opacity (0-1) */
  patternOpacity?: number

  /** Animation speed multiplier (0 = static) */
  animationSpeed?: number
}

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
 * Generate duotone color pair from seed.
 */
function generateDuotonePalette(seed: number): { dark: p5.Color; light: p5.Color } {
  // Use seed to pick hue (0-360)
  const hue = seed % 360

  // Create dark and light versions
  return {
    dark: null as any,   // Will be set in p5 context
    light: null as any,  // Will be set in p5 context
    hueValue: hue
  }
}

/**
 * Main generative thumbnail factory.
 */
export const generativeThumbnail: P5Factory = (p: p5, options?: ThumbnailOptions) => {
  const opts: Required<ThumbnailOptions> = {
    seed: options?.seed ?? Date.now(),
    seedImage: options?.seedImage ?? '',
    colorMode: options?.colorMode ?? 'duotone_generate',
    palette: options?.palette ?? [],
    pattern: options?.pattern ?? 'geometric',
    blendSeed: options?.blendSeed ?? false,
    blendMode: options?.blendMode ?? 'multiply',
    patternOpacity: options?.patternOpacity ?? 0.3,
    animationSpeed: options?.animationSpeed ?? 0.5
  }

  let img: p5.Image | null = null
  let darkColor: p5.Color
  let lightColor: p5.Color
  let patternOffset = 0

  p.preload = () => {
    if (opts.seedImage) {
      try {
        img = p.loadImage(opts.seedImage)
      } catch (err) {
        console.warn('RadiantForge: Failed to load seed image:', opts.seedImage, err)
      }
    }
  }

  p.setup = () => {
    p.createCanvas(200, 200) // Default thumbnail size
    p.colorMode(p.HSB, 360, 100, 100, 1)
    p.randomSeed(opts.seed)
    p.noiseSeed(opts.seed)

    // Generate color palette based on mode
    if (opts.colorMode === 'duotone_generate') {
      const hue = opts.seed % 360
      darkColor = p.color(hue, 80, 20)
      lightColor = p.color(hue, 60, 85)
    } else if (opts.colorMode === 'manual_palette' && opts.palette.length >= 2) {
      darkColor = p.color(opts.palette[0])
      lightColor = p.color(opts.palette[1])
    } else {
      // Default fallback
      darkColor = p.color(0, 0, 20)
      lightColor = p.color(0, 0, 85)
    }
  }

  p.draw = () => {
    p.background(0, 0, 10)

    // Draw seed image with duotone effect
    if (img) {
      applyDuotone(img)
    }

    // Draw pattern overlay
    if (opts.pattern !== 'none') {
      drawPattern()
    }

    // Update animation
    if (opts.animationSpeed > 0) {
      patternOffset += opts.animationSpeed
    }
  }

  /**
   * Apply duotone color mapping to image.
   */
  function applyDuotone(sourceImg: p5.Image) {
    p.push()

    // Draw image
    p.image(sourceImg, 0, 0, p.width, p.height)

    // Load pixels for color mapping
    p.loadPixels()

    for (let i = 0; i < p.pixels.length; i += 4) {
      // Get grayscale value (assuming B&W image, all channels are same)
      const gray = p.pixels[i] / 255 // Normalize to 0-1

      // Lerp between dark and light color
      const c = p.lerpColor(darkColor, lightColor, gray)

      // Update pixel
      p.pixels[i] = p.red(c)
      p.pixels[i + 1] = p.green(c)
      p.pixels[i + 2] = p.blue(c)
      // Alpha stays the same (i+3)
    }

    p.updatePixels()
    p.pop()
  }

  /**
   * Draw geometric pattern overlay.
   */
  function drawPattern() {
    p.push()
    p.blendMode(p.OVERLAY)

    if (opts.pattern === 'geometric') {
      drawGeometricPattern()
    } else if (opts.pattern === 'waves') {
      drawWavePattern()
    } else if (opts.pattern === 'particles') {
      drawParticlePattern()
    } else if (opts.pattern === 'grid') {
      drawGridPattern()
    }

    p.pop()
  }

  /**
   * Geometric shapes pattern.
   */
  function drawGeometricPattern() {
    p.noFill()
    p.stroke(lightColor)
    p.strokeWeight(1)

    const gridSize = 20
    const offset = (patternOffset % gridSize)

    for (let x = -offset; x < p.width + gridSize; x += gridSize) {
      for (let y = -offset; y < p.height + gridSize; y += gridSize) {
        const noise = p.noise(x * 0.01, y * 0.01, patternOffset * 0.01)

        if (noise > 0.5) {
          p.circle(x, y, gridSize * 0.5)
        } else if (noise > 0.3) {
          p.square(x - gridSize * 0.25, y - gridSize * 0.25, gridSize * 0.5)
        }
      }
    }
  }

  /**
   * Wave pattern.
   */
  function drawWavePattern() {
    p.noFill()
    p.stroke(lightColor)
    p.strokeWeight(2)

    const waveCount = 5
    for (let i = 0; i < waveCount; i++) {
      p.beginShape()
      for (let x = 0; x <= p.width; x += 5) {
        const y = p.height / 2 +
          p.sin((x + patternOffset) * 0.02 + i) * (20 + i * 10)
        p.vertex(x, y)
      }
      p.endShape()
    }
  }

  /**
   * Particle pattern.
   */
  function drawParticlePattern() {
    p.noStroke()
    p.fill(lightColor)

    const particleCount = 50
    for (let i = 0; i < particleCount; i++) {
      p.randomSeed(opts.seed + i)
      const x = p.random(p.width)
      const y = (p.random(p.height) + patternOffset) % p.height
      const size = p.random(2, 6)

      p.circle(x, y, size)
    }
  }

  /**
   * Grid pattern.
   */
  function drawGridPattern() {
    p.stroke(lightColor)
    p.strokeWeight(1)

    const gridSize = 20
    for (let x = 0; x <= p.width; x += gridSize) {
      p.line(x, 0, x, p.height)
    }
    for (let y = 0; y <= p.height; y += gridSize) {
      p.line(0, y, p.width, y)
    }
  }
}
