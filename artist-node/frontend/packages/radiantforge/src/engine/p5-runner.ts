// src/engine/p5-runner.ts
//
// Mounts p5.js sketches (sigils, visualizers) to DOM elements.
//
import p5 from 'p5'
import { get, type P5Options } from './registry'

/**
 * Track active p5 instances by their host element.
 * WeakMap so garbage collection can do its thing.
 */
const activeInstances = new WeakMap<HTMLElement, p5>()

/**
 * Mount a p5 sketch into the given element.
 *
 * - `id` must have been registered via register()
 * - `el` is the host container (RadiantForge will create a canvas inside)
 * - `options` are forwarded to the P5Factory
 *
 * Returns the created p5 instance, or null if id not found.
 */
export function mountSigil(
  id: string,
  el: HTMLElement,
  options?: P5Options
): p5 | null {
  if (!el) {
    throw new Error('RadiantForge: mountSigil requires a valid HTMLElement')
  }

  const factory = get(id)
  if (!factory) {
    if (import.meta.env?.MODE !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`RadiantForge: no sketch registered with id "${id}"`)
    }
    return null
  }

  // If there's already an instance on this element, clean it up first.
  unmountSigil(el)

  // Inject container dimensions into options so sketches can size correctly
  const enhancedOptions: P5Options = {
    ...options,
    _containerWidth: el.clientWidth || 200,
    _containerHeight: el.clientHeight || 200,
    _container: el,
  }

  const sketch = (p: p5) => {
    factory(p, enhancedOptions)
  }

  const instance = new p5(sketch, el)
  activeInstances.set(el, instance)
  return instance
}

/**
 * Unmount (remove) any sigil currently attached to the given element.
 * Safe to call multiple times.
 */
export function unmountSigil(el: HTMLElement | null | undefined): void {
  if (!el) return
  const instance = activeInstances.get(el)
  if (instance) {
    instance.remove()
    activeInstances.delete(el)
  }
}

/**
 * Convenience: check if an element currently has an active sigil.
 */
export function hasMountedSigil(el: HTMLElement | null | undefined): boolean {
  if (!el) return false
  return activeInstances.has(el)
}

/**
 * Get the p5 instance for a mounted sigil.
 * Useful for calling p5 methods like resizeCanvas().
 */
export function getSigilInstance(el: HTMLElement | null | undefined): p5 | null {
  if (!el) return null
  return activeInstances.get(el) || null
}

/**
 * Resize a mounted sigil's canvas to match its container dimensions.
 * This uses p5's resizeCanvas() which preserves the instance and all state.
 */
export function resizeSigil(el: HTMLElement | null | undefined): void {
  if (!el) return
  const instance = activeInstances.get(el)
  if (!instance) return

  const newWidth = el.clientWidth || 200
  const newHeight = el.clientHeight || 200

  // Call p5's resizeCanvas - this preserves the instance and state
  instance.resizeCanvas(newWidth, newHeight)
}
