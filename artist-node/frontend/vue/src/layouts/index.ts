// src/layouts/index.ts
import DefaultLayout from './DefaultLayout.vue'
import ServerLayout from './ServerLayout.vue'
import ArtistLayout from './ArtistLayout.vue'
import ArtistsLayout from './ArtistsLayout.vue'
// later: AlbumLayout, TracksLayout, SetLayout, StoreLayout, etc.

type LayoutComponent = any

const registry: Record<string, LayoutComponent> = {
  default: DefaultLayout,
  server: ServerLayout,
  artists: ArtistsLayout,
  artist: ArtistLayout,
}

export function getLayout(name?: string | null): LayoutComponent {
  if (!name) return registry.default
  return registry[name] ?? registry.default
}

export function registerLayout(name: string, component: LayoutComponent) {
  registry[name] = component
}
