<!-- src/components/blocks/BlockRenderer.vue -->
<!-- TODO - CJD - style classes based on parent Layout? -->
<template>
  <div class="block-renderer">
    <!-- HERO -->
    <HeroBlock
      v-if="block.type === 'hero'"
      :block="block"
      @cta="forwardCta"
    />

    <!-- SECTION -->
    <section
      v-else-if="block.type === 'section'"
      class="block-section"
      :id="block.id || undefined"
    >
      <h2 v-if="block.label" class="section-label">
        {{ block.label }}
      </h2>

      <div
        v-for="(child, cIdx) in block.blocks || []"
        :key="cIdx"
        class="section-child"
      >
        <RouterLink
          v-if="child.type === 'subpage'"
          :to="toPath(child.ref)"
          class="section-subpage-link"
        >
          {{ child.label || child.ref }}
        </RouterLink>

        <p
          v-else-if="child.type === 'markdown'"
          class="section-markdown"
        >
          {{ child.body }}
        </p>

        <pre v-else class="section-unknown">
          {{ child }}
        </pre>
      </div>
    </section>

    <!-- MARKDOWN -->
    <section
      v-else-if="block.type === 'markdown'"
      class="block-markdown"
    >
      <p>{{ block.body }}</p>
    </section>

    <!-- AUDIO PLAYER -->
    <AudioPlayerBlock
      v-else-if="block.type === 'audio_player'"
      :block="block"
    />

    <!-- Fallback -->
    <pre v-else class="block-unknown">
      {{ block }}
    </pre>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlockRenderer' })

import { RouterLink } from 'vue-router'
import HeroBlock from './HeroBlock.vue'
import AudioPlayerBlock from './AudioPlayerBlock.vue'

const props = defineProps<{
  block: any
}>()

const emit = defineEmits<{
  (e: 'cta', target: string): void
}>()

function toPath(ref: string): string {
  if (!ref) return '/'
  return ref.startsWith('/') ? ref : `/${ref}`
}

function forwardCta(target: string) {
  emit('cta', target)
}
</script>
