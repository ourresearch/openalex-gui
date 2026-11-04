// Why did this API request fail? (oxjob #2002)
//
// The one reader for every refusal the API sends. The GET path (api.getUrl), the OQL
// POST paths (api.executeOql / executeOqo) and the pages that show an error (Serp.vue,
// the facet cards) all ask it. Before, each path read its own clues (the status, the
// body's `message` or `fix`, Retry-After, whether anyone is signed in), so a plan gate
// read as a rate limit, a signed-out visitor who ran out of credit on the OQL path never
// saw the credit dialog, and people saw "Request failed with status code 429".
//
// Kinds:
//   throttle      a 429 that clears in a second or two (Retry-After <= 2 s): wait once, retry
//   daily_limit   a 429 "Insufficient budget" (or a bare 429): today's budget is spent
//   rate_limited  any other 429 with a message (load shedding, broad boolean searches)
//   plan_gate     "Plan upgrade required" (a 429 today, a 403 after #1850): a paid-plan feature
//   timeout       a 504, or the browser gave up waiting: the query took too long
//   invalid       a 400: the API says what is wrong with the query
//   aborted       we cancelled it ourselves (a newer request replaced it): not a failure
//   network       no answer at all (offline, blocked)
//   other         anything else

import { shortThrottleWaitMs } from "@/throttleRetry";

const PLAN_GATE_ERROR = "Plan upgrade required";

function bodyOf(e) {
    const data = e?.response?.data;
    return data && typeof data === "object" ? data : {};
}

export function classifyRequestError(e) {
    const status = e?.response?.status ?? null;
    const body = bodyOf(e);
    const message = typeof body.message === "string" && body.message.trim() ? body.message.trim() : null;
    const base = { status, message, retryAfterMs: null };

    // axios: ERR_CANCELED = our own AbortController; ECONNABORTED is both the browser
    // dropping the request (page unload: "Request aborted") and a client timeout
    // ("timeout of Nms exceeded"), told apart by the message.
    const browserGaveUp = !status && (e?.code === "ETIMEDOUT"
        || (e?.code === "ECONNABORTED" && /timeout/i.test(e?.message || "")));
    if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError"
        || (!status && e?.code === "ECONNABORTED" && !browserGaveUp)) {
        return { ...base, kind: "aborted" };
    }
    if (body.error === PLAN_GATE_ERROR) return { ...base, kind: "plan_gate" };
    if (status === 429) {
        const retryAfterMs = shortThrottleWaitMs(e.response);
        if (retryAfterMs !== null) return { ...base, kind: "throttle", retryAfterMs };
        if (!message || /^insufficient budget/i.test(message)) return { ...base, kind: "daily_limit" };
        return { ...base, kind: "rate_limited" };
    }
    if (status === 504 || status === 524 || browserGaveUp) {
        return { ...base, kind: "timeout" };
    }
    if (status === 400 || status === 422) return { ...base, kind: "invalid" };
    if (!status && e?.request) return { ...base, kind: "network" };
    return { ...base, kind: "other" };
}

const FALLBACK_TEXT = {
    throttle: "Too many requests at once. Please try again in a moment.",
    daily_limit: "You've used today's free budget. It resets at midnight UTC.",
    rate_limited: "OpenAlex is limiting requests right now. Please try again in a moment.",
    plan_gate: "This needs a paid plan. See https://openalex.org/pricing",
    timeout: "The query took too long and was stopped. Try narrowing it.",
    network: "Couldn't reach OpenAlex. Check your connection and try again.",
};

// What to tell a person. The API's own words win: its message (with its suggested fix),
// then the first validation error; a fixed sentence per kind only when it sent neither.
// Never the transport's "Request failed with status code 429".
export function refusalText(e) {
    const refusal = classifyRequestError(e);
    const body = bodyOf(e);
    if (refusal.message && typeof body.fix === "string" && body.fix.trim()) {
        return `${refusal.message} Fix: ${body.fix.trim()}`;
    }
    const firstValidationError = body.validation?.errors?.[0]?.message;
    if (refusal.kind === "invalid" && firstValidationError) return firstValidationError;
    if (refusal.message) return refusal.message;
    if (firstValidationError) return firstValidationError;
    if (FALLBACK_TEXT[refusal.kind]) return FALLBACK_TEXT[refusal.kind];
    // Not an HTTP failure at all: our own code threw before sending (e.g. a URL filter
    // with an unknown key, #228). Its message is the only clue there is.
    if (!refusal.status && !e?.request && e?.message) return e.message;
    return refusal.status
        ? `Something went wrong (error ${refusal.status}). Please try again.`
        : "Something went wrong. Please try again.";
}

// For a small space (a facet card): why it failed in a few words, or null when there is
// nothing more useful to say than "couldn't load", and whether trying again can help.
const SHORT_REASON = {
    daily_limit: "today's budget is used up",
    plan_gate: "this query needs a paid plan",
    invalid: "the query isn't valid",
};
export function refusalReason(e) {
    const { kind } = classifyRequestError(e);
    return { short: SHORT_REASON[kind] || null, canRetry: !SHORT_REASON[kind] };
}

// The refusal policy every API call shares: wait out a short throttle once and retry;
// show the "today's free limit" dialog to a signed-out visitor whose budget is spent.
// `send` makes the request; `onDailyLimitSignedOut` opens the dialog; `isSignedIn` and
// `wait` are passed in so this stays a plain module (tests drive it without a store).
export async function withRefusalPolicy(send, { isSignedIn, onDailyLimitSignedOut, wait } = {}) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await send();
        } catch (e) {
            const refusal = classifyRequestError(e);
            if (refusal.kind === "throttle" && attempt === 0) {
                await (wait || defaultWait)(refusal.retryAfterMs);
                continue;
            }
            if (refusal.kind === "daily_limit" && !isSignedIn?.()) onDailyLimitSignedOut?.();
            throw e;
        }
    }
}

const defaultWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
