<template>
  <div ref="host" class="oql-editor" />
</template>

<script setup>
// IDE-style OQL editor (oxjob #357). Wraps a CodeMirror 6 EditorView with OQL
// syntax highlighting, server-backed autocomplete (/parse-context), and
// server-backed linting (/validate). Cmd/Ctrl-Enter runs the query.
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView, keymap, placeholder, lineNumbers, highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  closeBrackets, closeBracketsKeymap, completionKeymap, startCompletion,
  completionStatus,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

import {
  oqlSyntax, oqlAutocomplete, makeOqlLinter,
  hideIdsExtension, proportionalFontTheme, monoFontTheme,
} from "./oqlLanguage";

const props = defineProps({
  modelValue: { type: String, default: "" },
  // editor chrome settings (#357) — reconfigured live via compartments
  showLineNumbers: { type: Boolean, default: false },
  monoFont: { type: Boolean, default: false },
  hideIds: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "run", "validate-result"]);

const host = ref(null);
let view = null;

// compartments so a settings toggle reconfigures the live editor (no rebuild)
const lineNumbersComp = new Compartment();
const fontComp = new Compartment();
const hideIdsComp = new Compartment();

const lineNumbersExt = () => (props.showLineNumbers ? lineNumbers() : []);
const fontExt = () => (props.monoFont ? monoFontTheme : proportionalFontTheme);
const hideIdsExt = () => (props.hideIds ? hideIdsExtension : []);

const runQuery = () => {
  if (view) emit("run", view.state.doc.toString());
  return true;
};

const updateListener = EditorView.updateListener.of((u) => {
  if (u.docChanged) emit("update:modelValue", u.state.doc.toString());
});

// Bug #357-iter3-2: reopen the menu when the cursor moves back into a word.
// `activateOnTyping` only fires on *insertion*; deleting (backspace) or arrowing the
// cursor into an existing field/value leaves no menu. So on a deletion or a pure
// cursor move that lands inside/at-end of a completable WORD (and not inside a
// "string"/[annotation]), re-pop the suggestions. Debounced; skipped while a menu is
// already open so we never interrupt an active completion.
const _WORD_CHAR = /[^\s"[\](),;><]/;

function _completableAt(state, pos) {
  const line = state.doc.lineAt(pos);
  const upto = state.doc.sliceString(line.from, pos);
  let inStr = false, inAnn = false;
  for (const ch of upto) {
    if (inStr) { if (ch === '"') inStr = false; continue; }
    if (inAnn) { if (ch === "]") inAnn = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "[") inAnn = true;
  }
  if (inStr || inAnn) return false;          // literal text — not a grammar slot
  const before = upto.slice(-1);
  return before !== "" && _WORD_CHAR.test(before);
}

let _reopenTimer = null;
function _reopenSoon(view) {
  if (_reopenTimer) clearTimeout(_reopenTimer);
  _reopenTimer = setTimeout(() => { _reopenTimer = null; startCompletion(view); }, 140);
}

const reopenOnNav = EditorView.updateListener.of((u) => {
  if (!(u.docChanged || u.selectionSet)) return;
  const sel = u.state.selection.main;
  if (!sel.empty) return;                         // a range selection, not a caret
  if (completionStatus(u.state) === "active") return;
  // insertions are already handled by activateOnTyping — only react to deletes / moves
  let inserted = false;
  if (u.docChanged) {
    u.changes.iterChanges((_fA, _tA, _fB, _tB, ins) => { if (ins.length) inserted = true; });
    if (inserted) return;
  }
  if (_completableAt(u.state, sel.head)) _reopenSoon(u.view);
});

// Bug #357-iter3-3: paren/bracket type-over. Typing a closer when the caret already
// sits in front of the same closer should step over it (IDE behavior), not insert a
// duplicate. closeBrackets() does this for pairs it auto-inserted; this makes it
// reliable for hand-typed closers too. Bound before closeBracketsKeymap so it wins.
const typeOver = (closer) => (view) => {
  const sel = view.state.selection.main;
  if (!sel.empty) return false;
  if (view.state.doc.sliceString(sel.head, sel.head + 1) !== closer) return false;
  view.dispatch({ selection: { anchor: sel.head + 1 }, scrollIntoView: true });
  return true;
};

// constant-scaffolding: focusing an empty editor pops the entity dropdown so a
// cold user never faces a blank box with no next step (#357).
const focusHandler = EditorView.domEventHandlers({
  focus: (_e, v) => {
    if (v.state.doc.length === 0) setTimeout(() => startCompletion(v), 0);
    return false;
  },
});

function buildState(doc) {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbersComp.of(lineNumbersExt()),
      fontComp.of(fontExt()),
      hideIdsComp.of(hideIdsExt()),
      highlightActiveLine(),
      drawSelection(),
      history(),
      closeBrackets(),
      EditorView.lineWrapping,
      placeholder("works where … — start typing, then ⌃Space for suggestions"),
      oqlSyntax(),
      oqlAutocomplete(),
      makeOqlLinter((data) => emit("validate-result", data)),
      focusHandler,
      reopenOnNav,
      keymap.of([
        { key: "Mod-Enter", run: runQuery },
        { key: "Mod-Space", run: startCompletion },
        { key: ")", run: typeOver(")") },
        { key: "]", run: typeOver("]") },
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...lintKeymap,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      updateListener,
      EditorView.theme({
        "&": { fontSize: "15px", borderRadius: "8px" },
        ".cm-content": {
          padding: "12px 8px",
          minHeight: "120px",
        },
        "&.cm-focused": { outline: "none" },
        ".cm-gutters": { background: "transparent", border: "none" },
      }),
    ],
  });
}

onMounted(() => {
  view = new EditorView({ state: buildState(props.modelValue), parent: host.value });
});

// live-reconfigure on settings changes (no editor rebuild, cursor preserved)
watch(() => props.showLineNumbers, () => {
  view && view.dispatch({ effects: lineNumbersComp.reconfigure(lineNumbersExt()) });
});
watch(() => props.monoFont, () => {
  view && view.dispatch({ effects: fontComp.reconfigure(fontExt()) });
});
watch(() => props.hideIds, () => {
  view && view.dispatch({ effects: hideIdsComp.reconfigure(hideIdsExt()) });
});

onBeforeUnmount(() => {
  if (_reopenTimer) { clearTimeout(_reopenTimer); _reopenTimer = null; }
  if (view) view.destroy();
  view = null;
});

// allow parent to set content (snippet chips / format) without a feedback loop
watch(
  () => props.modelValue,
  (val) => {
    if (view && val !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: val },
      });
    }
  }
);

// Edge controls (#357 C): replace the whole doc with `text`, drop the cursor at the
// end, and open the next autocomplete menu — so "+ Add filter"/"+ Add sort" hand off
// to the same chained scaffolding the user gets while typing (no hand-editing).
const insertContinuation = (text) => {
  if (!view) return;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text },
    selection: { anchor: text.length },
  });
  view.focus();
  setTimeout(() => startCompletion(view), 0);
};

// Fallback for the edge controls when there's nothing safe to append (e.g. the query
// already ends in a trailing directive): just park the cursor at the end and pop the
// grammar-aware continuation menu so the user still gets guided options.
const completeAtEnd = () => {
  if (!view) return;
  const end = view.state.doc.length;
  view.dispatch({ selection: { anchor: end } });
  view.focus();
  setTimeout(() => startCompletion(view), 0);
};

defineExpose({
  focus: () => view && view.focus(),
  insertContinuation,
  completeAtEnd,
});
</script>

<style scoped>
.oql-editor {
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}
.oql-editor :deep(.cm-editor) {
  max-height: 360px;
}
</style>
