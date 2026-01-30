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

enum StarType {
  TWINKLE = 'twinkle',
  PULSE = 'pulse',
  SHOOTING = 'shooting',
  SPARKLE = 'sparkle'
}

interface Star {
  x: number
  y: number
  z: number
  size: number
  hue: number
  brightness: number
  speed: number
  type: StarType
  twinklePhase: number  // For twinkle animation
  pulsePhase: number    // For pulse animation
  hasTrail: boolean     // Whether this star leaves a trail
  prevX: number         // Previous position for trail
  prevY: number
  prevZ: number
}

export const galaxyFlightVisualizer: VisualizerFactory = (p: p5, options?: VisualizerOptions) => {
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

  // Retro sci-fi color palette (magenta, purple, cyan)
  const sciFiColors = {
    magenta: 320,
    purple: 280,
    cyan: 180,
    pink: 330,
    blue: 220
  }

  // Create a star at a random position with a random type
  function createStar(): Star {
    // Distribute star types: 50% twinkle, 25% pulse, 15% shooting, 10% sparkle
    const rand = p.random()
    let type: StarType
    if (rand < 0.5) type = StarType.TWINKLE
    else if (rand < 0.75) type = StarType.PULSE
    else if (rand < 0.9) type = StarType.SHOOTING
    else type = StarType.SPARKLE

    // Different sizes for different types
    let size: number
    if (type === StarType.PULSE) size = p.random(3, 6)
    else if (type === StarType.SPARKLE) size = p.random(2, 5)
    else if (type === StarType.SHOOTING) size = p.random(1.5, 3)
    else size = p.random(1, 3)

    // Sci-fi color palette
    const colorChoices = [
      sciFiColors.magenta,
      sciFiColors.purple,
      sciFiColors.cyan,
      sciFiColors.pink,
      sciFiColors.blue
    ]
    const hue = p.random(colorChoices)

    // 30% of stars get trails
    const hasTrail = p.random() < 0.3

    const x = p.random(-p.width, p.width)
    const y = p.random(-p.height, p.height)
    const z = p.random(0, depth)

    return {
      x,
      y,
      z,
      size,
      hue,
      brightness: p.random(60, 100),
      speed: p.random(0.8, 1.2),
      type,
      twinklePhase: p.random(p.TWO_PI),
      pulsePhase: p.random(p.TWO_PI),
      hasTrail,
      prevX: x,
      prevY: y,
      prevZ: z
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

  // Draw a single star based on its type
  function drawStar(star: Star, sx: number, sy: number, z: number, size: number, distanceFade: number) {
    const baseHue = (star.hue + hueOffset + smoothBass * 30) % 360
    const baseBrightness = star.brightness * (0.6 + smoothHigh * 0.4 + beatPulse * 0.4) * distanceFade

    switch (star.type) {
      case StarType.TWINKLE: {
        // Fast random brightness flicker
        star.twinklePhase += 0.3
        const twinkle = p.noise(star.twinklePhase) * 0.5 + 0.5
        const brightness = baseBrightness * twinkle
        
        // Simple dot with glow
        const glowSize = size * 1.5
        p.fill(baseHue, 60, 100, 10 * distanceFade * twinkle)
        p.vertex(sx - glowSize, sy - glowSize, z)
        p.vertex(sx + glowSize, sy - glowSize, z)
        p.vertex(sx + glowSize, sy + glowSize, z)
        p.vertex(sx - glowSize, sy + glowSize, z)
        
        p.fill(baseHue, 40, brightness, 90 * distanceFade)
        p.vertex(sx - size, sy - size, z)
        p.vertex(sx + size, sy - size, z)
        p.vertex(sx + size, sy + size, z)
        p.vertex(sx - size, sy + size, z)
        break
      }

      case StarType.PULSE: {
        // Slow breathing pulse
        star.pulsePhase += 0.03
        const pulse = p.sin(star.pulsePhase) * 0.5 + 0.5
        const pulsedSize = size * (0.7 + pulse * 0.6)
        const brightness = baseBrightness * (0.8 + pulse * 0.2)
        
        // Larger outer glow
        const glowSize = pulsedSize * 2.5
        p.fill(baseHue, 80, 100, 20 * distanceFade * pulse)
        p.vertex(sx - glowSize, sy - glowSize, z)
        p.vertex(sx + glowSize, sy - glowSize, z)
        p.vertex(sx + glowSize, sy + glowSize, z)
        p.vertex(sx - glowSize, sy + glowSize, z)
        
        // Core
        p.fill(baseHue, 50, brightness, 85 * distanceFade)
        p.vertex(sx - pulsedSize, sy - pulsedSize, z)
        p.vertex(sx + pulsedSize, sy - pulsedSize, z)
        p.vertex(sx + pulsedSize, sy + pulsedSize, z)
        p.vertex(sx - pulsedSize, sy + pulsedSize, z)
        
        // Bright center
        const centerSize = pulsedSize * 0.4
        p.fill(0, 0, 100, 70 * distanceFade)
        p.vertex(sx - centerSize, sy - centerSize, z)
        p.vertex(sx + centerSize, sy - centerSize, z)
        p.vertex(sx + centerSize, sy + centerSize, z)
        p.vertex(sx - centerSize, sy + centerSize, z)
        break
      }

      case StarType.SHOOTING: {
        // Elongated with motion trail
        const trailLength = size * 4
        const brightness = baseBrightness
        
        // Calculate trail direction (opposite of motion)
        const factor = 300 / star.z
        const trailX = sx + trailLength
        
        // Gradient trail
        p.fill(baseHue, 70, brightness, 0)
        p.vertex(trailX, sy - size, z)
        p.fill(baseHue, 60, brightness, 60 * distanceFade)
        p.vertex(sx, sy - size, z)
        p.vertex(sx, sy + size, z)
        p.fill(baseHue, 70, brightness, 0)
        p.vertex(trailX, sy + size, z)
        
        // Bright head
        p.fill(baseHue, 40, 100, 90 * distanceFade)
        p.vertex(sx - size, sy - size, z)
        p.vertex(sx + size, sy - size, z)
        p.vertex(sx + size, sy + size, z)
        p.vertex(sx - size, sy + size, z)
        break
      }

      case StarType.SPARKLE: {
        // Cross/plus shape
        const brightness = baseBrightness
        const armLength = size * 2
        const armWidth = size * 0.4
        
        // Horizontal arm
        p.fill(baseHue, 50, brightness, 80 * distanceFade)
        p.vertex(sx - armLength, sy - armWidth, z)
        p.vertex(sx + armLength, sy - armWidth, z)
        p.vertex(sx + armLength, sy + armWidth, z)
        p.vertex(sx - armLength, sy + armWidth, z)
        
        // Vertical arm
        p.vertex(sx - armWidth, sy - armLength, z)
        p.vertex(sx + armWidth, sy - armLength, z)
        p.vertex(sx + armWidth, sy + armLength, z)
        p.vertex(sx - armWidth, sy + armLength, z)
        
        // Bright center
        p.fill(0, 0, 100, 90 * distanceFade)
        p.vertex(sx - size, sy - size, z)
        p.vertex(sx + size, sy - size, z)
        p.vertex(sx + size, sy + size, z)
        p.vertex(sx - size, sy + size, z)
        break
      }
    }
  }

  // Draw glowing trail from previous position to current position
  function drawTrail(star: Star, sx: number, sy: number, z: number, size: number, distanceFade: number) {
    // Calculate previous position in screen space
    const prevFactor = 300 / star.prevZ
    const psx = star.prevX * prevFactor
    const psy = star.prevY * prevFactor
    const pz = -star.prevZ

    const baseHue = (star.hue + hueOffset + smoothBass * 30) % 360
    
    // Trail intensity based on audio (bass makes trails glow more)
    const trailIntensity = 0.4 + smoothBass * 0.6 + beatPulse * 0.5
    
    // Draw multiple trail segments for smooth gradient
    const segments = 3
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments
      const t2 = (i + 1) / segments
      
      // Interpolate positions
      const x1 = p.lerp(psx, sx, t1)
      const y1 = p.lerp(psy, sy, t1)
      const z1 = p.lerp(pz, z, t1)
      const x2 = p.lerp(psx, sx, t2)
      const y2 = p.lerp(psy, sy, t2)
      const z2 = p.lerp(pz, z, t2)
      
      // Trail gets narrower and more transparent toward the back
      const w1 = size * (1 - t1 * 0.7)
      const w2 = size * (1 - t2 * 0.7)
      const alpha1 = 40 * distanceFade * trailIntensity * (1 - t1 * 0.8)
      const alpha2 = 40 * distanceFade * trailIntensity * (1 - t2 * 0.8)
      
      // Draw trail quad with gradient
      p.fill(baseHue, 70, 90, alpha1)
      p.vertex(x1 - w1, y1 - w1, z1)
      p.vertex(x1 + w1, y1 - w1, z1)
      p.fill(baseHue, 70, 90, alpha2)
      p.vertex(x2 + w2, y2 + w2, z2)
      p.vertex(x2 - w2, y2 - w2, z2)
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
    
    // Dark background with slight sci-fi tint
    p.background(280, 20, 3)
    
    // Update star positions
    for (const star of stars) {
      // Store previous position for trail
      star.prevX = star.x
      star.prevY = star.y
      star.prevZ = star.z
      
      // Move star toward camera
      const speed = baseSpeed * star.speed * (1 + smoothMid * 2)
      star.z -= speed
      
      // Reset star if it's behind camera
      if (star.z < 1) {
        star.x = p.random(-p.width * 2, p.width * 2)
        star.y = p.random(-p.height * 2, p.height * 2)
        star.z = depth
        star.prevX = star.x
        star.prevY = star.y
        star.prevZ = star.z
      }
    }
    
    // Sort stars by depth (back to front for proper alpha blending)
    const sortedStars = [...stars].sort((a, b) => b.z - a.z)
    
    // Draw trails FIRST (behind stars)
    p.noStroke()
    p.beginShape(p.QUADS)
    
    for (const star of sortedStars) {
      if (!star.hasTrail) continue
      
      // Calculate 3D perspective projection
      const factor = 300 / star.z
      const sx = star.x * factor
      const sy = star.y * factor
      
      // Skip if way off screen
      if (Math.abs(sx) > p.width * 2 || Math.abs(sy) > p.height * 2) continue
      
      // Size based on distance (closer = bigger)
      const size = star.size * factor * (1 + beatPulse * 0.3)
      
      // Distance affects brightness (closer = brighter)
      const distanceFade = p.map(star.z, 0, depth, 1, 0.2)
      
      // Calculate world position
      const z = -star.z
      
      // Draw trail
      drawTrail(star, sx, sy, z, size, distanceFade)
    }
    
    p.endShape()
    
    // Draw all stars on top of trails
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
      
      // Distance affects brightness (closer = brighter)
      const distanceFade = p.map(star.z, 0, depth, 1, 0.2)
      
      // Calculate world position
      const z = -star.z
      
      // Draw star based on type
      drawStar(star, sx, sy, z, size, distanceFade)
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

export default galaxyFlightVisualizer