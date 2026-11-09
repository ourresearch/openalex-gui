// oxjob #2104: who gets a server render of a record page when the render slots run
// short (server/middleware/02.records.ts).
//
// Each process renders at most `max` record pages at once. Since 26 Oct a scraper
// using browser user agents from home ISPs fills those slots, and real search
// crawlers and AI assistants got the empty SPA shell for about a third of their
// fetches. So, once VERIFIED_BOT_TOKEN is set:
//   - verified callers (Cloudflare-verified search crawlers, AI search, AI crawlers,
//     AI assistants, archivers, link previews) may use every slot and wait up to
//     `waitMs` for one, ahead of everyone else;
//   - everyone else may use only `max - reserved` slots and never waits: no free slot
//     means the SPA shell at once, before the server spends any API calls on them.
//     People's browsers render the SPA themselves, as before server rendering.
// Unset VERIFIED_BOT_TOKEN = reserve 0 = the old behaviour (everyone waits, FIFO).
//
// Cloudflare marks verified callers: Transform Rule "#2104 verified bots keep render
// slots" sets X-OpenAlex-Verified-Bot to VERIFIED_BOT_TOKEN, and #1688's rule
// 1511fcfc sets X-OpenAlex-Verified-Assistant to VERIFIED_ASSISTANT_TOKEN. Anyone may
// send either header; without the secret it counts for nothing.
import { tokenOk, HEADER as ASSISTANT_HEADER } from '../../assistantPages/index.mjs'

export const VERIFIED_BOT_HEADER = 'x-openalex-verified-bot'
const DEFAULT_RESERVED = 4

type Env = Record<string, string | undefined>

// header: (name) => string | undefined
export function isVerifiedCaller(header: (name: string) => string | undefined, env: Env = process.env) {
  return tokenOk(header(VERIFIED_BOT_HEADER), env.VERIFIED_BOT_TOKEN)
    || tokenOk(header(ASSISTANT_HEADER), env.VERIFIED_ASSISTANT_TOKEN)
}

// Slots kept for verified callers: 0 until VERIFIED_BOT_TOKEN is set, then
// SSR_RESERVED_RENDERS (default 4), never more than max - 1.
export function reservedFromEnv(max: number, env: Env = process.env) {
  if (!env.VERIFIED_BOT_TOKEN) return 0
  const n = Math.floor(Number(env.SSR_RESERVED_RENDERS || DEFAULT_RESERVED))
  if (!Number.isFinite(n) || n < 0) return DEFAULT_RESERVED
  return Math.min(n, max - 1)
}

export function createRenderGate({ max, reserved = 0, waitMs }: { max: number, reserved?: number, waitMs: number }) {
  let inFlight = 0
  const waiters: Array<() => void> = []
  const othersMax = max - reserved

  const hasRoom = (verified: boolean) => inFlight < (verified ? max : othersMax)
  // With a reserve, an unverified caller with no room gets the shell at once.
  const sheds = (verified: boolean) => reserved > 0 && !verified && !hasRoom(false)

  return {
    get inFlight() { return inFlight },
    // Checked before the record fetch, so a shed request costs no API calls.
    shedsEarly: sheds,
    acquire(verified: boolean): Promise<boolean> {
      if (sheds(verified)) return Promise.resolve(false)
      if (hasRoom(verified)) { inFlight++; return Promise.resolve(true) }
      return new Promise((resolve) => {
        const grant = () => { clearTimeout(timer); inFlight++; resolve(true) }
        const timer = setTimeout(() => {
          const i = waiters.indexOf(grant)
          if (i >= 0) waiters.splice(i, 1)
          resolve(false)
        }, waitMs)
        waiters.push(grant)
      })
    },
    release() {
      inFlight--
      // Only waiters get slots handed over. With a reserve they are all verified;
      // without one, everyone queues, as before #2104.
      const next = waiters.shift()
      if (next) next()
    },
  }
}

// Per-process counts, logged once a minute by the middleware (one line per process,
// instead of a line per shed request).
export function createSlotStats() {
  const zero = () => ({ verifiedRendered: 0, verifiedBusy: 0, othersRendered: 0, othersBusy: 0, othersShedEarly: 0,
    gone: 0, heldTooLong: 0 })
  let c = zero()
  return {
    rendered(verified: boolean) { verified ? c.verifiedRendered++ : c.othersRendered++ },
    busy(verified: boolean) { verified ? c.verifiedBusy++ : c.othersBusy++ },
    shedEarly() { c.othersShedEarly++ },
    // Granted a slot after the caller had left; released at once.
    gone() { c.gone++ },
    // Released by the hold cap, not by the response ending.
    heldTooLong() { c.heldTooLong++ },
    take() { const out = c; c = zero(); return out },
  }
}
