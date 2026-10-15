// oxjob #1689 edge cache: the boot-time Cloudflare purge (server/lib/purgeRecordCache.mjs).
import { describe, it, expect, vi } from 'vitest'
import { purgeDecision, purgeRecordHtml, schedulePurges, PURGE_DELAYS_MS, RELEASE_WINDOW_MS } from '../lib/purgeRecordCache.mjs'

const TOKEN = 'secret-token-value'
const ZONE = 'be142963359dc4da518cf2e0d7756e24'
const NOW = Date.parse('2026-10-15T17:30:00Z')
const ENV = { CLOUDFLARE_PURGE_TOKEN: TOKEN, CLOUDFLARE_ZONE_ID: ZONE }
const quietLog = () => ({ log: vi.fn(), warn: vi.fn() })
const allLines = (log: any) => [...log.log.mock.calls, ...log.warn.mock.calls].flat().join('\n')
const okFetch = () => vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, errors: [], result: { id: 'abc123' } }) })

describe('purgeDecision', () => {
  it('does nothing without both settings', () => {
    expect(purgeDecision({}).purge).toBe(false)
    expect(purgeDecision({ CLOUDFLARE_PURGE_TOKEN: TOKEN }).purge).toBe(false)
    expect(purgeDecision({ CLOUDFLARE_ZONE_ID: ZONE }).purge).toBe(false)
    expect(purgeDecision({ ...ENV, CLOUDFLARE_ZONE_ID: 'openalex.org' }).purge).toBe(false)
  })
  it('purges for a new release, not for the daily restart of an old one', () => {
    const fresh = { ...ENV, HEROKU_RELEASE_CREATED_AT: new Date(NOW - 2 * 60_000).toISOString(), HEROKU_RELEASE_VERSION: 'v900' }
    expect(purgeDecision(fresh, { now: NOW })).toEqual({ purge: true, why: 'release v900 created 2 min ago' })
    const old = { ...ENV, HEROKU_RELEASE_CREATED_AT: new Date(NOW - 26 * 3600_000).toISOString() }
    expect(purgeDecision(old, { now: NOW }).purge).toBe(false)
    // The release time wins over the build time: a rollback is a new release of an old build.
    expect(purgeDecision(fresh, { now: NOW, builtAt: String(NOW - 30 * 86400_000) }).purge).toBe(true)
  })
  it('without release metadata, uses the build time', () => {
    expect(purgeDecision(ENV, { now: NOW, builtAt: String(NOW - 5 * 60_000) }).purge).toBe(true)
    expect(purgeDecision(ENV, { now: NOW, builtAt: String(NOW - RELEASE_WINDOW_MS - 1) }).purge).toBe(false)
  })
  it('purges when it cannot tell, or when told to always', () => {
    expect(purgeDecision(ENV, { now: NOW }).purge).toBe(true)
    expect(purgeDecision({ ...ENV, CLOUDFLARE_PURGE_ON_BOOT: 'always' }, { now: NOW, builtAt: '1' }).purge).toBe(true)
  })
})

describe('purgeRecordHtml', () => {
  it('POSTs the tag to the zone purge endpoint with the bearer token', async () => {
    const fetchImpl = okFetch()
    const log = quietLog()
    expect(await purgeRecordHtml({ token: TOKEN, zone: ZONE, fetchImpl, log })).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`)
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(JSON.parse(init.body)).toEqual({ tags: ['record-html'] })
    expect(allLines(log)).toContain('purged Cache-Tag record-html')
    expect(allLines(log)).not.toContain(TOKEN)
  })
  it('logs Cloudflare errors and resolves false, never throws, never logs the token', async () => {
    const log = quietLog()
    const denied = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }) })
    expect(await purgeRecordHtml({ token: TOKEN, zone: ZONE, fetchImpl: denied, log })).toBe(false)
    const notJson = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new SyntaxError('bad') } })
    expect(await purgeRecordHtml({ token: TOKEN, zone: ZONE, fetchImpl: notJson, log })).toBe(false)
    const down = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    expect(await purgeRecordHtml({ token: TOKEN, zone: ZONE, fetchImpl: down, log })).toBe(false)
    const lines = allLines(log)
    expect(lines).toContain('HTTP 403: 10000 Authentication error')
    expect(lines).toContain('HTTP 502')
    expect(lines).toContain('TypeError: fetch failed')
    expect(lines).not.toContain(TOKEN)
  })
})

describe('schedulePurges', () => {
  it('purges at boot + 30 s and boot + 120 s for a new release', async () => {
    vi.useFakeTimers()
    try {
      const fetchImpl = okFetch()
      const log = quietLog()
      const timers = schedulePurges(ENV, { now: NOW, builtAt: String(NOW - 60_000), fetchImpl, log })
      expect(PURGE_DELAYS_MS).toEqual([30_000, 120_000])
      expect(timers).toHaveLength(2)
      await vi.advanceTimersByTimeAsync(29_999)
      expect(fetchImpl).toHaveBeenCalledTimes(0)
      await vi.advanceTimersByTimeAsync(1)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(90_000)
      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(allLines(log)).not.toContain(TOKEN)
    } finally {
      vi.useRealTimers()
    }
  })
  it('does nothing at all when unset, and no calls for a restart', () => {
    const fetchImpl = okFetch()
    const setTimer = vi.fn()
    const log = quietLog()
    expect(schedulePurges({}, { fetchImpl, setTimer, log })).toEqual([])
    expect(log.log).not.toHaveBeenCalled()
    expect(schedulePurges(ENV, { now: NOW, builtAt: String(NOW - 86400_000), fetchImpl, setTimer, log })).toEqual([])
    expect(setTimer).not.toHaveBeenCalled()
    expect(allLines(log)).toContain('no purge')
  })
  it('a timer that fails to schedule does not throw', () => {
    const log = quietLog()
    expect(schedulePurges(ENV, { now: NOW, setTimer: () => { throw new Error('boom') }, log })).toEqual([])
    expect(allLines(log)).toContain('purge not scheduled: boom')
  })
})
