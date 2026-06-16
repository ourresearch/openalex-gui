// Single source of truth for serializing OQL into a URL (oxjob #373 Phase 2).
//
// Lives in its own dependency-free leaf module ON PURPOSE: it's consumed by both
// `url.js` (the route-write sites, via the `url` object) and `api.js` (the
// `/query/oql/…` translate call). `api.js` ⇄ `url.js` are in a circular-import
// cycle (api → url → router → store → oqlBuilder.store → api), and the `url`
// object const is defined at the very end of `url.js`, so `api.getQuery` —
// called early, during the OQL builder's mount — would hit a temporal-dead-zone
// `ReferenceError: Cannot access 'url' before initialization` if it dereferenced
// `url.oqlForUrl`. Keeping the serializer in a leaf both modules import sidesteps
// the cycle entirely.
//
// Why this transform: OQL is pretty-printed as an indented, multi-line tree for
// DISPLAY, but the OQL parser is whitespace-blind — a newline+indent and a single
// space are the same token boundary — so layout carries NO meaning in a URL.
// Collapse every run of whitespace that contains a newline to a single space (and
// trim), so the URL doesn't percent-encode the pretty-print layout (`%0A%20%20…`).
// We deliberately collapse ONLY newline-bearing runs, never bare `\s+`, so an
// internal-spaced quoted phrase (`has "academic  teacher"`) is preserved
// byte-for-byte — the pretty-printer never inserts a newline inside a quoted
// literal. Identity-preserving: re-parsing yields the same OQO.
export const oqlForUrl = function (oql) {
    return String(oql ?? "").replace(/\s*[\r\n]+\s*/g, " ").trim();
};
