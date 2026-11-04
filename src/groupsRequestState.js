// Are these facet counts for the current query, or did the request fail? (oxjob #2002)
//
// One owner: GroupBy's getGroups writes this state; the card reads only it. Before, the
// card inferred the answer from `groups`, `isLoading` and a last-fetched signature, and
// getGroups never cleared the groups, had no error state and kept late answers. So a
// failed re-fetch (a 504 or a timeout: Sentry GUI-1, 29K in 14 days) left the previous
// query's counts under new results, a failed first load looked like "no values", and an
// older request answering last overwrote a newer one.
//
// States (`status`), each for one query (`forSignature`):
//   idle     nothing asked yet
//   loading  a request for forSignature is in flight. `groups` may still hold the
//            previous query's rows: #563 keeps them on screen during a re-fetch (no flicker)
//   ready    `groups` are forSignature's counts
//   error    forSignature's request failed: the old rows are gone, the card says so
//            (`error` holds what the card shows: {short, canRetry}, requestRefusal.js)

export function initialGroupsRequest() {
    return { status: "idle", forSignature: null, seq: 0, groups: [] };
}

// Fetch unless this query's counts are already shown or on their way. A failed query
// may be asked again (the watcher re-fires on navigation; the card has a Try again).
export function needsGroupsFetch(state, signature) {
    if (signature !== state.forSignature) return true;
    return state.status !== "ready" && state.status !== "loading";
}

export function beginGroupsRequest(state, signature) {
    return { ...state, status: "loading", forSignature: signature, seq: state.seq + 1 };
}

// Land an answer. `seq` is the number beginGroupsRequest gave the request: an answer for
// any older request is dropped, whatever order the answers arrive in.
export function settleGroupsRequest(state, seq, { groups, error } = {}) {
    if (seq !== state.seq) return state;
    if (error) return { ...state, status: "error", groups: [], error };
    return { ...state, status: "ready", groups: groups || [] };
}
