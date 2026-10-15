import { defineNitroPlugin } from 'nitropack/runtime'
// oxjob #1689 Nuxt trial: print SSR error stacks (production build hides them).
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error: any, ctx: any) => {
    // #1689 parity: a missing /_nuxt/ file is a 404, not a server error (bots probe them).
    if ((error?.statusCode ?? 500) < 500) return
    console.error('[ssr-error]', ctx?.event?.path, error?.stack || error)
  })
})
