// oxjob #1689: record pages (/works/W123, /authors/A123, /keywords/x, /W123, ...).
//
// Before Nuxt renders a record page this middleware fetches the record (and starts
// the page's works list) with the server's own key, then decides:
//   - the URL isn't the canonical form (short form /W123, lowercase id, trailing
//     slash)                       -> 301 to /works/W123 at once, no API call: the
//     long form then does the rest (a merged id is a second 301; unknown id a 404)
//   - API says 404                 -> status 404; the page renders "not found"
//   - merged id (the record has another id) -> one 301 to the record's URL
//   - API slow (> ~1.5 s) or failing -> the plain SPA shell (the browser fetches
//     and renders, exactly as before SSR), never an error page
//   - otherwise                    -> server render, with the data in
//     event.context.oxRecord for EntityPage.vue, and whether this visitor gets
//     the "Notice to agents" (server/lib/agentNotice.mjs)
// Paths under a record prefix that aren't a valid id (/works/W1/x, /keywords/a%2Fb)
// get the SPA shell, as today. Runs after the front door (server/plugins/00.front-door.ts:
// HTTPS, subdomain redirects, #1688 assistant pages) and before 03.paths.ts.
import { defineEventHandler, getRequestHeader, sendRedirect, setResponseHeader, setResponseStatus } from 'h3'
import { isUnderRecordPrefix, parseRecordPath, pathFromApiId, trimWorksList, worksListApiPath, worksListPlan } from '../../src/ssr/recordRoutes.js'
import { apiGet, LIST_TIMEOUT_MS, RECORD_TIMEOUT_MS } from '../lib/ssrApi'
import { showsAgentNotice } from '../lib/agentNotice.mjs'
import { createRenderGate, createSlotStats, isVerifiedCaller, reservedFromEnv } from '../lib/renderSlots'

export const SPA_FALLBACK_HEADER = 'x-openalex-ssr-fallback'

// Cache-Control for the responses this middleware ends or reroutes. A successfully
// server-rendered page gets its caching headers (ETag, Cache-Control: no-cache,
// Vary) from the render:response hook (server/recordHttpCache.mjs); anything left
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

// Admission control: at most this many server renders in flight per process; a
// request waits up to RENDER_WAIT_MS for a slot, else gets the SPA shell. Bounds the
// server's memory under a crawler burst (a 90-wide burst took one process to ~1.1 GB
// RSS on desk without it). shortcut: per process, not per dyno pool.
// #2104: with VERIFIED_BOT_TOKEN set, SSR_RESERVED_RENDERS (default 4) of the slots are
// kept for verified crawlers and assistants, and only they wait (server/lib/renderSlots.ts).
const MAX_RENDERS = Number(process.env.SSR_MAX_CONCURRENT_RENDERS) || 12
const RENDER_WAIT_MS = 1000
const RESERVED = reservedFromEnv(MAX_RENDERS)
const gate = createRenderGate({ max: MAX_RENDERS, reserved: RESERVED, waitMs: RENDER_WAIT_MS })
const stats = createSlotStats()

// One line per process a minute: how many record renders each kind of caller got and
// how many got the shell because the slots were full ("shed" = before any API call).
const STATS_EVERY_MS = 60_000
setInterval(() => {
  const c = stats.take()
  if (!Object.values(c).some(Boolean)) return
  console.log(`[record-ssr] slots 60s: verified rendered=${c.verifiedRendered} busy=${c.verifiedBusy}; `
    + `others rendered=${c.othersRendered} busy=${c.othersBusy} shed=${c.othersShedEarly}; `
    + `reserved=${RESERVED}/${MAX_RENDERS}`)
}, STATS_EVERY_MS).unref()

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

  // Short form (/W123), lowercase id or trailing slash: 301 to the long form right
  // away, without asking the API (live: 30% of record requests were short forms,
  // and the lookup made their 301 wait p50 356 ms, p95 1.9 s). The long form does
  // the merged-id 301 and the 404, so a merged short id is two cheap hops.
  if (pathname !== ref.canonicalPath) return redirect(event, ref.canonicalPath + search)

  // #2104: when only the reserved slots are free, unverified callers get the shell
  // now, before any API call; verified crawlers and assistants go on.
  const header = (name: string) => getRequestHeader(event, name)
  const verified = isVerifiedCaller(header)
  if (gate.shedsEarly(verified)) {
    stats.shedEarly()
    return spaShell(event, 'busy')
  }

  // Start the list with the record, unless the list depends on the record
  // (sources: repositories list works in any location).
  const earlyPlan = ref.type !== 'sources' ? worksListPlan(ref.type, null) : null
  const earlyList = earlyPlan ? fetchWorksList(earlyPlan, ref.id) : null

  const rec = await apiGet(ref.apiPath, RECORD_TIMEOUT_MS)
  if (rec.status === 'unavailable') {
    console.warn('[record-ssr] SPA fallback', ref.apiPath, rec.reason)
    return spaShell(event, rec.reason)
  }
  if (rec.status === 'notfound') {
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
  if (!(await gate.acquire(verified))) {
    stats.busy(verified)
    // Others are counted in the minute line only: a line each would be the scraper's volume.
    if (verified) console.warn('[record-ssr] SPA fallback', ref.apiPath, 'busy', 'verified')
    return spaShell(event, 'busy')
  }
  stats.rendered(verified)
  let released = false
  const release = () => { if (!released) { released = true; gate.release() } }
  event.node.res.once('close', release)
  event.node.res.once('finish', release)

  // Test hook for the render-error fallback (unset in production): this id's record
  // throws when the page reads its title.
  if (process.env.NUXT_SSR_TEST_FAULT_ID && process.env.NUXT_SSR_TEST_FAULT_ID === ref.id) {
    Object.defineProperty(rec.data, 'display_name', { get() { throw new Error('test fault') } })
  }
  event.context.oxRecord = {
    apiPath: ref.apiPath,
    data: rec.data,
    works: earlyList || (plan ? fetchWorksList(plan, ref.id) : null),
    agentNotice: showsAgentNotice(header),
  }
  setResponseHeader(event, 'x-openalex-render', 'ssr')
})
