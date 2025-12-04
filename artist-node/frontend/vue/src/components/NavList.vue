<script setup lang="ts">
// import { defineEmits, defineOptions } from 'vue'

// mirror the Pinia NavItem shape
interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

defineOptions({ name: 'NavList' })

const props = defineProps<{
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
