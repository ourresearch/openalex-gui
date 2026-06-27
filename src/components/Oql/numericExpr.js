// Numeric value-expression parser for the no-code OQL builder (oxjob #527).
//
// A range-capable numeric filter property (year, cited_by_count, works_count, …) now
// shows ONLY `is` in the builder — no ≥/=/≤ predicate menu. Instead the user types a
// natural numeric expression INTO the value chip and we parse it into one or more
// comparison filters. This is the numeric analog of valueExpr.js (boolean text): a pure
// text -> structured-result function. v2Edit turns the result into OQO filter(s) / tree
// clauses (numericFiltersToOqo / applyNumericExpr).
//
// SEMANTICS (locked with Jason, #527):
//   2020            -> year = 2020                         (equality)
//   >2000  / >=2000 -> year > 2000  / year >= 2000         (SYMBOL forms are literal)
//   <1970  / <=1970 -> year < 1970  / year <= 1970
//   after 2020      -> year >= 2020                        (WORD forms are INCLUSIVE)
//   before 1970     -> year <= 1970
//   2000-2020       -> year >= 2000 AND year <= 2020       (a range = TWO filters)
//   2000-           -> year >= 2000                         (open-ended)
//   -2020           -> year <= 2020
//   2020-2000       -> auto-swapped to year >= 2000 AND year <= 2020
//   2020, 2011      -> year = 2020 OR year = 2011          (value list: ONE filter)
//   2020 or 2021    -> same value list
//   2020 and 2021   -> year = 2020 AND year = 2021         (TWO filters)
//
// CONNECTORS: `and` / `&` -> SEPARATE AND-ed filters; `or` / `,` -> a single value list.
// RANGE SEPARATORS accepted: `-`, en-dash `–`, em-dash `—`, `..`, `to`.
// A value list (`or` / `,`) is only valid when every operand is a bare equality.
//
// OUTPUT: null when there is nothing parseable (empty / non-numeric / malformed), else
//   { filters: [ { op, values: [number, ...] }, ... ] }   — filters are AND-joined.
//   op ∈ ">" | ">=" | "<" | "<=" | "is".  A value LIST is one filter {op:"is", values:[…≥2]};
//   a comparison is always {op, values:[oneNumber]}.

// A range is `lo SEP hi` with either bound optional (but at least one present).
const RANGE_RE = /^(\d+)?\s*(?:-|–|—|\.\.|to)\s*(\d+)?$/i;

// Leading comparator forms, longest-match first. WORD forms (after/before) are INCLUSIVE
// (>= / <=) per Jason; SYMBOL forms are literal.
const COMPARATORS = [
  [/^(?:>=|≥)/, ">="],
  [/^(?:<=|≤)/, "<="],
  [/^>/, ">"],
  [/^</, "<"],
  [/^after\b/i, ">="],
  [/^before\b/i, "<="],
];

function parseRange(text) {
  const m = text.match(RANGE_RE);
  if (!m) return null;
  const loStr = m[1];
  const hiStr = m[2];
  if (loStr == null && hiStr == null) return null; // just a bare separator
  let lo = loStr != null ? Number(loStr) : null;
  let hi = hiStr != null ? Number(hiStr) : null;
  if (lo != null && hi != null && lo > hi) { const t = lo; lo = hi; hi = t; } // auto-swap
  const filters = [];
  if (lo != null) filters.push({ op: ">=", values: [lo] });
  if (hi != null) filters.push({ op: "<=", values: [hi] });
  return filters.length ? filters : null;
}

// One operand: an optional leading comparator + a bare integer. null if it doesn't parse.
function parseAtom(text) {
  let s = String(text).trim();
  if (!s) return null;
  let op = "is";
  for (const [re, o] of COMPARATORS) {
    if (re.test(s)) { op = o; s = s.replace(re, "").trim(); break; }
  }
  if (!/^\d+$/.test(s)) return null; // must be a clean integer remainder
  return { op, value: Number(s) };
}

// One AND-segment: a range, or an `or`/`,` value list, or a single comparison.
// Returns an array of filters (usually length 1; a range is length 1–2), or null.
function parseSegment(text) {
  const range = parseRange(text);
  if (range) return range;
  const parts = String(text).split(/\s*,\s*|\s+or\s+/i).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const atoms = parts.map(parseAtom);
  if (atoms.some((a) => a == null)) return null;
  if (atoms.length === 1) return [{ op: atoms[0].op, values: [atoms[0].value] }];
  // A value list is only meaningful for bare equalities (you can't OR mixed inequalities
  // into a single same-op value list); reject otherwise so the caller no-ops gracefully.
  if (atoms.some((a) => a.op !== "is")) return null;
  return [{ op: "is", values: atoms.map((a) => a.value) }];
}

export function parseNumericExpr(input) {
  const text = String(input == null ? "" : input).trim();
  if (!text) return null;
  // `and` / `&` splits into SEPARATE AND-ed filters (a range's `-` is handled per-segment).
  const parts = text.split(/\s+and\s+|\s*&\s*/i).map((p) => p.trim()).filter(Boolean);
  const filters = [];
  for (const part of parts) {
    const seg = parseSegment(part);
    if (!seg) return null; // any unparseable segment invalidates the whole expression
    filters.push(...seg);
  }
  return filters.length ? { filters } : null;
}
