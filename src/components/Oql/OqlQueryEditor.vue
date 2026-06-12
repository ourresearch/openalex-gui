<template>
  <div class="playground-editor">
    <div v-if="showHeader" class="pe-head">
      <div>
        <div class="text-h6">OQL editor</div>
        <div class="text-caption text-medium-emphasis">
          A serialization surface for OQL — highlight, validate, copy, tidy. Editing
          is for power users; the builder is the place to author a query.
        </div>
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

    <OqlEditor
      ref="editorRef"
      v-model="oql"
      @validation="onValidate"
    />

    <!-- playground-only Run: the editor itself can't submit; this is here so the
         dev playground can preview results. Real surfaces (SERP) run from the
         builder, not the editor. -->
    <div v-if="showPreview" class="pe-actions">
      <v-btn color="primary" size="small" :loading="running" @click="run">
        <v-icon start>mdi-play</v-icon> Run
      </v-btn>
      <v-spacer />
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
            Run the query to see results.
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import OqlEditor from "@/components/OqlPlayground/OqlEditor.vue";
import { oqlCorpus } from "@/oqlCorpus";
import { runOql } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "OqlQueryEditor" });

// Dev playground host for the reusable OqlEditor (oxjob #441). The editor owns the
// real chrome now (copy / tidy / validity badge); this wrapper just adds the
// playground extras: starter snippets, a Run button, and the OQL/OQO/URL/Results
// preview panes. It is NOT used on the SERP anymore — OQL there is becoming a pane
// of the advanced builder, wired up in a separate job.
const props = defineProps({
  seedOql: { type: String, default: null },
  showHeader: { type: Boolean, default: true },
  showSnippets: { type: Boolean, default: true },
  showPreview: { type: Boolean, default: true },
});

const DEFAULT_OQL = "works where institution is I27837315 [University of Michigan]";
const oql = ref(props.seedOql != null && props.seedOql !== "" ? props.seedOql : DEFAULT_OQL);
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

function onValidate(data) {
  validation.value = data;
}

function loadSnippet(s) {
  oql.value = s;
  editorRef.value && editorRef.value.focus();
}

async function run() {
  running.value = true;
  runError.value = null;
  results.value = null;
  tab.value = "results";
  try {
    results.value = await runOql(oql.value);
  } catch (e) {
    runError.value = e?.response?.data?.message || e?.message || "Query failed.";
  } finally {
    running.value = false;
  }
}

function pretty(o) {
  return JSON.stringify(o, null, 2);
}
</script>

<style scoped>
.playground-editor {
  max-width: 920px;
}
.pe-head {
  margin-bottom: 12px;
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
