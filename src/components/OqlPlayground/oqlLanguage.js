// CodeMirror 6 language support for OQL (oxjob #357): syntax highlighting,
// server-backed autocomplete, and server-backed linting.
//
// Architecture per OQLO charter decision 3 — the *server* is the brain:
//   - autocomplete: cursor -> GET /parse-context -> {category, suggestions, ...};
//     id-value slots fan out to /autocomplete/{entity}.
//   - linting: GET /validate -> diagnostics (rich codes + fix-its).
// The only thing done client-side is cheap syntax highlighting (a tokenizer) +
// prefix filtering of literal suggestion lists.

import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";

import { getParseContext, validateOql, autocompleteEntity } from "./oqlEditorApi";
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
// words that START an operator after a field (`is`, `contains`, `doesn't contain`)
const _OP_STARTS = new Set(["is", "contains", "doesn't", "doesnt", "does", "matches"]);
// words that CONTINUE an operator (`is not`, `is in collection`, `is similar to`)
const _OP_CONT = new Set(["not", "in", "collection", "similar", "to", "contain", "contains", "any", "of", "unknown"]);

function _wordToken(state, w) {
  // proximity operator — appears on the value side (`contains near "a b"`)
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
  { tag: t.operatorKeyword, color: OQL_ROLES.relation.fg },                   // is / contains / >
  { tag: t.literal, color: OQL_ROLES.value.fg },                              // values
  { tag: t.string, color: OQL_ROLES.value.fg },
  { tag: t.number, color: OQL_ROLES.value.fg },
  { tag: t.atom, color: OQL_ROLES.value.fg, fontWeight: "500" },              // entity ids
  { tag: t.comment, color: OQL_ANNOTATION_FG },                               // [Name] — gray, no italics
]);

export function oqlSyntax() {
  return [oqlStream, syntaxHighlighting(oqlHighlightStyle)];
}

// --- autocomplete -------------------------------------------------------------
function _typeForKind(kind) {
  return {
    field: "property", "bool-phrase": "property", operator: "keyword",
    connective: "keyword", directive: "keyword", direction: "keyword",
    entity: "type", "enum-slug": "enum", "value-keyword": "constant",
  }[kind] || "text";
}

// Constant-scaffolding goal (#357): after accepting a completion, insert a trailing
// space and immediately re-open the next menu so the user is *always* being offered
// the next grammar step (entity → field → operator → value → connective …). The user
// can press Escape to dismiss. `text` is what to insert (may differ from the visible
// label, e.g. an id-value applies as `Ixxxx [Name]`).
function applyAndChain(text) {
  return (view, _completion, from, to) => {
    const insert = text + " ";
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
    });
    // re-open on the next tick so CM has committed the change first
    setTimeout(() => startCompletion(view), 0);
  };
}

// Sectioned continuation menu (#357): "add another value to THIS filter". In OQL a
// multi-value filter is a parenthesized OR/AND list (`type is (article or dataset)`),
// so adding a value is a STRUCTURAL rewrite of the sibling clause's value, not an
// append. Given the sibling's `value_range` (the existing scalar or `(...)` list) and
// the connective the user picked, splice the value into a paren list and drop the
// dangling connective the cursor sits after. Example: `type is article or ▮` + pick
// "dataset" via `or` -> `type is (article or dataset)`.
function applyAddSiblingValue(sibling, newValue, connective) {
  return (view, _completion, _from, to) => {
    const vr = sibling.value_range;
    if (!vr) {
      // no range to rewrite (shouldn't happen for enum siblings) — fall back to a
      // plain insert so the menu still does *something* sensible.
      return applyAndChain(newValue)(view, _completion, _from, to);
    }
    const existing = view.state.doc.sliceString(vr.start, vr.end).trim();
    const stripped = existing.startsWith("(") && existing.endsWith(")")
      ? existing.slice(1, -1).trim()
      : existing;
    const replacement = `(${stripped} ${connective} ${newValue})`;
    // replace [value_range.start, cursor) — i.e. the old value + the dangling
    // connective + whatever whitespace the cursor sits in — with the paren list.
    view.dispatch({
      changes: { from: vr.start, to, insert: replacement },
      selection: { anchor: vr.start + replacement.length },
    });
    setTimeout(() => startCompletion(view), 0);
  };
}

async function oqlCompletionSource(context) {
  const q = context.state.doc.toString();
  const pos = context.pos;
  let data;
  try {
    data = await getParseContext(q, pos);
  } catch (e) {
    return null;
  }
  const c = data && data.context;
  if (!c || c.category === "none") return null;

  const range = c.replace_range || { start: pos, end: pos };
  const from = range.start;
  const to = Math.max(range.end, pos);
  const doc = context.state.doc;
  // the COMPLETE token the menu would replace (the prefix only reaches the cursor)
  const token = doc.sliceString(from, to).trim().toLowerCase();

  // id-value slot -> live entity lookup (already filtered server-side by prefix)
  if (c.category === "value" && c.value_kind === "id" && c.autocomplete_entity) {
    // Click-into-an-existing-value (#357 iter-5): an id fragment is useless as a
    // NAME query (`i42100` matches nothing), and the `[Name]` annotation right after
    // the value belongs to it — so for an id-ish token, search by the annotation's
    // name (popular entities when there's none), and extend the replacement over the
    // annotation so picking a different entity swaps id + name together.
    let q = c.prefix || "";
    let replaceTo = to;
    const ann = doc
      .sliceString(to, Math.min(doc.length, to + 220))
      .match(/^\s*\[([^\]]*)\]/);
    if (ann) replaceTo = to + ann[0].length;
    if (/^[a-z]\d+$/i.test(token)) q = ann ? ann[1] : "";
    // the apply inserts a trailing space (chaining); swallow the one already there
    // so a mid-query swap doesn't leave a double space
    if (doc.sliceString(replaceTo, replaceTo + 1) === " ") replaceTo += 1;
    let results = [];
    try {
      results = await autocompleteEntity(c.autocomplete_entity, q);
    } catch (e) {
      results = [];
    }
    const options = results.map((r) => {
      // bare OpenAlex id: the autocomplete API's `short_id` is namespaced
      // (`institutions/I33213144`) and `id` is a full URL — the last path segment
      // of either is the canonical bare id (`I33213144`) the OQL grammar expects.
      const id = (r.short_id || r.id || "").split("/").pop();
      const name = r.display_name || id;
      return {
        label: id,
        displayLabel: name,
        detail: r.hint || c.autocomplete_entity,
        // after a value, chain to the connective menu (and / or / sort by …)
        apply: applyAndChain(`${id} [${name}]`),
        type: "variable",
      };
    });
    if (!options.length) return null;
    // results are pre-filtered by the server query; don't let CM re-filter by id
    return { from, to: replaceTo, options, filter: false };
  }

  // Maps one enum-slug suggestion to a completion option. For slugs whose display
  // name differs from the slug (countries, languages), match/show the NAME the user
  // types ("United States") but insert the slug ("us"), with the slug as detail.
  const enumOption = (s, section, applyFn) => {
    const named = s.detail;
    return {
      label: named ? s.detail : s.value,
      apply: applyFn(s.value),
      detail: named ? s.value : undefined,
      type: "enum",
      section,
    };
  };

  // Sectioned continuation menu (#357): right after `<value> or/and ▮`, the server
  // returns a FIELD context tagged with the connective + the sibling clause. Offer two
  // groups: "Another <field> value" (auto-paren rewrite of THIS filter) and "New filter"
  // (the normal field list). The value section is populated from the sibling's enum
  // `values` (static config vocab) OR, for an id-kind sibling, a live entity lookup —
  // so multi-value id filters (a 2nd institution/author) autocomplete too (#357 iter-3).
  const sib = c.sibling;
  if (c.after_connective && sib) {
    const valueSection = { name: `Another ${sib.field} value`, rank: 0 };
    const filterSection = { name: "New filter", rank: 1 };
    let valueOpts = [];
    if (sib.values && sib.values.length) {
      // enum sibling: static config vocab (client-filtered by the typed name)
      valueOpts = sib.values.map((s) =>
        enumOption(s, valueSection, (v) =>
          applyAddSiblingValue(sib, v, c.after_connective)));
    } else if (sib.value_kind === "id" && sib.autocomplete_entity) {
      // id sibling: live entity lookup for the typed prefix; accept -> auto-paren rewrite
      let results = [];
      try {
        results = await autocompleteEntity(sib.autocomplete_entity, c.prefix || "");
      } catch (e) {
        results = [];
      }
      valueOpts = results.map((r) => {
        const id = (r.short_id || r.id || "").split("/").pop();
        const name = r.display_name || id;
        return {
          label: name,
          detail: r.hint || sib.autocomplete_entity,
          type: "variable",
          section: valueSection,
          apply: applyAddSiblingValue(sib, `${id} [${name}]`, c.after_connective),
        };
      });
    }
    const fieldOpts = (c.suggestions || []).map((s) => ({
      label: s.value,
      apply: applyAndChain(s.value),
      type: _typeForKind(s.kind),
      section: filterSection,
    }));
    const options = [...valueOpts, ...fieldOpts];
    if (!options.length) return null;
    return { from, to, options };
  }

  // literal completions (fields / operators / connectives / enums / directives).
  // Each chains to the next menu so scaffolding never stops. `section` groups them
  // in the dropdown (the sectioned continuation menu — server may tag suggestions).
  const sugg = c.suggestions || [];
  const kinds = new Set(sugg.map((s) => s.kind));

  // Keyword spots aren't choices (#357 iter-5, Jason: clicking `where` and being
  // offered only "where" is pointless): a cursor parked on a word that's already a
  // directive-keyword component gets NO menu. Typed partials ("gro", "sor") still
  // complete normally — and a pick mid-phrase ("by" -> "sort by") would mangle the
  // text anyway, so suppressing the complete words also closes that trap.
  const DIRECTIVE_COMPONENTS = new Set(["where", "sort", "group", "by", "sample"]);
  if (
    sugg.length &&
    [...kinds].every((k) => k === "directive") &&
    DIRECTIVE_COMPONENTS.has(token)
  ) {
    return null;
  }

  // Clicking into an already-complete token means "show me my options here" (#357
  // iter-5): for slots whose choice set is a real swap — and/or, asc/desc,
  // is/is not, enum vocab, entity types — offer the FULL set unfiltered, so the
  // current word doesn't filter the menu down to a pointless echo of itself.
  // Typing re-queries the source and filters as usual.
  const SWAP_KINDS = new Set(["entity", "connective", "operator", "direction", "enum-slug"]);
  const tokenIsComplete =
    !!token && sugg.some((s) => String(s.value).toLowerCase() === token);
  const swap = tokenIsComplete && [...kinds].some((k) => SWAP_KINDS.has(k));

  const options = sugg.map((s) => {
    if (s.kind === "enum-slug") return enumOption(s, s.section || undefined, applyAndChain);
    return {
      label: s.value,
      apply: applyAndChain(s.value),
      detail: s.detail || undefined,
      type: _typeForKind(s.kind),
      section: s.section || undefined,
      boost: s.kind === "field" || s.kind === "operator" ? 1 : 0,
    };
  });
  if (!options.length) return null;
  return swap ? { from, to, options, filter: false } : { from, to, options };
}

export function oqlAutocomplete() {
  return autocompletion({
    override: [oqlCompletionSource],
    activateOnTyping: true,
    icons: true,
    defaultKeymap: true,
  });
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
      if (onResult) onResult(data);
      if (data.valid) return [];
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
