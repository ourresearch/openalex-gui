<template>
  <div class="playground-editor">
    <div class="pe-head">
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
    <div class="pe-snippets">
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

    <OqlEditor
      ref="editorRef"
      v-model="oql"
      @run="run"
      @validate-result="onValidate"
    />

    <div class="pe-actions">
      <v-btn color="primary" size="small" :loading="running" @click="run(oql)">
        <v-icon start>mdi-play</v-icon> Run
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
      <span v-if="validation" class="pe-status" :class="validation.valid ? 'ok' : 'bad'">
        <v-icon size="small">{{ validation.valid ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
        {{ validation.valid ? 'valid' : (firstError || 'invalid') }}
      </span>
    </div>

    <!-- preview -->
    <div class="pe-preview">
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import OqlEditor from "./OqlEditor.vue";
import { oqlCorpus } from "@/oqlCorpus";
import { runOql, latencyStats } from "./oqlEditorApi";

defineOptions({ name: "PlaygroundEditor" });

const oql = ref("works where institution is I27837315 [University of Michigan]");
const editorRef = ref(null);
const tab = ref("oql");

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

const firstError = computed(() => {
  const d = validation.value?.diagnostics?.find((x) => x.severity === "error");
  return d ? `${d.code}` : "";
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

async function run(q) {
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
.pe-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-family: monospace;
}
.pe-status.ok { color: #047857; }
.pe-status.bad { color: #b91c1c; }
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
