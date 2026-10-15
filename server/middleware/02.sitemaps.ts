// oxjob #1689: /sitemap.xml, /sitemap-<group>.xml and /sitemap-<group>-<NNNNN>.xml.gz, proxied from the
// bucket the nightly Walden job writes (server/utils/sitemaps.ts). Runs before 03.paths, which would
// otherwise 404 these root "file" paths. Off (falls through to that 404) until SITEMAPS_BUCKET_URL is set.
import { defineEventHandler, getRequestHeader, setResponseHeaders, setResponseStatus } from 'h3'
import { originRequest, responseFor, sitemapConfig, sitemapName } from '../utils/sitemaps'

export default defineEventHandler(async (event) => {
  const name = sitemapName(event.path)
  if (!name || (event.method !== 'GET' && event.method !== 'HEAD')) return
  const cfg = sitemapConfig()
  if (!cfg) return
  const { url, headers } = originRequest(cfg, name, event.method, {
    'if-none-match': getRequestHeader(event, 'if-none-match'),
    'if-modified-since': getRequestHeader(event, 'if-modified-since'),
  })
  let res: Response | null = null
  try {
    res = await fetch(url, { method: event.method, headers, signal: AbortSignal.timeout(10_000) })
  } catch (err) {
    console.error('sitemap origin fetch failed', name, err)
  }
  const out = responseFor(name, res?.status ?? 599, res?.headers ?? new Headers())
  setResponseStatus(event, out.status)
  setResponseHeaders(event, Object.fromEntries(Object.entries(out.headers).filter(([, v]) => v !== undefined)) as Record<string, string>)
  if (out.status !== 200 || event.method === 'HEAD' || !res?.body) {
    await res?.body?.cancel()
    return out.status === 200 ? '' : out.status === 304 ? null : out.status === 404 ? 'Not found' : 'Sitemap temporarily unavailable'
  }
  return res.body
})
