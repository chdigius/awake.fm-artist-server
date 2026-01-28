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
<template>
  <RouterView />

  <!-- Global audio player (slides up from bottom) -->
  <GlobalPlayerBar :show-visualizer="true">
    <template #visualizer="{ config, audioElement }">
      <PlayerVisualizer
        :visualizer-id="config.id"
        :audio-element="audioElement"
        :options="config.options"
      />
    </template>
  </GlobalPlayerBar>
</template>

<script setup lang="ts">
import { useViewMode } from '@/composables/useViewMode';
import { GlobalPlayerBar } from '@awake/audio-player';
import PlayerVisualizer from '@/components/player/PlayerVisualizer.vue';

useViewMode();
</script>

<style>
/* If you want any truly global app-level stuff, it goes here */
</style>
