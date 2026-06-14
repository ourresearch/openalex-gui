<template>
  <div class="case-detail">
    <div class="case-detail__inner">
      <router-link :to="casesLink" class="back-link">
        <v-icon size="16">mdi-arrow-left</v-icon>
        Cases
      </router-link>

      <template v-if="row">
        <header class="case-head">
          <div class="eyebrow">{{ (row.tags || []).join(" · ") }}</div>
          <h1 class="case-id">{{ row.id }}</h1>
        </header>

        <!-- Properties strip -->
        <div class="props">
          <div class="prop">
            <span class="prop-key">Status</span>
            <v-chip :color="stateMeta[row.state].color" size="x-small" label variant="flat">
              {{ stateMeta[row.state].label }}
            </v-chip>
          </div>
          <div class="prop">
            <span class="prop-key">Complexity</span>
            <span class="prop-val">
              {{ row.complexity === null ? "—" : `${row.complexity} OQO leaves` }}
            </span>
          </div>
          <div class="prop">
            <span class="prop-key">Provenance</span>
            <span class="prop-val">
              {{ row.provenance.type }}
              <template v-if="row.provenance.label">
                &mdash;
                <a
                  v-if="row.provenance.url"
                  :href="row.provenance.url"
                  target="_blank"
                  rel="noopener"
                  class="prov-link"
                >{{ row.provenance.label }}<v-icon size="12">mdi-open-in-new</v-icon></a>
                <span v-else>{{ row.provenance.label }}</span>
              </template>
            </span>
          </div>
        </div>

        <!-- OQL -->
        <section class="case-section">
          <h2 class="section-title">OQL</h2>
          <CodeBlock :code="row.oql" />
        </section>

        <!-- State-specific explainer -->
        <section class="case-section">
          <h2 class="section-title">classic OpenAlex URL</h2>
          <div v-if="row.state === 'has-oxurl'" class="oxurl-line">
            <v-icon size="16" color="grey-darken-1" class="mr-1">mdi-link-variant</v-icon>
            <a :href="row.oxurl" target="_blank" rel="noopener" class="oxurl-link">
              {{ prettyUrl(row.oxurl) }}
            </a>
          </div>
          <div v-else-if="row.state === 'oql-only'" class="oxurl-flag oxurl-flag--win">
            <v-icon size="16" color="deep-purple" class="mr-1">mdi-trophy-variant</v-icon>
            <span>
              <strong>OQL expressiveness win.</strong>&nbsp;The server runs this, but no classic
              URL can: <code>|</code> ORs only within one key, and this ORs across two — inside a
              <code>contains any of (…)</code>, bare words hit stemmed <code>.search</code> while
              <code>"quoted phrases"</code> hit no-stem <code>.search.exact</code>.
            </span>
          </div>
          <div v-else-if="row.state === 'server-unsupported'" class="oxurl-flag oxurl-flag--server">
            <v-icon size="16" color="blue-grey-darken-1" class="mr-1">mdi-clock-alert-outline</v-icon>
            <span>
              <strong>Server gap.</strong>&nbsp;Renders to a classic URL, but the live API can't
              execute it yet (e.g. multi-dimensional <code>group_by</code> &mdash; single-dim only,
              #297). The OQO is valid; only execution lags.
              <span class="oxurl-line mt-2">
                <v-icon size="16" color="grey-darken-1" class="mr-1">mdi-link-variant</v-icon>
                <a :href="row.oxurl" target="_blank" rel="noopener" class="oxurl-link">
                  {{ prettyUrl(row.oxurl) }}
                </a>
              </span>
            </span>
          </div>
          <div v-else-if="row.state === 'rejected'" class="oxurl-flag oxurl-flag--rejected">
            <v-icon size="16" color="amber-darken-2" class="mr-1">mdi-check-circle</v-icon>
            Invalid OQL — the parser correctly rejected it. This is working as
            intended; the diagnostic below is the message it returns.
          </div>
          <div v-else-if="row.state === 'translator-bug'" class="oxurl-flag oxurl-flag--fail">
            <v-icon size="16" color="red-darken-1" class="mr-1">mdi-alert</v-icon>
            <strong>Translator gap.</strong>&nbsp;This is representable per the spec, but
            <code>query_translation</code> can't render the URL yet — a bug to fix.
          </div>
          <div v-else class="oxurl-flag oxurl-flag--neutral">
            <v-icon size="16" color="blue-grey-darken-1" class="mr-1">mdi-information-outline</v-icon>
            <strong>Out of scope.</strong>&nbsp;Not expressible in OQL/OQO — a deliberate
            boundary, not a gap to fix.
          </div>
        </section>

        <!-- OQO -->
        <section v-if="row.oqo" class="case-section">
          <h2 class="section-title">OQO</h2>
          <CodeBlock :code="toYaml(row.oqo)" />
        </section>

        <!-- Diagnostic -->
        <section v-if="row.diagnostic" class="case-section">
          <h2 class="section-title">Diagnostic</h2>
          <CodeBlock :code="row.diagnostic" diag />
        </section>

        <!-- Note -->
        <section v-if="row.note" class="case-section">
          <h2 class="section-title">Note</h2>
          <p class="prose">{{ row.note }}</p>
        </section>
      </template>

      <div v-else class="not-found">
        <v-icon size="40" color="grey-lighten-1">mdi-help-circle-outline</v-icon>
        <p class="text-body-1 mt-3">No case with id <code>{{ id }}</code>.</p>
        <router-link :to="casesLink">Back to Cases</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useHead } from "@unhead/vue";
import { stringify as yamlStringify } from "yaml";
import { oqlCorpus } from "@/oqlCorpus";
import { oqoLeafCount } from "@/oqlCorpusMetrics";
import CodeBlock from "@/components/OqlPlayground/CodeBlock.vue";

defineOptions({ name: "PlaygroundCaseDetail" });

const props = defineProps({
  id: { type: String, required: true },
});

// Back to the OQL cases table.
const casesLink = { name: "Query", params: { axis: "oql", section: "cases" } };

// Same six-sector derivation as the Cases table (see PlaygroundCases.vue):
// ok/hint rows use the corpus's authored `oxurl_status` (#384), error and
// out-of-scope rows key off `status`.
const caseState = (r) =>
  r.status === "error"
    ? "rejected"
    : r.status === "out-of-scope"
      ? "out-of-scope"
      : r.oxurl_status;

const stateMeta = {
  "has-oxurl": { label: "ok", color: "green" },
  "oql-only": { label: "OQL-only", color: "deep-purple" },
  "server-unsupported": { label: "server gap", color: "blue-grey-darken-1" },
  "rejected": { label: "rejected", color: "amber-darken-2" },
  "out-of-scope": { label: "out of scope", color: "blue-grey-lighten-1" },
  "translator-bug": { label: "translator gap", color: "red-darken-1" },
};

const row = computed(() => {
  // Corpus ids are sequential ints (#360); the route param arrives as a string.
  const r = oqlCorpus.find((c) => c.id === Number(props.id));
  return r ? { ...r, complexity: oqoLeafCount(r.oqo), state: caseState(r) } : null;
});

useHead({
  title: computed(() => (row.value ? `${row.value.id} — OQL Playground` : "OQL Playground")),
});

const toYaml = (obj) => yamlStringify(obj).trimEnd();
const prettyUrl = (url) => {
  try { return decodeURIComponent(url); } catch (e) { return url; }
};
</script>

<style scoped>
.case-detail {
  min-height: calc(100vh - 64px);
  padding: 32px 28px 64px;
}
.case-detail__inner {
  max-width: 760px;
  margin: 0 auto;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  margin-bottom: 20px;
}
.back-link:hover {
  color: rgba(0, 0, 0, 0.87);
}
.case-head {
  margin-bottom: 20px;
}
.eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}
.case-id {
  font-family: "Roboto Mono", monospace;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.props {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-bottom: 28px;
}
.prop {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}
.prop-key {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.45);
}
.prop-val {
  color: rgba(0, 0, 0, 0.8);
}
.prov-link {
  color: #1565c0;
  text-decoration: none;
}
.prov-link:hover {
  text-decoration: underline;
}
.case-section {
  margin-bottom: 24px;
}
.section-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  margin-bottom: 8px;
}
.oxurl-line {
  display: flex;
  align-items: center;
}
.oxurl-link {
  font-family: "Roboto Mono", monospace;
  font-size: 0.82rem;
  color: #1565c0;
  word-break: break-all;
  text-decoration: none;
}
.oxurl-link:hover {
  text-decoration: underline;
}
.oxurl-flag {
  display: flex;
  align-items: flex-start;
  font-size: 0.86rem;
}
.oxurl-flag--rejected {
  color: #b26a00;
}
.oxurl-flag--fail {
  color: #c62828;
}
.oxurl-flag--win {
  color: #5e35b1;
}
.oxurl-flag--server {
  color: #455a64;
}
.oxurl-flag--neutral {
  color: #455a64;
}
.oxurl-flag code {
  margin: 0 3px;
}
.prose {
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.8);
}
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
}
</style>
