import { defineNuxtPlugin, tryUseNuxtApp } from '#app'
// oxjob #1689 Nuxt trial: Nuxt owns the router; give the old module-level router
// import (src/router default export) the current instance, and install the old guards.
import { installGuards, setAppRouter, setRouterResolver } from '@/router/index.js'
import { navigation } from '@/navigation.js'

export default defineNuxtPlugin({
  name: 'ox-router',
  dependsOn: ['ox-store'],
  setup(nuxtApp) {
    const router = nuxtApp.$router as any
    if (import.meta.server) {
      setRouterResolver(() => (tryUseNuxtApp() as any)?.$router)
    } else {
      setAppRouter(router)
      navigation.setRouter(router)
      // Logged-in boot deferred past hydration (see installGuards): re-run the
      // guard's user boot by replaying the current route once hydration is done.
      if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
        nuxtApp.hooks.hook('app:suspense:resolve', () => {
          const store: any = nuxtApp.$store
          if (localStorage.getItem('token') && !store.getters['user/userLive']) {
            if (!store.getters['user/userId']) store.dispatch('user/restoreUserFromCache')
            store.dispatch('user/fetchUser').catch((e: any) => { if (e?.response?.status === 401) store.commit('user/logout') })
          }
        })
      }
    }
    installGuards(router, nuxtApp.$store)
  },
})
