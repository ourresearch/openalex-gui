// oxjob #1689: ETag, 304, Cache-Control, Cache-Tag, Link and Content-Signal on
// server-rendered record pages (logic and reasons in server/recordHttpCache.mjs).
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { getRequestHeader } from 'h3'
import { applyRecordHttpCache } from '../recordHttpCache.mjs'

export default defineNitroPlugin((nitro) => {
  // Nuxt's id for this build (a UUID; also in /_nuxt/builds/latest.json).
  const buildId = (useRuntimeConfig() as any).app?.buildId
  nitro.hooks.hook('render:response', (response: any, { event }: any) => {
    applyRecordHttpCache(response, {
      method: event.method,
      path: event.path,
      ifNoneMatch: getRequestHeader(event, 'if-none-match'),
      recordId: event.context.oxRecord?.data?.id,
      buildId,
    })
  })
})
