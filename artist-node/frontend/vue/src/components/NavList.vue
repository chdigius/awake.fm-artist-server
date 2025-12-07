<script setup lang="ts">
// mirror the Pinia NavItem shape
interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

defineOptions({ name: 'NavList' })

defineProps<{
  items: NavItem[]
}>()

const emit = defineEmits<{
  (e: 'navigate', href: string, event: MouseEvent): void
}>()

function onClick(href: string, event: MouseEvent) {
  emit('navigate', href, event)
}
</script>

<template>
  <ul class="nav-list">
    <li
      v-for="item in items"
      :key="item.href"
      class="nav-item"
    >
      <a :href="item.href" @click="onClick(item.href, $event)">
        {{ item.label }}
      </a>

      <!-- recursive: render children with NavList again -->
      <NavList
        v-if="item.children && item.children.length"
        class="nav-submenu"
        :items="item.children"
        @navigate="onClick"
      />
    </li>
  </ul>
</template>

<style scoped>
.nav-list {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  position: relative;
}

.nav-item > a {
  display: block;
  padding: 0.5rem 0;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-fg);
  text-decoration: none;
  border-radius: var(--radius);
  transition: color var(--transition-fast);
}

.nav-item > a:hover {
  color: var(--color-accent);
}

/* Submenu styling */
.nav-submenu {
  position: absolute;
  top: 100%;
  left: 0;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 180px;
  padding: 0.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: 
    opacity var(--transition-fast),
    transform var(--transition-fast),
    visibility var(--transition-fast);
}

.nav-item:hover > .nav-submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.nav-submenu .nav-item > a {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.nav-submenu .nav-item > a:hover {
  background: var(--color-border);
}
</style>
