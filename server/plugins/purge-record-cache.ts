// oxjob #1689 edge cache: purge Cloudflare's cached record pages when a new release
// boots (server/lib/purgeRecordCache.mjs has the when and why).
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { schedulePurges } from '../lib/purgeRecordCache.mjs'

export default defineNitroPlugin(() => {
  if (!process.env.CLOUDFLARE_PURGE_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) return
  schedulePurges(process.env, { builtAt: (useRuntimeConfig() as any).recordCacheBuiltAt })
})
