// The API's per-second throttles (one semantic search a second, broad boolean
// searches, the burst cap) answer 429 with a Retry-After of about a second; the
// daily credit limit answers 429 with a Retry-After of hours (until midnight UTC).
// Kyle, 2026-10-16: one semantic search on the SERP failed because the page itself
// fetched twice within the second. A short throttle is worth waiting out once; a
// daily limit is not.

export const SHORT_THROTTLE_MAX_SECONDS = 2;

// Milliseconds to wait before one retry, or null when the error isn't a short throttle.
export function shortThrottleWaitMs(response) {
    if (response?.status !== 429) return null;
    const headers = response.headers || {};
    const raw = response.data?.retryAfter
        ?? headers["retry-after"]
        ?? (typeof headers.get === "function" ? headers.get("retry-after") : undefined);
    if (raw === undefined || raw === null || raw === "") return null;
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > SHORT_THROTTLE_MAX_SECONDS) return null;
    return Math.max(seconds, 0.25) * 1000;
}
