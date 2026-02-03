/**
 * Modulation system for generative thumbnails.
 * Pattern-agnostic - works with any numerical parameter.
 *
 * Core concept: ModulatedValue can be either a static number or a modulator config.
 * This allows any parameter (zoom, hue, particle count, etc.) to be dynamically varied.
 */

import { ModulatorConfig, ModulatedValue, ModulationContext } from './types'

/**
 * Seeded random (0-1) - deterministic based on seed.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Resolve a modulated value to a concrete number.
 * If value is a number, return as-is.
 * If value is a modulator config, apply modulation.
 *
 * This is the main entry point for all modulation logic.
 */
export function resolveModulatedValue(
  seed: number,
  value: ModulatedValue,
  context?: ModulationContext
): number {
  // If static number, return as-is
  if (typeof value === 'number') return value

  // Apply modulation
  const { modulator } = value
  return applyModulator(seed, modulator, context)
}

/**
 * Apply a modulator to generate a value based on seed.
 */
function applyModulator(
  seed: number,
  config: ModulatorConfig,
  context?: ModulationContext
): number {
  const { type, min, max, frequency = 1.0, steps, curve = 1.0, phase = 0 } = config

  switch (type) {
    case 'sine_wave':
      return sineWaveModulator(seed, min, max, frequency, phase)

    case 'cosine_wave':
      return cosineWaveModulator(seed, min, max, frequency, phase)

    case 'linear_ramp':
      return linearRampModulator(seed, min, max, context?.index, context?.total)

    case 'random':
      return randomModulator(seed, min, max)

    case 'step':
      return stepModulator(seed, steps || [min, max])

    case 'exponential':
      return exponentialModulator(seed, min, max, curve)

    case 'sawtooth':
      return sawtoothModulator(seed, min, max, frequency, phase)

    case 'triangle':
      return triangleModulator(seed, min, max, frequency, phase)

    default:
      console.warn(`[Modulators] Unknown modulator type: ${type}, returning min value`)
      return min
  }
}

// ============================================================================
// MODULATOR IMPLEMENTATIONS
// ============================================================================

/**
 * Sine wave modulator: smooth oscillation between min and max.
 * Frequency controls how many cycles occur per unit seed.
 * Phase offsets the wave (0-1 = 0-2π radians).
 *
 * Use case: Breathing zoom, cyclical color shifts, organic variation.
 */
function sineWaveModulator(
  seed: number,
  min: number,
  max: number,
  frequency: number,
  phase: number
): number {
  const t = (seed * frequency + phase * Math.PI * 2) % (Math.PI * 2)
  const normalized = (Math.sin(t) + 1) / 2  // 0-1
  return min + normalized * (max - min)
}

/**
 * Cosine wave modulator: sine wave shifted by 90 degrees.
 * Starts at max instead of middle.
 *
 * Use case: Same as sine but different phase relationship.
 */
function cosineWaveModulator(
  seed: number,
  min: number,
  max: number,
  frequency: number,
  phase: number
): number {
  const t = (seed * frequency + phase * Math.PI * 2) % (Math.PI * 2)
  const normalized = (Math.cos(t) + 1) / 2  // 0-1
  return min + normalized * (max - min)
}

/**
 * Linear ramp modulator: smooth progression from min to max.
 * If index/total provided (collection context), uses position in collection.
 * Otherwise uses seeded random for position.
 *
 * Use case: Progressive evolution across discography, track 1→N darkens/zooms/rotates.
 */
function linearRampModulator(
  seed: number,
  min: number,
  max: number,
  index?: number,
  total?: number
): number {
  let t: number

  if (index !== undefined && total !== undefined && total > 0) {
    // Use position in collection
    t = index / total
  } else {
    // Use seeded random
    t = seededRandom(seed)
  }

  return min + t * (max - min)
}

/**
 * Random modulator: uniform random distribution between min and max.
 * Deterministic based on seed.
 *
 * Use case: Maximum chaos, unpredictable variation (current default behavior).
 */
function randomModulator(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min)
}

/**
 * Step modulator: discrete values from array.
 * Like a step sequencer in music production.
 *
 * Use case: Specific color palette, discrete zoom levels, quantized parameters.
 */
function stepModulator(seed: number, steps: number[]): number {
  if (steps.length === 0) return 0
  const index = Math.floor(seededRandom(seed) * steps.length)
  return steps[index]
}

/**
 * Exponential modulator: non-linear distribution between min and max.
 * curve > 1: slow start, fast end (ease-in)
 * curve < 1: fast start, slow end (ease-out)
 * curve = 1: linear (same as linear_ramp)
 *
 * Use case: Accelerating zoom, exponential color shifts, dramatic evolution.
 */
function exponentialModulator(
  seed: number,
  min: number,
  max: number,
  curve: number
): number {
  const t = seededRandom(seed)
  const curved = Math.pow(t, curve)
  return min + curved * (max - min)
}

/**
 * Sawtooth modulator: linear ramp that resets (0→1→0→1...).
 * Frequency controls how many cycles occur per unit seed.
 *
 * Use case: Repeating patterns, rhythmic variation.
 */
function sawtoothModulator(
  seed: number,
  min: number,
  max: number,
  frequency: number,
  phase: number
): number {
  const t = ((seed * frequency + phase) % 1)  // 0-1 sawtooth
  return min + t * (max - min)
}

/**
 * Triangle modulator: smooth up-and-down ramp (0→1→0→1...).
 * Like a sine wave but linear slopes instead of curves.
 *
 * Use case: Smooth cyclical variation with linear slopes.
 */
function triangleModulator(
  seed: number,
  min: number,
  max: number,
  frequency: number,
  phase: number
): number {
  const t = ((seed * frequency + phase) % 1)  // 0-1
  const triangle = t < 0.5 ? t * 2 : 2 - t * 2  // 0→1→0
  return min + triangle * (max - min)
}
