// oxjob #1782: the site should be reached only through Cloudflare (openalex.org), where the
// WAF and the bot rules (#338, #1691) run. openalex-gui.herokuapp.com, or any request sent
// straight to Heroku with `Host: openalex.org`, skips them. A Cloudflare transform rule stamps
// X-OpenAlex-Origin-Key on openalex.org and www.openalex.org requests; this handler notes, and
// in enforce mode turns away, requests without it. It runs after the alpha./analytics.
// redirects (those hosts aren't stamped and only ever redirect to openalex.org).
//
// Config vars on openalex-gui (each `config:set` restarts the app):
//   ORIGIN_SHARED_SECRET  the accepted secret, or several comma-separated so a rotation can
//                         overlap. Unset: the check is off.
//   ORIGIN_KEY_MODE       "log" (default): log each miss and serve it anyway. "enforce": a
//                         request to another hostname (herokuapp.com) gets a 301 to
//                         openalex.org; one already claiming openalex.org gets a 403 (a
//                         redirect there would loop if the Cloudflare rule were ever lost).
//                         "off": skip. Any other value counts as "log".
//
// Each process logs up to LOG_PER_MINUTE misses a minute, then a line saying how many it
// skipped. Lines start with "origin_key_miss"; Better Stack redacts IPs at ingest, so a line
// carries a keyed hash of the client IP instead.
import crypto from 'node:crypto'
import { defineEventHandler, sendRedirect, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { tokenOk } from '../../assistantPages/index.mjs'

export const ORIGIN_HEADER = 'x-openalex-origin-key'
const LOG_PER_MINUTE = 5
const SITE = 'https://openalex.org'
const SITE_HOSTS = new Set(['openalex.org', 'www.openalex.org'])

// Per-process sampler: up to `limit` lines a minute, then a count of the rest.
// shortcut: a minute's skip count is written when the next miss arrives in a later minute, so
// the last minute of a burst is never reported. Fine for spotting callers.
export class MissLog {
  private minute = -1
  private count = 0
  constructor(private limit: number, private warn: (line: string) => void, private now: () => number = () => Date.now()) {}

  shouldLog(): boolean {
    const minute = Math.floor(this.now() / 60000)
    if (minute !== this.minute) {
      if (this.count > this.limit) this.warn(`origin_key_miss_skipped count=${this.count - this.limit}`)
      this.minute = minute
      this.count = 0
    }
    this.count += 1
    return this.count <= this.limit
  }
}

const misses = new MissLog(LOG_PER_MINUTE, (line) => console.warn(line))

// Node lower-cases header names; reading them directly skips h3's copy of every header.
const header = (event: H3Event, name: string) => {
  const v = event.node.req.headers[name]
  return Array.isArray(v) ? v.join(', ') : v || ''
}
// A header value as a quoted, length-capped field, so it can't forge other fields.
const q = (value: string, n = 200) => JSON.stringify(value.slice(0, n))
const hostOf = (event: H3Event) => header(event, 'host').split(':')[0].toLowerCase()
// Express's req.originalUrl, as front-door.ts's redirects use it.
const originalUrl = (event: H3Event) => (event.node.req as any).originalUrl || event.node.req.url || '/'

function missLine(event: H3Event, reason: string, hashKey: string): string {
  // The LAST X-Forwarded-For entry: Heroku's router appends the address that connected to it.
  // (h3's getRequestIP takes the first entry, which the client can forge.)
  const ip = header(event, 'x-forwarded-for').split(',').pop()!.trim() || event.node.req.socket?.remoteAddress || ''
  const ipHash = ip ? crypto.createHmac('sha256', hashKey).update(ip).digest('hex').slice(0, 10) : '-'
  const path = originalUrl(event).split('?')[0] // path only: the query string can hold api_key / mailto
  return `origin_key_miss reason=${reason} host=${q(hostOf(event), 100)} method=${event.method} path=${q(path)}`
    + ` ua=${q(header(event, 'user-agent'))} cf_worker=${q(header(event, 'cf-worker'), 100)}`
    + ` ip_hash=${ipHash} req=${q(header(event, 'x-request-id'), 64)}`
}

export const originKey = defineEventHandler((event) => {
  // Read at request time (like NODE_ENV in front-door.ts): Nitro's build inlines some process.env.
  const keys = (process.env.ORIGIN_SHARED_SECRET || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!keys.length) return
  const mode = (process.env.ORIGIN_KEY_MODE || 'log').trim().toLowerCase()
  if (mode === 'off') return
  const got = header(event, ORIGIN_HEADER)
  if (keys.some((k) => tokenOk(got, k))) return
  if (misses.shouldLog()) console.warn(missLine(event, got ? 'wrong' : 'missing', keys[0]))
  if (mode !== 'enforce') return
  if (!SITE_HOSTS.has(hostOf(event))) return sendRedirect(event, SITE + originalUrl(event), 301)
  setResponseStatus(event, 403)
  return 'Please visit https://openalex.org'
})
