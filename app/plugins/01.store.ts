import { defineNuxtPlugin, tryUseNuxtApp } from '#app'
// oxjob #1689 Nuxt trial: Vuex 4 as a Nuxt plugin. One store per app instance
// (per request on the server, once in the browser). The server-side state is
// sent in the Nuxt payload and replayed into the browser store before hydration.
import { createAppStore, setAppStore, setStoreResolver } from '@/store/index.js'
import { setHydrating } from '@/utils/env.js'

export default defineNuxtPlugin({
  name: 'ox-store',
  setup(nuxtApp) {
    const store = createAppStore()
    if (import.meta.server) {
      setStoreResolver(() => (tryUseNuxtApp() as any)?.$store)
      nuxtApp.hooks.hook('app:rendered', () => {
        nuxtApp.payload.vuex = JSON.parse(JSON.stringify(store.state))
      })
    } else {
      setHydrating(nuxtApp.isHydrating)
      nuxtApp.hooks.hook('app:suspense:resolve', () => setHydrating(false))
      if (nuxtApp.payload.vuex) store.replaceState({ ...store.state, ...nuxtApp.payload.vuex })
      setAppStore(store)
    }
    nuxtApp.vueApp.use(store)
    return { provide: { store } }
  },
})
