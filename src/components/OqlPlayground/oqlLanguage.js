// CodeMirror 6 language support for OQL (oxjob #357 → #441): syntax highlighting
// + server-backed linting. NO autocomplete — OQL is a serialization surface, not
// an authoring tool (the LEGO builder owns authoring), so the editor only
// highlights and validates what it's given.
//
// Architecture per OQLO charter decision 3 — the *server* is the brain:
//   - linting: GET /validate -> diagnostics (rich codes + fix-its).
// The only thing done client-side is cheap syntax highlighting (a tokenizer).

import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { linter } from "@codemirror/lint";

import { validateOql } from "./oqlEditorApi";
import { unresolvedIdDiagnostics } from "./unresolvedIds";
import { OQL_ROLES, OQL_ANNOTATION_FG } from "@/components/Oql/oqlPalette";

// --- syntax highlighting ------------------------------------------------------
// Stateful tokenizer (#357 iter-3 item 6): classify every word by its SEMANTIC
// ROLE — keyword / conjunction / property / relation / value — and color it with
// the same palette as the #428 builder's bricks, so the two surfaces read as one
// feature. The grammar position decides the role (the same word can be a field
// word in `cited by is W123` and a keyword in `sort by`), so the tokenizer walks
// a small mode machine: entity → clause → field → relation → value, with paren
// depth tracking for value lists (`type is (article or dataset)` — and/or inside
// parens stay in the value list; outside they start a new clause).
//
// This is cosmetic best-effort only — the server (/validate) is the truth.

const _WORD = /[^\s"[\](),;><]+/;

const _DIRECTIONS = new Set(["asc", "desc", "ascending", "descending"]);
const _CONJUNCTIONS = new Set(["and", "or"]);
// boolean-phrase leads (`it's retracted`, `it has an ORCID`): the lead reads as
// the relation, the rest of the phrase is the property (violet, like the
// builder's boolean chips).
const _BOOL_LEADS = new Set(["it's", "its", "it"]);
const _BOOL_RELS = new Set(["has", "have", "not", "does", "doesn't", "doesnt", "is"]);
// words that START an operator after a field (`is`, `has`, `doesn't have`)
const _OP_STARTS = new Set(["is", "has", "doesn't", "doesnt", "does", "matches"]);
// words that CONTINUE an operator (`is not`, `is in collection`, `is similar to`, `does not have`)
const _OP_CONT = new Set(["not", "in", "collection", "similar", "to", "have", "any", "of", "unknown"]);

function _wordToken(state, w) {
  // proximity operator — appears on the value side (`has near "a b"`)
  if (w === "near") return "relation";
  switch (state.m) {
    case "entity":
      state.m = "clause";
      return "field"; // entity chip is property-violet in the builder
    case "clause":
      if (w === "where") { state.m = "field"; return "keyword"; }
      if (w === "sort" || w === "group") { state.m = "by"; return "keyword"; }
      if (w === "sample" || w === "seed") { state.m = "value"; return "keyword"; }
      state.m = "field";
      return "field";
    case "field":
      if (_CONJUNCTIONS.has(w)) { state.bool = false; return "conjunction"; }
      if (state.bool && _BOOL_RELS.has(w)) return "relation";
      if (_BOOL_LEADS.has(w)) { state.bool = true; return "relation"; }
      if (!state.bool && _OP_STARTS.has(w)) { state.m = "op"; return "relation"; }
      if (w === "sort" || w === "group") { state.m = "by"; state.bool = false; return "keyword"; }
      if (w === "sample" || w === "seed") { state.m = "value"; state.bool = false; return "keyword"; }
      return "field";
    case "op": // operator continuation or first value word
      if (_OP_CONT.has(w)) return "relation";
      state.m = "value";
      return "value";
    case "value":
      if (_CONJUNCTIONS.has(w)) {
        if (state.p === 0) state.m = "field";
        return "conjunction";
      }
      if (state.p === 0) {
        if (w === "sort" || w === "group") { state.m = "by"; return "keyword"; }
        if (w === "sample" || w === "seed") return "keyword";
        if (_DIRECTIONS.has(w)) return "keyword";
      }
      return "value";
    case "by":
      state.m = "sortfield";
      return w === "by" ? "keyword" : "field";
    case "sortfield":
      if (_DIRECTIONS.has(w)) return "keyword";
      if (w === "sort" || w === "group") { state.m = "by"; return "keyword"; }
      if (w === "sample" || w === "seed") { state.m = "value"; return "keyword"; }
      if (_CONJUNCTIONS.has(w)) return "conjunction";
      return "field";
    default:
      return "value";
  }
}

const oqlStream = StreamLanguage.define({
  name: "oql",
  startState: () => ({ m: "entity", p: 0, bool: false }),
  token(stream, state) {
    if (stream.eatSpace()) return null;
    const ch = stream.peek();
    if (ch === '"') {                       // "literal phrase" — always a value
      stream.next();
      let c;
      while ((c = stream.next()) != null) if (c === '"') break;
      if (state.m === "op") state.m = "value";
      return "string";
    }
    if (ch === "[") {                        // [annotation] — inert decoration
      stream.next();
      let c;
      while ((c = stream.next()) != null) if (c === "]") break;
      return "comment";
    }
    if (ch === "(") {
      stream.next();
      state.p += 1;
      if (state.m === "op") state.m = "value";
      return "punctuation";
    }
    if (ch === ")") {
      stream.next();
      state.p = Math.max(0, state.p - 1);
      return "punctuation";
    }
    if (ch === ",") { stream.next(); return "punctuation"; }
    if (ch === ";") {                        // statement end — reset
      stream.next();
      state.m = "entity"; state.p = 0; state.bool = false;
      return "punctuation";
    }
    if (ch === ">" || ch === "<") {          // comparison operators
      stream.next();
      if (stream.peek() === "=") stream.next();
      if (state.m === "field") state.m = "op";
      return "relation";
    }
    if (_WORD.test(ch)) {
      stream.match(_WORD);
      const raw = stream.current();
      const role = _wordToken(state, raw.toLowerCase());
      if (role === "value") {
        if (/^[a-z]\d{4,}$/i.test(raw)) return "atom";   // OpenAlex id (I12345…)
        if (/^\d+$/.test(raw)) return "number";
      }
      return role;
    }
    stream.next();
    return null;
  },
  tokenTable: {
    punctuation: t.punctuation,
    field: t.propertyName,
    relation: t.operatorKeyword,
    conjunction: t.logicOperator,
    value: t.literal,
  },
});

// Role colors shared with the #428 builder (single source: oqlPalette.js).
const oqlHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: OQL_ROLES.keyword.fg, fontWeight: "600" },         // where / sort by
  { tag: t.logicOperator, color: OQL_ROLES.conjunction.fg, fontWeight: "600" }, // and / or
  { tag: t.propertyName, color: OQL_ROLES.property.fg, fontWeight: "600" },   // fields, entity
  { tag: t.operatorKeyword, color: OQL_ROLES.relation.fg },                   // is / has / >
  { tag: t.literal, color: OQL_ROLES.value.fg },                              // values
  { tag: t.string, color: OQL_ROLES.value.fg },
  { tag: t.number, color: OQL_ROLES.value.fg },
  { tag: t.atom, color: OQL_ROLES.value.fg, fontWeight: "500" },              // entity ids
  { tag: t.comment, color: OQL_ANNOTATION_FG },                               // [Name] — gray, no italics
]);

export function oqlSyntax() {
  return [oqlStream, syntaxHighlighting(oqlHighlightStyle)];
}

// --- linting ------------------------------------------------------------------
// makeOqlLinter(onResult) returns the linter extension. The same /validate
// response that drives the squiggles is handed to onResult so the preview panel
// updates from one round-trip (no duplicate call).
export function makeOqlLinter(onResult) {
  return linter(
    async (view) => {
      const q = view.state.doc.toString();
      if (!q.trim()) {
        if (onResult) onResult(null);
        return [];
      }
      let data;
      try {
        data = await validateOql(q);
      } catch (e) {
        return [];
      }
      // Fold client-side unresolvable-id warnings into the same diagnostics list so
      // they show in BOTH the squiggles and the badge/popover (which reads onResult's
      // data.diagnostics). These carry buffer offsets in start/end, matching server
      // diagnostics' shape. `valid` is left untouched → Run/Tidy stay enabled.
      const idWarnings = unresolvedIdDiagnostics(q, data && data.oql).map((w) => ({
        code: w.code,
        message: w.message,
        fixit: w.fixit,
        severity: w.severity,
        start: w.from,
        end: w.to,
      }));
      if (idWarnings.length) {
        data = { ...data, diagnostics: [...(data.diagnostics || []), ...idWarnings] };
      }
      if (onResult) onResult(data);
      const len = q.length;
      return (data.diagnostics || [])
        .filter((d) => d.severity !== "info")
        .map((d) => {
          const start = typeof d.start === "number" ? Math.min(d.start, len) : 0;
          const end =
            typeof d.end === "number" && d.end > start
              ? Math.min(d.end, len)
              : Math.min(len, start + 1);
          return {
            from: start,
            to: Math.max(end, Math.min(start + 1, len)),
            severity: d.severity || "error",
            message: d.message + (d.fixit ? `\n\n💡 ${d.fixit}` : ""),
            source: d.code,
          };
        });
    },
    { delay: 350 }
  );
}
