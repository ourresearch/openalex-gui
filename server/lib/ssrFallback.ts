// oxjob #1689: if a server render of a record page fails, the visitor gets the plain
// SPA shell (the browser renders the page, as before SSR), never Nuxt's 500 page.
//
// Installed as the first Nitro error handler (nuxt.config.ts, `nitro:config` hook),
// ahead of Nuxt's own. It acts only on responses the record middleware marked as
// server-rendered; everything else falls through to Nuxt's handler unchanged.
import { getRequestHeaders, getResponseHeader, send, setResponseHeader, setResponseStatus } from 'h3'
import { useNitroApp } from 'nitropack/runtime'

const FALLBACK_HEADER = 'x-openalex-ssr-fallback' // same as server/middleware/02.records.ts

export default async function recordSsrFallback(error: any, event: any) {
  if (event.handled) return
  const render = String(getResponseHeader(event, 'x-openalex-render') || '')
  if (!render.startsWith('ssr')) return
  if (getRequestHeaders(event)[FALLBACK_HEADER]) return
  const status = Number(error?.statusCode || error?.status) || 500
  if (status < 500) return
  console.error('[record-ssr] render failed; serving the SPA shell', event.path, error?.cause?.stack || error?.stack || error)
  let html: string | null = null
  try {
    const res = await useNitroApp().localFetch(event.path, {
      headers: { ...getRequestHeaders(event), [FALLBACK_HEADER]: '1' },
      redirect: 'manual',
    })
    if (res.status === 200) html = await res.text()
  } catch (err) {
    console.error('[record-ssr] SPA fallback failed too', event.path, err)
  }
  if (html === null || event.handled) return
  setResponseStatus(event, 200)
  setResponseHeader(event, 'content-type', 'text/html;charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache')
  setResponseHeader(event, 'x-openalex-render', 'spa; render error')
  return send(event, html)
}
