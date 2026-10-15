import { defineNuxtPlugin } from '#app'
// oxjob #1689 Nuxt trial: Nuxt owns the router; give the old module-level router
// import (src/router default export) the current instance, and install the old guards.
import { installGuards, setAppRouter } from '@/router/index.js'
import { navigation } from '@/navigation.js'

export default defineNuxtPlugin({
  name: 'ox-router',
  dependsOn: ['ox-store'],
  setup(nuxtApp) {
    const router = nuxtApp.$router as any
    if (import.meta.client) {
      setAppRouter(router)
      navigation.setRouter(router)
    }
    installGuards(router, nuxtApp.$store)
  },
})
