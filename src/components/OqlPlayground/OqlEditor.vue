<template>
  <div ref="rootEl" class="oql-editor" :class="{ 'oql-editor--invalid': isInvalid }">
    <!-- Real toolbar (#611): a host opts in via `toolbar`, which REPLACES the floating
         top-right tools with a builder-style strip (same geometry + icon-button recipe
         as OqlQueryBuilderV2's .builder-toolbar, so the two modes' cards rhyme). -->
    <div v-if="toolbar" class="oql-editor__toolbar">
      <v-spacer />
      <v-btn size="small" variant="text" icon :disabled="!canTidy" @click="tidy">
        <v-icon color="grey-darken-1">mdi-broom</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ tidyTitle }}</v-tooltip>
      </v-btn>
      <v-btn size="small" variant="text" icon
        :color="copied ? 'success' : undefined" @click="copy">
        <v-icon :color="copied ? undefined : 'grey-darken-1'">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ copied ? 'Copied' : 'Copy' }}</v-tooltip>
      </v-btn>
      <v-btn size="small" variant="text" icon :disabled="!hasText" @click="clearDoc">
        <v-icon color="grey-darken-1">mdi-trash-can-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">Clear</v-tooltip>
      </v-btn>
    </div>

    <!-- the CodeMirror surface -->
    <div ref="host" class="oql-editor__cm" />

    <!-- phantom line numbers: CodeMirror only numbers real doc lines, so a short
         query leaves the gutter blank below the last line while min-height keeps
         the box tall. Continue the numbering down the empty space — fainter than
         the real numbers so it reads as vacancy, and fully inert. Geometry is
         measured off the live gutter in measurePhantom(). -->
    <div
      v-if="phantom.count > 0"
      class="oql-editor__phantom-nums"
      aria-hidden="true"
      :style="{
        top: phantom.top + 'px',
        width: phantom.width + 'px',
        fontSize: fontSize,
        lineHeight: phantom.lineHeight + 'px',
      }"
    >
      <div v-for="n in phantom.count" :key="n">{{ phantom.start + n - 1 }}</div>
    </div>

    <!-- floating tools, top-right (over the text, IDE-style) — the pre-toolbar
         presentation, kept for hosts that haven't opted into `toolbar` -->
    <div v-if="!toolbar" class="oql-editor__tools">
      <v-btn
        icon="mdi-broom"
        size="x-small"
        variant="text"
        density="comfortable"
        :disabled="!canTidy"
        :title="tidyTitle"
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

    <!-- ONE status badge, bottom-right (#530 QA r2 — Jason: the states are mutually
         exclusive). Activity wins while it's happening: "typing…" (edits buffered
         pre-submit) or "querying…" (submitted, fetch in flight) REPLACES the
         validity badge — a stale valid/invalid would lie mid-edit, and a querying
         query is valid by definition. When activity settles, validity returns:
         clean valid = quiet green check; invalid = red pill; valid-but-warned
         (e.g. an unresolvable entity id, #419) = amber pill. Both pills hover for
         a summary and click to open the popover. -->
    <!-- All states share ONE plain-text style — no icons, no pill chrome; the
         color alone carries the state (grey activity, green/amber/red validity).
         (#530 QA r3, Jason.) -->
    <div v-if="showBadge && status" class="oql-editor__badge">
      <span class="oql-badge oql-badge--busy">{{ status }}…</span>
    </div>
    <div v-else-if="showBadge && validation" class="oql-editor__badge">
      <!-- clean valid: no errors, no warnings -->
      <span v-if="!isInvalid && !hasWarnings" class="oql-badge oql-badge--ok" title="Valid OQL">
        valid
      </span>

      <!-- invalid OR valid-with-warnings: badge is the popover activator. Opens on
           HOVER (not click) — users won't know to click. (oxjob #428, Jason.) -->
      <v-menu v-else location="top end" open-on-hover :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <button
            type="button"
            class="oql-badge"
            :class="isInvalid ? 'oql-badge--bad' : 'oql-badge--warn'"
            :title="badgeSummary"
            v-bind="menuProps"
          >
            {{ badgeLabel }}
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
 * it cannot submit anything itself; it only reflects and reports text. The one
 * nod to submission: ⌘/Ctrl+Enter emits a `submit` event (intent only — the host
 * decides what, if anything, to do with it).
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
  // editor (and gutter) font size. Default 15px keeps existing callers unchanged;
  // the #463 view-code dialog passes 13px so the OQL code + line numbers match the
  // 13px builder bricks. Set on the CM theme so CM measures rows at this size and
  // the line numbers stay baseline-aligned (a smaller gutter font alone drifts).
  fontSize: { type: String, default: "15px" },
  // host-driven activity label ("typing" | "querying" | null). While set it
  // REPLACES the validity badge in the bottom-right slot (the states are mutually
  // exclusive). The editor doesn't compute this — only the host knows when it's
  // buffering edits vs running a query (#530 QA auto-run).
  status: { type: String, default: null },
  // #611: opt into the real toolbar strip (replaces the floating top-right tools).
  toolbar: { type: Boolean, default: false },
  // #611: hosts that render the validity state themselves (the SERP OQL tab puts a
  // chip in its card footer) turn the built-in bottom-right badge off. The
  // @validation payload carries everything such a host needs.
  showBadge: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "valid", "validation", "submit"]);

const rootEl = ref(null);
const host = ref(null);
let view = null;

// --- phantom line numbers ------------------------------------------------------
// CM gutters can't attach elements to lines that don't exist, so the continuation
// numbers are a plain overlay aligned to the real gutter: same width, same row
// height (defaultLineHeight — real rows can wrap taller, which is why we anchor to
// the last gutter element's measured bottom rather than counting rows). count goes
// to 0 whenever the doc fills the box (incl. the scrolling/max-height case).
const phantom = ref({ count: 0, start: 2, top: 0, width: 0, lineHeight: 0 });

function measurePhantom() {
  const v = view;
  if (!v) return;
  v.requestMeasure({
    read: () => {
      const gutterEl = v.dom.querySelector(".cm-gutter.cm-lineNumbers");
      const lastNum = gutterEl?.lastElementChild;
      const rootRect = rootEl.value?.getBoundingClientRect();
      if (!gutterEl || !lastNum || !rootRect) return { count: 0 };
      const lastRect = lastNum.getBoundingClientRect();
      const lineHeight = v.defaultLineHeight;
      return {
        count: Math.max(0, Math.floor((rootRect.bottom - lastRect.bottom) / lineHeight)),
        start: v.state.doc.lines + 1,
        top: lastRect.bottom - rootRect.top,
        width: gutterEl.offsetWidth,
        lineHeight,
      };
    },
    write: (m) => { phantom.value = { ...phantom.value, ...m }; },
  });
}

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
const warningCount = computed(() =>
  problems.value.filter((d) => d.severity === "warning").length
);
// valid-but-warned: query parses (valid===true) yet has non-blocking warnings
// (e.g. an unresolvable entity id, #419). Surface these instead of the green check.
const hasWarnings = computed(() => !isInvalid.value && warningCount.value > 0);
const errorSummary = computed(() => {
  const n = errorCount.value || problems.value.length || 1;
  return `${n} error${n === 1 ? "" : "s"} — click to view`;
});
const badgeLabel = computed(() =>
  isInvalid.value
    ? "invalid"
    : `${warningCount.value} warning${warningCount.value === 1 ? "" : "s"}`
);
const badgeSummary = computed(() =>
  isInvalid.value
    ? errorSummary.value
    : `${warningCount.value} warning${warningCount.value === 1 ? "" : "s"} — click to view`
);
// The doc already matches the server's canonical (tidy) formatting → tidy is a
// no-op, so disable the broom. Gated on validation.value (reactive) which refreshes
// after every edit's /validate round-trip; the doc compare reads the live buffer.
const isAlreadyTidy = computed(() => {
  const v = validation.value;
  return !!v?.valid && !!v.oql && !!view && v.oql === view.state.doc.toString();
});
const canTidy = computed(
  () => !!validation.value?.valid && !!validation.value?.oql && !isAlreadyTidy.value
);
const tidyTitle = computed(() =>
  !validation.value?.valid ? 'Tidy up (query must be valid)'
    : isAlreadyTidy.value ? 'Already tidy'
      : 'Tidy up'
);

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

// Clear (toolbar only, #611) — empty the buffer, mirroring the builder toolbar's
// trashcan. Reads the v-model (not the live doc) so the disabled state is reactive.
const hasText = computed(() => !!(props.modelValue || "").trim());
function clearDoc() {
  setDoc("", { external: false }); // a clear IS a user edit → emit
}

// --- doc plumbing ------------------------------------------------------------
const updateListener = EditorView.updateListener.of((u) => {
  if (u.docChanged && !applyingExternal) {
    emit("update:modelValue", u.state.doc.toString());
  }
  if (u.docChanged || u.geometryChanged || u.viewportChanged) measurePhantom();
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
        // ⌘/Ctrl+Enter = submit intent (#600). MUST be bound here, first: defaultKeymap
        // binds Mod-Enter to insertBlankLine, so the editor would otherwise eat the
        // keystroke (and dirty the doc) before any host keydown listener sees it.
        { key: "Mod-Enter", run: () => { emit("submit"); return true; } },
        ...closeBracketsKeymap,
        ...lintKeymap,
        ...historyKeymap,
        ...defaultKeymap,
      ]),
      updateListener,
      // mono always: OQL is the nerd surface — it should look like code.
      EditorView.theme({
        "&": { fontSize: props.fontSize },
        ".cm-content": {
          padding: "12px 8px 24px",
          minHeight: props.minHeight,
          fontFamily: "'JetBrains Mono','SF Mono',Menlo,monospace",
        },
        ".cm-scroller": { maxHeight: props.maxHeight },
        // CM sizes the gutter to the DOC height, not the content min-height, so on
        // a short query its tint + right rule stopped partway down the box. Same
        // min-height on .cm-gutter (the official CM recipe) runs it to the bottom,
        // under the phantom continuation numbers.
        ".cm-gutter": { minHeight: props.minHeight },
        "&.cm-focused": { outline: "none" },
        // Line-number gutter matching the site code blocks (CodeBlock.vue): faint
        // tint, small gray right-aligned digits, a thin continuous right rule.
        ".cm-gutters": {
          background: "rgba(0,0,0,0.022)",
          border: "none",
          borderRight: "1px solid rgba(0,0,0,0.1)",
          color: "rgba(0,0,0,0.32)",
        },
        ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 10px", minWidth: "0" },
      }),
    ],
  });
}

onMounted(() => {
  view = new EditorView({ state: buildState(props.modelValue), parent: host.value });
  measurePhantom();
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

/* phantom continuation numbers below the last real line — geometry (top / width /
   line-height / font-size) is measured off the live gutter in measurePhantom();
   only the static look lives here. Padding matches .cm-lineNumbers .cm-gutterElement
   in the CM theme above so the digits column-align with the real numbers. */
.oql-editor__phantom-nums {
  position: absolute;
  left: 0;
  z-index: 2;
  box-sizing: border-box;
  text-align: right;
  color: rgba(0, 0, 0, 0.16);
  pointer-events: none;
  user-select: none;
}
.oql-editor__phantom-nums > div {
  padding: 0 8px 0 10px;
}

/* real toolbar (#611): same strip geometry as the builder's .builder-toolbar —
   thin row, quiet stock icon buttons, a hairline bottom rule. */
.oql-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
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

/* ONE plain-text style for every state (#530 QA r3, Jason) — no icons, no pill
   chrome (border/radius/fill); only the color changes: grey activity, green /
   amber / red validity. The soft white wash stays so the label reads over code. */
.oql-badge {
  display: inline-flex;
  align-items: center;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1;
  padding: 3px 4px;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
}
.oql-badge--busy {
  color: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.oql-badge--ok {
  color: #047857;
}
.oql-badge--bad {
  color: #b91c1c;
  cursor: pointer;
}
.oql-badge--warn {
  color: #b45309;
  cursor: pointer;
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
