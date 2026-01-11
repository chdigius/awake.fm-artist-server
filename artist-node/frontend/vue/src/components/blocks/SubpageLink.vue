<template>
  <div class="subpage-link-container" :style="containerStyle">
    <router-link
      :to="toPath(pageRef)"
      :class="linkClasses"
    >
      <span v-if="icon?.position === 'left'" class="subpage-link__icon subpage-link__icon--left">
        {{ iconSymbol }}
      </span>

      <div class="subpage-link__content">
        <span class="subpage-link__text">{{ title }}</span>
        <span v-if="badge" class="subpage-link__badge">{{ badge }}</span>
      </div>

      <span v-if="icon?.position === 'right'" class="subpage-link__icon subpage-link__icon--right">
        {{ iconSymbol }}
      </span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

interface SubpageLinkProps {
  pageRef: string  // Renamed from 'ref' because Vue reserves that name
  title?: string
  badge?: string
  align?: 'left' | 'center' | 'right'
  size?: 'small' | 'medium' | 'large' | 'xl'
  weight?: 'normal' | 'bold' | 'light'
  decoration?: 'none' | 'underline' | 'overline'
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  font?: 'body' | 'heading' | 'mono'
  icon?: {
    position?: 'left' | 'right' | 'none'
    type?: 'arrow' | 'chevron' | 'external' | 'none'
  }
}

const props = withDefaults(defineProps<SubpageLinkProps>(), {
  title: '',
  align: 'left',
  size: 'large',
  weight: 'bold',
  decoration: 'none',
  transform: 'none',
  font: 'heading',
  icon: () => ({ position: 'none', type: 'none' })  // No icon by default
})

onMounted(() => {
  console.log('[SubpageLink] pageRef prop:', props.pageRef)
  console.log('[SubpageLink] computed path:', toPath(props.pageRef))
})

function toPath(ref: string): string {
  if (!ref) return '/'
  return ref.startsWith('/') ? ref : `/${ref}`
}

const containerStyle = computed(() => {
  const styles: Record<string, string> = {}

  // Container alignment
  if (props.align === 'center') {
    styles.display = 'flex'
    styles.justifyContent = 'center'
  } else if (props.align === 'right') {
    styles.display = 'flex'
    styles.justifyContent = 'flex-end'
  } else {
    styles.display = 'flex'
    styles.justifyContent = 'flex-start'
  }

  return styles
})

const linkClasses = computed(() => {
  const classes = ['subpage-link']

  // Size
  if (props.size) classes.push(`subpage-link--size-${props.size}`)

  // Weight
  if (props.weight) classes.push(`subpage-link--weight-${props.weight}`)

  // Decoration
  if (props.decoration) classes.push(`subpage-link--decoration-${props.decoration}`)

  // Transform
  if (props.transform && props.transform !== 'none') {
    classes.push(`subpage-link--transform-${props.transform}`)
  }

  // Font
  if (props.font) classes.push(`subpage-link--font-${props.font}`)

  return classes
})

const iconSymbol = computed(() => {
  if (props.icon?.type === 'none') return ''

  switch (props.icon?.type || 'arrow') {
    case 'arrow':
      return '→'
    case 'chevron':
      return '›'
    case 'external':
      return '↗'
    default:
      return '→'
  }
})
</script>

<style scoped>
.subpage-link-container {
  margin: 1rem 0;
}

.subpage-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  color: var(--color-text);
  cursor: pointer;
  text-decoration: none;
}

.subpage-link:hover {
  color: var(--color-accent);
}

.subpage-link__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.subpage-link__text {
  display: block;
}

.subpage-link__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
}

.subpage-link__icon {
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.subpage-link:hover .subpage-link__icon--right {
  transform: translateX(4px);
}

.subpage-link:hover .subpage-link__icon--left {
  transform: translateX(-4px);
}

/* Size variants */
.subpage-link--size-small {
  font-size: 0.875rem;
}

.subpage-link--size-medium {
  font-size: 1rem;
}

.subpage-link--size-large {
  font-size: 1.25rem;
}

.subpage-link--size-xl {
  font-size: 1.5rem;
}

/* Weight variants */
.subpage-link--weight-light {
  font-weight: 300;
}

.subpage-link--weight-normal {
  font-weight: 400;
}

.subpage-link--weight-bold {
  font-weight: 700;
}

/* Decoration variants */
.subpage-link--decoration-none {
  text-decoration: none;
}

.subpage-link--decoration-underline {
  text-decoration: underline;
}

.subpage-link--decoration-overline {
  text-decoration: overline;
}

/* Transform variants */
.subpage-link--transform-uppercase {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subpage-link--transform-lowercase {
  text-transform: lowercase;
}

.subpage-link--transform-capitalize {
  text-transform: capitalize;
}

/* Font variants */
.subpage-link--font-body {
  font-family: var(--font-body, sans-serif);
}

.subpage-link--font-heading {
  font-family: var(--font-heading, sans-serif);
}

.subpage-link--font-mono {
  font-family: var(--font-mono, monospace);
}
</style>

