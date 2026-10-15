import { defineNuxtPlugin } from '#app'
// oxjob #1689 Nuxt trial: Vuex 4 as a Nuxt plugin. One store per app instance
// (per request on the server, once in the browser).
import { createAppStore, setAppStore } from '@/store/index.js'

export default defineNuxtPlugin({
  name: 'ox-store',
  setup(nuxtApp) {
    const store = createAppStore()
    if (import.meta.client) setAppStore(store)
    nuxtApp.vueApp.use(store)
    return { provide: { store } }
  },
})
