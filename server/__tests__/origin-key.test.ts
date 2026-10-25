// oxjob #1782: the site's side-door check (server/lib/origin-key.ts), over real HTTP.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import http from 'node:http'
import { createApp, toNodeListener, defineEventHandler } from 'h3'
import { originKey, MissLog, ORIGIN_HEADER } from '../lib/origin-key'

const SECRET = 's3cret-value'
let server: http.Server
let port: number

beforeAll(async () => {
  const app = createApp()
  app.use(originKey)
  app.use(defineEventHandler(() => 'page'))
  server = http.createServer(toNodeListener(app))
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
  port = (server.address() as any).port
})
afterAll(() => server.close())

let warn: ReturnType<typeof vi.spyOn>
let hour = 0
function setEnv(secret?: string, mode?: string) {
  vi.stubEnv('ORIGIN_SHARED_SECRET', secret ?? '')
  vi.stubEnv('ORIGIN_KEY_MODE', mode ?? '')
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  // The sampler is per process: give each test a fresh minute so earlier tests don't use up its lines.
  vi.spyOn(Date, 'now').mockReturnValue(++hour * 3_600_000)
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// http.request, not fetch: fetch won't let a test set Host.
function get(path: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number, location?: string }>((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, headers: { host: 'openalex.org', ...headers } }, (res) => {
      res.resume()
      res.on('end', () => resolve({ status: res.statusCode!, location: res.headers.location }))
    })
    req.on('error', reject)
    req.end()
  })
}
const lines = () => warn.mock.calls.map((c) => String(c[0])).filter((l) => l.startsWith('origin_key_miss '))

describe('origin key', () => {
  it.each([[undefined, undefined], [SECRET, 'off']])('is off with secret %s, mode %s', async (secret, mode) => {
    setEnv(secret, mode)
    expect((await get('/works')).status).toBe(200)
    expect(lines()).toEqual([])
  })

  it('logs and serves misses by default', async () => {
    setEnv(SECRET)
    expect((await get('/works')).status).toBe(200)
    expect((await get('/works', { [ORIGIN_HEADER]: 'nope' })).status).toBe(200)
    expect(lines()).toHaveLength(2)
    expect(lines()[0]).toContain('reason=missing')
    expect(lines()[1]).toContain('reason=wrong')
  })

  it('is silent for the right secret, and accepts either during a rotation', async () => {
    setEnv('new-one, old-one', 'enforce')
    expect((await get('/works', { [ORIGIN_HEADER]: 'new-one' })).status).toBe(200)
    expect((await get('/works', { [ORIGIN_HEADER]: 'old-one' })).status).toBe(200)
    expect(lines()).toEqual([])
  })

  it('enforce: other hostnames get a 301 to openalex.org, openalex.org without the key a 403', async () => {
    setEnv(SECRET, 'enforce')
    const direct = await get('/works?page=2', { host: 'openalex-gui.herokuapp.com' })
    expect(direct.status).toBe(301)
    expect(direct.location).toBe('https://openalex.org/works?page=2')
    expect((await get('/works')).status).toBe(403)
    expect((await get('/works', { host: 'www.openalex.org' })).status).toBe(403)
  })

  it('treats an unknown mode as log', async () => {
    setEnv(SECRET, 'enforec')
    expect((await get('/works')).status).toBe(200)
  })

  it('logs path only, quoted fields, no secret or IP', async () => {
    setEnv(SECRET)
    await get('/works?api_key=CUSTOMERKEY&mailto=a@b.org', {
      [ORIGIN_HEADER]: 'almost-' + SECRET,
      'x-forwarded-for': '10.1.2.3, 203.0.113.9',
      'user-agent': 'python-requests/2.31',
      'cf-worker': 'example.org',
      'x-request-id': 'abc reason=fake',
    })
    const [line] = lines()
    expect(line).not.toContain(SECRET)
    expect(line).not.toContain('CUSTOMERKEY')
    expect(line).not.toContain('a@b.org')
    expect(line).not.toContain('203.0.113.9')
    expect(line).toContain('path="/works"')
    expect(line).toContain('ua="python-requests/2.31"')
    expect(line).toContain('cf_worker="example.org"')
    expect(line).toContain('req="abc reason=fake"')
  })
})

describe('MissLog', () => {
  it('caps lines per minute and reports the skips', () => {
    let now = 0
    const out: string[] = []
    const log = new MissLog(2, (l) => out.push(l), () => now)
    expect([1, 2, 3, 4, 5].map(() => log.shouldLog())).toEqual([true, true, false, false, false])
    now = 61_000
    expect(log.shouldLog()).toBe(true)
    expect(out).toEqual(['origin_key_miss_skipped count=3'])
  })
})
