// oxjob #1689: sitemap proxy (server/utils/sitemaps.ts, server/middleware/02.sitemaps.ts), SigV4 signer,
// IndexNow key file.
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp, toWebHandler } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { signV4 } from '../sigv4'
import { contentType, originRequest, responseFor, sitemapConfig, sitemapName } from '../sitemaps'
import sitemapsMiddleware from '../../middleware/02.sitemaps'

describe('signV4', () => {
  it("matches AWS's published S3 GET Object example", () => {
    // docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html, "Example: GET Object"
    const h = signV4({
      method: 'GET',
      url: 'https://examplebucket.s3.amazonaws.com/test.txt',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
      headers: { range: 'bytes=0-9' },
      amzDate: '20130524T000000Z',
    })
    expect(h.authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, '
      + 'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, '
      + 'Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
    )
    expect(h['x-amz-date']).toBe('20130524T000000Z')
  })
})

describe('sitemap paths', () => {
  it('serves only the root sitemap names the Walden job writes', () => {
    expect(sitemapName('/sitemap.xml')).toBe('sitemap.xml')
    expect(sitemapName('/sitemap-works-abstract.xml')).toBe('sitemap-works-abstract.xml')
    expect(sitemapName('/sitemap-works-abstract-00001.xml.gz')).toBe('sitemap-works-abstract-00001.xml.gz')
    expect(sitemapName('/sitemap-changed-00020.xml.gz?x=1')).toBe('sitemap-changed-00020.xml.gz')
    for (const bad of ['/sitemaps/index.xml', '/sitemap-../x.xml', '/sitemap-works-1.xml.gz', '/sitemap.xml.gz',
      '/sitemap-Works.xml', '/works/sitemap.xml', '/sitemap-works-abstract-00001.xml', '/sitemap_index.xml']) {
      expect(sitemapName(bad), bad).toBeNull()
    }
  })

  it('content types: gzip files as gzip (no Content-Encoding), indexes as XML', () => {
    expect(contentType('sitemap-works-cited-00001.xml.gz')).toBe('application/gzip')
    expect(contentType('sitemap.xml')).toBe('application/xml; charset=utf-8')
  })
})

describe('origin request', () => {
  it('is off without SITEMAPS_BUCKET_URL', () => {
    expect(sitemapConfig({})).toBeNull()
  })

  it('builds the live/ URL, passes conditionals, signs when keys are set', () => {
    const cfg = sitemapConfig({ SITEMAPS_BUCKET_URL: 'https://acct.r2.cloudflarestorage.com/openalex-sitemaps/', SITEMAPS_ACCESS_KEY_ID: 'AK', SITEMAPS_SECRET_ACCESS_KEY: 'SK' })!
    const { url, headers } = originRequest(cfg, 'sitemap.xml', 'GET', { 'if-none-match': '"abc"', 'if-modified-since': undefined })
    expect(url).toBe('https://acct.r2.cloudflarestorage.com/openalex-sitemaps/live/sitemap.xml')
    expect(headers['if-none-match']).toBe('"abc"')
    expect(headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AK\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/)
    const pub = originRequest(sitemapConfig({ SITEMAPS_BUCKET_URL: 'https://example.org/b', SITEMAPS_PREFIX: '' })!, 'sitemap.xml', 'GET', {})
    expect(pub).toEqual({ url: 'https://example.org/b/sitemap.xml', headers: {} })
  })

  it('maps origin statuses', () => {
    const h = new Headers({ etag: '"e"', 'last-modified': 'Thu, 15 Oct 2026 20:10:00 GMT', 'content-length': '12' })
    const ok = responseFor('sitemap-sources-00001.xml.gz', 200, h)
    expect(ok.status).toBe(200)
    expect(ok.headers).toMatchObject({ 'content-type': 'application/gzip', etag: '"e"', 'x-robots-tag': 'noindex', 'content-length': '12' })
    expect(responseFor('sitemap.xml', 304, h).status).toBe(304)
    expect(responseFor('sitemap.xml', 404, h).status).toBe(404)
    expect(responseFor('sitemap.xml', 403, h).status).toBe(404)
    expect(responseFor('sitemap.xml', 500, h)).toMatchObject({ status: 503, headers: { 'retry-after': '3600' } })
  })
})

describe('02.sitemaps middleware', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllGlobals()
  })

  function app() {
    const a = createApp()
    a.use(sitemapsMiddleware)
    a.use(() => 'fell through')
    return toWebHandler(a)
  }

  it('falls through when unconfigured or not a sitemap path', async () => {
    delete process.env.SITEMAPS_BUCKET_URL
    expect(await (await app()(new Request('http://x/sitemap.xml'))).text()).toBe('fell through')
    process.env.SITEMAPS_BUCKET_URL = 'https://example.org/b'
    expect(await (await app()(new Request('http://x/works/W1'))).text()).toBe('fell through')
  })

  it('streams the object with caching headers, and passes 304s', async () => {
    process.env.SITEMAPS_BUCKET_URL = 'https://example.org/b'
    const body = '<?xml version="1.0"?><sitemapindex/>'
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const h = init.headers as Record<string, string>
      if (h['if-none-match'] === '"v1"') return new Response(null, { status: 304, headers: { etag: '"v1"' } })
      return new Response(body, { status: 200, headers: { etag: '"v1"', 'content-length': String(body.length) } })
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = await app()(new Request('http://x/sitemap.xml'))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(body)
    expect(res.headers.get('content-type')).toBe('application/xml; charset=utf-8')
    expect(res.headers.get('cache-control')).toContain('max-age=3600')
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.org/b/live/sitemap.xml')
    const again = await app()(new Request('http://x/sitemap.xml', { headers: { 'if-none-match': '"v1"' } }))
    expect(again.status).toBe(304)
  })

  it('answers 404 for a missing file and 503 when the bucket is down', async () => {
    process.env.SITEMAPS_BUCKET_URL = 'https://example.org/b'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 404 })))
    expect((await app()(new Request('http://x/sitemap-works-abstract-09999.xml.gz'))).status).toBe(404)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await app()(new Request('http://x/sitemap.xml'))
    expect(res.status).toBe(503)
    expect(res.headers.get('retry-after')).toBe('3600')
  })
})

describe('IndexNow key file', () => {
  it('public/ holds exactly one key file whose body is its own name', () => {
    const pub = resolve(__dirname, '../../../public')
    const keys = readdirSync(pub).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f))
    expect(keys).toHaveLength(1)
    expect(readFileSync(resolve(pub, keys[0]), 'utf8')).toBe(keys[0].replace('.txt', ''))
  })
})
