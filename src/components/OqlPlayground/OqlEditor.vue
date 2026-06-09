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
      keymap.of([
        { key: "Mod-Enter", run: runQuery },
        { key: "Mod-Space", run: startCompletion },
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
