// oxjob #2104: is this process short of CPU, and why? (server/middleware/02.records.ts)
//
// 9 Nov: a few of the 20 website processes at a time run with their event loop busy
// ~100% of the time and spend 2-3x the CPU per render of the others. Such a process
// still rendered every unverified request younger than SSR_MAX_QUEUE_MS, so it kept
// falling behind until requests sat 30-45 s before it read them and Heroku's router
// timed them out (web.6, 15:56-16:04 CT: ~1,450 H12s). The load meter below lets it
// give unverified callers the shell while it is saturated, so it catches up.
import { readFileSync } from 'node:fs'
import { performance, type EventLoopUtilization } from 'node:perf_hooks'

type Env = Record<string, string | undefined>

// Shed unverified renders while the smoothed event-loop utilization is at or above
// this (SSR_SHED_ELU, default 0.9; 0 = off).
const DEFAULT_SHED_ELU = 0.9
export function shedEluFromEnv(env: Env = process.env) {
  const n = Number(env.SSR_SHED_ELU || DEFAULT_SHED_ELU)
  return n >= 0 && n <= 1 ? n : DEFAULT_SHED_ELU
}

// Event-loop use since the previous call: utilization (0..1) over idle + active ms.
export function eluSampler() {
  let prev = performance.eventLoopUtilization()
  return () => {
    const now = performance.eventLoopUtilization()
    const d = performance.eventLoopUtilization(now, prev)
    prev = now
    return d
  }
}

// Utilization smoothed over ~3 s of wall time. From a normal 0.7, ~3.5 s pinned at 100%
// reaches 0.9, so one 2 s render or GC pause doesn't trip it. The weight follows elapsed
// time, not ticks, because a busy loop runs the 1 s tick late.
const SMOOTH_MS = 3000
export function createLoadMeter({ threshold, sample }: { threshold: number, sample: () => EventLoopUtilization }) {
  let level = 0
  return {
    tick() {
      const d = sample()
      level += (1 - Math.exp(-(d.idle + d.active) / SMOOTH_MS)) * (d.utilization - level)
    },
    overloaded: () => threshold > 0 && level >= threshold,
  }
}

function readNumber(file: string, re: RegExp, scale: number): number | null {
  try {
    const m = readFileSync(file, 'utf8').match(re)
    return m ? Number(m[1]) * scale : null
  } catch { return null }
}

// Cumulative CPU counters in ms (ics: a count). A slow process that does more work shows
// cpu near elu x 60 s a minute; one on a crowded host shows high involuntary context
// switches (ics), host steal, or quota throttling instead.
export function cpuCounters() {
  const r = process.resourceUsage()
  return {
    cpu: (r.userCPUTime + r.systemCPUTime) / 1000,
    ics: r.involuntaryContextSwitches,
    // /proc/stat "cpu" line: user nice system idle iowait irq softirq steal, in 1/100 s.
    steal: readNumber('/proc/stat', /^cpu\s+(?:\d+\s+){7}(\d+)/m, 10),
    // Time held back by the container's CPU quota: cgroup v2 (us), else v1 (ns).
    throttled: readNumber('/sys/fs/cgroup/cpu.stat', /^throttled_usec (\d+)/m, 1e-3)
      ?? readNumber('/sys/fs/cgroup/cpu/cpu.stat', /^throttled_time (\d+)/m, 1e-6),
  }
}
type CpuCounters = ReturnType<typeof cpuCounters>

// "cpu=41200ms ics=5300 steal=1200ms throttled=0ms"; counters the host doesn't expose are left out.
export function cpuDelta(a: CpuCounters, b: CpuCounters) {
  return (Object.keys(b) as (keyof CpuCounters)[])
    .filter((k) => a[k] !== null && b[k] !== null)
    .map((k) => `${k}=${Math.round(b[k]! - a[k]!)}${k === 'ics' ? '' : 'ms'}`)
    .join(' ')
}

// The change since the previous call, for the minute line.
export function cpuSampler() {
  let prev = cpuCounters()
  return () => {
    const now = cpuCounters()
    const line = cpuDelta(prev, now)
    prev = now
    return line
  }
}
