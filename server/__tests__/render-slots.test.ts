// oxjob #2104: verified crawlers and assistants keep render slots; everyone else gets
// the SPA shell at once, before any API call, when only the reserved slots are free
// (server/lib/renderSlots.ts, server/middleware/02.records.ts).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createApp, defineEventHandler, getQuery, toNodeListener } from 'h3'
import { createRenderGate, isVerifiedCaller, maxQueueMsFromEnv, queueAgeMs, reservedFromEnv, VERIFIED_BOT_HEADER } from '../lib/renderSlots'
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

describe('queueAgeMs (Heroku X-Request-Start)', () => {
  const now = 1_762_700_000_000
  it.each([
    [String(now - 2500), 2500],
    [String(now + 300), 0], // router clock a little ahead
  ])('%s -> %i ms', (stamp, want) => {
    expect(queueAgeMs(stamp, now)).toBe(want)
  })
  it.each([[undefined], [''], ['soon'], ['0'], ['-5']])('%j -> null', (stamp) => {
    expect(queueAgeMs(stamp as any, now)).toBe(null)
  })
})

describe('maxQueueMsFromEnv', () => {
  it.each([
    [{}, 2000],
    [{ SSR_MAX_QUEUE_MS: '' }, 2000],
    [{ SSR_MAX_QUEUE_MS: '0' }, 0],
    [{ SSR_MAX_QUEUE_MS: '5000' }, 5000],
    [{ SSR_MAX_QUEUE_MS: 'lots' }, 2000],
    [{ SSR_MAX_QUEUE_MS: '-1' }, 2000],
  ])('%j -> %i', (env, want) => {
    expect(maxQueueMsFromEnv(env)).toBe(want)
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
  // ?hold=<name> keeps that response (and its slot) open until free(<name>); ?hold alone until free('').
  const holds = new Map<string, { done: Promise<void>, free: () => void }>()
  const hold = (name: string) => {
    if (!holds.has(name)) { let free = () => {}; const done = new Promise<void>((r) => { free = r }); holds.set(name, { done, free }) }
    return holds.get(name)!
  }
  const free = (name: string) => hold(name).free()
  const releaseHeld = () => free('')

  beforeAll(async () => {
    vi.stubEnv('VERIFIED_BOT_TOKEN', 'bot-secret')
    vi.stubEnv('SSR_MAX_CONCURRENT_RENDERS', '3')
    vi.stubEnv('SSR_RESERVED_RENDERS', '1')
    vi.stubEnv('SSR_MAX_SLOT_HOLD_MS', '1500')
    vi.resetModules()
    vi.doMock('../lib/ssrApi', () => ({ apiGet: (...a: any[]) => apiGet(...(a as [string])), RECORD_TIMEOUT_MS: 1500, LIST_TIMEOUT_MS: 1500 }))
    const { default: records } = await import('../middleware/02.records')
    const app = createApp()
    app.use(records)
    // Stands in for the Nuxt render: ?hold keeps the response (and its slot) open.
    app.use(defineEventHandler(async (event) => {
      const q = getQuery(event)
      if ('hold' in q) await hold(String(q.hold ?? '')).done
      return 'rendered'
    }))
    server = createServer(toNodeListener(app))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    base = `http://127.0.0.1:${(server.address() as any).port}`
  })
  afterAll(() => {
    for (const h of holds.values()) h.free()
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

  const render = (path: string, headers: Record<string, string> = {}) =>
    fetch(`${base}${path}`, { headers }).then((r) => r.headers.get('x-openalex-render'))
  const bot = { [VERIFIED_BOT_HEADER]: 'bot-secret' }
  const settle = () => new Promise((r) => setTimeout(r, 50))

  it('a caller that leaves while waiting for a slot does not keep the slot', async () => {
    // Fill all 3 slots: 2 unverified + 1 verified.
    const a = render('/works/W11?hold=a'); await settle()
    const b = render('/works/W12?hold=b'); await settle()
    const c = render('/works/W13?hold=c', bot); await settle()
    // A verified caller waits for a slot, then gives up (Heroku's router does at 30 s).
    const gone = new AbortController()
    const d = fetch(`${base}/works/W14`, { headers: bot, signal: gone.signal }).catch(() => null)
    await settle()
    gone.abort()
    await d
    await settle()
    // Its slot is granted after it left; it must come straight back.
    free('a'); await a; await settle()
    free('b'); free('c'); await b; await c; await settle()
    // All 3 free again: 2 unverified renders fit (one held, one rendered).
    const e = render('/works/W15?hold=e'); await settle()
    expect(await render('/works/W16')).toBe('ssr')
    free('e'); expect(await e).toBe('ssr')
  })

  it('an unverified request that already waited over 2 s gets the shell before the API; verified ones still render', async () => {
    const calls = apiGet.mock.calls.length
    const stale = { 'x-request-start': String(Date.now() - 5000) }
    expect(await render('/works/W31', stale)).toBe('spa; late')
    expect(apiGet.mock.calls.length).toBe(calls) // no API calls spent on it
    expect(await render('/works/W32', { ...stale, ...bot })).toBe('ssr')
  })

  it('a slot held past SSR_MAX_SLOT_HOLD_MS is released, so a hung render cannot keep it', async () => {
    const stuck = [render('/works/W21?hold=s'), render('/works/W22?hold=s')]
    await settle()
    expect(await render('/works/W23')).toBe('spa; busy') // 2 unverified slots taken
    await new Promise((r) => setTimeout(r, 1600))
    expect(await render('/works/W24')).toBe('ssr')
    free('s'); await Promise.all(stuck)
  })
})
