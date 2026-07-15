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

// Operator/keyword words that can directly precede a VALUE in OQL surface syntax.
// An annotation right after one of these (`institution is [Harvard]`) is a LONE
// annotation — the grammar accepts it as the value ref itself — so it must
// survive serialization. An annotation after anything else follows a value the
// parser treats as authoritative, so dropping it can't change the parse.
const OQL_PRE_VALUE_WORDS = new Set([
    "get", "where", "and", "or", "not", "is", "has", "in", "collection",
    "return", "sort", "by", "asc", "desc",
]);

// Strip `[display name]` annotations from an OQL string (oxjob #603 round 26c).
// Annotations are display sugar the parser IGNORES (`[...]` after a value; the ID
// is authoritative — oql_lang line 13), but they were riding into `?oql=` URLs:
// the render canonical the builder emits is annotated, while the execute echo
// (`x_query.oql`) is bare by design (decision 14 — no per-request ES display-name
// lookups on the execute path). Two spellings of one query in the URL layer is
// exactly what caused the round-26 draft-wipe (a post-run URL projection read as
// an external query change). Direction chosen with Jason 2026-07-15: URLs are
// BARE — strip annotations at the single URL-serialization point rather than
// teach the execute path to annotate (which would add an ES lookup dependency).
//
// Mirrors the server lexer exactly: `"` delimits strings with NO escape
// sequences (an in-string `[x]` is literal text — untouched); `[` outside a
// string opens an annotation ending at the next `]` (annotations don't nest).
// A LONE annotation (directly after an operator word, `(`, `,`, or at the start
// of a value slot) is itself a value ref in the grammar and is preserved;
// unterminated constructs are copied verbatim (garbage in, same garbage out —
// the server is the validator, not us).
export const stripOqlAnnotations = function (oql) {
    const s = String(oql ?? "");
    const n = s.length;
    let out = "";
    let i = 0;
    let curWord = "";   // word being scanned (abuts the current position)
    let prevWord = "";  // last completed word before intervening whitespace
    let prevCh = "";    // last non-whitespace char emitted outside strings
    while (i < n) {
        const c = s[i];
        if (c === '"') {
            const j = s.indexOf('"', i + 1);
            const end = j === -1 ? n : j + 1;
            out += s.slice(i, end);
            prevCh = '"';
            prevWord = "";
            curWord = "";
            i = end;
            continue;
        }
        if (c === "[") {
            const j = s.indexOf("]", i + 1);
            if (j === -1) { out += s.slice(i); break; } // unterminated: verbatim
            const word = (curWord || prevWord).toLowerCase();
            const lone = prevCh === "" || prevCh === "(" || prevCh === "," ||
                OQL_PRE_VALUE_WORDS.has(word);
            if (lone) {
                out += s.slice(i, j + 1); // the annotation IS the value — keep it
                prevCh = "]";
                prevWord = "";
                curWord = "";
            } else {
                out = out.replace(/\s+$/, ""); // drop the annotation + the gap before it
            }
            i = j + 1;
            continue;
        }
        out += c;
        if (/\s/.test(c)) {
            if (curWord) { prevWord = curWord; curWord = ""; }
        } else {
            prevCh = c;
            if (/[A-Za-z0-9_./-]/.test(c)) curWord += c;
            else { if (curWord) prevWord = curWord; curWord = ""; }
        }
        i += 1;
    }
    return out;
};

export const oqlForUrl = function (oql) {
    return stripOqlAnnotations(String(oql ?? ""))
        .replace(/\s*[\r\n]+\s*/g, " ")
        .trim();
};
