// src/composables/useTheme.ts
import { ref } from 'vue'

export type ThemeName = 'dark' | 'vapor' | 'crt' | 'minimal' | null

const currentTheme = ref<ThemeName>(null)

/**
 * Apply a theme to the document root.
 * Pass null to clear the theme (use base.css defaults).
 */
export function applyTheme(theme: ThemeName): void {
  currentTheme.value = theme

  if (theme) {
    document.documentElement.dataset.theme = theme
  } else {
    delete document.documentElement.dataset.theme
  }
}

interface PageMeta {
  theme?: string | null
  effective_theme?: string | null  // computed by backend via inheritance
}

/**
 * Composable for managing per-node theming.
 * Extracts theme from page meta and applies it to the document.
 */
export function useTheme() {
  /**
   * Given a page payload with meta, apply the effective theme.
   * 
   * The backend computes `effective_theme` by walking up the node tree,
   * falling back to root_theme from content/_meta.yaml if no ancestor
   * has a theme set.
   * 
   * Priority: effective_theme > theme > null (base.css defaults)
   */
  function applyPageTheme(pageMeta: PageMeta | null | undefined): void {
    // effective_theme is pre-computed with inheritance by the backend
    const theme = (pageMeta?.effective_theme ?? pageMeta?.theme ?? null) as ThemeName
    applyTheme(theme)
  }

  return {
    currentTheme,
    applyTheme,
    applyPageTheme,
  }
}

