// oxjob #1689 parity: the first four things master's server.js does to every
// request, in its order: HTTPS redirect, compression, alpha./analytics. redirects,
// then #1688's pages for verified AI assistants. server/plugins/00.front-door.ts
// puts these ahead of everything Nitro does (route rules, static files, other
// middleware, the Nuxt renderer), as Express did.
import compression from 'compression'
import { defineEventHandler, fromNodeMiddleware, getRequestHeader, getResponseHeader, sendRedirect, setResponseHeader, setResponseHeaders, setResponseStatus } from 'h3'
import type { App, H3Event } from 'h3'
import { assistantPage, HEADER as ASSISTANT_HEADER } from '../../assistantPages/index.mjs'

// Read at request time on purpose: Nitro's build replaces the literal
// `process.env.NODE_ENV` with "production", and server.js decided at runtime.
const NODE_ENV_KEY = 'NODE_ENV'
const runtimeEnv = () => process.env[NODE_ENV_KEY]

// Express's req.hostname: the Host header without its port.
function hostname(event: H3Event): string {
  const host = getRequestHeader(event, 'host') || ''
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1)
  return host.split(':')[0]
}

// Express's req.originalUrl: the path and query string as the client sent them.
function originalUrl(event: H3Event): string {
  return (event.node.req as any).originalUrl || event.node.req.url || '/'
}

// server.js: app.use(sslRedirect(['production'], 301)). heroku-ssl-redirect 0.0.4:
// in production, anything Heroku's router didn't receive over HTTPS gets a 301.
export const sslRedirect = defineEventHandler((event) => {
  if (runtimeEnv() !== 'production') return
  if (getRequestHeader(event, 'x-forwarded-proto') === 'https') return
  return sendRedirect(event, 'https://' + hostname(event) + originalUrl(event), 301)
})

// server.js: app.use(compression()). Same library, same defaults (gzip, deflate,
// brotli; 1 KB threshold; compressible types only; Vary: Accept-Encoding).
export const compress = defineEventHandler(fromNodeMiddleware(compression()))

// Express's req.subdomains (subdomain offset 2), e.g. ["alpha"] for alpha.openalex.org.
function subdomains(event: H3Event): string[] {
  const host = hostname(event)
  if (!host || /^[\d.]+$/.test(host) || host.startsWith('[')) return []
  return host.split('.').reverse().slice(2)
}

// server.js: analytics.openalex.org/ goes to /analytics; any other analytics. or
// alpha. URL goes to the same path on openalex.org (302, Express's default).
// server.js rebuilt the query from Express's parsed req.query; this keeps the
// query string as sent, which is the same for every ordinary URL.
export const subdomainRedirect = defineEventHandler((event) => {
  const subs = subdomains(event)
  if (!subs.includes('analytics') && !subs.includes('alpha')) return
  const url = originalUrl(event)
  const qIndex = url.indexOf('?')
  const path = qIndex === -1 ? url : url.slice(0, qIndex)
  if (subs.includes('analytics') && path === '/') return sendRedirect(event, 'https://openalex.org/analytics', 302)
  return sendRedirect(event, 'https://openalex.org' + url, 302)
})

// server.js (#1688): readable pages for verified AI assistants. Cloudflare sets
// X-OpenAlex-Verified-Assistant to a secret on verified "AI Assistant" requests;
// assistantPage() checks it in constant time against VERIFIED_ASSISTANT_TOKEN,
// picks HTML or Markdown by Accept, and marks the page noindex. With the token
// unset, or the header absent, this does nothing; any failure serves the site.
export const assistantPages = defineEventHandler(async (event) => {
  const token = process.env.VERIFIED_ASSISTANT_TOKEN
  if (!token || !getRequestHeader(event, ASSISTANT_HEADER)) return
  let page = null
  try {
    page = await assistantPage(
      { method: event.method, url: new URL('https://openalex.org' + originalUrl(event)), header: (name: string) => getRequestHeader(event, name) },
      { VERIFIED_ASSISTANT_TOKEN: token, ASSISTANT_PAGES_API_KEY: process.env.ASSISTANT_PAGES_API_KEY },
    )
  } catch (err) {
    console.error('Assistant page failed; serving the site instead.', err)
  }
  if (!page) return
  setResponseStatus(event, page.status)
  setResponseHeaders(event, page.headers)
  return page.body
})

// server.js order.
export const FRONT_DOOR = [sslRedirect, compress, subdomainRedirect, assistantPages]

// Puts FRONT_DOOR, in order, ahead of every handler already on the app.
export function installFrontDoor(app: App) {
  const stack = app.stack as unknown[]
  for (const handler of [...FRONT_DOOR].reverse()) {
    app.use(handler)
    stack.unshift(stack.pop())
  }
}

// Cache-Control where nothing set one (#860): HTML is `no-cache` (each deploy
// changes the hashed asset URLs inside it); other public files (PDFs, brand
// assets, favicons) keep serve-static's `public, max-age=0`, so a deploy shows up
// at once instead of after Cloudflare's 2-hour default. Hashed /_nuxt/ files
// already get `max-age=31536000, immutable` from Nuxt's route rule.
export function setDefaultCacheControl(event: H3Event) {
  if (getResponseHeader(event, 'cache-control')) return
  const type = String(getResponseHeader(event, 'content-type') || '')
  // Nitro's static handler is the only one that sets Last-Modified.
  if (type.startsWith('text/html')) setResponseHeader(event, 'cache-control', 'no-cache')
  else if (getResponseHeader(event, 'last-modified')) setResponseHeader(event, 'cache-control', 'public, max-age=0')
}
