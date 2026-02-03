/**
 * Shared types for modulation and transformation systems.
 * Pattern-agnostic - works with fractals, geometric patterns, or any future generator.
 */

// ============================================================================
// MODULATORS
// ============================================================================

export type ModulatorType =
  | 'sine_wave'
  | 'cosine_wave'
  | 'linear_ramp'
  | 'random'
  | 'step'
  | 'exponential'
  | 'sawtooth'
  | 'triangle'

export interface ModulatorConfig {
  type: ModulatorType
  min: number
  max: number
  frequency?: number      // For wave modulators (sine, cosine, sawtooth, triangle)
  steps?: number[]        // For step sequencer
  curve?: number          // For exponential (>1 = ease-in, <1 = ease-out)
  phase?: number          // Phase offset (0-1) for wave modulators
}

/**
 * A value that can either be static (number) or modulated (config object).
 * This is the core pattern-agnostic type that enables any parameter to be modulated.
 */
export type ModulatedValue = number | { modulator: ModulatorConfig }

// ============================================================================
// TRANSFORMS
// ============================================================================

export type TransformType =
  | 'rotate'
  | 'scale'
  | 'skew'
  | 'translate'
  | 'matrix'  // Advanced: custom transformation matrix

export interface RotateTransform {
  type: 'rotate'
  angle: ModulatedValue  // degrees
  origin?: { x: number; y: number }  // rotation center (default: canvas center)
}

export interface ScaleTransform {
  type: 'scale'
  x?: ModulatedValue     // horizontal scale (default: 1.0)
  y?: ModulatedValue     // vertical scale (default: 1.0)
  origin?: { x: number; y: number }  // scale center (default: canvas center)
}

export interface SkewTransform {
  type: 'skew'
  x?: ModulatedValue     // horizontal skew
  y?: ModulatedValue     // vertical skew
}

export interface TranslateTransform {
  type: 'translate'
  x?: ModulatedValue     // horizontal offset (pixels)
  y?: ModulatedValue     // vertical offset (pixels)
}

export interface MatrixTransform {
  type: 'matrix'
  a: ModulatedValue      // horizontal scaling
  b: ModulatedValue      // horizontal skewing
  c: ModulatedValue      // vertical skewing
  d: ModulatedValue      // vertical scaling
  e: ModulatedValue      // horizontal translation
  f: ModulatedValue      // vertical translation
}

export type Transform =
  | RotateTransform
  | ScaleTransform
  | SkewTransform
  | TranslateTransform
  | MatrixTransform

// ============================================================================
// GENERATOR OPTIONS (pattern-agnostic base)
// ============================================================================

export interface GeneratorBaseOptions {
  seed: number
  width: number
  height: number
  transforms?: Transform[]
}

// ============================================================================
// MODULATION CONTEXT
// ============================================================================

/**
 * Optional context for modulators that need collection-level information.
 */
export interface ModulationContext {
  index?: number         // Current item index in collection (0-based)
  total?: number         // Total items in collection
}
