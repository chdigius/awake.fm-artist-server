// src/index.ts
//
// Public API surface for Pixelforge.
//
// The idea is that host apps (Vue frontend, later mothership, etc.)
// only import from this file, never from ./engine directly.
//

// === CORE REGISTRY ===
export type { P5Options, P5Factory } from './engine/registry'
export {
  register,
  unregister,
  get,
  has,
  list,
} from './engine/registry'

// === P5 RUNNER (mounts p5 sketches to DOM) ===
export {
  mountSigil,
  unmountSigil,
  hasMountedSigil,
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
} from './audio/visualizer-runner'

// === BUILT-IN SIGILS (static/decorative) ===
export { awakeNode001Sigil } from './sigils/awake-node-001'

// === BUILT-IN VISUALIZERS (audio-reactive) ===
export { spectrumBarsSigil } from './visualizers/spectrum-bars'
export { gforceFlowSigil } from './visualizers/gforce-flow'

// === BOOTSTRAP: register all built-ins ===
import { register } from './engine/registry'
import { awakeNode001Sigil } from './sigils/awake-node-001'
import { spectrumBarsSigil } from './visualizers/spectrum-bars'
import { gforceFlowSigil } from './visualizers/gforce-flow'

export function registerBuiltins(): void {
  // Static sigils
  register('node-001', awakeNode001Sigil)
  
  // Audio visualizers
  register('spectrum-bars', spectrumBarsSigil)
  register('gforce-flow', gforceFlowSigil)
}
