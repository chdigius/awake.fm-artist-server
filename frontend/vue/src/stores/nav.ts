//src/stores/nav.ts
import { defineStore } from 'pinia'

export interface NavItem {
  label: string,
  href: string,
  children?: NavItem[]
}

interface NavState {
  items: NavItem[]
  loading: boolean
  error: string | null
  initialized: boolean
}

export const useNavStore = defineStore('nav', {
  state: (): NavState => ({
    items: [],
    loading: false,
    error: null,
    initialized: false,
  }),
  actions: {
    async fetchNav() {
      if (this.initialized) return

      this.loading = true
      this.error = null

      try {
        const res = await fetch('/api/nav')
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        this.items= data.items ?? []
        this.initialized = true
      } catch(e: any) {
        this.error = e?.message ?? 'Failed to load Nav Items'
      } finally {
        this.loading = false
      }
      }
    }
  })