// oxjob #1689 edge cache: purge Cloudflare's copies of record pages when a new
// release starts.
//
// Why: Cloudflare keeps record HTML up to a day (server/recordHttpCache.mjs), and
// that HTML names the build's hashed /_nuxt/ files, which the next deploy removes.
// Every cacheable record answer carries `Cache-Tag: record-html`, so one purge-by-tag
// call drops them all; the next request for each page refills from the new dynos.
//
// When: boot + 30 s and boot + 120 s, on every dyno. Heroku has no preboot on this
// app, so by then the old dynos are gone and nothing refills the cache with old HTML;
// the second call catches pages an old dyno was still finishing at the first. Purges
// are idempotent, so 8 dynos x 2 calls is harmless.
//
// Only for a new release: Heroku restarts every dyno about once a day, and a purge
// on each of those would empty the cache several times a day. A dyno purges when its
// release (HEROKU_RELEASE_CREATED_AT, set by `heroku labs:enable runtime-dyno-metadata`)
// or, without that, its build is under RELEASE_WINDOW_MS old. A rollback is a new
// release but an old build, so only the release time catches it.
// CLOUDFLARE_PURGE_ON_BOOT=always purges on every boot.
//
// Rate limits (Cloudflare, "Purge cache > Availability and limits", updated
// 2026-09-29): purge by tag, hostname or prefix is per account, Business 10 requests
// per second with a bucket of 50, at most 100 tags per request (Free 5/min, Pro 5/s,
// Enterprise 50/s). 16 calls spread over two minutes stay far below that.
//
// The token needs only Zone > Cache Purge > Purge on the openalex.org zone. It is
// never logged. Nothing here throws, and with the token or zone unset it does nothing.

export const RECORD_CACHE_TAG = 'record-html';
export const PURGE_DELAYS_MS = [30_000, 120_000];
export const RELEASE_WINDOW_MS = 30 * 60_000;
const API = 'https://api.cloudflare.com/client/v4';

const minutes = (ms) => `${Math.round(ms / 60_000)} min`;

// { purge: boolean, why: string } for this boot.
export function purgeDecision(env, { now = Date.now(), builtAt } = {}) {
  if (!env.CLOUDFLARE_PURGE_TOKEN || !env.CLOUDFLARE_ZONE_ID) return { purge: false, why: 'CLOUDFLARE_PURGE_TOKEN or CLOUDFLARE_ZONE_ID unset' };
  if (!/^[0-9a-f]{32}$/i.test(env.CLOUDFLARE_ZONE_ID)) return { purge: false, why: 'CLOUDFLARE_ZONE_ID is not a 32-character zone id' };
  if (env.CLOUDFLARE_PURGE_ON_BOOT === 'always') return { purge: true, why: 'CLOUDFLARE_PURGE_ON_BOOT=always' };
  const released = Date.parse(env.HEROKU_RELEASE_CREATED_AT || '');
  if (Number.isFinite(released)) {
    const age = now - released;
    const which = `release ${env.HEROKU_RELEASE_VERSION || '?'} created ${minutes(age)} ago`;
    return age < RELEASE_WINDOW_MS ? { purge: true, why: which } : { purge: false, why: `${which} (a restart, not a deploy)` };
  }
  const built = Number(builtAt);
  if (Number.isFinite(built) && built > 0) {
    const age = now - built;
    const which = `build made ${minutes(age)} ago`;
    return age < RELEASE_WINDOW_MS ? { purge: true, why: which } : { purge: false, why: `${which} (a restart, not a deploy)` };
  }
  return { purge: true, why: 'release and build time unknown' };
}

// One purge-by-tag call. Resolves true on success, false otherwise; never rejects.
export async function purgeRecordHtml({ token, zone, fetchImpl = globalThis.fetch, log = console, timeoutMs = 10_000 }) {
  try {
    const res = await fetchImpl(`${API}/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: [RECORD_CACHE_TAG] }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    if (res.ok && body?.success) {
      log.log(`[record-cache] purged Cache-Tag ${RECORD_CACHE_TAG} (Cloudflare purge ${body.result?.id ?? 'ok'})`);
      return true;
    }
    const errors = (body?.errors || []).map((e) => `${e.code} ${e.message}`).join('; ');
    log.warn(`[record-cache] purge failed: HTTP ${res.status}${errors ? `: ${errors}` : ''}`);
    return false;
  } catch (err) {
    log.warn(`[record-cache] purge failed: ${err?.name || 'Error'}: ${err?.message || err}`);
    return false;
  }
}

// Called once at boot. Returns the timers it set (none when it won't purge).
export function schedulePurges(env, { now = Date.now(), builtAt, fetchImpl, log = console, setTimer = setTimeout, delays = PURGE_DELAYS_MS } = {}) {
  try {
    const decision = purgeDecision(env, { now, builtAt });
    if (!env.CLOUDFLARE_PURGE_TOKEN || !env.CLOUDFLARE_ZONE_ID) return [];
    log.log(`[record-cache] ${decision.purge ? `purging at boot + ${delays.map((d) => `${d / 1000} s`).join(' and ')}` : 'no purge'}: ${decision.why}`);
    if (!decision.purge) return [];
    const args = { token: env.CLOUDFLARE_PURGE_TOKEN, zone: env.CLOUDFLARE_ZONE_ID, fetchImpl, log };
    return delays.map((ms) => {
      const timer = setTimer(() => { purgeRecordHtml(args); }, ms);
      timer?.unref?.();
      return timer;
    });
  } catch (err) {
    log.warn(`[record-cache] purge not scheduled: ${err?.message || err}`);
    return [];
  }
}
