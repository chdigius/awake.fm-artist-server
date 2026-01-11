<!-- src/views/PageView.vue -->
<template>
  <div class="page-view">
    <div v-if="loading" class="page-loading">Loading…</div>

    <div v-else-if="error" class="page-error">
      {{ error }}
    </div>

    <PageShell
      v-else-if="page"
      :meta="page.meta"
      :background="page.background"
    >
      <component
        :is="layoutComponent"
        :meta="page.meta"
        :blocks="page.content"
        :page="page"
      />
    </PageShell>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getLayout } from '@/layouts/index.ts'
import { useTheme } from '@/composables/useTheme'
import { useEffects } from '@/composables/useEffects'
import PageShell from '@/components/shared/PageShell.vue'

interface PagePayload {
  path: string
  title?: string
  tagline?: string
  background?: string
  meta?: {
    layout?: string
    theme?: string
    effective_theme?: string
    effects?: string[]
    [key: string]: any
  }
  content: any[]
}

const { applyPageTheme } = useTheme()
const { applyPageEffects } = useEffects()

const route = useRoute()

const page = ref<PagePayload | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const layoutComponent = computed(() => {
  const layoutName = page.value?.meta?.layout
  return getLayout(layoutName || 'default')
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

    applyPageTheme(data.meta)
    applyPageEffects(data.meta)
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

<style scoped>
.page-view {
  min-height: 100vh;
}
.page-loading,
.page-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
