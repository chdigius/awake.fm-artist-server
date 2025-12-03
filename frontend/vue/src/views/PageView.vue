<!-- src/views/PageView.vue -->
<template>
  <div class="page-view">
    <div v-if="loading" class="page-loading">Loading…</div>
    <div v-else-if="error" class="page-error">{{ error }}</div>
    <div v-else-if="page" class="page-loaded">
      <component
        :is="layoutComponent"
        :page="page"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ServerLayout from '@/layouts/ServerLayout.vue'
// later:
// import ArtistLayout from '@/layouts/ArtistLayout.vue'
// import ArtistsLayout from '@/layouts/ArtistsLayout.vue'

interface PagePayload {
  path: string
  title?: string
  tagline?: string
  meta?: {
    layout?: string
    [key: string]: any
  }
  content: any[]
}

const route = useRoute()

const page = ref<PagePayload | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// registry: layout name -> component
const layoutRegistry: Record<string, any> = {
  server: ServerLayout,
  // artist: ArtistLayout,
  // artists: ArtistsLayout,
  default: DefaultLayout,
}

const layoutComponent = computed(() => {
  const layout = page.value?.meta?.layout
  console.log(layout)
  if (layout && layoutRegistry[layout]) {
    console.log(layoutRegistry[layout])
    return layoutRegistry[layout]
  }
  console.log(layoutRegistry.default)
  return layoutRegistry.default
})

const currentGraphPath = computed(() => {
  const raw = route.path
  if (!raw || raw === '/') return null
  return raw.replace(/^\/+/, '')
})

async function loadPage() {
  loading.value = true
  error.value = null
  page.value = null

  try {
    const path = currentGraphPath.value
    let url = '/api/page'
    if (path) url += `?path=${encodeURIComponent(path)}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = (await res.json()) as PagePayload
    page.value = data
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load page'
  } finally {
    loading.value = false
  }
}

onMounted(loadPage)

watch(
  () => route.fullPath,
  () => {
    loadPage()
  }
)
</script>
