/**
 * Fractal pattern generators for Canvas 2D thumbnails.
 */

/**
 * Seeded random number generator (0-1).
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
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
  baseHue: number
  saturation: number
  lightness: number
  maxIterations: number
  hueRange: number
  zoom?: number
  offsetX?: number
  offsetY?: number
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
    baseHue,
    saturation,
    lightness,
    maxIterations,
    hueRange,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY
  } = options

  // Use manual values or generate from seed
  const offsetX = manualOffsetX !== undefined ? manualOffsetX : (seededRandom(seed) - 0.5) * 0.5
  const offsetY = manualOffsetY !== undefined ? manualOffsetY : (seededRandom(seed + 1) - 0.5) * 0.5
  const zoom = manualZoom !== undefined ? manualZoom : 1.5 + seededRandom(seed + 2) * 2
  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      const x0 = (px / width - 0.5) * 3.5 / zoom + offsetX
      const y0 = (py / height - 0.5) * 2 / zoom + offsetY

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
    baseHue,
    saturation,
    lightness,
    maxIterations,
    hueRange,
    zoom: manualZoom,
    offsetX: manualOffsetX,
    offsetY: manualOffsetY
  } = options

  // Use manual values or generate from seed
  const offsetX = manualOffsetX !== undefined ? manualOffsetX : (seededRandom(seed) - 0.5) * 0.5
  const offsetY = manualOffsetY !== undefined ? manualOffsetY : (seededRandom(seed + 1) - 0.5) * 0.5
  const zoom = manualZoom !== undefined ? manualZoom : 1.5 + seededRandom(seed + 2) * 2
  const hueShift = baseHue

  const cRe = -0.7 + offsetX
  const cIm = 0.27015 + offsetY

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      let zRe = (px / width - 0.5) * 3 / zoom
      let zIm = (py / height - 0.5) * 2 / zoom

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
    baseHue,
    saturation,
    lightness,
    hueRange
  } = options

  const hueShift = baseHue

  for (let px = 0; px < width; px++) {
    for (let py = 0; py < height; py++) {
      const x = px / width
      const y = py / height

      // Multi-octave noise
      let value = 0
      let amplitude = 1
      let frequency = 2 + seededRandom(seed + 4) * 4

      for (let octave = 0; octave < 4; octave++) {
        value += seededNoise(x * frequency + seed, y * frequency + seed) * amplitude
        frequency *= 2
        amplitude *= 0.5
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
