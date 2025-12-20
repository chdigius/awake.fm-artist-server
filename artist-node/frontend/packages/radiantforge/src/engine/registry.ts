// src/engine/registry.ts
//
// Generic registry for p5.js sketches (sigils, visualizers, etc.)
//
import type p5 from 'p5'
import type { RendererType } from './coordinate-helper'

/**
 * Base options for p5 sketches.
 * Extended by specific sigil/visualizer options.
 */
export interface P5Options {
  /** Renderer type: '2d' (CPU) or 'webgl' (GPU). Defaults to '2d'. */
  renderer?: RendererType
  [key: string]: unknown
}

/**
 * Options for static sigils (identity graphics, logos, etc.)
 */
export interface SigilOptions extends P5Options {
  // Sigil-specific options can be added here
  seed?: number
  variant?: string
  accentColor?: string
}

/**
 * Options for audio-reactive visualizers.
 */
export interface VisualizerOptions extends P5Options {
  // Visualizer-specific options can be added here
  sensitivity?: number
  [key: string]: unknown
}

/**
 * A P5Factory is a function that receives a p5 instance
 * and optional options, and is responsible for configuring
 * p.setup / p.draw / etc.
 *
 * This is the function you pass to `new p5(...)`.
 */
export type P5Factory = (p: p5, options?: P5Options) => void

/**
 * Factory function for static sigils.
 */
export type SigilFactory = (p: p5, options?: SigilOptions) => void

/**
 * Factory function for audio-reactive visualizers.
 */
export type VisualizerFactory = (p: p5, options?: VisualizerOptions) => void

const registry = new Map<string, P5Factory>()

/**
 * Register (or overwrite) a p5 sketch by id.
 * Works for both sigils and visualizers.
 * 
 * Example:
 *   register('node-001', (p) => { ... })
 *   register('spectrum-bars', (p, opts) => { ... })
 */
export function register(id: string, factory: P5Factory): void {
  if (!id) {
    throw new Error('RadiantForge: register requires a non-empty id')
  }
  registry.set(id, factory)
}

/**
 * Retrieve a p5 factory by id.
 */
export function get(id: string): P5Factory | undefined {
  return registry.get(id)
}

/**
 * Check if an id exists in the registry.
 */
export function has(id: string): boolean {
  return registry.has(id)
}

/**
 * Remove a sketch from the registry.
 */
export function unregister(id: string): void {
  registry.delete(id)
}

/**
 * List all registered ids.
 * Handy for debugging or tooling.
 */
export function list(): string[] {
  return Array.from(registry.keys())
}
