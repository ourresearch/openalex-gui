<template>
  <div class="playground-doc">
    <v-progress-circular v-if="loading" indeterminate color="primary" class="my-8" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="my-4">
      Couldn't load this page: {{ error }}
    </v-alert>

    <!-- first-party trusted artifact, escaped + rendered by miniMarkdown.
         The markdown carries its own H1 + intro, so the doc is self-contained. -->
    <article v-else class="md-body" v-html="html"></article>
  </div>
</template>

<script setup>
// Generic renderer for the OQL prose pages (Cheat sheet / Guide / Spec). Each
// fetches a canonical markdown artifact from elastic-api (`/query/spec/<slug>`)
// at runtime so it can never drift from the API, and renders it with the shared
// miniMarkdown. The slug selects which doc (oxjob #530).
import { ref, watch } from "vue";
import { fetchSpecMarkdown } from "./oqlSpecApi";
import { renderMarkdown } from "./miniMarkdown";

defineOptions({ name: "PlaygroundMarkdownDoc" });

const props = defineProps({
  slug: { type: String, required: true }, // cheatsheet | guide | oql (spec)
});

const loading = ref(true);
const error = ref(null);
const html = ref("");

async function load(slug) {
  loading.value = true;
  error.value = null;
  try {
    const md = await fetchSpecMarkdown(slug);
    html.value = renderMarkdown(md);
  } catch (e) {
    error.value = e?.response?.status ? `HTTP ${e.response.status}` : e?.message || "fetch failed";
  } finally {
    loading.value = false;
  }
}

watch(() => props.slug, load, { immediate: true });
</script>

<style scoped>
.playground-doc {
  max-width: 820px;
}
.md-body :deep(h1) {
  font-size: 1.7rem;
  margin: 0.2em 0 0.5em;
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
