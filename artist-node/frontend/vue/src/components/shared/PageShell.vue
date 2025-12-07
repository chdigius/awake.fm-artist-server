<!-- src/components/shared/PageShell.vue -->
<template>
  <div class="page-shell">
    <header class="page-shell__header">
      <MainNav />
    </header>

    <main class="page-shell__main">
      <div class="page-shell__inner">
        <slot />
      </div>
    </main>

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

const props = defineProps<{
  meta?: Record<string, any>
}>()
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-fg);
  display: flex;
  flex-direction: column;
}

/* Header & footer hug edges; use view-mode tokens for padding */
.page-shell__header,
.page-shell__footer {
  padding: var(--page-padding-y) var(--page-padding-x);
}

.page-shell__main {
  flex: 1;
}

.page-shell__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--page-padding-y) var(--page-padding-x);
}
</style>
