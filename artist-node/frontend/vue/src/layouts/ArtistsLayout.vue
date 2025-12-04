<!-- src/layouts/ServerLayout.vue -->
<template>
  <div class="layout-server">
    <header class="page-header">
      <h1 v-if="page.title">{{ page.title }}</h1>
      <p v-if="page.tagline" class="page-tagline">{{ page.tagline }}</p>
    </header>

    <main>
      <!-- maybe force hero first if present -->
      <BlockRenderer
        v-for="(block, idx) in page.content || []"
        :key="idx"
        :block="block"
        @cta="handleCta"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ArtistsLayout' })
import { useRouter } from 'vue-router'
import BlockRenderer from '@/components/blocks/BlockRenderer.vue'

const props = defineProps<{
  page: any
}>()

const router = useRouter()

function handleCta(target: string) {
  if (!target) return
  if (target.startsWith('#')) {
    const id = target.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    return
  }
  router.push(target)
}
</script>
