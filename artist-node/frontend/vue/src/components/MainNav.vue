<template>
  <nav
    class="main-nav"
    :class="{ 'main-nav--glass': glass }"
  >
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- everything else goes through NavList -->
    <NavList
      v-else
      :items="items"
      @navigate="goTo"
    />
  </nav>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav'
import NavList from '@/components/NavList.vue'

const props = defineProps<{
  glass?: boolean
}>()

const router = useRouter()
const navStore = useNavStore()

const items = computed(() => navStore.items)
const loading = computed(() => navStore.loading)
const error = computed(() => navStore.error)

function goTo(href: string, e: MouseEvent) {
  e.preventDefault()
  router.push(href)
}

onMounted(async () => {
  await navStore.fetchNav()
})
</script>

<style scoped>
.main-nav {
  font-family: var(--font-body);
}

.main-nav--glass {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 0.5rem;
  padding: 0.35rem 0.75rem;
  transition: background 150ms ease, backdrop-filter 150ms ease;
}

.loading {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.error {
  color: var(--color-accent);
  font-size: 0.875rem;
}

</style>
