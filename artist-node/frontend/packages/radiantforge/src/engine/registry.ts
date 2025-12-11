// src/engine/registry.ts
//
// Generic registry for p5.js sketches (sigils, visualizers, etc.)
//
import type p5 from 'p5'

/**
 * Arbitrary parameter bag for p5 sketches.
 * Later we can tighten this with generics or specific schemas.
 */
export type P5Options = Record<string, unknown>

/**
 * A P5Factory is a function that receives a p5 instance
 * and optional options, and is responsible for configuring
 * p.setup / p.draw / etc.
 *
 * This is the function you pass to `new p5(...)`.
 */
export type P5Factory = (p: p5, options?: P5Options) => void

// Legacy type aliases (still used by sigil/visualizer files)
export type SigilOptions = P5Options
export type SigilFactory = P5Factory

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
