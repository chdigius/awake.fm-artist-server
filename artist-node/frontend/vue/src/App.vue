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
  <div class="app-container" :style="{ paddingBottom: playerPadding }">
    <RouterView />
  </div>

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
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useViewMode } from '@/composables/useViewMode';
import { GlobalPlayerBar, usePlayerStore } from '@awake/audio-player';
import PlayerVisualizer from '@/components/player/PlayerVisualizer.vue';

useViewMode();

// Add bottom padding when player is active (height of minimized player)
const playerStore = usePlayerStore();
const { hasTrack } = storeToRefs(playerStore);

const playerPadding = computed(() => hasTrack.value ? '70px' : '0px');
</script>

<style>
.app-container {
  transition: padding-bottom 0.3s ease;
}
</style>
