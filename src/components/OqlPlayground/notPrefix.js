// Typed-"not" negation for the value autocomplete (oxjob #603 round 28, Jason).
// The picker's "not" checkbox footer is gone ("always awkward") — negation is typed
// on the chip input instead:
//   "not harvard"            → autocomplete runs on "harvard"; the pick is negated
//   "n" / "no" / "not"       → autocomplete SUPPRESSED (any case): the input reads as
//                              a negation-in-progress, not a query. Nottingham /
//                              Nigeria etc. resume the moment the input stops being a
//                              prefix of "not" ("nott", "ni" both search normally).
//   anything else            → plain query, no negation
// Pure function so it's unit-testable without the picker (see notPrefix.test.js).
export function parseNotQuery(raw) {
  const q = raw == null ? "" : String(raw);
  // The space is load-bearing: "not " arms negation and everything after it is the
  // real query ("not" alone is still ambiguous → suppressed below).
  const m = q.match(/^\s*not\s+(.*)$/i);
  if (m) return { negate: true, query: m[1], suppress: false };
  const t = q.trim().toLowerCase();
  if (t && "not".startsWith(t)) return { negate: false, query: "", suppress: true };
  return { negate: false, query: q, suppress: false };
}
