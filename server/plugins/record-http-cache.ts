// oxjob #1689: ETag, 304 and Cache-Control on server-rendered record pages
// (logic and reasons in server/recordHttpCache.mjs).
import { defineNitroPlugin } from 'nitropack/runtime'
import { getRequestHeader } from 'h3'
import { applyRecordHttpCache } from '../recordHttpCache.mjs'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response: any, { event }: any) => {
    applyRecordHttpCache(response, {
      method: event.method,
      path: event.path,
      ifNoneMatch: getRequestHeader(event, 'if-none-match'),
    })
  })
})
