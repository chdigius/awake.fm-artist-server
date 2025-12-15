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
      <h2
        v-if="block.label"
        class="section-label"
        :style="getSectionLabelStyle(block)"
      >
        {{ block.label }}
      </h2>

      <div
        v-for="(child, cIdx) in block.blocks || []"
        :key="cIdx"
        class="section-child"
      >
        <!-- Recursively render child blocks -->
        <BlockRenderer :block="child" @cta="forwardCta" />
      </div>
    </section>

    <!-- SUBPAGE -->
    <RouterLink
      v-else-if="block.type === 'subpage'"
      :to="toPath(block.ref)"
      class="block-subpage-link"
    >
      {{ block.label || block.ref }}
    </RouterLink>

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

    <!-- COLLECTION -->
    <CollectionBlock
      v-else-if="block.type === 'collection'"
      :source="block.source"
      :path="block.path"
      :layout="block.layout"
      :card="block.card"
      :sort="block.sort"
      :limit="block.limit"
      :paging="block.paging"
      :empty_state="block.empty_state"
      :items="block.items"
    />

    <!-- Fallback -->
    <pre v-else class="block-unknown">
      {{ block }}
    </pre>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlockRenderer' })

import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import HeroBlock from './HeroBlock.vue'
import AudioPlayerBlock from './AudioPlayerBlock.vue'
import CollectionBlock from './CollectionBlock.vue'

const props = defineProps<{
  block: any
}>()

onMounted(() => {
  console.log('[BlockRenderer] Block type:', props.block?.type, props.block);
})

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

// Get text-align style for section label based on collection layout alignment
function getSectionLabelStyle(block: any) {
  // Check if this section contains a collection block with alignment settings
  if (block.blocks && block.blocks.length > 0) {
    const firstChild = block.blocks[0];
    if (firstChild.type === 'collection' && firstChild.layout?.align?.horizontal) {
      const align = firstChild.layout.align.horizontal;
      return {
        textAlign: align === 'center' ? 'center' :
                   align === 'end' ? 'right' :
                   'left'
      };
    }
  }
  return {};
}
</script>
