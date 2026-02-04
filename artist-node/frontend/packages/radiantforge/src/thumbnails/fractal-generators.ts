/**
 * Fractal pattern generators for Canvas 2D thumbnails.
 */

import { ModulatedValue, ModulationContext } from './types'
import { resolveModulatedValue, seededRandom as importedSeededRandom } from './modulators'

// Re-export seededRandom for backwards compatibility
export { seededRandom } from './modulators'

/**
 * Helper to resolve common fractal options (baseHue, saturation, lightness, etc.)
 */
interface ResolvedCommonOptions {
  baseHue: number
  saturation: number
  lightness: number
  maxIterations: number
  hueRange: number
  rotation: number  // Rotation angle in radians
}

function resolveCommonOptions(
  options: FractalGeneratorOptions
): ResolvedCommonOptions {
  const { seed, modulationContext, rotation: rotationDegrees } = options
  
  // Resolve rotation (convert degrees to radians)
  const rotationAngle = rotationDegrees !== undefined
    ? resolveModulatedValue(seed, rotationDegrees, modulationContext)
    : 0
  
  return {
    baseHue: resolveModulatedValue(seed, options.baseHue, modulationContext),
    saturation: resolveModulatedValue(seed, options.saturation, modulationContext),
    lightness: resolveModulatedValue(seed, options.lightness, modulationContext),
    maxIterations: Math.round(resolveModulatedValue(seed, options.maxIterations, modulationContext)),
    hueRange: resolveModulatedValue(seed, options.hueRange, modulationContext),
    rotation: rotationAngle * Math.PI / 180  // Convert to radians
  }
}

/**
 * Rotate a 2D point around origin.
 * Used to rotate fractal coordinate space during generation.
 */
function rotatePoint(x: number, y: number, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  }
}

/**
 * Seeded noise function (simple gradient noise).
 */
export function seededNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

/**
 * Convert HSL to RGB.
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

export interface FractalGeneratorOptions {
  seed: number
  baseHue: ModulatedValue
  saturation: ModulatedValue
  lightness: ModulatedValue
  maxIterations: ModulatedValue
  hueRange: ModulatedValue
  zoom?: ModulatedValue
  offsetX?: ModulatedValue
  offsetY?: ModulatedValue
  rotation?: ModulatedValue       // Rotate fractal coordinate space (degrees)

  // Julia-specific
  juliaC?: {
    re: ModulatedValue
    im: ModulatedValue
  }

  // Fractal Noise-specific
  octaves?: ModulatedValue
  persistence?: ModulatedValue
  noiseScale?: ModulatedValue

  // Modulation context (optional, for collection-aware modulation)
  modulationContext?: ModulationContext
}

/**
 * Mandelbrot Set generator.
 */
export function generateMandelbrot(
  imageData: ImageData,
  options: FractalGeneratorOptions
): void {
  const { width, height, data } = imageData
  const {
    seed,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY,
    modulationContext
  } = options

  // Resolve common modulated values (includes rotation)
  const { baseHue, saturation, lightness, maxIterations, hueRange, rotation } = resolveCommonOptions(options)

  // Use manual values or generate from seed
  const offsetX = manualOffsetX !== undefined
    ? resolveModulatedValue(seed, manualOffsetX, modulationContext)
    : (importedSeededRandom(seed) - 0.5) * 0.5
  const offsetY = manualOffsetY !== undefined
    ? resolveModulatedValue(seed, manualOffsetY, modulationContext)
    : (importedSeededRandom(seed + 1) - 0.5) * 0.5
  const zoom = manualZoom !== undefined
    ? resolveModulatedValue(seed, manualZoom, modulationContext)
    : 1.5 + importedSeededRandom(seed + 2) * 2
  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      // Map pixel to centered coordinates
      let coordX = (px / width - 0.5) * 3.5 / zoom
      let coordY = (py / height - 0.5) * 2 / zoom
      
      // Apply rotation to coordinate space (rotate the fractal math!)
      if (rotation !== 0) {
        const rotated = rotatePoint(coordX, coordY, rotation)
        coordX = rotated.x
        coordY = rotated.y
      }
      
      // Apply offset after rotation
      const x0 = coordX + offsetX
      const y0 = coordY + offsetY

      let x = 0
      let y = 0
      let iteration = 0

      while (x * x + y * y <= 4 && iteration < maxIterations) {
        const xtemp = x * x - y * y + x0
        y = 2 * x * y + y0
        x = xtemp
        iteration++
      }

      const idx = (py * width + px) * 4
      if (iteration === maxIterations) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
      } else {
        const hue = (iteration / maxIterations * hueRange + hueShift) % 360
        const rgb = hslToRgb(hue, saturation, lightness)
        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
      }
      data[idx + 3] = 255
    }
  }
}

/**
 * Julia Set generator.
 */
export function generateJulia(
  imageData: ImageData,
  options: FractalGeneratorOptions
): void {
  const { width, height, data } = imageData
  const {
    seed,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY,
    juliaC,
    modulationContext
  } = options

  // Resolve common modulated values (includes rotation)
  const { baseHue, saturation, lightness, maxIterations, hueRange, rotation } = resolveCommonOptions(options)

  // Use manual values as BASE, then add seeded variation
  const baseOffsetX = manualOffsetX !== undefined
    ? resolveModulatedValue(seed, manualOffsetX, modulationContext)
    : 0.0
  const baseOffsetY = manualOffsetY !== undefined
    ? resolveModulatedValue(seed, manualOffsetY, modulationContext)
    : 0.0
  const baseZoom = manualZoom !== undefined
    ? resolveModulatedValue(seed, manualZoom, modulationContext)
    : 1.5

  // Add seeded variation (±0.3 for offset, ±0.5 for zoom)
  const offsetX = baseOffsetX + (importedSeededRandom(seed) - 0.5) * 0.6
  const offsetY = baseOffsetY + (importedSeededRandom(seed + 1) - 0.5) * 0.6
  const zoom = baseZoom * (0.7 + importedSeededRandom(seed + 2) * 0.6)  // 70%-130% of base
  const hueShift = baseHue

  // Julia constant: use manual values OR classic default
  const cRe = juliaC?.re !== undefined
    ? resolveModulatedValue(seed, juliaC.re, modulationContext)
    : (-0.7 + (importedSeededRandom(seed + 3) - 0.5) * 0.2)
  const cIm = juliaC?.im !== undefined
    ? resolveModulatedValue(seed, juliaC.im, modulationContext)
    : (0.27015 + (importedSeededRandom(seed + 4) - 0.5) * 0.2)

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      // Map pixel to centered coordinates
      let zRe = (px / width - 0.5) * 3 / zoom
      let zIm = (py / height - 0.5) * 2 / zoom
      
      // Apply rotation to coordinate space
      if (rotation !== 0) {
        const rotated = rotatePoint(zRe, zIm, rotation)
        zRe = rotated.x
        zIm = rotated.y
      }

      let iteration = 0

      while (zRe * zRe + zIm * zIm <= 4 && iteration < maxIterations) {
        const zReTemp = zRe * zRe - zIm * zIm + cRe
        zIm = 2 * zRe * zIm + cIm
        zRe = zReTemp
        iteration++
      }

      const idx = (py * width + px) * 4
      if (iteration === maxIterations) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
      } else {
        const hue = (iteration / maxIterations * hueRange + hueShift) % 360
        const rgb = hslToRgb(hue, saturation, lightness)
        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
      }
      data[idx + 3] = 255
    }
  }
}

/**
 * Fractal Noise generator (multi-octave Perlin-style).
 */
export function generateFractalNoise(
  imageData: ImageData,
  options: FractalGeneratorOptions
): void {
  const { width, height, data } = imageData
  const {
    seed,
    octaves: manualOctaves,
    persistence: manualPersistence,
    noiseScale: manualNoiseScale,
    modulationContext
  } = options

  // Resolve common modulated values
  const { baseHue, saturation, lightness, hueRange } = resolveCommonOptions(options)

  // Use manual values or defaults
  const octaves = manualOctaves !== undefined
    ? Math.round(resolveModulatedValue(seed, manualOctaves, modulationContext))
    : 4  // 1-8 layers
  const persistence = manualPersistence !== undefined
    ? resolveModulatedValue(seed, manualPersistence, modulationContext)
    : 0.5  // 0.0-1.0 amplitude decay
  const baseScale = manualNoiseScale !== undefined
    ? resolveModulatedValue(seed, manualNoiseScale, modulationContext)
    : (2 + importedSeededRandom(seed + 4) * 4)  // 2-6 base frequency

  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      const x = px / width
      const y = py / height

      // Multi-octave noise with configurable params
      let value = 0
      let amplitude = 1
      let frequency = baseScale

      for (let octave = 0; octave < octaves; octave++) {
        value += seededNoise(x * frequency + seed, y * frequency + seed) * amplitude
        frequency *= 2                    // Each octave doubles frequency
        amplitude *= persistence          // Each octave multiplies amplitude by persistence
      }

      value = (value + 1) / 2 // Normalize to 0-1

      const idx = (py * width + px) * 4
      const hue = (value * hueRange + hueShift) % 360
      const rgb = hslToRgb(hue, saturation, lightness * (0.7 + value * 0.6))
      data[idx] = rgb.r
      data[idx + 1] = rgb.g
      data[idx + 2] = rgb.b
      data[idx + 3] = 255
    }
  }
}

/**
 * Sierpinski Triangle generator (recursive).
 */
export function generateSierpinski(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  seed: number,
  color: string
): void {
  const depth = 5 + Math.floor(seededRandom(seed) * 3)

  ctx.strokeStyle = color
  ctx.lineWidth = 1

  function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, d: number) {
    if (d === 0) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x3, y3)
      ctx.closePath()
      ctx.stroke()
    } else {
      const x12 = (x1 + x2) / 2
      const y12 = (y1 + y2) / 2
      const x23 = (x2 + x3) / 2
      const y23 = (y2 + y3) / 2
      const x31 = (x3 + x1) / 2
      const y31 = (y3 + y1) / 2

      triangle(x1, y1, x12, y12, x31, y31, d - 1)
      triangle(x12, y12, x2, y2, x23, y23, d - 1)
      triangle(x31, y31, x23, y23, x3, y3, d - 1)
    }
  }

  const size = Math.min(canvas.width, canvas.height) * 0.8
  const cx = canvas.width / 2
  const cy = canvas.height / 2

  triangle(
    cx, cy - size / 2,
    cx - size / 2, cy + size / 2,
    cx + size / 2, cy + size / 2,
    depth
  )
}

/**
 * Geometric pattern generator (circles and squares).
 */
export function generateGeometric(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  seed: number,
  color: string
): void {
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  const gridSize = 20
  for (let x = 0; x < canvas.width; x += gridSize) {
    for (let y = 0; y < canvas.height; y += gridSize) {
      const noise = seededRandom(seed + x * 0.1 + y * 0.1)
      if (noise > 0.5) {
        ctx.beginPath()
        ctx.arc(x, y, gridSize * 0.25, 0, Math.PI * 2)
        ctx.stroke()
      } else if (noise > 0.3) {
        ctx.strokeRect(x - gridSize * 0.25, y - gridSize * 0.25, gridSize * 0.5, gridSize * 0.5)
      }
    }
  }

  ctx.globalAlpha = 1
}

/**
 * Wave pattern generator.
 */
export function generateWaves(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  seed: number,
  color: string
): void {
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    for (let x = 0; x <= canvas.width; x += 5) {
      const y = canvas.height / 2 + Math.sin(x * 0.02 + i) * (20 + i * 10)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

/**
 * Particle pattern generator.
 */
export function generateParticles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  seed: number,
  color: string
): void {
  ctx.globalAlpha = 0.3
  ctx.fillStyle = color

  for (let i = 0; i < 50; i++) {
    const x = seededRandom(seed + i) * canvas.width
    const y = seededRandom(seed + i * 2) * canvas.height
    const size = 2 + seededRandom(seed + i * 3) * 4
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

/**
 * Burning Ship fractal generator.
 * Like Mandelbrot but uses absolute values - creates dramatic ship-like structures.
 */
export function generateBurningShip(
  imageData: ImageData,
  options: FractalGeneratorOptions
): void {
  const { width, height, data } = imageData
  const {
    seed,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY,
    modulationContext
  } = options

  // Resolve common modulated values (includes rotation)
  const { baseHue, saturation, lightness, maxIterations, hueRange, rotation } = resolveCommonOptions(options)

  // Use manual values as BASE, then add seeded variation
  const baseOffsetX = manualOffsetX !== undefined
    ? resolveModulatedValue(seed, manualOffsetX, modulationContext)
    : 0.0
  const baseOffsetY = manualOffsetY !== undefined
    ? resolveModulatedValue(seed, manualOffsetY, modulationContext)
    : -0.5
  const baseZoom = manualZoom !== undefined
    ? resolveModulatedValue(seed, manualZoom, modulationContext)
    : 1.5

  // Add seeded variation (±0.3 for offset, ±0.5 for zoom)
  const offsetX = baseOffsetX + (importedSeededRandom(seed) - 0.5) * 0.6
  const offsetY = baseOffsetY + (importedSeededRandom(seed + 1) - 0.5) * 0.6
  const zoom = baseZoom * (0.7 + importedSeededRandom(seed + 2) * 0.6)  // 70%-130% of base
  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      // Map pixel to centered coordinates
      let coordX = (px / width - 0.5) * 3.5 / zoom
      let coordY = (py / height - 0.5) * 2 / zoom
      
      // Apply rotation to coordinate space
      if (rotation !== 0) {
        const rotated = rotatePoint(coordX, coordY, rotation)
        coordX = rotated.x
        coordY = rotated.y
      }
      
      // Apply offset after rotation
      const x0 = coordX + offsetX
      const y0 = coordY + offsetY

      let x = 0
      let y = 0
      let iteration = 0

      // KEY DIFFERENCE: abs() on x and y BEFORE operations
      while (x * x + y * y <= 4 && iteration < maxIterations) {
        const absX = Math.abs(x)
        const absY = Math.abs(y)
        const xtemp = absX * absX - absY * absY + x0
        y = 2 * absX * absY + y0
        x = xtemp
        iteration++
      }

      const idx = (py * width + px) * 4
      if (iteration === maxIterations) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
      } else {
        const hue = (iteration / maxIterations * hueRange + hueShift) % 360
        const rgb = hslToRgb(hue, saturation, lightness)
        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
      }
      data[idx + 3] = 255
    }
  }
}

/**
 * Tricorn (Mandelbar) fractal generator.
 * Conjugate of Mandelbrot - creates heart-shaped structures with organic tendrils.
 */
export function generateTricorn(
  imageData: ImageData,
  options: FractalGeneratorOptions
): void {
  const { width, height, data } = imageData
  const {
    seed,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY,
    modulationContext
  } = options

  // Resolve common modulated values (includes rotation)
  const { baseHue, saturation, lightness, maxIterations, hueRange, rotation } = resolveCommonOptions(options)

  // Use manual values or generate from seed
  const offsetX = manualOffsetX !== undefined
    ? resolveModulatedValue(seed, manualOffsetX, modulationContext)
    : (importedSeededRandom(seed) - 0.5) * 0.5
  const offsetY = manualOffsetY !== undefined
    ? resolveModulatedValue(seed, manualOffsetY, modulationContext)
    : (importedSeededRandom(seed + 1) - 0.5) * 0.5
  const zoom = manualZoom !== undefined
    ? resolveModulatedValue(seed, manualZoom, modulationContext)
    : 1.5 + importedSeededRandom(seed + 2) * 2
  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      // Map pixel to centered coordinates
      let coordX = (px / width - 0.5) * 3.5 / zoom
      let coordY = (py / height - 0.5) * 2 / zoom
      
      // Apply rotation to coordinate space
      if (rotation !== 0) {
        const rotated = rotatePoint(coordX, coordY, rotation)
        coordX = rotated.x
        coordY = rotated.y
      }
      
      // Apply offset after rotation
      const x0 = coordX + offsetX
      const y0 = coordY + offsetY

      let x = 0
      let y = 0
      let iteration = 0

      // KEY DIFFERENCE: negative sign on y
      while (x * x + y * y <= 4 && iteration < maxIterations) {
        const xtemp = x * x - y * y + x0
        y = -2 * x * y + y0  // Negative sign here
        x = xtemp
        iteration++
      }

      const idx = (py * width + px) * 4
      if (iteration === maxIterations) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
      } else {
        const hue = (iteration / maxIterations * hueRange + hueShift) % 360
        const rgb = hslToRgb(hue, saturation, lightness)
        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
      }
      data[idx + 3] = 255
    }
  }
}
