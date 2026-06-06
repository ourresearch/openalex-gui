<template>
  <div ref="host" class="oql-editor" />
</template>

<script setup>
// IDE-style OQL editor (oxjob #357). Wraps a CodeMirror 6 EditorView with OQL
// syntax highlighting, server-backed autocomplete (/parse-context), and
// server-backed linting (/validate). Cmd/Ctrl-Enter runs the query.
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { EditorState } from "@codemirror/state";
import {
  EditorView, keymap, placeholder, lineNumbers, highlightActiveLine,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  closeBrackets, closeBracketsKeymap, completionKeymap, startCompletion,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

import { oqlSyntax, oqlAutocomplete, makeOqlLinter } from "./oqlLanguage";

const props = defineProps({
  modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "run", "validate-result"]);

const host = ref(null);
let view = null;

const runQuery = () => {
  if (view) emit("run", view.state.doc.toString());
  return true;
};

const updateListener = EditorView.updateListener.of((u) => {
  if (u.docChanged) emit("update:modelValue", u.state.doc.toString());
});

function buildState(doc) {
  return EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      closeBrackets(),
      EditorView.lineWrapping,
      placeholder("works where … — start typing, then ⌃Space for suggestions"),
      oqlSyntax(),
      oqlAutocomplete(),
      makeOqlLinter((data) => emit("validate-result", data)),
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
          fontFamily: "'JetBrains Mono','SF Mono',Menlo,monospace",
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

defineExpose({
  focus: () => view && view.focus(),
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
