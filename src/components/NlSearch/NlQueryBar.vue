<template>
  <!-- The top of the one-mode page (oxjob #1744): the query in OQL, always editable, with
       Basic's shortcut filters along the editor's bottom edge. The chat, the chips, the
       facets and this editor all write the same thing: the URL's ?oql=. -->
  <v-card variant="outlined" class="nl-query-bar bg-white">
    <oql-editor
      v-model="text"
      min-height="56px"
      max-height="240px"
      font-size="14px"
      :status="status"
      :placeholder="PLACEHOLDER"
      toolbar
      :show-badge="false"
      @validation="onValidation"
      @submit="submit"
    />
    <div class="nl-query-actions">
      <oql-status-chip :status="status" :validation="validation" />
      <span v-if="dirty" class="nl-dirty-hint">Edited · not run yet</span>
      <v-spacer />
      <v-btn
        v-if="dirty"
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
        :loading="status === 'querying'"
        title="Run this query (⌘⏎)"
        @click="submit"
      >Run</v-btn>
    </div>
    <div class="nl-query-chips">
      <novice-filter-chips v-if="chipsShown" cap-to-slots />
      <div v-else class="nl-chips-note">
        <v-icon size="16" class="mr-1">mdi-filter-variant</v-icon>
        {{ chipsNote }}
      </div>
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

const OqlEditor = defineAsyncComponent(() => import('@/components/OqlPlayground/OqlEditor.vue'));

defineOptions({ name: 'NlQueryBar' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
});

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

async function submit() {
  const t = (text.value || '').trim();
  if (!t) return;
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
const chipsNote = computed(() => {
  if (isLoading.value) return 'Shortcut filters load with the results.';
  if (isPipeline.value) return 'To filter the works behind these groups, use the facets, edit the OQL, or ask the chat.';
  if (!hasFiltersAvailable.value) return 'No shortcut filters for this kind of thing.';
  return 'This query has more logic than shortcut filters can show. Edit the OQL, or ask the chat.';
});
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
.nl-query-chips {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.015);
  padding: 8px 10px;
  min-height: 48px;
  display: flex;
  align-items: center;
}
.nl-chips-note {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
}
</style>
