// oxjob #1689 parity: master's server.js behaviours on the Nuxt server
// (server/lib/front-door.ts), checked over real HTTP against an h3 app built the
// way Nitro builds it: route rules first, then static files, then the renderer.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import http from 'node:http'
import zlib from 'node:zlib'
import { createApp, toNodeListener, defineEventHandler, setResponseHeader } from 'h3'
import { installFrontDoor, setDefaultCacheControl } from '../lib/front-door'

const BIG_HTML = '<!DOCTYPE html><html><body>' + 'x'.repeat(5000) + '</body></html>'
const PROXIED = '<!DOCTYPE html>' + 'abcdefghij'.repeat(200000)
let server: http.Server
let base: string
const seen: string[] = []

beforeAll(async () => {
  const app = createApp({ onBeforeResponse: (event) => setDefaultCacheControl(event) })
  // Stand-ins for what Nitro registers before plugins run.
  app.use(defineEventHandler((event) => { seen.push('route-rules:' + event.path) }))
  app.use(defineEventHandler((event) => {
    if (event.path === '/brand-assets/openalex-lockup.png') {
      setResponseHeader(event, 'content-type', 'image/png')
      setResponseHeader(event, 'last-modified', new Date(0).toUTCString())
      return Buffer.alloc(4000)
    }
    if (event.path === '/robots.txt') {
      setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
      setResponseHeader(event, 'last-modified', new Date(0).toUTCString())
      return 'User-agent: *\n' + 'Allow: /\n'.repeat(300)
    }
    // Nitro's static handler serving a precompressed .br file (compressPublicAssets).
    if (event.path === '/_nuxt/precompressed.js') {
      setResponseHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
      setResponseHeader(event, 'content-type', 'text/javascript; charset=utf-8')
      setResponseHeader(event, 'content-encoding', 'br')
      setResponseHeader(event, 'vary', 'Accept-Encoding')
      return zlib.brotliCompressSync(Buffer.from(PROXIED))
    }
    if (event.path.startsWith('/_nuxt/')) {
      setResponseHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
      setResponseHeader(event, 'content-type', 'text/javascript; charset=utf-8')
      setResponseHeader(event, 'last-modified', new Date(0).toUTCString())
      return 'console.log(1);'.repeat(500)
    }
  }))
  // h3's sendProxy pattern (proxy route rules): write chunks, then `return res.end()`.
  app.use(defineEventHandler((event) => {
    if (event.path !== '/proxied') return
    event.node.res.setHeader('content-type', 'text/html; charset=utf-8')
    for (let i = 0; i < PROXIED.length; i += 65536) event.node.res.write(PROXIED.slice(i, i + 65536))
    return event.node.res.end()
  }))
  app.use(defineEventHandler((event) => {
    setResponseHeader(event, 'content-type', 'text/html;charset=utf-8')
    return event.path === '/tiny' ? '<p>hi</p>' : BIG_HTML
  }))
  installFrontDoor(app)
  // Stand-in for Nitro's in-process fetch (mock req carrying __unenv__).
  app.use(defineEventHandler((event) => { if (event.node.req.headers['x-test-internal']) (event.node.req as any).__unenv__ = {} }))
  ;(app.stack as unknown[]).unshift((app.stack as unknown[]).pop())
  server = http.createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
  base = `http://127.0.0.1:${(server.address() as any).port}`
})
afterAll(() => server.close())
afterEach(() => {
  vi.unstubAllEnvs()
  seen.length = 0
})

// Raw HTTP (fetch would follow redirects, decompress, and refuse to set Host).
function get(path: string, headers: Record<string, string> = {}): Promise<{ status: number, headers: http.IncomingHttpHeaders, body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(base + path, { headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    req.end()
  })
}

describe('HTTPS redirect (heroku-ssl-redirect, production only)', () => {
  it('301s plain HTTP to https on the same host, path and query, without the port', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const r = await get('/works?filter=x:1', { Host: 'openalex.org:80' })
    expect(r.status).toBe(301)
    expect(r.headers.location).toBe('https://openalex.org/works?filter=x:1')
  })
  it('passes requests Heroku received over HTTPS', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect((await get('/about', { 'X-Forwarded-Proto': 'https' })).status).toBe(200)
  })
  it('redirects static files too (it runs before them, as in Express)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect((await get('/brand-assets/openalex-lockup.png', { Host: 'openalex.org' })).status).toBe(301)
  })
  it('does nothing outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect((await get('/about')).status).toBe(200)
  })
})

describe("Nitro's in-process requests", () => {
  it('skip the front door: no redirect, no compression', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const r = await get('/about', { Host: 'alpha.openalex.org', 'Accept-Encoding': 'gzip', 'x-test-internal': '1' })
    expect(r.status).toBe(200)
    expect(r.headers['content-encoding']).toBeUndefined()
    expect(r.body.toString()).toBe(BIG_HTML)
  })
})

describe('alpha. and analytics. subdomains', () => {
  it('sends analytics.openalex.org/ to /analytics', async () => {
    const r = await get('/', { Host: 'analytics.openalex.org' })
    expect(r.status).toBe(302)
    expect(r.headers.location).toBe('https://openalex.org/analytics')
  })
  it('keeps path and query for other analytics. and alpha. URLs', async () => {
    for (const host of ['analytics.openalex.org', 'alpha.openalex.org']) {
      const r = await get('/works?filter=publication_year:2020&page=2', { Host: host })
      expect(r.status).toBe(302)
      expect(r.headers.location).toBe('https://openalex.org/works?filter=publication_year:2020&page=2')
    }
    expect((await get('/', { Host: 'alpha.openalex.org' })).headers.location).toBe('https://openalex.org/')
  })
  it('leaves openalex.org, staging and localhost alone', async () => {
    for (const host of ['openalex.org', 'staging.openalex.org', 'localhost:3000', '127.0.0.1:5000']) {
      expect((await get('/about', { Host: host })).status).toBe(200)
    }
  })
  it('runs before route rules', async () => {
    await get('/works', { Host: 'alpha.openalex.org' })
    expect(seen).toEqual([])
  })
})

describe('compression (the compression package, as server.js)', () => {
  it('gzips HTML and says so in Vary', async () => {
    const r = await get('/about', { 'Accept-Encoding': 'gzip' })
    expect(r.headers['content-encoding']).toBe('gzip')
    expect(r.headers.vary).toMatch(/Accept-Encoding/i)
    expect(zlib.gunzipSync(r.body).toString()).toBe(BIG_HTML)
  })
  it('prefers brotli when offered', async () => {
    const r = await get('/about', { 'Accept-Encoding': 'gzip, deflate, br' })
    expect(r.headers['content-encoding']).toBe('br')
    expect(zlib.brotliDecompressSync(r.body).toString()).toBe(BIG_HTML)
  })
  it('compresses static files and hashed assets', async () => {
    expect((await get('/_nuxt/entry.js', { 'Accept-Encoding': 'gzip' })).headers['content-encoding']).toBe('gzip')
    expect((await get('/robots.txt', { 'Accept-Encoding': 'gzip' })).headers['content-encoding']).toBe('gzip')
  })
  it('streams a large proxied response through whole (no stall after 16 KB)', async () => {
    const r = await get('/proxied', { 'Accept-Encoding': 'br' })
    expect(r.headers['content-encoding']).toBe('br')
    expect(zlib.brotliDecompressSync(r.body).toString()).toBe(PROXIED)
  })
  it('never compresses a precompressed static file twice', async () => {
    const r = await get('/_nuxt/precompressed.js', { 'Accept-Encoding': 'gzip, br' })
    expect(r.headers['content-encoding']).toBe('br')
    expect(zlib.brotliDecompressSync(r.body).toString()).toBe(PROXIED)
  })
  it('skips bodies under 1 KB, binary types, and clients that do not ask', async () => {
    expect((await get('/tiny', { 'Accept-Encoding': 'gzip' })).headers['content-encoding']).toBeUndefined()
    expect((await get('/brand-assets/openalex-lockup.png', { 'Accept-Encoding': 'gzip' })).headers['content-encoding']).toBeUndefined()
    const plain = await get('/about')
    expect(plain.headers['content-encoding']).toBeUndefined()
    expect(plain.body.toString()).toBe(BIG_HTML)
  })
})

describe('Cache-Control (#860)', () => {
  it('HTML pages are no-cache', async () => {
    expect((await get('/about')).headers['cache-control']).toBe('no-cache')
  })
  it('public files are public, max-age=0', async () => {
    expect((await get('/brand-assets/openalex-lockup.png')).headers['cache-control']).toBe('public, max-age=0')
    expect((await get('/robots.txt')).headers['cache-control']).toBe('public, max-age=0')
  })
  it('hashed assets keep a year, immutable', async () => {
    expect((await get('/_nuxt/entry.js')).headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })
})

describe('assistant pages (#1688)', () => {
  const TOKEN = 'test-secret-token'
  const work = { id: 'https://openalex.org/W2741809807', display_name: 'The state of OA', publication_year: 2018, type: 'article', authorships: [], cited_by_count: 1 }
  function stubApi() {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(work), { status: 200, headers: { 'content-type': 'application/json' } })))
  }
  afterEach(() => vi.unstubAllGlobals())

  it('serves a verified assistant a plain HTML page, noindex, ahead of everything else', async () => {
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', TOKEN)
    stubApi()
    const r = await get('/works/W2741809807', { 'X-OpenAlex-Verified-Assistant': TOKEN })
    expect(r.status).toBe(200)
    expect(r.headers['content-type']).toMatch(/^text\/html/)
    expect(r.headers['x-robots-tag']).toBe('noindex')
    expect(r.headers['cache-control']).toBe('private, no-store')
    expect(r.body.toString()).toContain('The state of OA')
    expect(r.body.toString()).toContain('<meta name="robots" content="noindex">')
    expect(seen).toEqual([])
  })
  it('serves Markdown when Accept asks for it', async () => {
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', TOKEN)
    stubApi()
    const r = await get('/W2741809807', { 'X-OpenAlex-Verified-Assistant': TOKEN, Accept: 'text/markdown' })
    expect(r.headers['content-type']).toMatch(/^text\/markdown/)
    expect(r.body.toString()).toContain('The state of OA')
  })
  it('a wrong token, no token configured, or no header gets the normal site', async () => {
    stubApi()
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', TOKEN)
    expect((await get('/works/W2741809807', { 'X-OpenAlex-Verified-Assistant': 'wrong' })).body.toString()).toBe(BIG_HTML)
    expect((await get('/works/W2741809807')).body.toString()).toBe(BIG_HTML)
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', '')
    expect((await get('/works/W2741809807', { 'X-OpenAlex-Verified-Assistant': TOKEN })).body.toString()).toBe(BIG_HTML)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('an API failure still answers the assistant (error page), never the shell', async () => {
    vi.stubEnv('VERIFIED_ASSISTANT_TOKEN', TOKEN)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    const r = await get('/works/W2741809807', { 'X-OpenAlex-Verified-Assistant': TOKEN })
    expect(r.status).toBe(502)
    expect(r.headers['x-robots-tag']).toBe('noindex')
  })
})
