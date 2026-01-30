// src/audio/visualizer-runner.ts
//
// Extended p5 runner for audio-reactive visualizers.
// Injects frequency band data into p5 sketches automatically.
//

import p5 from 'p5'
import { get, type P5Options } from '../engine/registry'
import { CoordinateHelper, type RendererType } from '../engine/coordinate-helper'
import { AudioAnalyzer, getGlobalAnalyzer, type FrequencyBands, type AnalyzerConfig } from './analyzer'

/**
 * Extended options for visualizer sketches.
 */
export interface VisualizerOptions extends P5Options {
  // Standard injected by runner
  _containerWidth?: number
  _containerHeight?: number
  _container?: HTMLElement
  
  // Audio-specific injected by visualizer runner
  _getAudioData?: () => FrequencyBands
  _analyzer?: AudioAnalyzer
  
  // User-configurable
  sensitivity?: number
  smoothing?: number
  colorMode?: 'spectrum' | 'reactive' | 'theme'
}

/**
 * Track active visualizer instances.
 */
const activeVisualizers = new WeakMap<HTMLElement, {
  instance: p5
  analyzer: AudioAnalyzer
  ownAnalyzer: boolean // true if we created it, false if shared/global
}>()

/**
 * Mount an audio-reactive visualizer sigil.
 * 
 * @param id - Registered sigil ID
 * @param el - Container element
 * @param audioSource - Audio element to analyze
 * @param options - Sigil options
 * @param analyzerConfig - Optional analyzer configuration
 * @returns The p5 instance, or null if sigil not found
 */
export function mountVisualizer(
  id: string,
  el: HTMLElement,
  audioSource: HTMLAudioElement,
  options?: P5Options,
  analyzerConfig?: AnalyzerConfig
): p5 | null {
  if (!el) {
    throw new Error('RadiantForge: mountVisualizer requires a valid HTMLElement')
  }

  const factory = get(id)
  if (!factory) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`RadiantForge: no visualizer registered with id "${id}"`)
    }
    return null
  }

  // Clean up any existing visualizer on this element
  unmountVisualizer(el)

  const width = el.clientWidth || 200
  const height = el.clientHeight || 200
  const renderer: RendererType = (options?.renderer as RendererType) || '2d'

  // Create or get analyzer
  const analyzer = new AudioAnalyzer(analyzerConfig)
  analyzer.connectElement(audioSource)

  // Build enhanced options with audio data getter
  const enhancedOptions: VisualizerOptions = {
    ...options,
    _containerWidth: width,
    _containerHeight: height,
    _container: el,
    _getAudioData: () => analyzer.getFrequencyBands(),
    _analyzer: analyzer,
    renderer,
  }

  const sketch = (p: p5) => {
    // Create coordinate helper and inject it
    const coords = new CoordinateHelper(p, width, height, renderer)
    const optsWithCoords = {
      ...enhancedOptions,
      _coords: coords,
    }
    factory(p, optsWithCoords)
  }

  const instance = new p5(sketch, el)
  
  activeVisualizers.set(el, {
    instance,
    analyzer,
    ownAnalyzer: true,
  })

  // Log renderer type for debugging
  if (import.meta.env?.MODE !== 'production') {
    console.log(`RadiantForge: Mounted visualizer with ${renderer.toUpperCase()} renderer`, { width, height, el })
  }

  return instance
}

/**
 * Mount a visualizer using a shared/global analyzer.
 * Useful when multiple visualizers should react to the same audio.
 * 
 * @param id - Registered visualizer ID
 * @param el - Container element
 * @param analyzer - Shared AudioAnalyzer instance (or uses global if not provided)
 * @param options - Visualizer options
 */
export function mountVisualizerShared(
  id: string,
  el: HTMLElement,
  analyzer?: AudioAnalyzer,
  options?: P5Options
): p5 | null {
  if (!el) {
    throw new Error('RadiantForge: mountVisualizerShared requires a valid HTMLElement')
  }

  const factory = get(id)
  if (!factory) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`RadiantForge: no visualizer registered with id "${id}"`)
    }
    return null
  }

  unmountVisualizer(el)

  const width = el.clientWidth || 200
  const height = el.clientHeight || 200
  const renderer: RendererType = (options?.renderer as RendererType) || '2d'

  // Use provided analyzer or global
  const sharedAnalyzer = analyzer || getGlobalAnalyzer()

  const enhancedOptions: VisualizerOptions = {
    ...options,
    _containerWidth: width,
    _containerHeight: height,
    _container: el,
    _getAudioData: () => sharedAnalyzer.getFrequencyBands(),
    _analyzer: sharedAnalyzer,
    renderer,
  }

  const sketch = (p: p5) => {
    // Create coordinate helper and inject it
    const coords = new CoordinateHelper(p, width, height, renderer)
    const optsWithCoords = {
      ...enhancedOptions,
      _coords: coords,
    }
    factory(p, optsWithCoords)
  }

  const instance = new p5(sketch, el)
  
  activeVisualizers.set(el, {
    instance,
    analyzer: sharedAnalyzer,
    ownAnalyzer: false, // Don't destroy shared analyzer on unmount
  })

  return instance
}

/**
 * Unmount a visualizer and clean up resources.
 */
export function unmountVisualizer(el: HTMLElement | null | undefined): void {
  if (!el) return
  
  const entry = activeVisualizers.get(el)
  if (entry) {
    entry.instance.remove()
    
    // Only destroy analyzer if we own it
    if (entry.ownAnalyzer) {
      entry.analyzer.destroy()
    }
    
    activeVisualizers.delete(el)
  }
}

/**
 * Check if an element has an active visualizer.
 */
export function hasVisualizer(el: HTMLElement | null | undefined): boolean {
  if (!el) return false
  return activeVisualizers.has(el)
}

/**
 * Get the analyzer for an active visualizer.
 */
export function getVisualizerAnalyzer(el: HTMLElement): AudioAnalyzer | null {
  const entry = activeVisualizers.get(el)
  return entry?.analyzer || null
}

/**
 * Resize a mounted visualizer's canvas to match its container dimensions.
 * This uses p5's resizeCanvas() which preserves the instance and audio connection.
 */
export function resizeVisualizer(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const entry = activeVisualizers.get(el);
  if (!entry) return;

  const newWidth = el.clientWidth || 200;
  const newHeight = el.clientHeight || 200;

  // Call p5's resizeCanvas - this preserves the instance and audio connection
  entry.instance.resizeCanvas(newWidth, newHeight);
  
  // Remove aspect-ratio that p5 sets - it prevents proper resizing
  const canvas = entry.instance.canvas;
  if (canvas && canvas.style) {
    canvas.style.aspectRatio = '';
  }
}

