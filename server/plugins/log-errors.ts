import { defineNitroPlugin } from 'nitropack/runtime'
// oxjob #1689 Nuxt trial: print SSR error stacks (production build hides them).
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error: any, ctx: any) => {
    console.error('[ssr-error]', ctx?.event?.path, error?.stack || error)
  })
})
