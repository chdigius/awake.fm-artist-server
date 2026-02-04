/**
 * Transform system for generative thumbnails.
 * Pattern-agnostic - works with any canvas-based generator.
 *
 * Transforms are applied AFTER pattern generation to modify spatial presentation.
 * Think of them as post-processing effects like rotation, scale, skew.
 */

import { Transform } from './types'
import { resolveModulatedValue } from './modulators'

/**
 * Apply a list of transforms to a canvas context.
 * Transforms are applied in order (first to last).
 * 
 * NOTE: Transforms are applied to the CURRENT context state and will persist
 * until save/restore is called by the caller. This allows transforms to affect
 * subsequent drawImage calls.
 * 
 * @param ctx - Canvas 2D context
 * @param transforms - Array of transform configs
 * @param seed - Seed for modulated values
 * @param width - Canvas width (for centering)
 * @param height - Canvas height (for centering)
 */
export function applyTransforms(
  ctx: CanvasRenderingContext2D,
  transforms: Transform[],
  seed: number,
  width: number,
  height: number
): void {
  // Apply each transform in sequence
  // NO save/restore here - let the caller manage state!
  for (const transform of transforms) {
    applyTransform(ctx, transform, seed, width, height)
  }
}

/**
 * Apply a single transform to canvas context.
 */
function applyTransform(
  ctx: CanvasRenderingContext2D,
  transform: Transform,
  seed: number,
  width: number,
  height: number
): void {
  switch (transform.type) {
    case 'rotate':
      applyRotate(ctx, transform, seed, width, height)
      break
    case 'scale':
      applyScale(ctx, transform, seed, width, height)
      break
    case 'skew':
      applySkew(ctx, transform, seed)
      break
    case 'translate':
      applyTranslate(ctx, transform, seed)
      break
    case 'matrix':
      applyMatrix(ctx, transform, seed)
      break
    default:
      console.warn(`[Transforms] Unknown transform type: ${(transform as any).type}`)
  }
}

/**
 * Apply rotation transform.
 * Rotates around specified origin (default: canvas center).
 */
function applyRotate(
  ctx: CanvasRenderingContext2D,
  transform: { angle: any; origin?: { x: number; y: number } },
  seed: number,
  width: number,
  height: number
): void {
  const angle = resolveModulatedValue(seed, transform.angle)


  // Rotate around center
  // Move origin to center
  ctx.translate(width / 2, height / 2)
  // Rotate
  ctx.rotate(angle * Math.PI / 180)
  // Move origin back so we can draw from top-left
  ctx.translate(-width / 2, -height / 2)
}

/**
 * Apply scale transform.
 * Scales around specified origin (default: canvas center).
 */
function applyScale(
  ctx: CanvasRenderingContext2D,
  transform: { x?: any; y?: any; origin?: { x: number; y: number } },
  seed: number,
  width: number,
  height: number
): void {
  const scaleX = resolveModulatedValue(seed, transform.x ?? 1.0)
  const scaleY = resolveModulatedValue(seed, transform.y ?? 1.0)


  // Scale around center
  ctx.translate(width / 2, height / 2)
  ctx.scale(scaleX, scaleY)
  ctx.translate(-width / 2, -height / 2)
}

/**
 * Apply skew transform (parallelogram effect).
 * Creates motion lines or 3D perspective illusion.
 */
function applySkew(
  ctx: CanvasRenderingContext2D,
  transform: { x?: any; y?: any },
  seed: number
): void {
  const skewX = resolveModulatedValue(seed, transform.x ?? 0)
  const skewY = resolveModulatedValue(seed, transform.y ?? 0)

  // Apply skew using transform matrix
  // [1, skewY, skewX, 1, 0, 0]
  ctx.transform(1, skewY, skewX, 1, 0, 0)
}

/**
 * Apply translation transform (positional offset).
 * Shifts the entire pattern horizontally/vertically.
 */
function applyTranslate(
  ctx: CanvasRenderingContext2D,
  transform: { x?: any; y?: any },
  seed: number
): void {
  const tx = resolveModulatedValue(seed, transform.x ?? 0)
  const ty = resolveModulatedValue(seed, transform.y ?? 0)

  ctx.translate(tx, ty)
}

/**
 * Apply custom transformation matrix.
 * Advanced: allows arbitrary 2D affine transformations.
 * 
 * Matrix format: [a, b, c, d, e, f]
 * a = horizontal scaling
 * b = horizontal skewing
 * c = vertical skewing
 * d = vertical scaling
 * e = horizontal translation
 * f = vertical translation
 */
function applyMatrix(
  ctx: CanvasRenderingContext2D,
  transform: { a: any; b: any; c: any; d: any; e: any; f: any },
  seed: number
): void {
  const a = resolveModulatedValue(seed, transform.a)
  const b = resolveModulatedValue(seed, transform.b)
  const c = resolveModulatedValue(seed, transform.c)
  const d = resolveModulatedValue(seed, transform.d)
  const e = resolveModulatedValue(seed, transform.e)
  const f = resolveModulatedValue(seed, transform.f)

  ctx.transform(a, b, c, d, e, f)
}
