// src/visualizers/spectrum-bars.ts
//
// "Spectrum Bars" visualizer
// Classic frequency spectrum visualization with vertical bars.
//
import type p5 from 'p5'
import type { SigilFactory, SigilOptions } from '../engine/registry'
import type { FrequencyBands } from '../audio/analyzer'

interface SpectrumBarsOptions extends SigilOptions {
  // Injected by runner
  _containerWidth?: number
  _containerHeight?: number
  _container?: HTMLElement
  _getAudioData?: () => FrequencyBands
  
  // User options
  barCount?: number
  gap?: number
  accentColor?: string
  sensitivity?: number
  mirrorMode?: boolean
  glowEnabled?: boolean
}

/**
 * Parse a CSS color string to RGB values.
 */
function parseColor(p: p5, color?: string): [number, number, number] {
  if (!color) return [0, 255, 153] // default accent green
  try {
    const c = p.color(color)
    return [p.red(c), p.green(c), p.blue(c)]
  } catch {
    return [0, 255, 153]
  }
}

export const spectrumBarsSigil: SigilFactory = (p: p5, options?: SigilOptions) => {
  const opts = (options || {}) as SpectrumBarsOptions
  
  const barCount = opts.barCount || 32
  const gap = opts.gap || 2
  const sensitivity = opts.sensitivity || 1.0
  const mirrorMode = opts.mirrorMode ?? false
  const glowEnabled = opts.glowEnabled ?? true
  
  let accentRGB: [number, number, number]
  let barHeights: number[] = []
  
  // Smoothing for bar animations
  const smoothedHeights: number[] = new Array(barCount).fill(0)

  p.setup = () => {
    const w = opts._containerWidth || 400
    const h = opts._containerHeight || 200
    const canvas = p.createCanvas(w, h)
    canvas.style('display', 'block')
    
    p.colorMode(p.RGB, 255)
    accentRGB = parseColor(p, opts.accentColor)
    
    barHeights = new Array(barCount).fill(0)
  }

  p.draw = () => {
    p.clear()
    p.background(0, 0, 0, 0)
    
    const getAudio = opts._getAudioData
    
    // Get frequency data
    let bands: FrequencyBands | null = null
    if (getAudio) {
      bands = getAudio()
    }
    
    // Map frequency bands to bar heights
    if (bands) {
      // Distribute bands across bars with some interpolation
      const bandValues = [
        bands.sub,
        bands.bass,
        bands.bass,
        bands.lowMid,
        bands.lowMid,
        bands.mid,
        bands.mid,
        bands.mid,
        bands.highMid,
        bands.highMid,
        bands.high,
        bands.high,
      ]
      
      for (let i = 0; i < barCount; i++) {
        // Map bar index to band index with interpolation
        const bandIndex = (i / barCount) * (bandValues.length - 1)
        const lowBand = Math.floor(bandIndex)
        const highBand = Math.min(lowBand + 1, bandValues.length - 1)
        const t = bandIndex - lowBand
        
        const rawHeight = p.lerp(bandValues[lowBand], bandValues[highBand], t)
        barHeights[i] = rawHeight * sensitivity
      }
    } else {
      // No audio - animate with fake data for preview
      const time = p.millis() * 0.001
      for (let i = 0; i < barCount; i++) {
        barHeights[i] = (p.sin(time * 2 + i * 0.3) * 0.5 + 0.5) * 0.6
      }
    }
    
    // Smooth the heights for less jittery animation
    for (let i = 0; i < barCount; i++) {
      smoothedHeights[i] = p.lerp(smoothedHeights[i], barHeights[i], 0.3)
    }
    
    // Calculate bar dimensions
    const totalGap = gap * (barCount - 1)
    const barWidth = (p.width - totalGap) / barCount
    const maxBarHeight = p.height * 0.9
    
    // Draw bars
    p.noStroke()
    
    const actualBarCount = mirrorMode ? Math.ceil(barCount / 2) : barCount
    
    for (let i = 0; i < actualBarCount; i++) {
      const height = smoothedHeights[i] * maxBarHeight
      const x = i * (barWidth + gap)
      const y = p.height - height
      
      // Glow effect
      if (glowEnabled && height > 10) {
        const glowIntensity = smoothedHeights[i]
        for (let g = 3; g > 0; g--) {
          p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 20 * glowIntensity)
          p.rect(x - g, y - g, barWidth + g * 2, height + g * 2, 2)
        }
      }
      
      // Main bar with gradient effect (brighter at top)
      const topAlpha = 255
      const bottomAlpha = 150
      
      // Draw bar
      p.fill(accentRGB[0], accentRGB[1], accentRGB[2], p.lerp(bottomAlpha, topAlpha, smoothedHeights[i]))
      p.rect(x, y, barWidth, height, 2)
      
      // Mirror mode - draw on right side too
      if (mirrorMode) {
        const mirrorX = p.width - x - barWidth
        
        if (glowEnabled && height > 10) {
          const glowIntensity = smoothedHeights[i]
          for (let g = 3; g > 0; g--) {
            p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 20 * glowIntensity)
            p.rect(mirrorX - g, y - g, barWidth + g * 2, height + g * 2, 2)
          }
        }
        
        p.fill(accentRGB[0], accentRGB[1], accentRGB[2], p.lerp(bottomAlpha, topAlpha, smoothedHeights[i]))
        p.rect(mirrorX, y, barWidth, height, 2)
      }
    }
    
    // Beat flash overlay
    if (bands?.beat) {
      p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 30 * bands.beatIntensity)
      p.rect(0, 0, p.width, p.height)
    }
  }

  p.windowResized = () => {
    const container = opts._container
    if (container) {
      p.resizeCanvas(container.clientWidth, container.clientHeight)
    }
  }
}

export default spectrumBarsSigil

