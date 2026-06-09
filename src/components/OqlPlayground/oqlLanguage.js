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
import { ViewPlugin, Decoration, EditorView } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

import { getParseContext, validateOql, autocompleteEntity } from "./oqlEditorApi";

// --- keywords (lowercase, matched case-insensitively) ------------------------
const KEYWORDS = new Set([
  "where", "and", "or", "not", "is", "contains", "any", "of", "in",
  "sort", "group", "by", "sample", "seed", "near", "within", "words", "word",
  "similar", "to", "unknown", "null", "asc", "desc", "ascending", "descending",
  "does", "doesn't", "doesnt", "it's", "its", "it", "has", "have",
]);

const _WORD = /[^\s"[\](),;><]+/;

// --- syntax highlighting ------------------------------------------------------
const oqlStream = StreamLanguage.define({
  name: "oql",
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    const ch = stream.peek();
    if (ch === '"') {                       // "literal phrase"
      stream.next();
      let c;
      while ((c = stream.next()) != null) if (c === '"') break;
      return "string";
    }
    if (ch === "[") {                        // [annotation] — inert decoration
      stream.next();
      let c;
      while ((c = stream.next()) != null) if (c === "]") break;
      return "comment";
    }
    if (ch === "(" || ch === ")" || ch === "," || ch === ";") {
      stream.next();
      return "punctuation";
    }
    if (ch === ">" || ch === "<") {          // comparison operators
      stream.next();
      if (stream.peek() === "=") stream.next();
      return "operator";
    }
    if (_WORD.test(ch)) {
      stream.match(_WORD);
      const raw = stream.current();
      const w = raw.toLowerCase();
      if (KEYWORDS.has(w)) return "keyword";
      if (/^[a-z]\d{4,}$/i.test(raw)) return "atom";   // OpenAlex id (I12345…)
      if (/^\d+$/.test(raw)) return "number";
      return "variableName";                            // field name / value
    }
    stream.next();
    return null;
  },
  tokenTable: {
    punctuation: t.punctuation,
  },
});

const oqlHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#7c3aed", fontWeight: "600" },     // violet
  { tag: t.string, color: "#0369a1" },                          // blue
  { tag: t.comment, color: "#94a3b8", fontStyle: "italic" },    // grey annotations
  { tag: t.number, color: "#b45309" },                          // amber
  { tag: t.atom, color: "#047857", fontWeight: "500" },         // green ids
  { tag: t.operator, color: "#7c3aed" },
  { tag: t.variableName, color: "#0f172a" },                    // near-black
]);

export function oqlSyntax() {
  return [oqlStream, syntaxHighlighting(oqlHighlightStyle)];
}

// --- autocomplete -------------------------------------------------------------
function _typeForKind(kind) {
  return {
    field: "property", "bool-phrase": "property", operator: "keyword",
    connective: "keyword", directive: "keyword", entity: "type",
    "enum-slug": "enum", "value-keyword": "constant",
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

  // id-value slot -> live entity lookup (already filtered server-side by prefix)
  if (c.category === "value" && c.value_kind === "id" && c.autocomplete_entity) {
    let results = [];
    try {
      results = await autocompleteEntity(c.autocomplete_entity, c.prefix || "");
    } catch (e) {
      results = [];
    }
    const options = results.map((r) => {
      const id = r.short_id || (r.id || "").split("/").pop();
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
    return { from, to, options, filter: false };
  }

  // literal completions (fields / operators / connectives / enums / directives).
  // Each chains to the next menu so scaffolding never stops. `section` groups them
  // in the dropdown (the sectioned continuation menu — server may tag suggestions).
  const options = (c.suggestions || []).map((s) => ({
    label: s.value,
    apply: applyAndChain(s.value),
    type: _typeForKind(s.kind),
    section: s.section || undefined,
    boost: s.kind === "field" || s.kind === "operator" ? 1 : 0,
  }));
  if (!options.length) return null;
  return { from, to, options };
}

export function oqlAutocomplete() {
  return autocompletion({
    override: [oqlCompletionSource],
    activateOnTyping: true,
    icons: true,
    defaultKeymap: true,
  });
}

// --- hide-IDs decoration (#357 setting) --------------------------------------
// Entity values render as `Ixxxx [Display Name]`. When "hide IDs" is on, visually
// collapse the `Ixxxx ` prefix so the user sees just `[Display Name]`. The id stays
// in the document (copy/run/format all use the real text) — this is display-only.
const _ID_BEFORE_BRACKET = /([A-Za-z]\d{4,})(\s+)(?=\[)/g;
const _hiddenMark = Decoration.replace({});

function _buildIdDecos(view) {
  const builder = new RangeSetBuilder();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let m;
    _ID_BEFORE_BRACKET.lastIndex = 0;
    while ((m = _ID_BEFORE_BRACKET.exec(text)) !== null) {
      const start = from + m.index;
      const end = start + m[1].length + m[2].length; // id + trailing whitespace
      builder.add(start, end, _hiddenMark);
    }
  }
  return builder.finish();
}

// ViewPlugin + atomicRanges so the cursor skips over the hidden id rather than
// landing invisibly inside it. Toggle via a Compartment in OqlEditor.vue.
export const hideIdsExtension = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = _buildIdDecos(view);
    }
    update(u) {
      if (u.docChanged || u.viewportChanged) this.decorations = _buildIdDecos(u.view);
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of(
        (view) => view.plugin(plugin)?.decorations || Decoration.none
      ),
  }
);

// --- fonts (#357 setting) ----------------------------------------------------
// Default to a friendly proportional UI font (the language is English-y and has
// nothing to column-align); offer monospace as a power-user toggle.
export const proportionalFontTheme = EditorView.theme({
  ".cm-content": {
    fontFamily:
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  },
});
export const monoFontTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "'JetBrains Mono','SF Mono',Menlo,monospace",
  },
});

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
