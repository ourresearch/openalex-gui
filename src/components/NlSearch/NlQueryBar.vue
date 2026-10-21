<template>
  <!-- The top of the one-mode page (oxjob #1744): the query in OQL, always editable, with
       Basic's shortcut filters along the editor's bottom edge. The chat, the chips, the
       facets and this editor all write the same thing: the URL's ?oql=. -->
  <v-card variant="outlined" class="nl-query-bar bg-white">
    <div class="nl-query-editor">
      <oql-editor
        v-model="text"
        min-height="56px"
        max-height="240px"
        font-size="14px"
        :status="status"
        :placeholder="PLACEHOLDER"
        toolbar
        ide
        :show-badge="false"
        @validation="onValidation"
        @submit="submit"
      />
      <!-- While the chat writes a query, the box holds no OQL: the old query would read as
           the answer (Jason, Wed 21 Oct). -->
      <div v-if="creating" class="nl-query-creating" aria-live="polite">
        <span class="nl-creating-dots"><span /><span /><span /></span>
        Writing the query…
      </div>
    </div>
    <div class="nl-query-actions">
      <template v-if="!creating">
        <oql-status-chip :status="status" :validation="validation" />
        <span v-if="noteToChat" class="nl-dirty-hint">The <code>#</code> note goes to the chat · Enter sends it</span>
        <span v-else-if="dirty" class="nl-dirty-hint">Edited · not run yet</span>
      </template>
      <v-spacer />
      <v-btn
        v-if="dirty && !creating"
        variant="text"
        size="small"
        class="text-none mr-1"
        @click="revert"
      >Undo edits</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        :loading="status === 'querying' || creating"
        :disabled="creating"
        :title="noteToChat ? 'Send the note to the chat (⏎)' : 'Run this query (⌘⏎)'"
        @click="submit"
      >{{ noteToChat ? 'Ask' : 'Run' }}</v-btn>
    </div>
    <!-- Basic's shortcut filters, when the query is a flat list of filters. No row at all
         otherwise (Jason, Wed 21 Oct: the "why not" notes cost a line and said little). -->
    <div v-if="chipsRowShown" class="nl-query-chips">
      <novice-filter-chips v-if="chipsShown" cap-to-slots />
    </div>
    <search-error-alert v-if="searchError" :message="searchError" class="ma-3 mt-0" />
  </v-card>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import { pickOql } from '@/oqlForm';
import { filtersFromUrlStr } from '@/filterConfigs';
import { facetConfigs } from '@/facetConfigs';
import { basicCanRepresent, chipSlotCount } from '@/components/Filter/basicFilterMode';
import { isPipelineResponse } from '@/oqlPipeline';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import SearchErrorAlert from '@/components/SearchErrorAlert.vue';
import OqlStatusChip from '@/components/OqlPlayground/OqlStatusChip.vue';
import { validateOql } from '@/components/OqlPlayground/oqlEditorApi';
import { oqlForPageUrl } from '@/components/NlSearch/nlChat';
import { splitComments } from '@/components/OqlPlayground/oqlComments';

const OqlEditor = defineAsyncComponent(() => import('@/components/OqlPlayground/OqlEditor.vue'));

defineOptions({ name: 'NlQueryBar' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
  // The chat is writing a query: the box empties and waits for it.
  creating: { type: Boolean, default: false },
});
// `ask`: a `#` note in the box, for the chat to apply to the query above it.
const emit = defineEmits(['ask']);

const store = useStore();
const route = useRoute();
const router = useRouter();

const PLACEHOLDER = 'Ask in the chat, or type OQL here: get works about (coral reefs) since 2020, most cited first';

const entityType = computed(() => store.getters.entityType);
const isLoading = computed(() => !!store.state.isLoading);
const status = computed(() => (isLoading.value ? 'querying' : null));

// ---- the text: follows the page's query until someone edits it --------------------------
// The URL's ?oql= first: it keeps entity names ([MIT](I63966007)), which the execute echo
// (shownOql) drops. The editor's own validate pass then swaps in the tidy canonical form.
// A classic URL (/works?filter=...) has no ?oql=, so it shows the echo.
const seed = computed(() => route.query.oql || store.getters.shownOql || '');
const text = ref('');
const baseline = ref('');
const validation = ref(null);
const dirty = computed(() => url.oqlForUrl(text.value || '') !== url.oqlForUrl(baseline.value || ''));

function setText(s) {
  text.value = s || '';
  baseline.value = text.value;
}
// Take a query in, but keep the buffer byte-stable when it already shows that query (a
// submit wrote the pretty form; the URL echoes it back on one line).
function adopt(s) {
  if (s && url.oqlForUrl(text.value || '') === url.oqlForUrl(s)) {
    baseline.value = text.value;
    return;
  }
  setText(s);
}
// The settled query replaces an un-edited buffer; someone's edits are never overwritten
// by a refresh of the same query.
watch(seed, (s) => {
  if (!dirty.value || !text.value.trim()) adopt(s);
}, { immediate: true });
// A new query (chat answer, chip, facet, back button) is a navigation: it always wins.
watch(() => route.query.oql, (o) => {
  if (o) adopt(o);
});

watch(text, () => { validation.value = null; });
function onValidation(v) {
  validation.value = v;
  // Open tidied: adopt the server's pretty form of an un-edited seed (same query, so
  // no loop: canonical of canonical is itself).
  const shown = pickOql(v, store.getters.newOql);
  if (v?.valid && shown && !dirty.value && shown !== text.value) setText(shown);
}

function revert() {
  setText(seed.value);
}

// A `#` note (oqlComments.js): the box's OQL plus words for the chat to change it with.
const noteToChat = computed(() => splitComments(text.value).note);

async function submit() {
  if (props.creating) return;
  const t = (text.value || '').trim();
  if (!t) return;
  const { oql, note } = splitComments(t);
  if (note) {
    // The chat changes the query in the box (edits and all) the way it changes the page's
    // after a follow-up. The note leaves the box now; the thread keeps it.
    text.value = oql;
    emit('ask', { text: note, currentQuery: oql || null });
    return;
  }
  let canonical = validation.value?.valid ? pickOql(validation.value, store.getters.newOql) : null;
  if (!canonical) {
    let res;
    try { res = await validateOql(t); } catch (e) { return; }
    if (t !== (text.value || '').trim()) return; // kept typing
    if (!res?.valid) return; // the red chip already says why
    canonical = pickOql(res, store.getters.newOql);
  }
  setText(canonical);
  // Names stay in the URL (see oqlForPageUrl); compare without them.
  const next = oqlForPageUrl(canonical);
  if (url.oqlForUrl(next) === url.oqlForUrl(route.query.oql || '')) return;
  store.commit('setOqlSubmitError', null);
  url.pushToRoute(router, { name: 'OqlQuery', query: { oql: next } });
}

// ---- shortcut filters: Basic's chips, when the query is a flat list of filters ---------
const isPipeline = computed(() => isPipelineResponse(props.resultsObject));
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const hasFiltersAvailable = computed(() =>
  facetConfigs(entityType.value).some((c) => c.actions?.includes('filter'))
);
// Same gate as the Basic tab (SerpInputContainer.basicRepresentable): the chips read the
// settled canonical query (x_query.url); a query with no classic form can't be chips.
const chipsRepresentable = computed(() => {
  if (route.query.oql) {
    const xq = props.resultsObject?.meta?.x_query;
    if (isLoading.value || !xq || xq.url == null) return false;
  }
  let filters;
  try {
    filters = filtersFromUrlStr(entityType.value, url.chipFilterStr(route));
  } catch (e) {
    return false;
  }
  return basicCanRepresent(entityType.value, filters)
    && filters.length <= chipSlotCount(entityType.value, isSemanticSearch.value);
});
const chipsShown = computed(() => hasFiltersAvailable.value && !isPipeline.value && chipsRepresentable.value);
// While a query loads the chips can't be read yet: keep the row if it was there, so the
// page doesn't jump twice.
const chipsRowShown = ref(false);
watch([chipsShown, isLoading], ([shown, loading]) => {
  if (!loading) chipsRowShown.value = shown;
}, { immediate: true });
</script>

<style scoped>
.nl-query-bar {
  overflow: hidden;
}
.nl-query-bar :deep(.oql-editor) {
  border: none;
  border-radius: 0;
}
.nl-query-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 8px;
}
.nl-dirty-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.nl-query-editor {
  position: relative;
}
.nl-query-creating {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  background: #fff;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.5);
  cursor: progress;
}
.nl-creating-dots {
  display: inline-flex;
  gap: 4px;
}
.nl-creating-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  opacity: 0.3;
  animation: nl-creating-blink 1.2s infinite ease-in-out;
}
.nl-creating-dots span:nth-child(2) { animation-delay: 0.2s; }
.nl-creating-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes nl-creating-blink {
  0%, 80%, 100% { opacity: 0.25; }
  40% { opacity: 1; }
}
.nl-dirty-hint code {
  font-size: 12px;
  padding: 0 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
}
.nl-query-chips {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.015);
  padding: 8px 10px;
  min-height: 48px;
  display: flex;
  align-items: center;
}
</style>
