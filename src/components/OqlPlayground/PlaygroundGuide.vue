<template>
  <div class="playground-guide">
    <div class="guide-intro">
      <h2 class="text-h5">OQL Guide</h2>
      <p class="text-body-2 text-medium-emphasis">
        The human-readable OQL specification &mdash; a bottom-line-up-front walkthrough.
        Served live from the canonical
        <code>docs/oql-spec.md</code> in the API, so it can't drift from the language.
      </p>
    </div>

    <v-progress-circular v-if="loading" indeterminate color="primary" class="my-8" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="my-4">
      Couldn't load the OQL guide: {{ error }}
    </v-alert>

    <!-- first-party trusted artifact, escaped + rendered by miniMarkdown -->
    <article v-else class="md-body" v-html="html"></article>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { fetchOqlGuideMarkdown } from "./oqlSpecApi";
import { renderMarkdown } from "./miniMarkdown";

defineOptions({ name: "PlaygroundGuide" });

const loading = ref(true);
const error = ref(null);
const html = ref("");

onMounted(async () => {
  try {
    const md = await fetchOqlGuideMarkdown();
    html.value = renderMarkdown(md);
  } catch (e) {
    error.value = e?.response?.status ? `HTTP ${e.response.status}` : e?.message || "fetch failed";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.playground-guide {
  max-width: 820px;
}
.guide-intro {
  margin-bottom: 16px;
}
.md-body :deep(h1) {
  font-size: 1.6rem;
  margin: 1.4em 0 0.5em;
}
.md-body :deep(h2) {
  font-size: 1.3rem;
  margin: 1.3em 0 0.4em;
  padding-top: 0.4em;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
}
.md-body :deep(h3) {
  font-size: 1.1rem;
  margin: 1.1em 0 0.3em;
}
.md-body :deep(p) {
  line-height: 1.6;
  margin: 0.6em 0;
}
.md-body :deep(ul),
.md-body :deep(ol) {
  padding-left: 1.4em;
  line-height: 1.6;
}
.md-body :deep(code) {
  background: rgba(79, 70, 229, 0.08);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-size: 0.88em;
}
/* Match the site-wide CodeBlock container (light, rounded). Markdown fenced
   snippets are illustrative prose, so they get no line-number gutter. */
.md-body :deep(pre.md-code) {
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: inherit;
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: "Roboto Mono", monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.md-body :deep(pre.md-code code) {
  background: none;
  padding: 0;
  color: inherit;
}
.md-body :deep(blockquote) {
  border-left: 3px solid rgba(79, 70, 229, 0.4);
  margin: 0.8em 0;
  padding: 0.2em 0 0.2em 1em;
  color: rgba(0, 0, 0, 0.7);
}
.md-body :deep(table.md-table) {
  border-collapse: collapse;
  margin: 0.8em 0;
  font-size: 0.88rem;
}
.md-body :deep(table.md-table th),
.md-body :deep(table.md-table td) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 5px 10px;
  text-align: left;
}
.md-body :deep(table.md-table th) {
  background: rgba(0, 0, 0, 0.03);
}
.md-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 1.4em 0;
}
.md-body :deep(a) {
  color: #4f46e5;
}
</style>
