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
        <!-- Recursively render child blocks, passing down section alignment -->
        <BlockRenderer 
          :block="child" 
          :parent-align="block.align?.horizontal"
          @cta="forwardCta" 
        />
      </div>
    </section>

    <!-- SUBPAGE -->
    <SubpageLink
      v-else-if="block.type === 'subpage'"
      :page-ref="block.ref"
      :title="block.title || block.label"
      :badge="block.badge"
      :align="block.align || parentAlign"
      :size="block.size"
      :weight="block.weight"
      :decoration="block.decoration"
      :transform="block.transform"
      :font="block.font"
      :icon="block.icon"
    />

    <!-- MARKDOWN -->
    <section
      v-else-if="block.type === 'markdown'"
      class="block-markdown"
      v-html="renderMarkdown(block.body)"
    ></section>

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
import { marked } from 'marked'
import HeroBlock from './HeroBlock.vue'
import AudioPlayerBlock from './AudioPlayerBlock.vue'
import CollectionBlock from './CollectionBlock.vue'
import SubpageLink from './SubpageLink.vue'

const props = defineProps<{
  block: any
  parentAlign?: string  // Inherited alignment from parent section
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

// Render markdown to HTML
function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  return marked(markdown) as string
}

// Get text-align style for section label with inheritance-with-override pattern
function getSectionLabelStyle(block: any): Record<string, string> {
  // PRIORITY 1: Explicit section.align takes precedence
  if (block.align?.horizontal) {
    const align = block.align.horizontal;
    const textAlign = align === 'center' ? 'center' :
                      align === 'end' || align === 'right' ? 'right' :
                      'left';
    return { textAlign };
  }

  // PRIORITY 2: Inherit from first child block if it has alignment
  if (block.blocks && block.blocks.length > 0) {
    const firstChild = block.blocks[0];
    if (firstChild.type === 'collection' && firstChild.layout?.align?.horizontal) {
      const align = firstChild.layout.align.horizontal;
      const textAlign = align === 'center' ? 'center' :
                        align === 'end' || align === 'right' ? 'right' :
                        'left';
      return { textAlign };
    }
  }

  // PRIORITY 3: Default (no explicit style)
  return {};
}
</script>
