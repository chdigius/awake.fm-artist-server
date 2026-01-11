<!-- src/App.vue -->
<!-- <template>
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
</script> -->
<!-- src/App.vue -->
<template>
  <RouterView />
</template>


<script setup lang="ts">
import { useViewMode } from '@/composables/useViewMode'

useViewMode()
</script>


<style>
/* If you want any truly global app-level stuff, it goes here */
</style>
