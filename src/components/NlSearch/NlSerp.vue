<template>
  <!-- The one-mode search page, behind GUI flag `nl_search` (oxjob #1744, charter
       plans/nl-search.md). Three columns, each collapsible: facets left, the query and its
       results middle, the chat right. One mode: the OQL is always at the top and editable, with
       Basic's shortcut filters at its bottom edge; no Basic / Advanced / OQL tabs. Serp.vue
       still runs the query (?oql= -> execute), so links, saved searches and Back work as before. -->
  <div class="nl-serp" :class="{ 'nl-serp--stacked': stacked }">
    <!-- Facets -->
    <aside v-if="open.facets" class="nl-col nl-col--facets">
      <div class="nl-col-head">
        <v-icon size="18" class="mr-2" color="grey-darken-1">mdi-filter-variant</v-icon>
        <span class="nl-col-title">Facets</span>
        <v-spacer />
        <div id="nl-facets-head-tools" class="nl-head-tools" />
        <v-btn icon variant="text" size="small" aria-label="Hide the facets" @click="toggle('facets')">
          <v-icon size="20">mdi-chevron-left</v-icon>
          <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">Hide the facets</v-tooltip>
        </v-btn>
      </div>
      <div class="nl-col-body">
        <!-- On a calculation the facets filter the works the groups are counted from, as
             Scopus, Web of Science, Dimensions and Tableau's dimension filters do (prior art:
             oxjob #1745 work/prior_art_works_and_groups.md). A click narrows the starting set
             and the groups regroup; the splits and calculations stay. -->
        <div v-if="isPipeline && !isSemanticSearch" class="nl-facets-note">
          Filter the works these groups are counted from.
        </div>
        <group-by-sidebar v-if="!isSemanticSearch" :results-object="resultsObject" head-to="#nl-facets-head-tools" />
      </div>
    </aside>
    <button v-else type="button" class="nl-rail" aria-label="Show the facets" @click="toggle('facets')">
      <v-icon size="18">mdi-filter-variant</v-icon>
      <span class="nl-rail-label">Facets</span>
    </button>

    <!-- The query and its results: always shown (Jason, Wed 21 Oct: hiding them isn't a real use). -->
    <main class="nl-col nl-col--main">
      <div class="nl-col-head nl-col-head--main">
        <v-icon size="18" class="mr-2" color="grey-darken-1">mdi-code-braces</v-icon>
        <span class="nl-col-title">Query</span>
        <v-spacer />
        <serp-header-actions />
      </div>
      <div ref="mainBody" class="nl-col-body nl-col-body--main">
        <nl-query-bar
          :results-object="resultsObject"
          :search-error="searchError"
          :creating="chatAsking"
          @ask="askFromBar"
        />
        <nl-results
          v-model:format="format"
          :results-object="resultsObject"
          :search-error="searchError"
        />
      </div>
    </main>

    <!-- Chat -->
    <aside v-if="open.chat" class="nl-col nl-col--chat">
      <nl-chat ref="chatRef" @collapse="toggle('chat')" @answer="onAnswer" @asking="(a) => (chatAsking = a)" />
    </aside>
    <button v-else type="button" class="nl-rail nl-rail--chat" aria-label="Show the chat" @click="toggle('chat')">
      <v-icon size="18" color="primary">mdi-creation-outline</v-icon>
      <span class="nl-rail-label">Ask</span>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';

import { isPipelineResponse } from '@/oqlPipeline';
import GroupBySidebar from '@/components/GroupBySidebar.vue';
import SerpHeaderActions from '@/components/Serp/SerpHeaderActions.vue';
import NlQueryBar from '@/components/NlSearch/NlQueryBar.vue';
import NlResults from '@/components/NlSearch/NlResults.vue';
import NlChat from '@/components/NlSearch/NlChat.vue';
import { defaultFormat, loadPickChart } from '@/components/NlSearch/nlChart';

defineOptions({ name: 'NlSerp' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
});

const store = useStore();
const route = useRoute();
const { mdAndUp } = useDisplay();
const stacked = computed(() => !mdAndUp.value);

const isPipeline = computed(() => isPipelineResponse(props.resultsObject));
const isSemanticSearch = computed(() => !!route.query['search.semantic']);

// ---- which columns are open (per device) -----------------------------------------------
const OPEN_KEY = 'nlSearch.columns.v1';
function loadOpen() {
  try {
    const o = JSON.parse(localStorage.getItem(OPEN_KEY) || 'null');
    if (o && typeof o === 'object') {
      return { facets: o.facets !== false, results: true, chat: o.chat !== false };
    }
  } catch (e) { /* fall through */ }
  return { facets: true, results: true, chat: true };
}
const open = reactive(loadOpen());
function toggle(col) {
  open[col] = !open[col];
  try { localStorage.setItem(OPEN_KEY, JSON.stringify(open)); } catch (e) { /* private mode */ }
}

// ---- the chat and the OQL box ---------------------------------------------------------------
// While the chat writes a query the box waits for it; a `#` note in the box goes to the chat.
const chatRef = ref(null);
const chatAsking = ref(false);
async function askFromBar({ text, currentQuery }) {
  if (!open.chat) toggle('chat');
  await nextTick();
  chatRef.value?.ask(text, { currentQuery });
}

// ---- result format (per device), and the chat's pick for its answers --------------------
const FORMAT_KEY = 'nlSearch.format.v1';
const FORMATS = ['table', 'list', 'chart'];
function loadFormat() {
  try {
    const f = localStorage.getItem(FORMAT_KEY);
    return FORMATS.includes(f) ? f : 'list';
  } catch (e) {
    return 'list';
  }
}
const format = ref(loadFormat());
watch(format, (f) => {
  try { localStorage.setItem(FORMAT_KEY, f); } catch (e) { /* private mode */ }
});

// A chat answer opens on the format that suits it (a chart for a calculation, the list for
// a list). It applies once, to the first response for that answer's query.
const pendingAnswerOql = ref(null);
function onAnswer(msg) {
  pendingAnswerOql.value = msg?.shownOql || null;
}
watch([() => props.resultsObject, () => store.state.isLoading], ([r, loading]) => {
  if (!pendingAnswerOql.value || !r || loading) return;
  format.value = defaultFormat(r, store.getters.shownOql);
  pendingAnswerOql.value = null;
  // On a phone the columns stack and the answer lands below the chat: bring it into view.
  if (stacked.value) nextTick(() => mainBody.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});
const mainBody = ref(null);
// A failed run ends the wait too, so a later unrelated query doesn't inherit it.
watch(() => props.searchError, (e) => { if (e) pendingAnswerOql.value = null; });

onMounted(() => { loadPickChart(); });
</script>

<style scoped>
.nl-serp {
  display: flex;
  align-items: stretch;
  height: calc(100dvh - var(--chrome-height, 56px));
  min-height: 560px;
  background: #f7f7f8;
}
.nl-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #fff;
}
.nl-col--facets {
  flex: 0 0 400px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.nl-col--main {
  flex: 1 1 auto;
  background: #f7f7f8;
}
.nl-col--chat {
  flex: 0 0 400px;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}
.nl-col :deep(.nl-col-head) {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
}
.nl-col :deep(.nl-col-title) {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}
.nl-col-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.nl-col-body--main {
  padding: 16px 24px 48px;
}
.nl-col--facets :deep(.group-by-sidebar) {
  width: 100%;
  flex: 1 1 auto;
  padding: 10px 10px 32px;
}
.nl-head-tools {
  display: flex;
  align-items: center;
}
.nl-facets-note {
  padding: 12px 16px 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.55);
}
.nl-rail {
  flex: 0 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border: none;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
}
.nl-rail:hover {
  background: rgba(0, 0, 0, 0.03);
}
.nl-rail--chat {
  border-right: none;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}
.nl-rail-label {
  writing-mode: vertical-rl;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
/* Narrow screens: one column after another, the page scrolls. */
.nl-serp--stacked {
  flex-direction: column;
  height: auto;
}
.nl-serp--stacked .nl-col {
  flex: 0 0 auto;
}
/* Phone: ask first, then the query and its results; facets (a long list) last. */
.nl-serp--stacked .nl-col--facets,
.nl-serp--stacked .nl-rail:first-child {
  order: 1;
}
.nl-serp--stacked .nl-col--chat {
  order: -1;
  height: 70vh;
  border-left: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.nl-serp--stacked .nl-col-body {
  overflow: visible;
}
.nl-serp--stacked .nl-col-body--main {
  padding: 12px 12px 32px;
}
.nl-serp--stacked .nl-rail {
  flex-direction: row;
  padding: 8px 16px;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.nl-serp--stacked .nl-rail-label {
  writing-mode: horizontal-tb;
}
</style>
