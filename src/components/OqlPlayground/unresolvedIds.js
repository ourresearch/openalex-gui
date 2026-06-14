// Unresolvable-entity-id detection for the OQL editor (oxjob #419).
//
// A shape-valid OpenAlex id that resolves to no entity (a typo, or a deleted/merged
// record) is deliberately still VALID OQL — the language faithfully mirrors the engine,
// which accepts it and returns empty (#363). So existence-checking stays OUT of the
// validator. Instead the renderer annotates the miss as "[no entity found]" in the
// canonical oql (#418). This module is the editor-side companion: read that sentinel
// and turn it into a loud, NON-blocking inline warning so a typo doesn't silently yield
// zero results. Purely a string transform — no CodeMirror / API imports — so it's a
// leaf module the linter wires in and unit tests can import under a plain node env.

const NO_ENTITY_SENTINEL = "[no entity found]";
// id token shared with the editor tokenizer's value rule: a letter then >=4 digits.
const ID_TOKEN = /[A-Za-z]\d{4,}/g;

/**
 * Given the user's buffer text `q` and the server's canonical oql string, return a
 * per-id warning for every buffer occurrence of an id the server marked
 * "[no entity found]".
 *
 * Why re-locate by token instead of using the canonical's offsets: the canonical oql
 * reformats the query and can add `[display name]` annotations the user never typed,
 * so its character offsets don't line up with the live buffer. The bare id string,
 * however, is stable across both — so we collect the unresolved ids from the canonical
 * and find each one in `q` to get true buffer offsets. Matching is case-insensitive
 * (the canonical upper-cases ids; users often type them lower-case).
 *
 * @param {string} q            the editor buffer (what the user typed)
 * @param {string} canonicalOql the `oql` field from /validate (null on invalid queries)
 * @returns {Array<{from:number,to:number,severity:"warning",code:string,message:string,fixit:string}>}
 *          empty when there's no canonical, no sentinel, or no buffer match.
 */
export function unresolvedIdDiagnostics(q, canonicalOql) {
  if (!q || typeof canonicalOql !== "string" || !canonicalOql.includes(NO_ENTITY_SENTINEL)) {
    return [];
  }
  const unresolved = new Set();
  const annot = /([A-Za-z]\d{4,})\s*\[no entity found\]/g;
  let a;
  while ((a = annot.exec(canonicalOql)) !== null) {
    unresolved.add(a[1].toLowerCase());
  }
  if (!unresolved.size) return [];

  const out = [];
  ID_TOKEN.lastIndex = 0;
  let m;
  while ((m = ID_TOKEN.exec(q)) !== null) {
    const raw = m[0];
    if (!unresolved.has(raw.toLowerCase())) continue;
    out.push({
      from: m.index,
      to: m.index + raw.length,
      severity: "warning",
      code: "OQL_UNRESOLVABLE_ID",
      message: `${raw} — no entity found. This ID is well-formed but matches no entity; it may be a typo, or a deleted or merged record.`,
      fixit: "The query still runs — this clause just matches nothing. Double-check the ID (or pick it from autocomplete in the builder).",
    });
  }
  return out;
}
