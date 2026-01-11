// src/composables/useEffects.ts
import { ref } from 'vue'

/**
 * Effect name as defined in _meta.yaml -> CSS class name(s)
 * 
 * Maps short effect names to the actual CSS classes defined in
 * frontend/packages/css-core/effects/
 */
const EFFECTS_REGISTRY: Record<string, string[]> = {
  // CRT monitor effects
  'crt': ['fx-crt'],
  'scanlines': ['fx-crt'],  // alias

  // Chromatic aberration (color fringing)
  'chroma': ['fx-chroma'],
  'chromatic': ['fx-chroma'],  // alias
  'chromatic-aberration': ['fx-chroma'],  // full name alias
  'chroma-block': ['fx-chroma-block'],

  // VHS tape effects (combine CRT + chroma + grain)
  'vhs': ['fx-crt', 'fx-chroma', 'fx-grain'],

  // Glow effects
  'glow': ['fx-glow'],
  'glow-block': ['fx-glow-block'],

  // Film grain
  'grain': ['fx-grain'],
  'film-grain': ['fx-grain'],  // alias
}

// All possible effect CSS classes (for cleanup)
const ALL_EFFECT_CLASSES = [
  'fx-crt',
  'fx-chroma',
  'fx-chroma-block',
  'fx-glow',
  'fx-glow-block',
  'fx-grain',
]

// Currently active effects
const activeEffects = ref<string[]>([])

/**
 * Resolve effect names from meta to CSS classes
 */
function resolveEffectClasses(effects: string[]): string[] {
  const classes: string[] = []
  
  for (const effect of effects) {
    const mapped = EFFECTS_REGISTRY[effect]
    if (mapped) {
      classes.push(...mapped)
    } else {
      // Unknown effect - log warning but don't break
      console.warn(`[useEffects] Unknown effect: "${effect}"`)
    }
  }
  
  return classes
}

/**
 * Apply effect classes to document.documentElement (same level as theme)
 */
function applyEffectsToDocument(classes: string[]): void {
  // Remove all existing effect classes
  document.documentElement.classList.remove(...ALL_EFFECT_CLASSES)
  
  // Add new effect classes
  if (classes.length > 0) {
    document.documentElement.classList.add(...classes)
  }
}

/**
 * Composable for managing per-node visual effects.
 * Maps effect names from page meta to CSS classes applied to <html>.
 */
export function useEffects() {
  /**
   * Get CSS classes for the given effects array
   */
  function getEffectClasses(effects: string[] | undefined | null): string[] {
    if (!effects || effects.length === 0) {
      return []
    }
    return resolveEffectClasses(effects)
  }

  /**
   * Apply effects from page meta to document.documentElement
   * Same pattern as useTheme - effects are applied at the <html> level
   */
  function applyPageEffects(pageMeta: { effects?: string[] } | null | undefined): void {
    const effects = pageMeta?.effects ?? []
    activeEffects.value = effects
    
    const classes = getEffectClasses(effects)
    applyEffectsToDocument(classes)
  }

  return {
    activeEffects,
    getEffectClasses,
    applyPageEffects,
    EFFECTS_REGISTRY,
  }
}

