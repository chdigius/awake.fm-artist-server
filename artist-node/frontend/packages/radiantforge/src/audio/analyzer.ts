// src/audio/analyzer.ts
//
// Audio Analyzer Service
// Wraps Web Audio API to provide frequency band data for visualizers.
//

/**
 * Processed frequency data broken into useful bands for visualization.
 */
export interface FrequencyBands {
  /** 20-60 Hz - kick drums, sub bass */
  sub: number
  /** 60-250 Hz - bass guitar, low synths */
  bass: number
  /** 250-500 Hz - warmth, body */
  lowMid: number
  /** 500-2000 Hz - vocals, snare */
  mid: number
  /** 2000-4000 Hz - presence, clarity */
  highMid: number
  /** 4000-20000 Hz - cymbals, air, brilliance */
  high: number
  
  /** Overall RMS volume level (0-1) */
  volume: number
  /** Current peak level (0-1) */
  peak: number
  
  /** Beat detected this frame */
  beat: boolean
  /** Beat intensity when detected (0-1) */
  beatIntensity: number
  /** Milliseconds since last beat */
  timeSinceBeat: number
}

/**
 * Configuration for the audio analyzer.
 */
export interface AnalyzerConfig {
  /** FFT size (power of 2, default 2048) */
  fftSize?: number
  /** Smoothing time constant (0-1, default 0.8) */
  smoothingTimeConstant?: number
  /** Beat detection threshold (0-1, default 0.6) */
  beatThreshold?: number
  /** Minimum ms between beats (default 200) */
  beatCooldown?: number
}

const DEFAULT_CONFIG: Required<AnalyzerConfig> = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  beatThreshold: 0.6,
  beatCooldown: 200,
}

/**
 * AudioAnalyzer wraps Web Audio API to provide real-time frequency analysis.
 * 
 * Usage:
 *   const analyzer = new AudioAnalyzer()
 *   analyzer.connectElement(audioElement)
 *   // In animation loop:
 *   const bands = analyzer.getFrequencyBands()
 */
export class AudioAnalyzer {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null
  private frequencyData: Uint8Array = new Uint8Array(0)
  private config: Required<AnalyzerConfig>
  
  // Beat detection state
  private lastBeatTime = 0
  private beatDetected = false
  private beatIntensity = 0
  
  // Track connected element to prevent double-connection
  private connectedElement: HTMLAudioElement | null = null

  constructor(config?: AnalyzerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Connect to an HTML audio element.
   * Safe to call multiple times - will reuse existing connection.
   * 
   * Note: Due to browser autoplay policy, the AudioContext won't actually
   * start until ensureResumed() is called after a user gesture (e.g., play button click).
   */
  connectElement(audio: HTMLAudioElement): void {
    // Already connected to this element
    if (this.connectedElement === audio && this.context) {
      return
    }

    // Disconnect previous if different element
    if (this.connectedElement && this.connectedElement !== audio) {
      this.disconnect()
    }

    // Store the element but don't create context yet (autoplay policy)
    this.connectedElement = audio
  }

  /**
   * Actually initialize the AudioContext and connect to the audio element.
   * Call this after a user gesture (e.g., when play button is clicked).
   */
  ensureResumed(): void {
    if (!this.connectedElement) return
    
    // Already fully connected
    if (this.analyser && this.context?.state === 'running') return

    // Create audio context on first call
    if (!this.context) {
      this.context = new AudioContext()
    }

    // Resume context if suspended (autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume()
    }

    // Only create analyser/source once
    if (!this.analyser) {
      // Create analyser node
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = this.config.fftSize
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant

      // Create source from audio element
      this.source = this.context.createMediaElementSource(this.connectedElement)
      this.source.connect(this.analyser)
      this.analyser.connect(this.context.destination)

      // Initialize frequency data array
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    }
  }

  /**
   * Connect to a media stream (e.g., microphone input).
   */
  connectStream(stream: MediaStream): void {
    this.disconnect()

    if (!this.context) {
      this.context = new AudioContext()
    }

    if (this.context.state === 'suspended') {
      this.context.resume()
    }

    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = this.config.fftSize
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant

    this.source = this.context.createMediaStreamSource(stream)
    this.source.connect(this.analyser)
    // Don't connect to destination for mic input (feedback!)

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  /**
   * Disconnect and clean up.
   */
  disconnect(): void {
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    this.connectedElement = null
    // Keep context alive for reconnection
  }

  /**
   * Fully destroy the analyzer, including the AudioContext.
   */
  destroy(): void {
    this.disconnect()
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }

  /**
   * Get raw frequency data (0-255 per bin).
   */
  getRawFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData)
    }
    return this.frequencyData
  }

  /**
   * Get processed frequency bands (0-1 normalized).
   * Call this every frame in your visualizer.
   */
  getFrequencyBands(): FrequencyBands {
    if (!this.analyser) {
      return this.emptyBands()
    }

    this.analyser.getByteFrequencyData(this.frequencyData)
    
    const sampleRate = this.context?.sampleRate || 44100
    const binCount = this.frequencyData.length
    const binSize = sampleRate / (binCount * 2) // Hz per bin

    // Calculate band averages
    const sub = this.getAverageInRange(20, 60, binSize)
    const bass = this.getAverageInRange(60, 250, binSize)
    const lowMid = this.getAverageInRange(250, 500, binSize)
    const mid = this.getAverageInRange(500, 2000, binSize)
    const highMid = this.getAverageInRange(2000, 4000, binSize)
    const high = this.getAverageInRange(4000, 20000, binSize)

    // Calculate overall volume (RMS-ish)
    let sum = 0
    let peak = 0
    for (let i = 0; i < this.frequencyData.length; i++) {
      const val = this.frequencyData[i] / 255
      sum += val * val
      if (val > peak) peak = val
    }
    const volume = Math.sqrt(sum / this.frequencyData.length)

    // Beat detection (based on bass + sub energy spike)
    const now = performance.now()
    const bassEnergy = (sub + bass) / 2
    const timeSinceBeat = now - this.lastBeatTime
    
    if (
      bassEnergy > this.config.beatThreshold &&
      timeSinceBeat > this.config.beatCooldown
    ) {
      this.beatDetected = true
      this.beatIntensity = bassEnergy
      this.lastBeatTime = now
    } else {
      this.beatDetected = false
    }

    return {
      sub,
      bass,
      lowMid,
      mid,
      highMid,
      high,
      volume,
      peak,
      beat: this.beatDetected,
      beatIntensity: this.beatIntensity,
      timeSinceBeat,
    }
  }

  /**
   * Get average amplitude in a frequency range (normalized 0-1).
   */
  private getAverageInRange(minHz: number, maxHz: number, binSize: number): number {
    const minBin = Math.floor(minHz / binSize)
    const maxBin = Math.min(Math.ceil(maxHz / binSize), this.frequencyData.length - 1)
    
    if (minBin >= maxBin) return 0
    
    let sum = 0
    for (let i = minBin; i <= maxBin; i++) {
      sum += this.frequencyData[i]
    }
    
    return (sum / (maxBin - minBin + 1)) / 255
  }

  /**
   * Return empty bands when not connected.
   */
  private emptyBands(): FrequencyBands {
    return {
      sub: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      high: 0,
      volume: 0,
      peak: 0,
      beat: false,
      beatIntensity: 0,
      timeSinceBeat: Infinity,
    }
  }

  /**
   * Check if currently connected and active.
   */
  isConnected(): boolean {
    return this.analyser !== null && this.context !== null
  }

  /**
   * Get the AudioContext (for advanced use cases).
   */
  getContext(): AudioContext | null {
    return this.context
  }
}

// === Singleton instance for simple use cases ===

let globalAnalyzer: AudioAnalyzer | null = null

/**
 * Get or create a global AudioAnalyzer instance.
 * Useful when you only have one audio source.
 */
export function getGlobalAnalyzer(config?: AnalyzerConfig): AudioAnalyzer {
  if (!globalAnalyzer) {
    globalAnalyzer = new AudioAnalyzer(config)
  }
  return globalAnalyzer
}

/**
 * Destroy the global analyzer instance.
 */
export function destroyGlobalAnalyzer(): void {
  if (globalAnalyzer) {
    globalAnalyzer.destroy()
    globalAnalyzer = null
  }
}

