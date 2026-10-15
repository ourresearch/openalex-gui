// oxjob #1689: the only API calls the server makes for a record page.
//
// - A service key from the environment (NUXT_SSR_API_KEY, else #1688's
//   ASSISTANT_PAGES_API_KEY), sent as a header; it never reaches the page or payload.
// - A recognizable User-Agent, so API logs can tell SSR traffic apart.
// - A hard per-request timeout: on a slow API the page falls back to the SPA shell.
// - A small, bounded, short-lived cache keyed by API path. Everything in it is public
//   record data fetched with the service key (nothing per visitor), and it saves the
//   second fetch when a non-canonical URL 301s to its canonical one. It holds JSON
//   text, parsed per request, so no two renders ever share (and mutate) one object.
//   shortcut: whole-entry LRU by insertion order with a byte budget; fine at a few
//   hundred entries, use lru-cache if it ever needs to be bigger.

export const SSR_USER_AGENT = 'openalex.org ssr (oxjob 1689)'
const API_BASE = 'https://api.openalex.org/'
export const RECORD_TIMEOUT_MS = Number(process.env.SSR_RECORD_TIMEOUT_MS) || 1500
export const LIST_TIMEOUT_MS = Number(process.env.SSR_LIST_TIMEOUT_MS) || 1500

const CACHE_TTL_MS = 60_000
const CACHE_MAX_BYTES = 32 * 1024 * 1024
const CACHE_MAX_ENTRY_BYTES = 2 * 1024 * 1024

type Cached = { status: 'ok', text: string } | { status: 'notfound' }
type CacheEntry = { at: number, bytes: number, value: Cached }
const cache = new Map<string, CacheEntry>()
let cacheBytes = 0

export type ApiResult =
  | { status: 'ok', data: any, bytes: number }
  | { status: 'notfound' }
  | { status: 'unavailable', reason: string }

function apiKey(): string | undefined {
  return process.env.NUXT_SSR_API_KEY || process.env.ASSISTANT_PAGES_API_KEY || undefined
}

function cacheGet(key: string): ApiResult | undefined {
  const e = cache.get(key)
  if (!e) return
  if (Date.now() - e.at > CACHE_TTL_MS) {
    cache.delete(key)
    cacheBytes -= e.bytes
    return
  }
  if (e.value.status === 'notfound') return { status: 'notfound' }
  return { status: 'ok', data: JSON.parse(e.value.text), bytes: e.value.text.length }
}

function cachePut(key: string, value: Cached, bytes: number) {
  if (bytes > CACHE_MAX_ENTRY_BYTES) return
  const old = cache.get(key)
  if (old) { cache.delete(key); cacheBytes -= old.bytes }
  cache.set(key, { at: Date.now(), bytes, value })
  cacheBytes += bytes
  for (const [k, e] of cache) {
    if (cacheBytes <= CACHE_MAX_BYTES) break
    cache.delete(k)
    cacheBytes -= e.bytes
  }
}

export function cacheStats() {
  return { entries: cache.size, bytes: cacheBytes }
}

export function clearCache() {
  cache.clear()
  cacheBytes = 0
}

/**
 * GET api.openalex.org/<apiPath>. `apiPath` must be built by src/ssr/recordRoutes.js
 * from a validated type and id (never from the request's query string).
 */
export async function apiGet(apiPath: string, timeoutMs: number, transform?: (data: any) => any): Promise<ApiResult> {
  const cached = cacheGet(apiPath)
  if (cached) return cached
  const headers: Record<string, string> = { 'User-Agent': SSR_USER_AGENT, Accept: 'application/json' }
  const key = apiKey()
  if (key) headers.Authorization = `Bearer ${key}`
  let res: Response
  try {
    // The API answers a merged id with the surviving record (it follows its own 301).
    res = await fetch(API_BASE + apiPath, { headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })
  } catch (err: any) {
    return { status: 'unavailable', reason: err?.name === 'TimeoutError' ? 'timeout' : `network: ${err?.message || err}` }
  }
  if (res.status === 404) {
    res.body?.cancel().catch(() => {})
    cachePut(apiPath, { status: 'notfound' }, 64)
    return { status: 'notfound' }
  }
  if (!res.ok) {
    res.body?.cancel().catch(() => {})
    return { status: 'unavailable', reason: `http ${res.status}` }
  }
  let text: string
  try {
    text = await res.text()
  } catch (err: any) {
    return { status: 'unavailable', reason: err?.name === 'TimeoutError' ? 'timeout' : `read: ${err?.message || err}` }
  }
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    return { status: 'unavailable', reason: 'not json' }
  }
  if (!data || typeof data !== 'object' || data.error) {
    return { status: 'unavailable', reason: `api error: ${String(data?.error || 'empty').slice(0, 80)}` }
  }
  if (transform) {
    data = transform(data)
    if (!data) return { status: 'unavailable', reason: 'unexpected shape' }
    text = JSON.stringify(data)
  }
  cachePut(apiPath, { status: 'ok', text }, text.length)
  return { status: 'ok', data, bytes: text.length }
}
