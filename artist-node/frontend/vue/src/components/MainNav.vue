<template>
  <nav class="main-nav">
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

.loading {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.error {
  color: var(--color-accent);
  font-size: 0.875rem;
}
</style>
