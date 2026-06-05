<template>
  <div class="case-detail">
    <div class="case-detail__inner">
      <router-link :to="{ name: 'OqlPlayground' }" class="back-link">
        <v-icon size="16">mdi-arrow-left</v-icon>
        Cases
      </router-link>

      <template v-if="row">
        <header class="case-head">
          <div class="eyebrow">{{ row.category }}</div>
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
          <pre class="code-block">{{ row.oql }}</pre>
        </section>

        <!-- State-specific explainer -->
        <section class="case-section">
          <h2 class="section-title">classic OpenAlex URL</h2>
          <div v-if="row.state === 'ok'" class="oxurl-line">
            <v-icon size="16" color="grey-darken-1" class="mr-1">mdi-link-variant</v-icon>
            <a :href="row.oxurl" target="_blank" rel="noopener" class="oxurl-link">
              {{ prettyUrl(row.oxurl) }}
            </a>
          </div>
          <div v-else-if="row.state === 'rejected'" class="oxurl-flag oxurl-flag--rejected">
            <v-icon size="16" color="amber-darken-2" class="mr-1">mdi-check-circle</v-icon>
            Invalid OQL — the parser correctly rejected it. This is working as
            intended; the diagnostic below is the message it returns.
          </div>
          <div v-else-if="row.state === 'translator-gap'" class="oxurl-flag oxurl-flag--fail">
            <v-icon size="16" color="red-darken-1" class="mr-1">mdi-alert</v-icon>
            <strong>Translator gap.</strong>&nbsp;This is representable per the spec, but
            <code>query_translation</code> can't render the URL yet — a bug to fix.
          </div>
          <div v-else class="oxurl-flag oxurl-flag--fail">
            <v-icon size="16" color="red-darken-1" class="mr-1">mdi-alert</v-icon>
            <strong>Spec gap.</strong>&nbsp;This query isn't expressible in OQL/OQO yet —
            it needs an OQLO spec/grammar addition.
          </div>
        </section>

        <!-- OQO -->
        <section v-if="row.oqo" class="case-section">
          <h2 class="section-title">OQO</h2>
          <pre class="code-block">{{ toYaml(row.oqo) }}</pre>
        </section>

        <!-- Diagnostic -->
        <section v-if="row.diagnostic" class="case-section">
          <h2 class="section-title">Diagnostic</h2>
          <pre class="code-block code-block--diag">{{ row.diagnostic }}</pre>
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
        <router-link :to="{ name: 'OqlPlayground' }">Back to Cases</router-link>
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

defineOptions({ name: "PlaygroundCaseDetail" });

const props = defineProps({
  id: { type: String, required: true },
});

// Same five-sector derivation as the Cases table (see PlaygroundCases.vue).
const caseState = (r) =>
  r.status === "error"
    ? "rejected"
    : r.status === "out-of-scope"
      ? "out-of-scope"
      : r.oxurl
        ? "ok"
        : r.oxurl_representable
          ? "translator-gap"
          : "spec-gap";

const stateMeta = {
  "ok": { label: "ok", color: "green" },
  "rejected": { label: "rejected", color: "amber-darken-2" },
  "out-of-scope": { label: "out of scope", color: "blue-grey-lighten-1" },
  "translator-gap": { label: "translator gap", color: "red-darken-1" },
  "spec-gap": { label: "spec gap", color: "red-darken-1" },
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
.code-block {
  font-family: "Roboto Mono", monospace;
  font-size: 0.82rem;
  background: rgba(0, 0, 0, 0.035);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 14px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.code-block--diag {
  color: #8a5a00;
  background: rgba(178, 106, 0, 0.06);
  border-color: rgba(178, 106, 0, 0.16);
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
  align-items: center;
  font-size: 0.86rem;
}
.oxurl-flag--rejected {
  color: #b26a00;
}
.oxurl-flag--fail {
  color: #c62828;
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
