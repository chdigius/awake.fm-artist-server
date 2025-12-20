// src/engine/coordinate-helper.ts
//
// Coordinate system abstraction for p5.js 2D vs WebGL rendering.
// Allows sketches to be written once and work with both renderers.
//

import type p5 from 'p5'

export type RendererType = '2d' | 'webgl'

/**
 * Helper class that abstracts coordinate system differences between 2D and WebGL.
 * 
 * 2D renderer: origin at top-left (0, 0), y-axis down
 * WebGL renderer: origin at center (0, 0), y-axis up
 * 
 * This helper provides a consistent "canvas space" API where:
 * - Origin is always top-left
 * - Y-axis always goes down
 * - Coordinates are automatically translated for the active renderer
 */
export class CoordinateHelper {
  private p: p5
  private isWebGL: boolean

  constructor(p: p5, width: number, height: number, renderer: RendererType) {
    this.p = p
    this.isWebGL = renderer === 'webgl'
    // Note: We don't store width/height - we read from p.width/p.height directly
    // so it's always current after canvas resizes
  }

  /**
   * Convert canvas-space X coordinate to renderer-space
   */
  x(canvasX: number): number {
    return this.isWebGL ? canvasX - this.p.width / 2 : canvasX
  }

  /**
   * Convert canvas-space Y coordinate to renderer-space
   */
  y(canvasY: number): number {
    return this.isWebGL ? -(canvasY - this.p.height / 2) : canvasY
  }

  /**
   * Get the center point in renderer-space
   */
  center(): { x: number; y: number } {
    return this.isWebGL 
      ? { x: 0, y: 0 } 
      : { x: this.p.width / 2, y: this.p.height / 2 }
  }

  /**
   * Get the origin (top-left) coordinates in renderer-space.
   * Useful for operations like image() that need to know where (0,0) is.
   * 
   * WebGL: returns (-width/2, -height/2) because origin is at center
   * 2D: returns (0, 0) because origin is already at top-left
   */
  getOrigin(): { x: number; y: number } {
    return this.isWebGL
      ? { x: -this.p.width / 2, y: -this.p.height / 2 }
      : { x: 0, y: 0 }
  }

  /**
   * Get canvas dimensions (read from p5 instance, always current)
   */
  get w(): number {
    return this.p.width
  }

  get h(): number {
    return this.p.height
  }

  /**
   * Check if using WebGL renderer
   */
  get usingWebGL(): boolean {
    return this.isWebGL
  }

  /**
   * Translate to a canvas-space position
   * Useful for setting up coordinate system at start of draw()
   */
  applyTransform(): void {
    if (this.isWebGL) {
      // In WebGL, translate to top-left and flip Y axis
      this.p.translate(-this.p.width / 2, -this.p.height / 2)
      this.p.scale(1, -1)
    }
    // In 2D, no transform needed (already top-left origin)
  }

  /**
   * Reset transform (call at end of draw if you used applyTransform)
   */
  resetTransform(): void {
    if (this.isWebGL) {
      this.p.resetMatrix()
    }
  }
}

