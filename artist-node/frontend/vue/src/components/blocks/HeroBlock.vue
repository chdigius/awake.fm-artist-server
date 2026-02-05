<!-- src/components/blocks/HeroBlock.vue -->
<template>
  <section
    class="hero-block"
    :class="{ 'hero-block--has-bg': block.background || block.backgroundImage }"
    :id="block.id || undefined"
    :style="backgroundStyle"
  >
    <!-- BANNER (optional - wide image over background) -->
    <div v-if="block.banner" class="hero-banner">
      <ImageRenderer
        :config="block.banner"
        :aspect-ratio="21/9"
        image-class="hero-banner__image"
      />
    </div>

    <!-- SIGIL FLAG (optional) -->
    <div
      v-if="block.sigil"
      class="hero-sigil-wrapper"
    >
      <!-- p5 / RadiantForge sigil -->
      <RadiantForgeSigil
        v-if="block.sigil.type === 'p5' && block.sigil.id"
        :sigil-id="block.sigil.id"
        :options="block.sigil.options"
      />

      <!-- Static image sigil -->
      <img
        v-else-if="block.sigil.type === 'image' && block.sigil.src"
        :src="block.sigil.src"
        :alt="block.sigil.alt || block.heading || 'Node sigil'"
        class="hero-sigil-image"
      />
    </div>

    <!-- OVERLINE / KICKER -->
    <p
      v-if="block.overline"
      class="hero-overline"
    >
      {{ block.overline }}
    </p>

    <!-- MAIN TITLE -->
    <h1
      v-if="block.heading"
      class="hero-title"
    >
      {{ block.heading }}
    </h1>

    <!-- TAGLINE / SUBHEADING -->
    <p
      v-if="block.subheading"
      class="hero-subheading"
    >
      {{ block.subheading }}
    </p>

    <!-- BODY COPY -->
    <p
      v-if="block.body"
      class="hero-body"
    >
      {{ block.body }}
    </p>

    <!-- CTA ROW -->
    <div
      v-if="block.cta || block.secondary_cta"
      class="hero-cta-row"
    >
      <button
        v-if="block.cta"
        type="button"
        class="hero-cta hero-cta--primary"
        @click="onClick(block.cta.target)"
      >
        {{ block.cta.label }}
      </button>

      <button
        v-if="block.secondary_cta"
        type="button"
        class="hero-cta hero-cta--secondary"
        @click="onClick(block.secondary_cta.target)"
      >
        {{ block.secondary_cta.label }}
      </button>
    </div>

    <!-- OPTIONAL META LINE (for nerd signals, if provided) -->
    <p
      v-if="block.meta"
      class="hero-meta"
    >
      {{ block.meta }}
    </p>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'HeroBlock' })

import { computed } from 'vue'
import RadiantForgeSigil from '@/components/radiantforge/RadiantForgeSigil.vue'
import ImageRenderer from '@/components/shared/ImageRenderer.vue'
import type { SigilOptions } from '@awake/radiantforge'

type Cta = {
  label: string
  target: string
}

type P5SigilConfig = {
  type: 'p5'
  id: string
  options?: SigilOptions
  alt?: string
}

type ImageSigilConfig = {
  type: 'image'
  src: string
  alt?: string
}

type SigilConfig = P5SigilConfig | ImageSigilConfig

type ImageConfig = {
  type: 'static' | 'generative_from_seed'
  src?: string
  alt?: string
  seedFrom?: string
  seed?: number
  style?: any
}

const props = defineProps<{
  block: {
    id?: string
    overline?: string
    heading?: string
    subheading?: string
    body?: string
    cta?: Cta
    secondary_cta?: Cta
    meta?: string
    sigil?: SigilConfig
    background?: string
    backgroundImage?: ImageConfig
    banner?: ImageConfig
    [key: string]: any
  }
}>()

// Compute background style if block has a background image
const backgroundStyle = computed(() => {
  // Support new backgroundImage (ImageConfig) or legacy background (string path)
  if (props.block.backgroundImage) {
    // For now, only support static backgrounds (generative backgrounds in future phase)
    if (props.block.backgroundImage.type === 'static' && props.block.backgroundImage.src) {
      return {
        backgroundImage: `url(${props.block.backgroundImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
  } else if (props.block.background) {
    // Legacy string path support
    return {
      backgroundImage: `url(${props.block.background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return {}
})

const emit = defineEmits<{
  (e: 'cta', target: string): void
}>()

function onClick(target?: string) {
  if (!target) return
  emit('cta', target)
}
</script>

<style scoped>
.hero-block {
  /* Centered identity block - broadcast node declaration */
  padding-block-start: clamp(0.5rem, 1.5vh, 1rem);
  padding-block-end: clamp(1.5rem, 4vh, 2.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  position: relative;
}

/* Background image variant */
.hero-block--has-bg {
  padding-block: clamp(4rem, 15vh, 8rem);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Dark overlay for readability when background is present */
.hero-block--has-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
  z-index: 0;
}

/* Ensure content sits above the overlay */
.hero-block--has-bg > * {
  position: relative;
  z-index: 1;
}

/* BANNER - wide image over background */
.hero-banner {
  width: 100%;
  max-width: 1200px;
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hero-banner__image {
  width: 100%;
  height: auto;
  display: block;
}

/* SIGIL FLAG */
.hero-sigil-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.hero-sigil-image {
  width: clamp(6rem, 12vw, 9rem);
  aspect-ratio: 1 / 1;
  display: inline-block;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
}

/* OVERLINE / KICKER - terminal aesthetic */
.hero-overline {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  opacity: 0.6;
  margin-bottom: 0.5rem;
}

/* MAIN TITLE - the identity anchor */
.hero-title {
  font-family: var(--font-display, var(--font-sans, system-ui, sans-serif));
  font-size: clamp(2.4rem, 5vw + 1rem, 4rem);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
}

/* TAGLINE / SUBHEADING - the ethos one-liner */
.hero-subheading {
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: var(--page-font-size-lg, 1.2rem);
  opacity: 0.85;
  margin: 0.75rem 0 0 0;
  letter-spacing: 0.02em;
}

/* BODY COPY - manifesto energy */
.hero-body {
  max-width: 52rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--page-font-size-base, 1rem);
  line-height: 1.7;
  opacity: 0.75;
  margin: 1rem 0 0 0;
  white-space: pre-line;
}

/* CTA ROW - centered actions */
.hero-cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.hero-cta {
  cursor: pointer;
  padding: 0.75rem 2rem;
  border-radius: 999px;
  border: 1px solid var(--color-accent, #00ff99);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: transparent;
  color: var(--color-accent, #00ff99);
  transition: 
    background 150ms ease-out, 
    color 150ms ease-out, 
    transform 100ms ease-out,
    box-shadow 150ms ease-out;
}

.hero-cta--primary {
  background: var(--color-accent, #00ff99);
  color: var(--color-on-accent, #050505);
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(var(--color-accent-rgb, 0, 255, 153), 0.25);
}

.hero-cta--secondary:hover {
  background: var(--color-accent, #00ff99);
  color: var(--color-on-accent, #050505);
}

/* META LINE (nerd signal) - subtle tech cred */
.hero-meta {
  margin-top: 2.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  opacity: 0.5;
  text-transform: uppercase;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .hero-block {
    padding-block: clamp(3rem, 10vh, 5rem);
  }

  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.5rem);
  }

  .hero-body {
    max-width: 100%;
  }

  .hero-cta-row {
    flex-direction: column;
    align-items: center;
  }

  .hero-cta {
    width: 100%;
    max-width: 280px;
  }
}
</style>
