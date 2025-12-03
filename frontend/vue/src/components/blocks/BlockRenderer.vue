<!-- src/components/blocks/BlockerRenderer.vue -->
<!-- TODO - CJD - style classes based on parent Layout? -->
<template>
  <div class="block-renderer">
    <!-- HERO -->
    <section v-if="block.type === 'hero'" class="block-hero">
      <h2 class="hero-heading">{{ block.heading }} </h2>
      <p v-if="block.subheading" class="hero-subheading">
        {{ block.subheading }}
      </p>
      <p v-if="block.body" class="hero-body">
        {{ block.body }}
      </p>
      <button
        v-if="block.cta"
        class="hero-cta"
        @click="$emit('cta-click', block.cta.target)"
      >
        {{ block.cta.label }}
      </button>
    </section>

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

        <p v-else-if="child.type === 'markdown'" class="section-markdown">
          {{ child.body }}
        </p>

        <pre v-else class="section-unknown">
          {{ child }}
        </pre>
      </div>
    </section>

    <!-- MARKDOWN -->
    <section v-else-if="block.type === 'markdown'" class="block-markdown">
      <p> {{ block.body }}</p>
    </section>

    <!-- Fallback -->
    <pre v-else class="block-unknown">
      {{ block }}
    </pre>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlockRenderer' })
import { RouterLink } from 'vue-router'

const props = defineProps<{
  block: any
}>()

function toPath(ref: string): string {
  if (!ref) return '/'
  return ref.startsWith('/') ? ref : `/${ref}`
}
</script>