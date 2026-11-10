// oxjob #2104: a CPU-saturated process gives unverified callers the shell until it
// catches up (server/lib/processHealth.ts; the middleware test is in render-slots.test.ts).
import { describe, it, expect } from 'vitest'
import { cpuCounters, cpuDelta, createLoadMeter, shedEluFromEnv } from '../lib/processHealth'

describe('shedEluFromEnv', () => {
  it.each([
    [{}, 0.9],
    [{ SSR_SHED_ELU: '' }, 0.9],
    [{ SSR_SHED_ELU: '0' }, 0],
    [{ SSR_SHED_ELU: '0.95' }, 0.95],
    [{ SSR_SHED_ELU: '1.5' }, 0.9],
    [{ SSR_SHED_ELU: 'hot' }, 0.9],
  ])('%j -> %d', (env, want) => {
    expect(shedEluFromEnv(env)).toBe(want)
  })
})

describe('createLoadMeter', () => {
  // Each sample is one tick: [utilization, seconds it covers].
  const run = (threshold: number, samples: Array<[number, number]>) => {
    const queue = samples.map(([u, s]) => ({ utilization: u, active: u * s * 1000, idle: (1 - u) * s * 1000 }))
    const m = createLoadMeter({ threshold, sample: () => queue.shift()! })
    return { m, tick: () => { m.tick(); return m.overloaded() } }
  }
  const secs = (u: number, n: number, s = 1): Array<[number, number]> => Array(n).fill([u, s])

  it('one busy second in a normal load does not trip it', () => {
    const { tick } = run(0.9, [...secs(0.7, 20), [1, 1], ...secs(0.7, 2)])
    for (let i = 0; i < 23; i++) expect(tick()).toBe(false)
  })

  it('a few seconds pinned at 100% trip it, and it clears once the load eases', () => {
    const { m, tick } = run(0.9, [...secs(0.7, 20), ...secs(1, 10), ...secs(0.6, 10)])
    for (let i = 0; i < 20; i++) tick()
    const toTrip = [...Array(10)].map(tick).indexOf(true) + 1
    expect(toTrip).toBeGreaterThanOrEqual(3)
    expect(toTrip).toBeLessThanOrEqual(5)
    for (let i = 0; i < 10; i++) tick()
    expect(m.overloaded()).toBe(false)
  })

  it('a late tick counts the seconds it covers, so a busy loop trips it as fast', () => {
    const { tick } = run(0.9, [...secs(0.7, 20), ...secs(1, 2, 3)])
    for (let i = 0; i < 20; i++) tick()
    expect(tick()).toBe(false)
    expect(tick()).toBe(true)
  })

  it('threshold 0 never sheds', () => {
    const { tick } = run(0, secs(1, 10))
    for (let i = 0; i < 10; i++) expect(tick()).toBe(false)
  })
})

describe('cpu counters for the minute line', () => {
  it('reads this process', () => {
    const c = cpuCounters()
    expect(c.cpu).toBeGreaterThan(0)
    expect(c.ics).toBeGreaterThanOrEqual(0)
  })
  it('logs the change and leaves out what the host does not expose', () => {
    const a = { cpu: 1000, ics: 10, steal: null, throttled: 5 }
    const b = { cpu: 42200.4, ics: 5310, steal: null, throttled: 5 }
    expect(cpuDelta(a, b)).toBe('cpu=41200ms ics=5300 throttled=0ms')
    expect(cpuDelta({ ...a, steal: 100 }, { ...b, steal: 1300 })).toBe('cpu=41200ms ics=5300 steal=1200ms throttled=0ms')
  })
})
