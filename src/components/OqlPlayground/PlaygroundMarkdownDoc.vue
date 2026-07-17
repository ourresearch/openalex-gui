<template>
  <div class="playground-doc">
    <div class="doc-main">
      <v-progress-circular v-if="loading" indeterminate color="primary" class="my-8" />

      <v-alert v-else-if="error" type="error" variant="tonal" class="my-4">
        Couldn't load this page: {{ error }}
      </v-alert>

      <!-- first-party trusted artifact, escaped + rendered by miniMarkdown.
           The markdown carries its own H1 + intro, so the doc is self-contained. -->
      <article v-else ref="articleRef" class="md-body" v-html="html"></article>
    </div>

    <!-- Scrollspy "On this page" TOC, built from the rendered <h2> headings
         (miniMarkdown stamps slug ids). Mirrors the pricing page's TOC. -->
    <nav v-if="toc.length > 1" class="doc-toc">
      <div class="doc-toc-heading">
        <v-icon size="16">mdi-text-box-outline</v-icon>
        On this page
      </div>
      <ul>
        <li v-for="item in toc" :key="item.id">
          <a
            :href="'#' + item.id"
            :class="{ active: activeId === item.id }"
            @click.prevent="scrollToSection(item.id)"
          >{{ item.label }}</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
// Generic renderer for the OQL prose pages (Cheat sheet / Guide / Spec). Each
// fetches a canonical markdown artifact from elastic-api (`/query/spec/<slug>`)
// at runtime so it can never drift from the API, and renders it with the shared
// miniMarkdown. The slug selects which doc (oxjob #530).
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { fetchSpecMarkdown } from "./oqlSpecApi";
import { renderMarkdown } from "./miniMarkdown";

defineOptions({ name: "PlaygroundMarkdownDoc" });

const props = defineProps({
  slug: { type: String, required: true }, // cheatsheet | guide | api | oql (spec)
});

const loading = ref(true);
const error = ref(null);
const html = ref("");

// Scrollspy TOC state.
const articleRef = ref(null);
const toc = ref([]);
const activeId = ref("");
let observer = null;

// Build the TOC from the rendered <h2> section headings and wire an
// IntersectionObserver that highlights whichever section is in view (same
// approach as PricingPageNewer.vue).
async function buildToc() {
  await nextTick();
  if (observer) { observer.disconnect(); observer = null; }
  toc.value = [];
  activeId.value = "";
  const root = articleRef.value;
  if (!root) return;
  const heads = Array.from(root.querySelectorAll("h2[id]"));
  toc.value = heads.map((h) => ({ id: h.id, label: h.textContent }));
  if (heads.length < 2) return;
  activeId.value = heads[0].id;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeId.value = entry.target.id;
      }
    },
    { rootMargin: "-15% 0px -70% 0px" }
  );
  heads.forEach((h) => observer.observe(h));
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

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
  // Build the TOC only AFTER `loading` flips false — that's when the <article>
  // (a v-else) actually mounts, so articleRef is available to query for headings.
  await buildToc();
}

watch(() => props.slug, load, { immediate: true });
onBeforeUnmount(() => { if (observer) observer.disconnect(); });
</script>

<style scoped>
.playground-doc {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}
.doc-main {
  flex: 1;
  min-width: 0;
  max-width: 820px;
}
/* Scrollspy TOC — sticky in the right gutter; hidden on narrower viewports. */
.doc-toc {
  position: sticky;
  top: 88px;
  flex-shrink: 0;
  width: 190px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  font-size: 0.82rem;
}
.doc-toc-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 10px;
}
.doc-toc ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.doc-toc li {
  margin: 0;
}
.doc-toc a {
  display: block;
  padding: 4px 0 4px 12px;
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.6);
  text-decoration: none;
  line-height: 1.35;
}
.doc-toc a:hover {
  color: rgba(0, 0, 0, 0.9);
}
.doc-toc a.active {
  color: #0a0a0a;
  border-left-color: #0a0a0a;
  font-weight: 500;
}
@media (max-width: 1100px) {
  .doc-toc {
    display: none;
  }
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
