import { defineNuxtPlugin } from '#app'
// oxjob #1689 Nuxt trial: Vuetify per app instance (documented manual Nuxt setup,
// vuetifyjs.com/en/getting-started/installation/#manual-setup).
import { createVuetify } from 'vuetify'
import { vuetifyOptions } from '@/plugins/vuetify.js'

export default defineNuxtPlugin({
  name: 'ox-vuetify',
  setup(nuxtApp) {
    const vuetify = createVuetify({ ...vuetifyOptions, ssr: true })
    nuxtApp.vueApp.use(vuetify)
  },
})
