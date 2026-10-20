// The IDE layer of the OQL editor (oxjob #1597): what makes the box at the top of the search
// page feel like VS Code. Jason (2026-10-08 interview, 2026-10-20): "a text editor that tells
// you what your options are"; "entities should be shown as links, not markdown style parens
// and brackets".
//
//   - Entity links: `[MIT](I63966007)` shows as the name, styled as a link. `[`, `](` and the
//     ID are hidden, never deleted: the document (v-model, copy, the URL) keeps the full form.
//     Click puts the cursor in the name and opens its lookup; Cmd/Ctrl-click opens the entity.
//   - Autocomplete: the server's parser says what fits at the cursor (GET /parse-context, the
//     same grammar that runs the query); entity slots and `[` look names up as you type.
//   - Hover: an entity shows a small card with a link out; a phrase shows its help (GET
//     /oql-vocabulary, the parser's own vocabulary).
//   - Highlighting for the English OQL (keywords quiet, values teal, links blue).
//
// Everything here is opt-in through OqlEditor's `ide` prop; the old OQL tab doesn't turn it on.

import { EditorState, StateField, RangeSetBuilder, Compartment, Prec } from "@codemirror/state";
import {
  EditorView, Decoration, WidgetType, hoverTooltip, keymap, tooltips, closeHoverTooltips,
} from "@codemirror/view";
import {
  autocompletion, startCompletion, acceptCompletion, completionStatus,
  insertCompletionText, pickedCompletion,
} from "@codemirror/autocomplete";
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import { cmdLabel } from "@/components/Oql/platformKeys";
import { OQL_ROLES, OQL_ANNOTATION_FG } from "@/components/Oql/oqlPalette";
import { collectionTypeIcon } from "@/collectionTypeLabels";
import { edgeWarm } from "@/edgeAutocomplete";
import {
  findLinks, linkAtName, linkCovering, openBracketBefore, bracketTailEnd, linkText,
  phraseAt, entityPath, cardFacts, kindLabel, compactNumber,
} from "./oqlLinks";
import { getParseContext, searchEntities, getEntityRecord, getVocabulary } from "./oqlEditorApi";

// --- vocabulary (the parser's phrases + help) --------------------------------------------
// Loaded once per page. Until it arrives (or on an API that doesn't serve it yet) keywords
// come from the small list below and phrase help is off; once served, the parser's own words
// replace the list.
const FALLBACK_KEYWORDS = `get the of and or not by about with in from since before through at published funded
citing co-authored under license where works articles reviews preprints books book chapters datasets conference
papers dissertations editorials letters reports authors institutions sources journals repositories companies
funders publishers topics fields subfields domains countries count sum mean median percent share h-index
citations fwci retracted open access closed non-retracted top cited first last most least newest oldest best
matches highest lowest alphabetical reverse latest earliest year country institution source funder publisher
language type topic field subfield domain sdg corresponding author as collection show only least more than
fewer above below who each all ever title abstract full text an a is except both`.split(/\s+/);

const vocab = { keywords: new Set(FALLBACK_KEYWORDS), phrases: new Map(), served: false };
let vocabPromise = null;

function loadVocabulary() {
  if (!vocabPromise) {
    vocabPromise = getVocabulary().then((phrases) => {
      if (!phrases || !phrases.length) return;
      const keywords = new Set();
      for (const p of phrases) {
        const key = String(p.value || "").toLowerCase().replace(/\s+/g, " ").trim();
        if (!key) continue;
        if (!vocab.phrases.has(key)) vocab.phrases.set(key, p);
        if (p.kind !== "year") for (const w of key.split(" ")) if (/^[a-z-]+$/.test(w)) keywords.add(w);
      }
      vocab.keywords = keywords;
      vocab.served = true;
    });
  }
  return vocabPromise;
}

// --- highlighting for the English OQL ------------------------------------------------------
const LOGIC_WORDS = new Set(["and", "or", "not"]);
function eatThrough(stream, ch) {
  let c;
  while ((c = stream.next()) != null && c !== ch);
}

// A fresh instance re-tokenizes the document (a reconfigure with the same one would not).
const makeCoreStream = () => StreamLanguage.define({
  name: "oql-core",
  startState: () => ({ p: 0, afterLink: false }),
  token(stream, state) {
    if (stream.eatSpace()) return null;
    const ch = stream.peek();
    if (ch === '"') {
      stream.next();
      eatThrough(stream, '"');
      state.afterLink = false;
      return "string";
    }
    if (ch === "[") {
      stream.next();
      eatThrough(stream, "]");
      state.afterLink = stream.peek() === "(";
      return "link";
    }
    if (ch === "(" && state.afterLink) {
      stream.next();
      eatThrough(stream, ")");
      state.afterLink = false;
      return "meta";
    }
    state.afterLink = false;
    if (ch === "(") { stream.next(); state.p += 1; return "paren"; }
    if (ch === ")") { stream.next(); state.p = Math.max(0, state.p - 1); return "paren"; }
    if (ch === "," || ch === "." || ch === ";") { stream.next(); return "punctuation"; }
    if (stream.match(/^\d[\d,.–-]*(?![^\s,.;()[\]"])/)) return "number";
    if (stream.match(/^[^\s,.;()[\]"]+/)) {
      const w = stream.current().toLowerCase().replace(/'s$/, "");
      if (state.p > 0) return LOGIC_WORDS.has(w) ? "logic" : "value";
      return vocab.keywords.has(w) ? "keyword" : "value";
    }
    stream.next();
    return null;
  },
  tokenTable: {
    keyword: t.keyword, value: t.literal, logic: t.logicOperator, link: t.link,
    meta: t.meta, paren: t.paren, punctuation: t.punctuation,
  },
});

// Role colors from the one OQL palette (oqlPalette.js), shared with the old editor and builder.
const coreHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.punctuation], color: OQL_ROLES.keyword.fg },
  { tag: [t.literal, t.string, t.number], color: OQL_ROLES.value.fg, fontWeight: "500" },
  { tag: t.logicOperator, color: OQL_ROLES.conjunction.fg, fontWeight: "600" },
  { tag: t.paren, color: OQL_ANNOTATION_FG },
]);

const languageSlot = new Compartment();
const coreLanguage = () => [makeCoreStream(), syntaxHighlighting(coreHighlight)];

// --- entity links: hide the Markdown, keep the text -----------------------------------------
class EmptyLinkWidget extends WidgetType {
  constructor(id) { super(); this.id = id; }
  eq(o) { return o.id === this.id; }
  toDOM() {
    const s = document.createElement("span");
    s.className = "cm-oql-link";
    s.textContent = this.id;
    return s;
  }
}

const hideMark = Decoration.replace({});
const linkMark = Decoration.mark({ class: "cm-oql-link" });

function buildLinks(state) {
  const links = findLinks(state.doc.toString());
  const deco = new RangeSetBuilder();
  const hidden = new RangeSetBuilder();
  for (const l of links) {
    if (!l.name) {
      const w = Decoration.replace({ widget: new EmptyLinkWidget(l.id) });
      deco.add(l.from, l.to, w);
      hidden.add(l.from, l.to, w);
      continue;
    }
    deco.add(l.from, l.nameFrom, hideMark);
    deco.add(l.nameFrom, l.nameTo, linkMark);
    deco.add(l.nameTo, l.to, hideMark);
    hidden.add(l.from, l.nameFrom, hideMark);
    hidden.add(l.nameTo, l.to, hideMark);
  }
  return { links, deco: deco.finish(), hidden: hidden.finish() };
}

const linkField = StateField.define({
  create: (state) => buildLinks(state),
  update: (value, tr) => (tr.docChanged ? buildLinks(tr.state) : value),
  provide: (f) => [
    EditorView.decorations.from(f, (v) => v.deco),
    EditorView.atomicRanges.of((view) => view.state.field(f).hidden),
  ],
});

// A click or arrow that stops at the very start or end of a name (the same spot on screen as
// just outside the link) puts the caret outside, so typing after a link never lands in its
// name. An arrow moving across the edge steps one character in instead, so it never sticks.
const linkCaret = EditorState.transactionFilter.of((tr) => {
  if (!tr.selection || tr.docChanged || !tr.isUserEvent("select")) return tr;
  const sel = tr.newSelection.main;
  if (!sel.empty || tr.newSelection.ranges.length > 1) return tr;
  const before = tr.startState.selection.main.head;
  for (const l of tr.startState.field(linkField).links) {
    if (!l.name) continue;
    let anchor = null;
    if (sel.head === l.nameTo) {
      anchor = before === l.to && before > sel.head ? Math.max(l.nameFrom, l.nameTo - 1) : l.to;
    } else if (sel.head === l.nameFrom) {
      anchor = before === l.from && before < sel.head ? Math.min(l.nameTo, l.nameFrom + 1) : l.from;
    }
    if (anchor !== null && anchor !== sel.head) return [tr, { selection: { anchor }, sequential: true }];
  }
  return tr;
});

// Backspace / Delete walk through a link one name character at a time and never break its
// hidden parts; an emptied link goes in one more keystroke.
function deleteAroundLink(view, forward) {
  const { state } = view;
  const sel = state.selection.main;
  const { links } = state.field(linkField);
  if (!sel.empty) {
    // a selection that holds a whole name takes the whole link with it
    let from = sel.from, to = sel.to;
    for (const l of links) {
      if (from <= l.nameFrom && to >= l.nameTo) {
        from = Math.min(from, l.from);
        to = Math.max(to, l.to);
      }
    }
    if (from === sel.from && to === sel.to) return false;
    view.dispatch({ changes: { from, to }, selection: { anchor: from }, userEvent: "delete.selection" });
    return true;
  }
  const p = sel.head;
  // `lookup`: the edit landed in a name, so open its lookup (a keymap command, not an update)
  const del = (from, to, anchor, lookup = false) => {
    view.dispatch({
      changes: { from, to }, selection: { anchor },
      userEvent: forward ? "delete.forward" : "delete.backward",
    });
    if (lookup && view.dom) startCompletion(view);
    return true;
  };
  for (const l of links) {
    if (p < l.from || p > l.to) continue;
    if (!l.name) {
      if ((!forward && p === l.to) || (forward && p === l.from)) return del(l.from, l.to, l.from);
      continue;
    }
    if (!forward) {
      if (p === l.to) return del(l.nameTo - 1, l.nameTo, l.nameTo - 1, true);
      if (p === l.nameFrom || p === l.from) {
        if (l.from === 0) return true;
        return del(l.from - 1, l.from, l.from - 1);
      }
    } else {
      if (p === l.from || p === l.nameFrom) return del(l.nameFrom, l.nameFrom + 1, l.nameFrom, true);
      if (p === l.nameTo) {
        if (l.to >= state.doc.length) return true;
        return del(l.to, l.to + 1, l.to);
      }
    }
  }
  return false;
}

// --- autocomplete ----------------------------------------------------------------------------
// Icons for the grammar's kinds of word; entity kinds take the site's own entity icons.
const WORD_ICONS = {
  keyword: "mdi-code-braces", noun: "mdi-shape-outline", adjective: "mdi-tag-text-outline",
  measure: "mdi-sigma", split: "mdi-table-column", order: "mdi-sort", year: "mdi-calendar-blank-outline",
  place: "mdi-text-search", sentence: "mdi-format-text", search: "mdi-magnify",
};
const iconFor = (kind) => WORD_ICONS[kind] || (kind ? collectionTypeIcon(kind) : WORD_ICONS.keyword);

// JS strings count UTF-16 units; the parser counts code points.
function toCodePoints(text, pos) {
  return [...text.slice(0, pos)].length;
}
function fromCodePoints(text, cp) {
  let i = 0, n = 0;
  while (n < cp && i < text.length) {
    const c = text.codePointAt(i);
    i += c > 0xffff ? 2 : 1;
    n += 1;
  }
  return i;
}

// Context answers by the text before the cursor: typing inside a `[...]` asks once.
const ctxCache = new Map();
async function parseContextAt(text, pos) {
  const key = text.slice(0, pos);
  if (!ctxCache.has(key)) {
    if (ctxCache.size > 30) ctxCache.clear();
    ctxCache.set(key, getParseContext(text, toCodePoints(text, pos)).catch(() => null));
  }
  return ctxCache.get(key);
}

function needsSpaceAfter(state, to) {
  const next = state.doc.sliceString(to, to + 1);
  return next === "" || !/[\s,.)]/.test(next);
}

// Insert `text` over [from, to), plus a space unless `cursor` puts the caret inside it. Whether
// the next dropdown opens is the option's `reopen` (CodeMirror's activateOnCompletion).
function applyText(text, { space = true, cursor = null } = {}) {
  return (view, completion, from, to) => {
    const add = space && cursor == null && needsSpaceAfter(view.state, to) ? " " : "";
    const spec = insertCompletionText(view.state, text + add, from, to);
    if (cursor != null) spec.selection = { anchor: from + cursor };
    view.dispatch({ ...spec, annotations: pickedCompletion.of(completion) });
  };
}

function entityOption(row, i) {
  const bits = [row.hint, row.works_count != null ? `${compactNumber(row.works_count)} works` : null];
  return {
    label: row.name,
    detail: bits.filter(Boolean).join(" · ").slice(0, 70) || kindLabel(row.kind),
    type: row.kind || "search",
    boost: 99 - Math.min(98, i),
    section: { name: "Matching names", rank: 0 },
    reopen: true,
    apply: applyText(linkText(row.name, row.id)),
  };
}

function serverOption(s, i) {
  const insert = s.insert || s.value;
  const cursor = typeof s.cursor === "number" ? s.cursor : null;
  const endish = s.kind === "order" || /[)"]$/.test(insert) || cursor != null;
  const apply = applyText(insert, { space: !endish, cursor });
  return {
    label: s.value,
    detail: s.detail || undefined,
    info: s.doc ? () => docNode(s.doc, "cm-oql-info") : undefined,
    type: s.kind || "keyword",
    boost: 60 - Math.min(59, i),
    section: { name: s.current ? "Current" : "Suggestions", rank: s.current ? 1 : 2 },
    reopen: s.kind !== "order",
    // `, most cited first` / `. Show ...` offered mid-phrase: swallow the space before it
    apply: /^[,.]/.test(insert)
      ? (view, c, from, to) => apply(view, c, view.state.doc.sliceString(from - 1, from) === " " ? from - 1 : from, to)
      : apply,
  };
}

async function entityResult(ctx, kinds, query, from, to, extra = []) {
  const rows = query.trim() ? await searchEntities(kinds, query).catch(() => []) : [];
  if (ctx.aborted) return null;
  const options = [...rows.map((r, i) => entityOption(r, i)), ...extra];
  if (!options.length) return null;
  return { from, to, options, filter: false };
}

async function oqlCompletions(ctx) {
  const { state, pos } = ctx;
  const text = state.doc.toString();
  const { links } = state.field(linkField);

  // 1. In a link's name: other entities named like it (the link's own kind first)
  const inLink = linkAtName(links, pos);
  if (inLink) {
    const kinds = inLink.kind ? [inLink.kind] : [];
    return entityResult(ctx, kinds, inLink.name || "", inLink.from, inLink.to);
  }

  // 2. After an unclosed `[`: look the name up
  const br = openBracketBefore(text, pos, links);
  if (br) {
    let kinds = [];
    if (vocab.served) {
      const slot = await parseContextAt(text, br.from);
      if (ctx.aborted) return null;
      kinds = slot?.context?.autocomplete_entities || [];
    }
    return entityResult(ctx, kinds, br.query, br.from, bracketTailEnd(text, pos));
  }

  // 3. Everywhere else: ask the parser what fits here
  if (!vocab.served) {
    await loadVocabulary();
    if (!vocab.served || ctx.aborted) return null;
  }
  const res = await parseContextAt(text, pos);
  if (ctx.aborted || !res?.context) return null;
  const c = res.context;
  const suggestions = c.suggestions || [];
  const kinds = c.autocomplete_entities || [];
  const rr = c.replace_range;
  const from = rr ? fromCodePoints(text, rr.start) : pos;
  const to = rr ? Math.max(pos, fromCodePoints(text, rr.end)) : pos;
  const typedSomething = from < pos;
  // after a space the dropdown opens on its own; mid-word it needs a match
  if (!ctx.explicit && !typedSomething && !/\s$/.test(text.slice(0, pos)) && pos !== 0) return null;
  const options = suggestions.map(serverOption);
  if (kinds.length) {
    const prefix = c.prefix || "";
    if (prefix.trim().length >= 2) {
      return entityResult(ctx, kinds, prefix.replace(/^\[/, ""), from, to, options);
    }
    // first where a name is what goes here (`from `, `funded by `); last where it's one
    // option among many (`get ` also takes `[MIT](I63966007)'s works`)
    const nameFirst = c.slot === "entity" || !options.length;
    options.push({
      label: `Type a name: ${kinds.slice(0, 3).map((k) => kindLabel(k).toLowerCase()).join(", ")}…`,
      type: "search",
      boost: nameFirst ? 100 : -1,
      section: { name: "Matching names", rank: nameFirst ? 0 : 3 },
      reopen: true,
      apply: applyText("[]", { cursor: 1 }),
    });
  }
  if (!options.length) return null;
  return { from, to, options, filter: false };
}

function renderIcon(completion) {
  const el = document.createElement("i");
  el.className = `cm-oql-icon mdi ${iconFor(completion.type)}`;
  el.setAttribute("aria-hidden", "true");
  return el;
}

// --- hover: entity cards and phrase help --------------------------------------------------------
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function entityHref(l) {
  const path = entityPath(l.kind, l.id);
  return path ? `${window.location.origin}${path}` : null;
}

function cardDom(l) {
  const dom = el("div", "cm-oql-card");
  const kicker = el("div", "cm-oql-card__kicker");
  const icon = el("i", `mdi ${l.kind ? iconFor(l.kind) : "mdi-link-variant"}`);
  kicker.append(icon, document.createTextNode(" " + kindLabel(l.kind)));
  const title = el("div", "cm-oql-card__title", l.name || l.id);
  const line = el("div", "cm-oql-card__line");
  const stats = el("div", "cm-oql-card__stats");
  dom.append(kicker, title, line, stats);
  const href = entityHref(l);
  const foot = el("div", "cm-oql-card__foot");
  if (href) {
    const a = el("a", "cm-oql-card__open", "Open ↗");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    foot.append(a);
  }
  foot.append(el("span", "cm-oql-card__hint", `${l.id}${href ? ` · ${cmdLabel}-click opens` : ""}`));
  dom.append(foot);
  if (href) {
    line.textContent = "…";
    getEntityRecord(l.kind, l.id).then((rec) => {
      const f = cardFacts(l.kind, rec);
      if (!f) { line.textContent = ""; return; }
      kicker.lastChild.textContent = " " + f.kicker;
      title.textContent = f.title;
      line.textContent = f.line || "";
      stats.textContent = f.stats.join(" · ");
    });
  }
  return dom;
}

// Help text from the grammar: `backticked` spans are OQL examples, shown as code.
function docNode(text, cls = "cm-oql-card__doc") {
  const box = el("div", cls);
  String(text).split("`").forEach((part, i) => {
    if (part) box.append(i % 2 ? el("code", "cm-oql-code", part) : document.createTextNode(part));
  });
  return box;
}

function phraseDom(entry) {
  const dom = el("div", "cm-oql-card cm-oql-card--phrase");
  const head = el("div", "cm-oql-card__kicker");
  head.append(el("i", `mdi ${iconFor(entry.kind)}`),
    document.createTextNode(" " + (entry.detail || entry.kind || "")));
  dom.append(head, el("div", "cm-oql-card__title cm-oql-card__title--mono", entry.value));
  if (entry.doc) dom.append(docNode(entry.doc));
  return dom;
}

const oqlHover = hoverTooltip((view, pos) => {
  if (completionStatus(view.state)) return null;   // the dropdown has the floor
  const { links } = view.state.field(linkField);
  const l = links.find((x) => pos >= x.from && pos <= x.to);
  if (l) return { pos: l.nameFrom, end: l.nameTo, above: true, create: () => ({ dom: cardDom(l) }) };
  const line = view.state.doc.lineAt(pos);
  const hit = phraseAt(line.text, pos - line.from, vocab.phrases);
  if (!hit) return null;
  return {
    pos: line.from + hit.from, end: line.from + hit.to, above: true,
    create: () => ({ dom: phraseDom(hit.entry) }),
  };
}, { hoverTime: 300, hideOnChange: true });

// --- clicks ------------------------------------------------------------------------------------
const CHOICE_KINDS = new Set(["order", "measure", "split", "noun", "adjective"]);

// A plain click on a name, a choice phrase (`most cited first`, `mean FWCI`) or a year opens
// its dropdown, like a select. Runs on the click (after mouseup): a dropdown started on
// mousedown is reset by the selection the mouseup makes.
function clickOpensDropdown(view) {
  const sel = view.state.selection.main;
  if (!sel.empty || completionStatus(view.state)) return;
  const { links } = view.state.field(linkField);
  let open = !!linkAtName(links, sel.head);
  if (!open) {
    const line = view.state.doc.lineAt(sel.head);
    const at = sel.head - line.from;
    const word = /[\w-]*$/.exec(line.text.slice(0, at))[0] + /^[\w-]*/.exec(line.text.slice(at))[0];
    const hit = phraseAt(line.text, at, vocab.phrases);
    open = (hit && CHOICE_KINDS.has(hit.entry.kind)) || (vocab.served && /^\d{4}$/.test(word));
  }
  if (open) {
    view.dispatch({ effects: closeHoverTooltips });
    startCompletion(view);
  }
}

function modKey(event, view) {
  if (event.key === "Meta" || event.key === "Control") {
    view.dom.classList.toggle("cm-oql-mod", event.type === "keydown");
  }
  return false;
}

const clicks = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.metaKey || event.ctrlKey)) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;
    const { links } = view.state.field(linkField);
    const l = linkAtName(links, pos) || linkCovering(links, pos);
    const href = l && entityHref(l);
    if (!href) return false;
    event.preventDefault();
    window.open(href, "_blank", "noopener");
    return true;
  },
  // holding Cmd/Ctrl shows links as clickable, as in VS Code
  keydown: modKey,
  keyup: modKey,
  blur(event, view) {
    view.dom.classList.remove("cm-oql-mod");
    return false;
  },
  click(event, view) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.detail > 1) return false;
    setTimeout(() => clickOpensDropdown(view), 0);
    return false;
  },
});

// --- look ----------------------------------------------------------------------------------------
const MONO = "'JetBrains Mono','SF Mono',Menlo,monospace";
const SANS = "Inter, system-ui, sans-serif";
const PANEL = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "8px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.14)",
  background: "#fff",
};

const ideTheme = EditorView.theme({
  ".cm-oql-link": {
    color: "#1d4ed8",
    fontWeight: "500",
    textDecoration: "underline",
    textDecorationColor: "rgba(29, 78, 216, 0.28)",
    textUnderlineOffset: "3px",
  },
  ".cm-oql-link:hover": { textDecorationColor: "rgba(29, 78, 216, 0.8)" },
  "&.cm-oql-mod .cm-oql-link": { cursor: "pointer", textDecorationColor: "#1d4ed8" },
});

// Tooltips live on <body> (the page's cards clip their overflow); CodeMirror wraps them in
// the editor's theme classes, so a theme (not a base theme, which loses to the library's own
// defaults) styles them.
const tooltipTheme = EditorView.theme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    ...PANEL,
    padding: "4px 0",
    // no overflow clip here: the help panel (.cm-completionInfo) is drawn beside the list
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    borderRadius: "8px",
    fontFamily: MONO,
    fontSize: "13px",
    maxHeight: "320px",
    minWidth: "320px",
    maxWidth: "560px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 12px 4px 10px",
    lineHeight: "20px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    background: "#e8f0fe",
    color: "#0f172a",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > completion-section": {
    display: "block",
    padding: "6px 12px 2px",
    fontFamily: SANS,
    fontSize: "11px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
    borderBottom: "none",
  },
  ".cm-oql-icon": { fontSize: "16px", color: "#64748b", width: "18px", textAlign: "center", flex: "none" },
  ".cm-completionLabel": { flex: "none" },
  ".cm-completionDetail": {
    marginLeft: "auto",
    paddingLeft: "16px",
    fontStyle: "normal",
    fontFamily: SANS,
    fontSize: "12px",
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ".cm-completionMatchedText": { textDecoration: "none", fontWeight: "700" },
  ".cm-tooltip.cm-completionInfo": {
    ...PANEL,
    padding: "10px 12px",
    maxWidth: "320px",
    fontFamily: SANS,
    fontSize: "13px",
    lineHeight: "1.45",
    color: "#334155",
  },
  ".cm-tooltip.cm-tooltip-hover:has(> .cm-oql-card)": {
    border: "none",
    background: "transparent",
  },
  ".cm-oql-card": {
    ...PANEL,
    borderRadius: "10px",
    padding: "10px 14px 8px",
    minWidth: "240px",
    maxWidth: "360px",
    fontFamily: SANS,
    color: "#0f172a",
  },
  ".cm-oql-card__kicker": { fontSize: "12px", color: "#64748b", marginBottom: "2px" },
  ".cm-oql-card__title": { fontSize: "15px", fontWeight: "600", lineHeight: "1.3" },
  ".cm-oql-card__title--mono": { fontFamily: MONO, fontSize: "13px" },
  ".cm-oql-card__line": { fontSize: "13px", color: "#334155", marginTop: "2px" },
  ".cm-oql-card__stats": { fontSize: "12px", color: "#64748b", marginTop: "4px" },
  ".cm-oql-card__doc": { fontSize: "13px", color: "#334155", marginTop: "4px", lineHeight: "1.45" },
  ".cm-oql-code": {
    fontFamily: MONO,
    fontSize: "12px",
    background: "#f1f5f9",
    borderRadius: "4px",
    padding: "1px 4px",
    color: "#0f172a",
  },
  ".cm-oql-card__foot": {
    display: "flex", alignItems: "center", gap: "10px", marginTop: "8px",
    paddingTop: "6px", borderTop: "1px solid rgba(0,0,0,0.07)",
  },
  ".cm-oql-card__open": { fontSize: "13px", fontWeight: "600", color: "#1d4ed8", textDecoration: "none" },
  ".cm-oql-card__open:hover": { textDecoration: "underline" },
  ".cm-oql-card__hint": { marginLeft: "auto", fontSize: "11px", color: "#94a3b8" },
});

// --- the extension -------------------------------------------------------------------------------
export function oqlIde() {
  return [
    languageSlot.of(coreLanguage()),
    linkField,
    linkCaret,
    Prec.highest(keymap.of([
      { key: "Backspace", run: (v) => deleteAroundLink(v, false) },
      { key: "Delete", run: (v) => deleteAroundLink(v, true) },
      { key: "Tab", run: acceptCompletion },
    ])),
    autocompletion({
      override: [oqlCompletions],
      icons: false,
      addToOptions: [{ render: renderIcon, position: 20 }],
      activateOnTypingDelay: 60,
      activateOnCompletion: (c) => c.reopen === true,
      maxRenderedOptions: 60,
    }),
    oqlHover,
    clicks,
    ideTheme,
    tooltipTheme,
    typeof document !== "undefined" ? tooltips({ parent: document.body }) : [],
  ];
}

// Load the vocabulary and recolor an editor once it lands (keywords from the parser); warm the
// edge autocomplete so the first name lookup isn't cold.
export function warmIde(view) {
  edgeWarm("mix");
  loadVocabulary().then(() => {
    if (!view || !vocab.served) return;
    view.dispatch({ effects: languageSlot.reconfigure(coreLanguage()) });
  });
}

// for tests
export const _internal = { toCodePoints, fromCodePoints, oqlCompletions, deleteAroundLink, loadVocabulary };
