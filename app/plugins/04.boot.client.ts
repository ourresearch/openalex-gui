import { defineNuxtPlugin } from '#app'
// oxjob #1689 Nuxt trial: the browser-only half of src/main.js.
import VScrollLock from 'v-scroll-lock'
import axios from 'axios'
import tracking from '@/tracking.js'
import { getAppStore } from '@/store/index.js'
import { urlBase } from '@/apiConfig.js'
import { installKeyWait } from '@/keyWait.js'

export default defineNuxtPlugin({
  name: 'ox-boot',
  setup(nuxtApp) {
    const app = nuxtApp.vueApp
    const OriginalResizeObserver = window.ResizeObserver
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          try { callback(entries, observer) } catch (e: any) {
            if (e?.message?.includes('ResizeObserver loop')) return
            throw e
          }
        })
      }
    }
    tracking.setupJavaScriptErrorTracking()
    // Before the first page fetch: a signed-in first load waits for its API key (oxjob #1744).
    installKeyWait(axios, getAppStore(), urlBase.api)
    app.use(VScrollLock)
    app.config.globalProperties.config = {}
    ;(window as any).OpenAlex = app

    nuxtApp.hook('app:mounted', () => {
      const initSentry = () => Promise.all([import('@sentry/vue'), import('@/sentryScrub.js')]).then(([Sentry, scrub]: any) => {
        Sentry.init({
          app,
          dsn: 'https://db1c393aec6e9b2a1632747abe5900f5@o4512257233649664.ingest.us.sentry.io/4512257301807104',
          environment: location.hostname === 'openalex.org' ? 'production' : 'development',
          sendDefaultPii: false,
          beforeBreadcrumb: scrub.scrubBreadcrumb,
          beforeSend: scrub.scrubEvent,
        })
      })
      const scheduleSentry = () => setTimeout(initSentry, 1500)
      if (document.readyState === 'complete') scheduleSentry()
      else window.addEventListener('load', scheduleSentry, { once: true })
      import('@/uiProvenance.js').then(({ initUiProvenance }) => initUiProvenance())
      import('@/entityCounts.js').then(({ fetchEntityCounts }) => fetchEntityCounts())
      import('@/metaCatalog.js').then(({ fetchMetaCatalog }) => fetchMetaCatalog())
    })
  },
})
