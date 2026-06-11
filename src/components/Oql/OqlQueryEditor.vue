<template>
  <div class="playground-editor">
    <div v-if="showHeader" class="pe-head">
      <div>
        <div class="text-h6">OQL editor</div>
        <div class="text-caption text-medium-emphasis">
          Type a query. Suggestions, entity lookup, and linting are live from the
          server. <kbd>⌃Space</kbd> for suggestions · <kbd>⌘/Ctrl ↵</kbd> to run.
        </div>
      </div>
      <div class="pe-latency" v-if="lat">
        <span class="lat-label">latency p50/p95 (ms)</span>
        <span class="lat-pill" :title="'samples: ' + lat['parse-context'].n">
          autocomplete {{ fmt(lat['parse-context'].p50) }}/{{ fmt(lat['parse-context'].p95) }}
        </span>
        <span class="lat-pill" :title="'samples: ' + lat.validate.n">
          validate {{ fmt(lat.validate.p50) }}/{{ fmt(lat.validate.p95) }}
        </span>
      </div>
    </div>

    <!-- starter snippets -->
    <div v-if="showSnippets" class="pe-snippets">
      <span class="text-caption text-medium-emphasis mr-1">Try:</span>
      <v-chip
        v-for="s in snippets"
        :key="s.id"
        size="small"
        variant="tonal"
        class="mr-1 mb-1"
        @click="loadSnippet(s.oql)"
      >
        {{ s.label }}
      </v-chip>
    </div>

    <!-- embedded (SERP "OQL" mode): the editor (top) + a footer of commands/buttons
         integrated into ONE self-contained card. Playground keeps the flat layout
         (plain div wrapper). -->
    <component
      :is="embedded ? VCard : 'div'"
      :variant="embedded ? 'outlined' : undefined"
      :class="['pe-shell', { 'pe-shell--card': embedded }]"
    >
    <OqlEditor
      ref="editorRef"
      v-model="oql"
      @run="run"
      @validate-result="onValidate"
    />

    <v-divider v-if="embedded" />

    <div class="pe-actions" :class="{ 'pe-actions--in-card': embedded }">
      <v-btn color="primary" size="small" :loading="running" @click="run(oql)">
        <v-icon start>mdi-play</v-icon> {{ runLabel }}
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        title="Append a filter clause and open suggestions — no typing needed"
        @click="addFilter"
      >
        <v-icon start>mdi-filter-plus-outline</v-icon> Add filter
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        title="Append a sort clause and open suggestions"
        @click="addSort"
      >
        <v-icon start>mdi-sort</v-icon> Add sort
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        :disabled="!canFormat"
        title="Replace with the canonical formatting"
        @click="format"
      >
        <v-icon start>mdi-format-align-left</v-icon> Format
      </v-btn>
      <span v-if="validation" class="pe-status" :class="statusClass">
        <v-icon size="small">{{ statusIcon }}</v-icon>
        {{ statusText }}
      </span>

      <v-spacer />
    </div>
    </component>

    <!-- diagnostics panel (#357 D): all errors + warnings at once, not just the
         first squiggle. Each row carries the parser/validator message (which already
         includes "Did you mean …?" fix-its from the server) + the suggested fix. -->
    <div v-if="diagnostics.length" class="pe-diagnostics">
      <div
        v-for="(d, i) in diagnostics"
        :key="i"
        class="pe-diag"
        :class="d.severity === 'warning' ? 'warn' : 'err'"
      >
        <v-icon size="small" class="pe-diag-icon">
          {{ d.severity === 'warning' ? 'mdi-alert-outline' : 'mdi-alert-circle-outline' }}
        </v-icon>
        <div class="pe-diag-body">
          <div class="pe-diag-msg">{{ d.message }}</div>
          <div v-if="d.fixit" class="pe-diag-fix">💡 {{ d.fixit }}</div>
        </div>
        <code class="pe-diag-code" :title="'diagnostic code: ' + d.code">{{ d.code }}</code>
      </div>
    </div>

    <!-- preview -->
    <div v-if="showPreview" class="pe-preview">
      <v-tabs v-model="tab" density="compact">
        <v-tab value="oql">Canonical OQL</v-tab>
        <v-tab value="oqo">OQO</v-tab>
        <v-tab value="url">Classic URL</v-tab>
        <v-tab value="results">Results</v-tab>
      </v-tabs>
      <v-window v-model="tab" class="pe-window">
        <v-window-item value="oql">
          <pre class="pe-code">{{ validation?.oql || '—' }}</pre>
        </v-window-item>
        <v-window-item value="oqo">
          <pre class="pe-code">{{ validation?.oqo ? pretty(validation.oqo) : '—' }}</pre>
        </v-window-item>
        <v-window-item value="url">
          <pre class="pe-code">{{ validation?.oxurl || '—' }}</pre>
        </v-window-item>
        <v-window-item value="results">
          <div v-if="runError" class="pe-runerr">{{ runError }}</div>
          <div v-else-if="results">
            <div class="text-caption mb-2">
              {{ (results.meta?.count ?? 0).toLocaleString() }} results
            </div>
            <ul class="pe-results">
              <li v-for="(r, i) in (results.results || []).slice(0, 10)" :key="i">
                {{ r.display_name || r.id }}
              </li>
            </ul>
          </div>
          <div v-else class="text-medium-emphasis text-caption">
            Run the query (⌘/Ctrl ↵) to see results.
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { VCard } from "vuetify/components";
import OqlEditor from "@/components/OqlPlayground/OqlEditor.vue";
import { oqlCorpus } from "@/oqlCorpus";
import { runOql, latencyStats } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "OqlQueryEditor" });

// Shared OQL editor experience used by BOTH the /query/oql/playground page and the
// SERP "OQL" mode. Same parameterization idea as OqlQueryBuilder: playground keeps
// header + inline preview + inline run; the SERP hides those and turns "Run" into a
// "run" emit so results render in the SERP results area.
const props = defineProps({
  seedOql: { type: String, default: null },
  showHeader: { type: Boolean, default: true },
  showSnippets: { type: Boolean, default: true },
  showPreview: { type: Boolean, default: true },
  // true: Run executes inline + fills the Results preview tab. false: emit "run".
  inlineRun: { type: Boolean, default: true },
  runLabel: { type: String, default: "Run" },
  // SERP "OQL" mode: wrap the editor + actions footer in one self-contained card.
  embedded: { type: Boolean, default: false },
});
const emit = defineEmits(["run", "update:oql"]);

const DEFAULT_OQL = "works where institution is I27837315 [University of Michigan]";
const oql = ref(props.seedOql != null && props.seedOql !== "" ? props.seedOql : DEFAULT_OQL);
const editorRef = ref(null);
const tab = ref("oql");

watch(oql, (v) => emit("update:oql", v));

// Editor chrome is fixed, not a settings menu (Jason, #357): monospace, line
// numbers on, entity IDs always visible — OQL is the nerd surface; it should
// look like code. (The old hideIds/lineNumbers/monoFont toggles are gone.)

const validation = ref(null);
const results = ref(null);
const runError = ref(null);
const running = ref(false);

// a few short, valid starter snippets from the normative corpus
const snippets = oqlCorpus
  .filter((r) => r.status === "ok" && r.oql && r.oql.length < 70)
  .slice(0, 6)
  .map((r) => ({ id: r.id, oql: r.oql, label: shortLabel(r.oql) }));

function shortLabel(s) {
  return s.length > 42 ? s.slice(0, 40) + "…" : s;
}

// All diagnostics for the panel (#357 D), errors before warnings, infos dropped.
const SEV_RANK = { error: 0, warning: 1 };
const diagnostics = computed(() => {
  const all = (validation.value?.diagnostics || []).filter((d) => d.severity !== "info");
  return [...all].sort(
    (a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9)
  );
});
const errorCount = computed(() => diagnostics.value.filter((d) => d.severity === "error").length);
const warningCount = computed(() => diagnostics.value.filter((d) => d.severity === "warning").length);

function _plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// Status pill — warnings are first-class (yellow) and distinct from errors (red).
const statusClass = computed(() => {
  if (!validation.value) return "";
  if (!validation.value.valid) return "bad";
  return warningCount.value ? "warn" : "ok";
});
const statusIcon = computed(() => {
  if (statusClass.value === "ok") return "mdi-check-circle";
  if (statusClass.value === "warn") return "mdi-alert";
  return "mdi-alert-circle";
});
const statusText = computed(() => {
  if (!validation.value) return "";
  if (!validation.value.valid) return _plural(errorCount.value || 1, "error");
  return warningCount.value ? `valid · ${_plural(warningCount.value, "warning")}` : "valid";
});
const canFormat = computed(() => validation.value?.valid && validation.value?.oql);

function onValidate(data) {
  validation.value = data;
}

function loadSnippet(s) {
  oql.value = s;
  editorRef.value && editorRef.value.focus();
}

function format() {
  if (validation.value?.oql) oql.value = validation.value.oql;
}

// --- edge controls (#357 C): "+ Add filter" / "+ Add sort" -------------------
// Text-first, no hand-editing: append the right clause keyword to the end of the
// query and hand off to the editor's chained autocomplete (it pops the field menu).
// The grammar is simple enough to decide what to append with two cheap regexes —
// no extra round-trip on click. Messy cases (a trailing sort/group/sample already
// present) fall back to just opening the continuation menu, which never produces
// invalid text.
const HAS_WHERE = /\bwhere\b/i;
const HAS_TRAILING_DIRECTIVE = /\b(sort\s+by|group\s+by|sample)\b/i;

function addFilter() {
  const ed = editorRef.value;
  if (!ed) return;
  const d = oql.value.replace(/\s+$/, "");
  if (!d) return ed.insertContinuation("works where ");
  // A trailing directive (sort/group/sample) means appending a filter at the end
  // would break clause order — let the menu guide instead of corrupting the query.
  if (HAS_TRAILING_DIRECTIVE.test(d)) return ed.completeAtEnd();
  ed.insertContinuation(HAS_WHERE.test(d) ? `${d} and ` : `${d} where `);
}

function addSort() {
  const ed = editorRef.value;
  if (!ed) return;
  const d = oql.value.replace(/\s+$/, "");
  // sort comes once, after the where-expression; if a directive is already present
  // don't stack a second one — open the menu so the user picks the valid next step.
  if (HAS_TRAILING_DIRECTIVE.test(d)) return ed.completeAtEnd();
  ed.insertContinuation(`${d || "works"} sort by `);
}

async function run(q) {
  if (!props.inlineRun) {
    emit("run", q);
    return;
  }
  running.value = true;
  runError.value = null;
  results.value = null;
  tab.value = "results";
  try {
    results.value = await runOql(q);
  } catch (e) {
    runError.value = e?.response?.data?.message || e?.message || "Query failed.";
  } finally {
    running.value = false;
  }
}

function pretty(o) {
  return JSON.stringify(o, null, 2);
}

// --- live latency HUD ---
const lat = ref(null);
let timer = null;
onMounted(() => {
  timer = setInterval(() => {
    lat.value = latencyStats();
  }, 1000);
});
onBeforeUnmount(() => timer && clearInterval(timer));

function fmt(v) {
  return v == null ? "–" : Math.round(v);
}

defineExpose({ setOql: (v) => { oql.value = v; } });
</script>

<style scoped>
.playground-editor {
  max-width: 920px;
}
.pe-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}
.pe-latency {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.lat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}
.lat-pill {
  font-family: monospace;
  font-size: 0.72rem;
  background: rgba(124, 58, 237, 0.08);
  border-radius: 6px;
  padding: 1px 6px;
}
.pe-snippets {
  margin-bottom: 10px;
}
.pe-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}
/* embedded: the editor + footer read as one card; the footer is a padded strip
   below a divider (no outer margins). */
.pe-shell--card {
  overflow: hidden;
}
.pe-shell--card :deep(.cm-editor),
.pe-shell--card :deep(.oql-editor) {
  border: none;
}
.pe-actions--in-card {
  margin: 0;
  padding: 8px 12px;
  flex-wrap: wrap;
}
.pe-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-family: monospace;
}
.pe-status.ok { color: #047857; }
.pe-status.bad { color: #b91c1c; }
.pe-status.warn { color: #b45309; }
.pe-diagnostics {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pe-diag {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.85rem;
}
.pe-diag.err {
  background: rgba(185, 28, 28, 0.06);
  border-color: rgba(185, 28, 28, 0.18);
}
.pe-diag.warn {
  background: rgba(180, 83, 9, 0.07);
  border-color: rgba(180, 83, 9, 0.2);
}
.pe-diag.err .pe-diag-icon { color: #b91c1c; }
.pe-diag.warn .pe-diag-icon { color: #b45309; }
.pe-diag-body { flex: 1; min-width: 0; }
.pe-diag-msg { color: #0f172a; }
.pe-diag-fix {
  margin-top: 2px;
  color: #475569;
  font-size: 0.8rem;
}
.pe-diag-code {
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.68rem;
  color: #94a3b8;
  white-space: nowrap;
  margin-top: 2px;
}
kbd {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0 4px;
}
.pe-preview {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin-top: 8px;
}
.pe-window {
  padding: 12px 14px;
}
.pe-code {
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.82rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: #0f172a;
}
.pe-results {
  margin: 0;
  padding-left: 18px;
  font-size: 0.85rem;
}
.pe-results li { margin-bottom: 3px; }
.pe-runerr { color: #b91c1c; font-size: 0.85rem; }
</style>
