// src/index.ts
//
// Public API surface for RadiantForge.
//
// The idea is that host apps (Vue frontend, later mothership, etc.)
// only import from this file, never from ./engine directly.
//

// === CORE REGISTRY ===
export type {
  P5Options,
  P5Factory,
  SigilOptions,
  SigilFactory,
  VisualizerOptions as VisualizerOptionsRegistry,
  VisualizerFactory,
} from './engine/registry'
export {
  register,
  unregister,
  get,
  has,
  list,
} from './engine/registry'

// === COORDINATE HELPER ===
export type { RendererType } from './engine/coordinate-helper'
export { CoordinateHelper } from './engine/coordinate-helper'

// === P5 RUNNER (mounts p5 sketches to DOM) ===
export {
  mountSigil,
  unmountSigil,
  hasMountedSigil,
  getSigilInstance,
  resizeSigil,
} from './engine/p5-runner'

// === AUDIO ANALYZER ===
export type { FrequencyBands, AnalyzerConfig } from './audio/analyzer'
export {
  AudioAnalyzer,
  getGlobalAnalyzer,
  destroyGlobalAnalyzer,
} from './audio/analyzer'

// === VISUALIZER RUNNER (audio-reactive p5 sketches) ===
export type { VisualizerOptions } from './audio/visualizer-runner'
export {
  mountVisualizer,
  mountVisualizerShared,
  unmountVisualizer,
  hasVisualizer,
  getVisualizerAnalyzer,
  resizeVisualizer,
} from './audio/visualizer-runner'

// === BUILT-IN SIGILS (static/decorative) ===
export { awakeNode001Sigil } from './sigils/awake-node-001'

// === BUILT-IN VISUALIZERS (audio-reactive) ===
export { spectrumBarsVisualizer } from './visualizers/spectrum-bars'
export { gforceFlowVisualizer } from './visualizers/gforce-flow'
export { nebulaFlightVisualizer } from './visualizers/nebula-flight'

// === BOOTSTRAP: register all built-ins ===
import { register } from './engine/registry'
import { awakeNode001Sigil } from './sigils/awake-node-001'
import { spectrumBarsVisualizer } from './visualizers/spectrum-bars'
import { gforceFlowVisualizer } from './visualizers/gforce-flow'
import { nebulaFlightVisualizer } from './visualizers/nebula-flight'

export function registerBuiltins(): void {
  // Static sigils
  register('node-001', awakeNode001Sigil)
  
  // Audio visualizers
  register('spectrum-bars', spectrumBarsVisualizer)
  register('gforce-flow', gforceFlowVisualizer)
  register('nebula-flight', nebulaFlightVisualizer)
}
