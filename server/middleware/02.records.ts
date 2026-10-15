// oxjob #1689: record pages (/works/W123, /authors/A123, /keywords/x, /W123, ...).
//
// Before Nuxt renders a record page this middleware fetches the record (and starts
// the page's works list) with the server's own key, then decides:
//   - API says 404                 -> status 404; the page renders "not found"
//     (at the canonical URL: /W999 and /works/w999 301 there first)
//   - the URL isn't the canonical one (short form /W123, lowercase id, merged id
//     whose record has another id)  -> one 301 to the canonical URL
//   - API slow (> ~1.5 s) or failing -> the plain SPA shell (the browser fetches
//     and renders, exactly as before SSR), never an error page
//   - otherwise                    -> server render, with the data in
//     event.context.oxRecord for EntityPage.vue
// Paths under a record prefix that aren't a valid id (/works/W1/x, /keywords/a%2Fb)
// get the SPA shell, as today. Runs after 02.assistant-pages (verified AI assistants).
import { defineEventHandler, getRequestHeader, sendRedirect, setResponseHeader, setResponseStatus } from 'h3'
import { isUnderRecordPrefix, parseRecordPath, pathFromApiId, trimWorksList, worksListApiPath, worksListPlan } from '../../src/ssr/recordRoutes.js'
import { apiGet, LIST_TIMEOUT_MS, RECORD_TIMEOUT_MS } from '../lib/ssrApi'

export const SPA_FALLBACK_HEADER = 'x-openalex-ssr-fallback'

// Cache-Control for the responses this middleware ends or reroutes. A successfully
// server-rendered page gets its caching headers (ETag, Cache-Control,
// CDN-Cache-Control) from track seo-content's render:response hook; anything left
// unset gets the server's default (no-cache).
const CACHE_NOT_FOUND = 'public, max-age=0, s-maxage=3600'
const CACHE_REDIRECT = 'public, max-age=3600, s-maxage=86400'
// The SPA fallback (slow API) must never be cached, or crawlers keep getting it.
const CACHE_FALLBACK = 'no-cache'

function spaShell(event: any, why: string) {
  event.context.nuxt ||= {}
  event.context.nuxt.noSSR = true
  setResponseHeader(event, 'x-openalex-render', `spa; ${why}`)
  setResponseHeader(event, 'cache-control', CACHE_FALLBACK)
}

function redirect(event: any, location: string) {
  setResponseHeader(event, 'cache-control', CACHE_REDIRECT)
  return sendRedirect(event, location, 301)
}

function fetchWorksList(plan: { filterKey: string, sort: string }, id: string) {
  return apiGet(worksListApiPath(plan, id), LIST_TIMEOUT_MS, trimWorksList)
    .then((r) => (r.status === 'ok' ? r.data : null))
    .catch(() => null)
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const q = event.path.indexOf('?')
  const pathname = q === -1 ? event.path : event.path.slice(0, q)
  const search = q === -1 ? '' : event.path.slice(q)
  const ref = parseRecordPath(pathname)
  if (!ref) {
    if (isUnderRecordPrefix(pathname)) spaShell(event, 'not a record id')
    return
  }
  // The render-error fallback (server/lib/ssrFallback.ts) re-requests the page with
  // this header to get the SPA shell. Anyone may send it; they just get the SPA.
  if (getRequestHeader(event, SPA_FALLBACK_HEADER)) return spaShell(event, 'render error')

  const isCanonicalGuess = pathname === ref.canonicalPath
  // Start the list with the record, unless we'll redirect (non-canonical URL) or the
  // list depends on the record (sources: repositories list works in any location).
  const earlyPlan = isCanonicalGuess && ref.type !== 'sources' ? worksListPlan(ref.type, null) : null
  const earlyList = earlyPlan ? fetchWorksList(earlyPlan, ref.id) : null

  const rec = await apiGet(ref.apiPath, RECORD_TIMEOUT_MS)
  if (rec.status === 'unavailable') {
    console.warn('[record-ssr] SPA fallback', ref.apiPath, rec.reason)
    if (!isCanonicalGuess) return redirect(event, ref.canonicalPath + search)
    return spaShell(event, rec.reason)
  }
  if (rec.status === 'notfound') {
    // Unknown id: 404 at the canonical URL (a short or lowercase form 301s there first).
    if (!isCanonicalGuess) return redirect(event, ref.canonicalPath + search)
    setResponseStatus(event, 404)
    setResponseHeader(event, 'x-openalex-render', 'ssr; not found')
    setResponseHeader(event, 'cache-control', CACHE_NOT_FOUND)
    event.context.oxRecord = { apiPath: ref.apiPath, notFound: true }
    return
  }
  const canonical = pathFromApiId(rec.data.id)
  if (!canonical || !canonical.startsWith(`/${ref.type}/`)) {
    console.warn('[record-ssr] SPA fallback', ref.apiPath, 'unexpected id', String(rec.data.id).slice(0, 80))
    return spaShell(event, 'unexpected id')
  }
  if (canonical !== pathname) return redirect(event, canonical + search)

  const plan = earlyPlan ? null : worksListPlan(ref.type, rec.data)
  // Test hook for the render-error fallback (unset in production): this id's record
  // throws when the page reads its title.
  if (process.env.NUXT_SSR_TEST_FAULT_ID && process.env.NUXT_SSR_TEST_FAULT_ID === ref.id) {
    Object.defineProperty(rec.data, 'display_name', { get() { throw new Error('test fault') } })
  }
  event.context.oxRecord = {
    apiPath: ref.apiPath,
    data: rec.data,
    works: earlyList || (plan ? fetchWorksList(plan, ref.id) : null),
  }
  setResponseHeader(event, 'x-openalex-render', 'ssr')
})
