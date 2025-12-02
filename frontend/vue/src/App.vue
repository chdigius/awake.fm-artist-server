<!-- src/App.vue -->
<template>
  <div class="app-shell">
    <header>
      <MainNav />
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import MainNav from '@/components/MainNav.vue'
</script>
