<!-- src/views/PageView.vue -->
<template>
  <div class="page-view">
    <div v-if="loading" class="page-loading">
      Loading...
    </div>

    <div v-else-if="error" class="page-error">
      {{ error }}
    </div>

    <div v-else-if="page" class="page-content">
      <header class="page-header">
        <h1 v-if="page.title" class="page-title">{{ page.title }}</h1>
        <p v-if="page.tagline" class="page-tagline">{{ page.tagline }}</p>
      </header>

      <main>
        <div
          v-for="(block, index) in page.content"
          :key="index"
          class="page-block"
        >

          <!-- HERO BLOCK -->
          <section
            v-if="block.type === 'hero'"
            class="block-hero"
          >
            <h2 class="hero-heading"> {{ block.heading }} </h2>
            <p v-if="block.subheading" class="hero-subheading">
              {{ block.subheading}}
            </p>

            <p v-if="block.body" class="hero-body">
              {{ block.body }}
            </p>

            <button
              v-if="block.cta"
              class="hero-cta"
              @click="scrollTo(block.cta.target)"
            >
              {{ block.cta.label }}
            </button>
          </section>

          <!-- SECTION -->
          <section
            v-else-if="block.type == 'section'"
            class="block-section"
            :id="block.id || undefined"
          >
            <h2 v-if="block.label" class="section-label">
              {{ block.label }}
            </h2>

            <!-- nested blocks inside this section -->
            <div
              v-for="(child, cIdx) in block.blocks || []"
              :key="cIdx"
              class="section-child"
            >
              <!-- subpage links (Artists, Tracks, etc. -->
              <div
                v-if="child.type == 'subpage'"
                class="secton-subpage-link"
              >
                <RouterLink :to="toPath(child.ref)">
                  {{ child.label || child.ref}}
                </RouterLink>
              </div>

              <!-- markdown (for now: plain text)-->
              <p
                v-else-if="child.type === 'markdown'"
                class="section-markdown"
              >
                {{ child.body}}
              </p>

              <!-- fallback debug -->
              <pre v-else class="section-unknown">
                {{ child }}
              </pre>
            </div>
          </section>

          <!-- MARKDOWN at top level -->
          <section
            v-else-if="block.type === 'markdown'"
            class="block-markdown"
          >
            <p>{{ block.body }}</p>
          </section>

          <!-- fallback block renderer -->
          <pre v-else class="block-unknown">
            {{ block }}
          </pre>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

interface HeroBlock {
  type: 'hero'
  heading: string
  subheading?: string
  body?: string
  cta?: { label: string, target: string }
}

interface SubpageBlock {
  type: 'subpage'
  ref: string
  label?: string
  nav?: boolean
}

interface MarkdownBlock {
  type: 'markdown'
  body: string
}

interface SectionBlock {
  type: 'section'
  id?: string
  label?: string
  blocks?: Array<HeroBlock | SubpageBlock | MarkdownBlock | any>
}

interface PagePayload {
  path: string
  title?: string
  tagline?: string
  content: Block[]
  // preview/meta omitted for now
}

const props = defineProps<{
  pathParam?: string | string[]
}>()

const route = useRoute()
const router = useRouter()

const page = ref<PagePayload | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Convert the current route into an internal graph path:
 * - '/' → null (root)
 * - '/artists/zol' → 'artists/zol'
 */
const currentGraphPath = computed(() => {
  // If we have an explicit prop from the catch all route
  if (props.pathParam && props.pathParam !== '') {
    if (Array.isArray(props.pathParam)) {
      return props.pathParam.join('/')
    }
    return props.pathParam
  }

  // Otherwise derive from the actual route path
  const raw = route.path
  if (raw === '/' || raw === '') {
    return null
  }
  // strip leading slash
  return raw.replace(/^\/+/, '')
})

async function loadPage() {
  loading.value = true
  error.value = null
  page.value = null

  try {
    const path = currentGraphPath.value

    let url = '/api/page'
    if (path) {
      url += `?path=${encodeURIComponent(path)}`
    }

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
 
    const data = await res.json()
    page.value = data as PagePayload
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load page'
  } finally {
    loading.value = false
  }
}

function toPath(ref: string): string {
  // backend path uses paths like 'artists/zol'
  // frontend paths are '/artists/zol'
  if (!ref.startsWith('/')) {
    return '/' + ref
  }
  return ref
}

function scrollTo(target: string) {
  if (!target) {
    return
  }
  // if it's an anchor like #artists
  if (target.startsWith('#')) {
    const id = target.slice(1)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      return
    }
  }

  router.push(target)
}

onMounted(() => {
  loadPage()
})

// reload whenever route changes
watch(
  () => route.path,
  () => {
    loadPage()
  }
)
</script>

<style scoped>
.page-view {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-tagline {
  opacity: 0.8;
}

.block-hero {
  margin-bottom: 2rem;
}

.hero-heading {
  font-size: 1.8rem;
}

.hero-subheading {
  margin-top: 0.25rem;
  opacity: 0.8;
}

.hero-body {
  margin-top: 0.75rem
}

.hero-cta {
  margin-top: 0.75rem;
}

.block-section {
  margin-bottom: 1.5rem;
}

.section-label {
  margin-bottom: 0.5rem;
}

.section-subpage-link a {
  text-decoration: underline;
  cursor: pointer;
}

.block-unknown,
.section-unknown {
  font-size: 0.8rem;
  opacity: 0.7;
  padding: 0.5rem;
  border-radius: 4px;
}
</style>
