<!-- src/layouts/ServerLayout.vue -->
<template>
  <div
    class="layout-server"
    :style="backgroundStyle"
  >
    <div class="layout-server__inner">
      <main class="page-main">
        <!-- maybe force hero first if present later -->
        <BlockRenderer
          v-for="(block, idx) in page.content || []"
          :key="idx"
          :block="block"
          @cta="handleCta"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ServerLayout' })

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BlockRenderer from '@/components/blocks/BlockRenderer.vue'

const props = defineProps<{
  page: any
}>()

const router = useRouter()

// Compute background style if page has a background image
const backgroundStyle = computed(() => {
  if (!props.page?.background) return {}

  const href = props.page.background.startsWith('http')
    ? props.page.background
    : new URL(props.page.background, window.location.origin).href

  return {
    backgroundImage: `url(${href})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }
})

function handleCta(target: string) {
  if (!target) return

  // in-page anchor
  if (target.startsWith('#')) {
    const id = target.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    return
  }

  // route navigation
  router.push(target)
}
</script>

<style scoped>
.layout-server {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-fg);
  display: flex;
}

.layout-server__inner {
  /* this is where the view-mode tokens kick in */
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--page-padding-y) var(--page-padding-x);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--page-gutter);
}

.page-header {
  margin-bottom: var(--page-gutter);
  padding-bottom: calc(var(--page-gutter) * 0.75);
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
}

.page-title {
  font-size: var(--page-font-size-xxl);
  line-height: 1.1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.page-tagline {
  margin-top: 0.5rem;
  font-size: var(--page-font-size-lg);
  opacity: 0.8;
}

.page-main {
  display: flex;
  flex-direction: column;
  gap: var(--page-gutter);
}
</style>
