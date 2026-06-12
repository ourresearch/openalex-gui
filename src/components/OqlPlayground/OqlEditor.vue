<template>
  <div class="oql-editor" :class="{ 'oql-editor--invalid': isInvalid }">
    <!-- the CodeMirror surface -->
    <div ref="host" class="oql-editor__cm" />

    <!-- floating tools, top-right (over the text, IDE-style) -->
    <div class="oql-editor__tools">
      <v-btn
        icon="mdi-broom"
        size="x-small"
        variant="text"
        density="comfortable"
        :disabled="!canTidy"
        :title="canTidy ? 'Tidy up' : 'Tidy up (query must be valid)'"
        @click="tidy"
      />
      <v-btn
        :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        size="x-small"
        variant="text"
        density="comfortable"
        :title="copied ? 'Copied' : 'Copy'"
        :color="copied ? 'success' : undefined"
        @click="copy"
      />
    </div>

    <!-- validity badge, bottom-right. Valid = quiet green check. Invalid =
         red pill; hover shows "N errors", click opens the error popover. -->
    <div v-if="validation" class="oql-editor__badge">
      <!-- valid -->
      <span v-if="!isInvalid" class="oql-badge oql-badge--ok" title="Valid OQL">
        <v-icon size="14">mdi-check-circle</v-icon>
        valid
      </span>

      <!-- invalid: badge is the popover activator; native title = hover tooltip -->
      <v-menu v-else location="top end" :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <button
            type="button"
            class="oql-badge oql-badge--bad"
            :title="errorSummary"
            v-bind="menuProps"
          >
            <v-icon size="14">mdi-alert-circle</v-icon>
            invalid
          </button>
        </template>
        <v-card class="oql-errors" min-width="280" max-width="460">
          <v-list density="compact" class="py-1">
            <v-list-item
              v-for="(d, i) in problems"
              :key="i"
              class="oql-errors__item"
            >
              <template #prepend>
                <v-icon
                  size="16"
                  :color="d.severity === 'warning' ? 'warning' : 'error'"
                  class="mt-1"
                >
                  {{ d.severity === 'warning' ? 'mdi-alert-outline' : 'mdi-alert-circle-outline' }}
                </v-icon>
              </template>
              <div class="oql-errors__msg">{{ d.message }}</div>
              <div v-if="d.fixit" class="oql-errors__fix">💡 {{ d.fixit }}</div>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </div>
</template>

<script setup>
/**
 * OqlEditor — a self-contained, reusable OQL text surface (oxjob #357 → #441).
 *
 * ROLE: OQL is no longer an *authoring* tool (the LEGO/builder owns authoring).
 * This editor exists for *serialization*: reading, copying, and hand-editing an
 * OQL query, and keeping it two-way-synced with a builder elsewhere on the page.
 * So there is deliberately NO autocomplete, no "add filter/sort", and no Run —
 * it cannot submit anything; it only reflects and reports text.
 *
 * WHAT IT DOES
 *   - Syntax highlighting (cheap client tokenizer, see oqlLanguage.js).
 *   - Live linting via the server /validate endpoint → red/amber squiggles.
 *   - Copy + Tidy (canonical pretty-print) tools, floating top-right.
 *   - A valid/invalid badge, bottom-right; invalid → click for an error popover.
 *
 * TWO-WAY SYNC CONTRACT
 *   - v-model:                  the raw OQL text. Emits `update:modelValue` on
 *                               *user* edits only (programmatic/external sets do
 *                               NOT echo back, so a parent can push text in
 *                               without a feedback loop).
 *   - @valid="{oql,oqo,oxurl}": fired (debounced, on keystrokes) every time the
 *                               current text parses to a VALID query. This is the
 *                               signal a builder listens to in order to rebuild
 *                               itself from typed OQL. Not fired while invalid, so
 *                               the builder simply holds its last good state.
 *   - @validation="data|null":  the raw /validate payload (valid, oql, oqo, oxurl,
 *                               diagnostics) for any consumer that wants more than
 *                               the valid signal (e.g. a preview panel). null when
 *                               the editor is empty.
 *
 * PROPS
 *   - modelValue   String   the OQL text (v-model).
 *   - placeholder  String   empty-state hint.
 *   - minHeight    String   CSS min-height of the text area (default 120px).
 *   - maxHeight    String   CSS max-height before it scrolls (default 360px).
 *   - readonly     Boolean  render-only (no edits); still highlights + validates.
 *
 * EXPOSED: focus() — focus the editor.
 *
 * The component is intentionally free of any page/layout assumptions so it can be
 * dropped into a playground, a SERP pane, a dialog, etc.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { EditorState } from "@codemirror/state";
import {
  EditorView, keymap, placeholder as cmPlaceholder, lineNumbers,
  highlightActiveLine, drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

import { oqlSyntax, makeOqlLinter } from "./oqlLanguage";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "works where … — type or paste OQL" },
  minHeight: { type: String, default: "120px" },
  maxHeight: { type: String, default: "360px" },
  readonly: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "valid", "validation"]);

const host = ref(null);
let view = null;

// guards an echo when WE push text into the doc (external/programmatic set):
// the resulting docChanged must not re-emit update:modelValue back to the parent.
let applyingExternal = false;

// --- validity state (driven by the linter's /validate round-trip) ------------
const validation = ref(null);
const isInvalid = computed(() => !!validation.value && validation.value.valid === false);
const problems = computed(() =>
  (validation.value?.diagnostics || [])
    .filter((d) => d.severity !== "info")
    .sort((a, b) => (a.severity === "warning" ? 1 : 0) - (b.severity === "warning" ? 1 : 0))
);
const errorCount = computed(() =>
  problems.value.filter((d) => d.severity !== "warning").length
);
const errorSummary = computed(() => {
  const n = errorCount.value || problems.value.length || 1;
  return `${n} error${n === 1 ? "" : "s"} — click to view`;
});
const canTidy = computed(() => !!validation.value?.valid && !!validation.value?.oql);

function onValidateResult(data) {
  validation.value = data || null;
  emit("validation", data || null);
  if (data && data.valid) {
    emit("valid", { oql: data.oql, oqo: data.oqo, oxurl: data.oxurl });
  }
}

// --- tools -------------------------------------------------------------------
const copied = ref(false);
let copiedTimer = null;
function copy() {
  if (!view) return;
  const text = view.state.doc.toString();
  const done = () => {
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 1300);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => {});
  }
}

// Tidy = replace the buffer with the server's canonical formatting of the same
// query (only available when valid). Cursor parks at the end.
function tidy() {
  if (!view || !canTidy.value) return;
  const text = validation.value.oql;
  setDoc(text, { external: false }); // a tidy IS a user-visible edit → emit
}

// --- doc plumbing ------------------------------------------------------------
const updateListener = EditorView.updateListener.of((u) => {
  if (u.docChanged && !applyingExternal) {
    emit("update:modelValue", u.state.doc.toString());
  }
});

function setDoc(text, { external }) {
  if (!view || text === view.state.doc.toString()) return;
  applyingExternal = external;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text },
    selection: { anchor: text.length },
  });
  applyingExternal = false;
}

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
      EditorView.editable.of(!props.readonly),
      EditorState.readOnly.of(props.readonly),
      cmPlaceholder(props.placeholder),
      oqlSyntax(),
      makeOqlLinter(onValidateResult),
      keymap.of([
        ...closeBracketsKeymap,
        ...lintKeymap,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      updateListener,
      // mono always: OQL is the nerd surface — it should look like code.
      EditorView.theme({
        "&": { fontSize: "15px" },
        ".cm-content": {
          padding: "12px 8px 24px",
          minHeight: props.minHeight,
          fontFamily: "'JetBrains Mono','SF Mono',Menlo,monospace",
        },
        ".cm-scroller": { maxHeight: props.maxHeight },
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
  if (copiedTimer) { clearTimeout(copiedTimer); copiedTimer = null; }
  if (view) view.destroy();
  view = null;
});

// External set (parent / builder → editor): replace the doc without echoing
// update:modelValue, so two-way sync never loops.
watch(
  () => props.modelValue,
  (val) => setDoc(val ?? "", { external: true })
);

defineExpose({ focus: () => view && view.focus() });
</script>

<style scoped>
.oql-editor {
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}
.oql-editor--invalid {
  border-color: rgba(185, 28, 28, 0.35);
}
.oql-editor__cm {
  overflow: hidden;
}

/* floating tools, top-right */
.oql-editor__tools {
  position: absolute;
  top: 4px;
  right: 6px;
  z-index: 3;
  display: flex;
  gap: 2px;
  /* let clicks through the gaps to the editor, buttons capture their own */
  pointer-events: none;
}
.oql-editor__tools :deep(.v-btn) {
  pointer-events: auto;
  color: rgba(0, 0, 0, 0.45);
}
.oql-editor__tools :deep(.v-btn:hover) {
  color: rgba(0, 0, 0, 0.8);
}

/* validity badge, bottom-right */
.oql-editor__badge {
  position: absolute;
  bottom: 5px;
  right: 8px;
  z-index: 3;
}
.oql-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  border: 1px solid transparent;
}
.oql-badge--ok {
  color: #047857;
}
.oql-badge--bad {
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.25);
  background: rgba(254, 242, 242, 0.92);
  cursor: pointer;
  font: inherit;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
}
.oql-badge--bad:hover {
  background: #fee2e2;
}

/* error popover */
.oql-errors__item {
  align-items: flex-start;
}
.oql-errors__msg {
  font-size: 0.83rem;
  color: #0f172a;
  white-space: normal;
}
.oql-errors__fix {
  margin-top: 2px;
  font-size: 0.78rem;
  color: #475569;
}
</style>
