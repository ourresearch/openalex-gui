// oxjob #1689 Nuxt trial: hand Nuxt the existing route table (documented recipe:
// nuxt.com/docs/4.x/guide/recipes/custom-routing#router-options).
import type { RouterConfig } from 'nuxt/schema'
import { routes, scrollBehavior } from '@/router/index.js'

export default {
  routes: () => routes,
  scrollBehavior,
} satisfies RouterConfig
