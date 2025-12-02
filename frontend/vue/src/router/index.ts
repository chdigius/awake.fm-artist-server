// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import PageView from '@/views/PageView.vue'

const routes = [
  {
    path: '/',
    name: 'root',
    component: PageView,
    // no props -> means "use root_content_path"
  },
  {
    // catch-all for everything else on the node
    path: '/:pathMatch(.*)*',
    name: 'page',
    component: PageView,
    props: route => ({
      pathParam: route.params.pathMatch,
    }),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
