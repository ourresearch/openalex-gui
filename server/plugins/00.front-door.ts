// oxjob #1689 parity with master's server.js, for every response.
// 1. HTTPS redirect, compression, the alpha./analytics. redirects and #1688's
//    assistant pages run first, ahead of Nitro's route rules and static files, as
//    they did in Express (server/middleware/ would run after static files).
// 2. Cache-Control defaults where nothing set one (no-cache HTML, #860).
import { defineNitroPlugin } from 'nitropack/runtime'
import { installFrontDoor, setDefaultCacheControl } from '../lib/front-door'

export default defineNitroPlugin((nitroApp) => {
  installFrontDoor(nitroApp.h3App)
  nitroApp.hooks.hook('beforeResponse', (event) => setDefaultCacheControl(event))
})
