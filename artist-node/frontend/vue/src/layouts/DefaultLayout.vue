<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="layout-default">
    <header class="page-header">
      <h1 v-if="page.title">{{ page.title }}</h1>
      <p v-if="page.tagline" class="page-tagline">{{ page.tagline }}</p>
    </header>

    <main>
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
defineOptions({ name: 'DefaultLayout' })
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
