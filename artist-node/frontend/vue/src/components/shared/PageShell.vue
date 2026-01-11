<!-- src/components/shared/PageShell.vue -->
<template>
  <div
    class="page-shell"
    :style="backgroundStyle"
  >
    
    <!-- HEADER (full-bleed background, constrained content) -->
    <header class="page-shell__header">
      <div class="page-shell__header-inner">
        <MainNav :glass="hasBackground" />
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="page-shell__main">
      <div class="page-shell__inner">
        <slot />
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="page-shell__footer">
      <div class="page-shell__footer-inner">
        <span class="page-shell__footer-text">
          © {{ new Date().getFullYear() }} Awake.fm Artist Node
        </span>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import MainNav from '@/components/MainNav.vue'

import { computed } from 'vue'

const props = defineProps<{
  meta?: Record<string, any>
  background?: string
}>()

const hasBackground = computed(() => Boolean(props.background))

const backgroundStyle = computed(() => {
  if (!props.background) return {}
  const href = props.background.startsWith('http')
    ? props.background
    : new URL(props.background, window.location.origin).href

  return {
    backgroundImage: `url(${href})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }
})
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-fg);
  display: flex;
  flex-direction: column;
}

/*  -----------------------------  
    FULL-BLEED HEADER + FOOTER 
    ----------------------------- */

.page-shell__header,
.page-shell__footer {
  width: 100%;
  background: v-bind('hasBackground ? "transparent" : "var(--color-bg)"');
  padding: 0;                       /* padding moves to the inner rail */
}

/* Constrained inner rails */
.page-shell__header-inner,
.page-shell__footer-inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--page-padding-y) var(--page-padding-x);
  width: 100%;
  box-sizing: border-box;
  backdrop-filter: blur(6px);
  background-color: v-bind('hasBackground ? "rgba(0,0,0,0.32)" : "var(--color-bg)"');
}

/* MAIN AREA */
.page-shell__main {
  flex: 1;
}

.page-shell__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding-x) var(--page-padding-y);
  width: 100%;
  box-sizing: border-box;
}

.page-shell__footer-text {
  opacity: 0.75;
  font-size: 0.9rem;
}
</style>
