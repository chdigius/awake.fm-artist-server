// src/sigils/awake-node-001.ts
//
// "Node 001" sigil - orbital pulse animation
// A central core with orbiting particles, pulsing glow effect.
//
import type p5 from 'p5'
import type { SigilFactory, SigilOptions } from '../engine/registry'

interface NodeSigilOptions extends SigilOptions {
  seed?: string
  variant?: 'orbit' | 'pulse' | 'spiral'
  accentColor?: string
  particleCount?: number
  speed?: number
  // Injected by p5-runner
  _containerWidth?: number
  _containerHeight?: number
  _container?: HTMLElement
}

/**
 * Simple hash function to get a deterministic number from a seed string.
 */
function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Parse a CSS color string to RGB values.
 * Falls back to accent green if parsing fails.
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

export const awakeNode001Sigil: SigilFactory = (p: p5, options?: SigilOptions) => {
  const opts = (options || {}) as NodeSigilOptions
  
  const seed = opts.seed || 'awake-node-001'
  const variant = opts.variant || 'orbit'
  const particleCount = opts.particleCount || 5
  const speed = opts.speed || 1
  
  // Deterministic randomness from seed
  const seedHash = hashSeed(seed)
  
  let accentRGB: [number, number, number]
  let particles: Array<{ angle: number; radius: number; size: number; speed: number }>
  let pulsePhase = 0
  let time = 0

  p.setup = () => {
    // Use container dimensions injected by p5-runner
    const w = opts._containerWidth || 200
    const h = opts._containerHeight || 200
    const canvas = p.createCanvas(w, h)
    canvas.style('display', 'block')
    
    p.colorMode(p.RGB, 255)
    accentRGB = parseColor(p, opts.accentColor)
    
    // Initialize particles with seeded variation
    particles = []
    for (let i = 0; i < particleCount; i++) {
      const seedOffset = (seedHash + i * 1000) % 360
      particles.push({
        angle: (i / particleCount) * p.TWO_PI + seedOffset * 0.01,
        radius: 0.25 + (((seedHash + i * 500) % 100) / 100) * 0.15,
        size: 3 + (((seedHash + i * 200) % 100) / 100) * 4,
        speed: (0.8 + (((seedHash + i * 300) % 100) / 100) * 0.4) * speed
      })
    }
  }

  p.draw = () => {
    const cx = p.width / 2
    const cy = p.height / 2
    const baseRadius = Math.min(p.width, p.height) * 0.35
    
    // Clear with transparency for glow layering
    p.clear()
    p.background(0, 0, 0, 0)
    
    time += p.deltaTime * 0.001 * speed
    pulsePhase = p.sin(time * 2) * 0.5 + 0.5

    // === CENTRAL CORE ===
    // Outer glow
    p.noStroke()
    for (let i = 4; i > 0; i--) {
      const glowAlpha = 20 * (1 - i / 5) * (0.6 + pulsePhase * 0.4)
      const glowSize = baseRadius * 0.3 * (1 + i * 0.3)
      p.fill(accentRGB[0], accentRGB[1], accentRGB[2], glowAlpha)
      p.ellipse(cx, cy, glowSize, glowSize)
    }
    
    // Core circle
    const coreSize = baseRadius * 0.18 * (0.9 + pulsePhase * 0.1)
    p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 200)
    p.ellipse(cx, cy, coreSize, coreSize)
    
    // Inner bright spot
    p.fill(255, 255, 255, 180)
    p.ellipse(cx, cy, coreSize * 0.4, coreSize * 0.4)

    // === ORBIT RING ===
    p.noFill()
    p.stroke(accentRGB[0], accentRGB[1], accentRGB[2], 40 + pulsePhase * 20)
    p.strokeWeight(1)
    p.ellipse(cx, cy, baseRadius * 2 * 0.7, baseRadius * 2 * 0.7)

    // === PARTICLES ===
    if (variant === 'orbit' || variant === 'spiral') {
      for (const particle of particles) {
        particle.angle += particle.speed * 0.02
        
        let r = baseRadius * particle.radius * 2
        if (variant === 'spiral') {
          r *= 0.8 + p.sin(particle.angle * 0.5 + time) * 0.2
        }
        
        const px = cx + p.cos(particle.angle) * r
        const py = cy + p.sin(particle.angle) * r
        
        // Particle glow
        p.noStroke()
        p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 30)
        p.ellipse(px, py, particle.size * 3, particle.size * 3)
        
        // Particle core
        p.fill(accentRGB[0], accentRGB[1], accentRGB[2], 220)
        p.ellipse(px, py, particle.size, particle.size)
      }
    }

    // === PULSE VARIANT - concentric rings ===
    if (variant === 'pulse') {
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const ringPhase = (time * 0.5 + i / ringCount) % 1
        const ringRadius = baseRadius * 0.3 + ringPhase * baseRadius * 0.7
        const ringAlpha = (1 - ringPhase) * 60
        
        p.noFill()
        p.stroke(accentRGB[0], accentRGB[1], accentRGB[2], ringAlpha)
        p.strokeWeight(2 * (1 - ringPhase))
        p.ellipse(cx, cy, ringRadius * 2, ringRadius * 2)
      }
    }
  }

  p.windowResized = () => {
    // Resize to fill container
    const container = opts._container
    if (container) {
      p.resizeCanvas(container.clientWidth, container.clientHeight)
    }
  }
}

export default awakeNode001Sigil

