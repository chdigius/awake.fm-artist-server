// src/visualizers/nebula-flight.ts
//
// "Nebula Flight" visualizer
// Fly through a 3D starfield nebula with thousands of particles.
// Stars pulse with the beat and flow toward you in parallax 3D.
//
// This visualizer REQUIRES WebGL for performance!
//
import type p5 from 'p5'
import type { VisualizerFactory, VisualizerOptions } from '../engine/registry'
import type { FrequencyBands } from '../audio/analyzer'

interface NebulaOptions extends VisualizerOptions {
  _containerWidth?: number
  _containerHeight?: number
  _container?: HTMLElement
  _getAudioData?: () => FrequencyBands
  
  // User options
  starCount?: number
  speed?: number
  sensitivity?: number
  colorShift?: number
  depth?: number
}

interface Star {
  x: number
  y: number
  z: number
  size: number
  hue: number
  brightness: number
  speed: number
}

export const nebulaFlightVisualizer: VisualizerFactory = (p: p5, options?: VisualizerOptions) => {
  const opts = (options || {}) as NebulaOptions
  
  // This visualizer REQUIRES WebGL for thousands of particles
  // Force WebGL regardless of what's passed in
  const renderer = 'webgl'
  const starCount = opts.starCount || 2000
  const baseSpeed = opts.speed || 2
  const sensitivity = opts.sensitivity || 1.0
  const colorShift = opts.colorShift || 0.5
  const depth = opts.depth || 1000
  
  let stars: Star[] = []
  let time = 0
  let hueOffset = 0
  
  // Smoothed audio values
  let smoothBass = 0
  let smoothMid = 0
  let smoothHigh = 0
  let smoothVolume = 0
  let beatPulse = 0

  // Create a star at a random position
  function createStar(): Star {
    return {
      x: p.random(-p.width, p.width),
      y: p.random(-p.height, p.height),
      z: p.random(0, depth),
      size: p.random(1, 4),
      hue: p.random(180, 300), // Blue to purple range
      brightness: p.random(60, 100),
      speed: p.random(0.8, 1.2)
    }
  }

  p.setup = () => {
    const w = opts._containerWidth || 400
    const h = opts._containerHeight || 400
    
    // WebGL is REQUIRED for this visualizer
    const canvas = p.createCanvas(w, h, p.WEBGL)
    canvas.style('display', 'block')
    
    p.colorMode(p.HSB, 360, 100, 100, 100)
    p.background(0)
    
    // Initialize starfield
    for (let i = 0; i < starCount; i++) {
      stars.push(createStar())
    }
  }

  p.draw = () => {
    time += p.deltaTime * 0.001
    hueOffset += colorShift * 0.5
    
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
      
      // Beat pulse
      if (bands.beat) {
        beatPulse = bands.beatIntensity
      } else {
        beatPulse *= 0.9
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
    
    // Dark background
    p.background(0, 0, 5)
    
    // Update star positions first
    for (const star of stars) {
      // Move star toward camera
      const speed = baseSpeed * star.speed * (1 + smoothMid * 2)
      star.z -= speed
      
      // Reset star if it's behind camera
      if (star.z < 1) {
        star.x = p.random(-p.width * 2, p.width * 2)
        star.y = p.random(-p.height * 2, p.height * 2)
        star.z = depth
      }
    }
    
    // Sort stars by depth (back to front for proper alpha blending)
    const sortedStars = [...stars].sort((a, b) => b.z - a.z)
    
    // Draw all stars in ONE batched draw call - this is the key to performance!
    // We'll draw 3 quads per star (glow, core, center) but all in one beginShape()
    p.noStroke()
    p.beginShape(p.QUADS)
    
    for (const star of sortedStars) {
      // Calculate 3D perspective projection
      const factor = 300 / star.z
      const sx = star.x * factor
      const sy = star.y * factor
      
      // Skip if way off screen
      if (Math.abs(sx) > p.width * 2 || Math.abs(sy) > p.height * 2) continue
      
      // Size based on distance (closer = bigger)
      const size = star.size * factor * (1 + beatPulse * 0.3)
      
      // Color shifts based on audio
      const starHue = (star.hue + hueOffset + smoothBass * 30) % 360
      const brightness = star.brightness * (0.6 + smoothHigh * 0.4 + beatPulse * 0.4)
      
      // Distance affects brightness (closer = brighter)
      const distanceFade = p.map(star.z, 0, depth, 1, 0.2)
      const finalBrightness = brightness * distanceFade
      
      // Calculate world position
      const z = -star.z
      
      // Layer 1: Outer glow (largest, most transparent)
      const glowSize = size * 2
      p.fill(starHue, 80, 100, 15 * distanceFade)
      p.vertex(sx - glowSize, sy - glowSize, z)
      p.vertex(sx + glowSize, sy - glowSize, z)
      p.vertex(sx + glowSize, sy + glowSize, z)
      p.vertex(sx - glowSize, sy + glowSize, z)
      
      // Layer 2: Core (medium, colored)
      p.fill(starHue, 50, finalBrightness, 80 * distanceFade)
      p.vertex(sx - size, sy - size, z)
      p.vertex(sx + size, sy - size, z)
      p.vertex(sx + size, sy + size, z)
      p.vertex(sx - size, sy + size, z)
      
      // Layer 3: Bright center (smallest, white)
      const centerSize = size * 0.5
      p.fill(0, 0, 100, 60 * distanceFade)
      p.vertex(sx - centerSize, sy - centerSize, z)
      p.vertex(sx + centerSize, sy - centerSize, z)
      p.vertex(sx + centerSize, sy + centerSize, z)
      p.vertex(sx - centerSize, sy + centerSize, z)
    }
    
    p.endShape()
    
    // Beat flash overlay
    if (beatPulse > 0.3) {
      p.push()
      p.noStroke()
      const flashHue = (hueOffset % 360)
      p.fill(flashHue, 40, 100, beatPulse * 5)
      p.translate(0, 0, -500)
      const flashSize = p.width * 2
      p.beginShape(p.QUADS)
      p.vertex(-flashSize, -flashSize, 0)
      p.vertex(flashSize, -flashSize, 0)
      p.vertex(flashSize, flashSize, 0)
      p.vertex(-flashSize, flashSize, 0)
      p.endShape()
      p.pop()
    }
  }

  p.windowResized = () => {
    const container = opts._container
    if (container) {
      p.resizeCanvas(container.clientWidth, container.clientHeight)
    }
  }
}

export default nebulaFlightVisualizer

