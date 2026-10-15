import { defineNuxtPlugin } from '#app'
// oxjob #1689: no app code calls an API during a server render. Record data comes
// from the Nitro record middleware (server/middleware/02.records.ts) with the server's
// key; every axios call the app makes (users-api, collections, group-bys, counts)
// belongs to the browser. On the server such a call stays pending, as in the
// browser's first render before its fetch returns, and is logged once per path so a
// new one gets noticed. (src/api.js skips its own calls the same way.)
import axios from 'axios'

let installed = false
const seen = new Set<string>()

export default defineNuxtPlugin({
  name: 'ox-ssr-no-api',
  enforce: 'pre',
  setup() {
    if (installed) return
    installed = true
    axios.defaults.adapter = (config: any) => {
      const shape = String(config?.url || '').split('?')[0]
      if (seen.size < 200 && !seen.has(shape)) {
        seen.add(shape)
        console.warn('[record-ssr] axios call skipped on the server:', config?.method, shape)
      }
      return new Promise(() => {})
    }
  },
})
