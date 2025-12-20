// src/visualizers/gforce-flow.ts
//
// "G-Force Flow" visualizer
// Inspired by the classic G-Force visualizer - fluid, organic, psychedelic.
// Radial waveforms, color cycling, particle trails, beat pulses.
//
// Now GPU-accelerated with WebGL!
//
import type p5 from 'p5'
import type { VisualizerFactory, VisualizerOptions } from '../engine/registry'
import type { CoordinateHelper } from '../engine/coordinate-helper'
import type { FrequencyBands } from '../audio/analyzer'

interface GForceOptions extends VisualizerOptions {
  _containerWidth?: number
  _containerHeight?: number
  _container?: HTMLElement
  _getAudioData?: () => FrequencyBands
  _coords?: CoordinateHelper
  
  // User options
  colorSpeed?: number
  trailLength?: number
  particleCount?: number
  sensitivity?: number
  mode?: 'radial' | 'spiral' | 'mirror'
}

export const gforceFlowVisualizer: VisualizerFactory = (p: p5, options?: VisualizerOptions) => {
  const opts = (options || {}) as GForceOptions
  
  const sensitivity = opts.sensitivity || 1.0
  const colorSpeed = opts.colorSpeed || 0.5
  const trailLength = opts.trailLength || 0.15
  const particleCount = opts.particleCount || 60
  const mode = opts.mode || 'radial'
  
  // Default to 2D renderer for best performance
  // This visualizer uses trail buffer with heavy pixel copying (p.get(), image()),
  // which is faster on CPU than GPU due to CPU-GPU transfer overhead.
  // Can be overridden with opts.renderer = 'webgl' if desired.
  // The runner sets opts._renderer based on config, defaulting to '2d'
  const isWebGL = opts._renderer === 'webgl'
  
  let time = 0
  let hueOffset = 0
  let particles: Array<{
    angle: number
    radius: number
    speed: number
    size: number
    hueOffset: number
  }> = []
  
  // Previous frame buffer for trail effect
  let trailBuffer: p5.Graphics
  
  // Smoothed audio values
  let smoothBass = 0
  let smoothMid = 0
  let smoothHigh = 0
  let smoothVolume = 0
  let beatPulse = 0

  p.setup = () => {
    const w = opts._containerWidth || 400
    const h = opts._containerHeight || 400
    
    // Use the renderer specified in options (WebGL or 2D)
    const canvas = isWebGL ? p.createCanvas(w, h, p.WEBGL) : p.createCanvas(w, h)
    canvas.style('display', 'block')
    
    p.colorMode(p.HSB, 360, 100, 100, 100)
    p.background(0)
    
    // Create trail buffer with same renderer
    trailBuffer = isWebGL ? p.createGraphics(w, h, p.WEBGL) : p.createGraphics(w, h)
    trailBuffer.colorMode(p.HSB, 360, 100, 100, 100)
    trailBuffer.background(0)
    
    // Initialize particles
    particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (i / particleCount) * p.TWO_PI,
        radius: p.random(0.2, 0.8),
        speed: p.random(0.5, 2),
        size: p.random(2, 6),
        hueOffset: p.random(0, 60)
      })
    }
  }

  p.draw = () => {
    // Get center point using CoordinateHelper (handles renderer differences)
    if (!opts._coords) {
      throw new Error('gforce-flow: CoordinateHelper not provided by runner')
    }
    const center = opts._coords.center()
    const cx = center.x
    const cy = center.y
    const origin = opts._coords.getOrigin() // Reuse this throughout the function
    const maxRadius = Math.min(p.width, p.height) * 0.45
    
    time += p.deltaTime * 0.001
    hueOffset += colorSpeed * (1 + smoothBass * 2)
    
    // Get audio data
    const getAudio = opts._getAudioData
    let bands: FrequencyBands | null = null
    if (getAudio) {
      bands = getAudio()
    }
    
    // Update smoothed values
    if (bands) {
      smoothBass = p.lerp(smoothBass, bands.bass * sensitivity, 0.3)
      smoothMid = p.lerp(smoothMid, bands.mid * sensitivity, 0.25)
      smoothHigh = p.lerp(smoothHigh, bands.high * sensitivity, 0.2)
      smoothVolume = p.lerp(smoothVolume, bands.volume * sensitivity, 0.2)
      
      // Beat pulse decay
      if (bands.beat) {
        beatPulse = bands.beatIntensity
      } else {
        beatPulse *= 0.92
      }
    } else {
      // Fake animation when no audio
      const fakeTime = time * 2
      smoothBass = (p.sin(fakeTime) * 0.5 + 0.5) * 0.6
      smoothMid = (p.sin(fakeTime * 1.3 + 1) * 0.5 + 0.5) * 0.5
      smoothHigh = (p.sin(fakeTime * 1.7 + 2) * 0.5 + 0.5) * 0.4
      smoothVolume = (smoothBass + smoothMid + smoothHigh) / 3
      beatPulse *= 0.95
      if (p.random() < 0.02) beatPulse = 0.8
    }
    
    // === TRAIL EFFECT ===
    // Draw fading trail from previous frame
    trailBuffer.background(0, 0, 0, trailLength * 100)
    
    // Position trail buffer using CoordinateHelper (handles renderer differences)
    p.image(trailBuffer, origin.x, origin.y)
    
    p.push()
    // In 2D mode, translate to center; WebGL is already centered
    if (!isWebGL) {
      p.translate(cx, cy)
    }
    
    // === RADIAL WAVEFORM ===
    const wavePoints = 128
    const baseHue = (hueOffset % 360)
    
    p.noFill()
    p.strokeWeight(2 + smoothBass * 3)
    
    // Multiple layered waves
    for (let layer = 0; layer < 3; layer++) {
      const layerHue = (baseHue + layer * 40) % 360
      const layerAlpha = 80 - layer * 20
      p.stroke(layerHue, 80, 90, layerAlpha)
      
      p.beginShape()
      for (let i = 0; i <= wavePoints; i++) {
        const angle = (i / wavePoints) * p.TWO_PI
        
        // Create wave distortion based on audio
        const bassWave = p.sin(angle * 2 + time * 3) * smoothBass * 40
        const midWave = p.sin(angle * 4 + time * 5) * smoothMid * 25
        const highWave = p.sin(angle * 8 + time * 8) * smoothHigh * 15
        
        const waveRadius = maxRadius * (0.3 + layer * 0.15) + bassWave + midWave + highWave
        const beatExpand = beatPulse * 30
        
        let x, y
        if (mode === 'spiral') {
          const spiralAngle = angle + time * 0.5 + layer * 0.3
          x = p.cos(spiralAngle) * (waveRadius + beatExpand)
          y = p.sin(spiralAngle) * (waveRadius + beatExpand)
        } else if (mode === 'mirror') {
          const mirrorWave = p.sin(angle * 6 + time * 4) * smoothMid * 30
          x = p.cos(angle) * (waveRadius + beatExpand + mirrorWave)
          y = p.sin(angle) * (waveRadius + beatExpand + mirrorWave)
        } else {
          x = p.cos(angle) * (waveRadius + beatExpand)
          y = p.sin(angle) * (waveRadius + beatExpand)
        }
        
        p.curveVertex(x, y)
      }
      p.endShape(p.CLOSE)
    }
    
    // === PARTICLES ===
    p.noStroke()
    for (const particle of particles) {
      // Update particle
      particle.angle += particle.speed * 0.02 * (1 + smoothMid)
      
      const particleHue = (baseHue + particle.hueOffset) % 360
      const particleRadius = maxRadius * particle.radius * (0.8 + smoothBass * 0.4)
      const pulseSize = particle.size * (1 + beatPulse * 2)
      
      // Spiral motion
      const spiralOffset = mode === 'spiral' ? p.sin(time + particle.angle) * 20 : 0
      
      const px = p.cos(particle.angle) * (particleRadius + spiralOffset)
      const py = p.sin(particle.angle) * (particleRadius + spiralOffset)
      
      // Glow layers
      for (let g = 3; g > 0; g--) {
        const glowAlpha = 20 * (1 - g / 4) * (0.5 + smoothVolume)
        p.fill(particleHue, 70, 100, glowAlpha)
        p.ellipse(px, py, pulseSize * (1 + g * 0.8), pulseSize * (1 + g * 0.8))
      }
      
      // Core
      p.fill(particleHue, 60, 100, 90)
      p.ellipse(px, py, pulseSize, pulseSize)
    }
    
    // === CENTER CORE ===
    const coreSize = 20 + smoothBass * 40 + beatPulse * 30
    
    // Core glow
    for (let g = 5; g > 0; g--) {
      const glowHue = (baseHue + 180) % 360
      p.fill(glowHue, 60, 100, 15 * (1 - g / 6))
      p.ellipse(0, 0, coreSize * (1 + g * 0.5), coreSize * (1 + g * 0.5))
    }
    
    // Core
    p.fill((baseHue + 180) % 360, 50, 100, 90)
    p.ellipse(0, 0, coreSize, coreSize)
    
    // Inner bright spot
    p.fill(0, 0, 100, 80)
    p.ellipse(0, 0, coreSize * 0.3, coreSize * 0.3)
    
    // === BEAT FLASH ===
    if (beatPulse > 0.3) {
      p.fill(baseHue, 30, 100, beatPulse * 15)
      p.ellipse(0, 0, p.width * 2, p.height * 2)
    }
    
    p.pop()
    
    // Copy to trail buffer (position depends on renderer)
    trailBuffer.image(p.get(), origin.x, origin.y)
  }

  p.windowResized = () => {
    const container = opts._container
    if (container) {
      p.resizeCanvas(container.clientWidth, container.clientHeight)
      // Recreate trail buffer at new size (same renderer as main canvas)
      trailBuffer = isWebGL ? p.createGraphics(p.width, p.height, p.WEBGL) : p.createGraphics(p.width, p.height)
      trailBuffer.colorMode(p.HSB, 360, 100, 100, 100)
      trailBuffer.background(0)
    }
  }
}

export default gforceFlowVisualizer

