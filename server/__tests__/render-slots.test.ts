// oxjob #2104: verified crawlers and assistants keep render slots; everyone else gets
// the SPA shell at once, before any API call, when only the reserved slots are free
// (server/lib/renderSlots.ts, server/middleware/02.records.ts).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createApp, defineEventHandler, getQuery, toNodeListener } from 'h3'
import { createRenderGate, isVerifiedCaller, reservedFromEnv, VERIFIED_BOT_HEADER } from '../lib/renderSlots'
import { HEADER as ASSISTANT_HEADER } from '../../assistantPages/index.mjs'

const headers = (h: Record<string, string>) => (name: string) => h[name.toLowerCase()]

describe('isVerifiedCaller', () => {
  const env = { VERIFIED_BOT_TOKEN: 'bot-secret', VERIFIED_ASSISTANT_TOKEN: 'assistant-secret' }
  it('accepts the bot header with the bot secret', () => {
    expect(isVerifiedCaller(headers({ [VERIFIED_BOT_HEADER]: 'bot-secret' }), env)).toBe(true)
  })
  it("accepts #1688's assistant header with the assistant secret", () => {
    expect(isVerifiedCaller(headers({ [ASSISTANT_HEADER]: 'assistant-secret' }), env)).toBe(true)
  })
  it('refuses a guessed or crossed secret, and no header', () => {
    expect(isVerifiedCaller(headers({ [VERIFIED_BOT_HEADER]: 'guess' }), env)).toBe(false)
    expect(isVerifiedCaller(headers({ [VERIFIED_BOT_HEADER]: 'assistant-secret' }), env)).toBe(false)
    expect(isVerifiedCaller(headers({}), env)).toBe(false)
  })
  it('refuses everyone while the secrets are unset', () => {
    expect(isVerifiedCaller(headers({ [VERIFIED_BOT_HEADER]: '', [ASSISTANT_HEADER]: '' }), {})).toBe(false)
    expect(isVerifiedCaller(headers({ [VERIFIED_BOT_HEADER]: 'x' }), {})).toBe(false)
  })
})

describe('reservedFromEnv', () => {
  it.each([
    [{}, 0],
    [{ SSR_RESERVED_RENDERS: '6' }, 0],
    [{ VERIFIED_BOT_TOKEN: 't' }, 4],
    [{ VERIFIED_BOT_TOKEN: 't', SSR_RESERVED_RENDERS: '6' }, 6],
    [{ VERIFIED_BOT_TOKEN: 't', SSR_RESERVED_RENDERS: '0' }, 0],
    [{ VERIFIED_BOT_TOKEN: 't', SSR_RESERVED_RENDERS: '99' }, 11],
    [{ VERIFIED_BOT_TOKEN: 't', SSR_RESERVED_RENDERS: 'lots' }, 4],
  ])('%j -> %i of 12', (env, want) => {
    expect(reservedFromEnv(12, env)).toBe(want)
  })
})

describe('createRenderGate', () => {
  it('without a reserve everyone queues, first come first served (the old behaviour)', async () => {
    const g = createRenderGate({ max: 2, waitMs: 50 })
    expect(await g.acquire(false)).toBe(true)
    expect(await g.acquire(false)).toBe(true)
    expect(g.shedsEarly(false)).toBe(false)
    const waiting = g.acquire(false)
    g.release()
    expect(await waiting).toBe(true)
    expect(await g.acquire(true)).toBe(false) // waited 50 ms, no slot
    expect(g.inFlight).toBe(2)
  })

  it('with a reserve, others stop at max - reserved and never wait; verified use the rest', async () => {
    const g = createRenderGate({ max: 4, reserved: 2, waitMs: 1000 })
    expect(await g.acquire(false)).toBe(true)
    expect(await g.acquire(false)).toBe(true)
    expect(g.shedsEarly(false)).toBe(true)
    expect(g.shedsEarly(true)).toBe(false)
    const t0 = Date.now()
    expect(await g.acquire(false)).toBe(false)
    expect(Date.now() - t0).toBeLessThan(50)
    expect(await g.acquire(true)).toBe(true)
    expect(await g.acquire(true)).toBe(true)
    expect(g.inFlight).toBe(4)
  })

  it('a freed slot goes to a waiting verified caller, not to the next unverified one', async () => {
    const g = createRenderGate({ max: 2, reserved: 1, waitMs: 1000 })
    await g.acquire(false)
    await g.acquire(true)
    const waiting = g.acquire(true)
    g.release()
    expect(await waiting).toBe(true)
    expect(g.inFlight).toBe(2)
    expect(await g.acquire(false)).toBe(false)
  })
})

describe('record middleware with a reserve', () => {
  const apiGet = vi.fn(async (path: string) => ({ status: 'ok', data: { id: `https://openalex.org/${path.split('?')[0].split('/')[1]}` } }))
  let server: Server
  let base = ''
  let releaseHeld: () => void = () => {}
  const held = new Promise<void>((resolve) => { releaseHeld = resolve })

  beforeAll(async () => {
    vi.stubEnv('VERIFIED_BOT_TOKEN', 'bot-secret')
    vi.stubEnv('SSR_MAX_CONCURRENT_RENDERS', '3')
    vi.stubEnv('SSR_RESERVED_RENDERS', '1')
    vi.resetModules()
    vi.doMock('../lib/ssrApi', () => ({ apiGet: (...a: any[]) => apiGet(...(a as [string])), RECORD_TIMEOUT_MS: 1500, LIST_TIMEOUT_MS: 1500 }))
    const { default: records } = await import('../middleware/02.records')
    const app = createApp()
    app.use(records)
    // Stands in for the Nuxt render: ?hold keeps the response (and its slot) open.
    app.use(defineEventHandler(async (event) => { if ('hold' in getQuery(event)) await held; return 'rendered' }))
    server = createServer(toNodeListener(app))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    base = `http://127.0.0.1:${(server.address() as any).port}`
  })
  afterAll(() => {
    releaseHeld()
    vi.unstubAllEnvs()
    return new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('sheds unverified callers before the API once only the reserve is left; verified still render', async () => {
    const fetched = (apiPath: string) => vi.waitFor(() => expect(apiGet.mock.calls.map((c) => c[0])).toContain(apiPath))
    // Two unverified renders hold the two unreserved slots.
    const a = fetch(`${base}/works/W1?hold`)
    await fetched('works/W1')
    const b = fetch(`${base}/works/W2?hold`)
    await fetched('works/W2')
    await new Promise((r) => setTimeout(r, 20))

    const calls = apiGet.mock.calls.length
    const shed = await fetch(`${base}/works/W3`, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/141' } })
    expect(shed.headers.get('x-openalex-render')).toBe('spa; busy')
    expect(apiGet.mock.calls.length).toBe(calls) // no API calls spent on it

    const bad = await fetch(`${base}/works/W4`, { headers: { [VERIFIED_BOT_HEADER]: 'guess' } })
    expect(bad.headers.get('x-openalex-render')).toBe('spa; busy')

    const bot = await fetch(`${base}/works/W5`, { headers: { [VERIFIED_BOT_HEADER]: 'bot-secret' } })
    expect(bot.headers.get('x-openalex-render')).toBe('ssr')
    expect(await bot.text()).toBe('rendered')

    releaseHeld()
    expect((await a).headers.get('x-openalex-render')).toBe('ssr')
    expect((await b).headers.get('x-openalex-render')).toBe('ssr')
  })
})
