<template>
  <!-- A calculation's Works tab (oxjob #1745, after Jason 2026-10-20): the works its groups are
       counted from, the way Splunk's Events tab sits beside Statistics and Visualization and
       Tableau's "View Data" has Summary and Full Data tabs. A click on a group in the chart
       narrows this list to that group's works (drill-through, as in Metabase and Excel). It
       shows them as list rows or, as a plain list's Table does, in ResultsTable (#1744). -->
  <div class="nl-works" :class="{ 'nl-works--busy': busy }">
    <div class="nl-works-head">
      <span class="nl-works-count">{{ countText }}</span>
      <v-chip
        v-if="drill"
        size="small"
        closable
        close-label="Show all the works"
        @click:close="emit('clear-drill')"
      >{{ drill.label }}</v-chip>
      <!-- These works' own order (oxjob #1658): the Works query's, shown in its OQL. -->
      <sort-menu :x-query="xQuery" @pick="setSortBy" />
    </div>
    <v-divider />

    <div v-if="error" class="nl-works-empty">{{ error }}</div>
    <results-table
      v-else-if="results.length && mode === 'table'"
      :results-object="tableObject"
      entity-type="works"
      :sort="tableSort"
      @sort="(s) => setSortBy([{ column_id: s.field, direction: s.direction }])"
      @filter-column="(key) => emit('filter-column', key)"
    />
    <div v-else-if="results.length" class="results-container">
      <serp-results-list-item v-for="r in results" :key="r.id" :result="r" />
    </div>
    <div v-else-if="!busy" class="nl-works-empty">No works.</div>

    <sliding-pagination
      v-if="count > PER_PAGE"
      v-model="page"
      class="pb-8 pt-4"
      :count="count"
      :per-page="PER_PAGE"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch } from 'vue';
import { api } from '@/api';
import filters from '@/filters';
import { startingSetOqo } from '@/oqlPipeline';
import { createFetchSequencer } from '@/serpFetchSeq';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import SortMenu from '@/components/Serp/SortMenu.vue';

defineOptions({ name: 'NlWorksList' });

const props = defineProps({
  // The calculation's response: its echoed query names the starting set of works.
  resultsObject: Object,
  // {rows, label}: filter rows that pick one group's works, from the chart (or null).
  drill: { type: Object, default: null },
  // 'list' | 'table': the same fetched page either way, so switching never refetches.
  mode: { type: String, default: 'list' },
});
// `oql`: the query for exactly these works (filters, a clicked group, the order), from the
// API's echo, so the top of the page can show it on the Works tab (#1744).
const emit = defineEmits(['clear-drill', 'filter-column', 'oql']);

const PER_PAGE = 25;
const page = ref(1);
// These works' order, inside their own query (oxjob #1658): set from the menu or a Table
// header, null = the default (most cited (age-adjusted); never written). This fetch owns
// it, not the calculation's query, which a works sort would re-run.
const sortBy = shallowRef(null);
function setSortBy(s) {
  sortBy.value = s && s.length ? s : null;
}
const tableSort = computed(() => ({
  field: sortBy.value?.[0]?.column_id ?? '',
  direction: sortBy.value?.[0]?.direction ?? 'desc',
}));
const xQuery = shallowRef(null);
const results = shallowRef([]);
const count = ref(0);
const busy = ref(false);
const loaded = ref(false);
const error = ref('');

// The fetched page in the response shape ResultsTable reads.
const tableObject = computed(() => ({
  meta: { count: count.value, page: page.value, per_page: PER_PAGE },
  results: results.value,
}));

// The starting set (taken from the response, so it always matches the groups beside it),
// narrowed to one group after a chart click.
const worksOqo = computed(() => {
  const oqo = props.resultsObject?.meta?.x_query?.oqo;
  if (oqo?.get_rows !== 'works') return null;
  const set = startingSetOqo(oqo);
  return { ...set, filter_rows: [...(set.filter_rows || []), ...(props.drill?.rows || [])] };
});

const countText = computed(() => {
  if (!loaded.value) return 'Loading the works…';
  const n = filters.toPrecision(count.value || 0);
  const noun = count.value === 1 ? 'work' : 'works';
  return `${n} ${noun}${props.drill ? ' in' : ''}`;
});

const beginFetch = createFetchSequencer();
async function load() {
  const isStale = beginFetch();
  const oqo = worksOqo.value;
  busy.value = Boolean(oqo);
  let resp = null;
  let failed = !oqo;
  if (oqo) {
    try {
      const run = sortBy.value ? { ...oqo, sort_by: sortBy.value } : oqo;
      resp = await api.executeOqo(run, { page: page.value, per_page: PER_PAGE });
    } catch (e) {
      console.warn('[NlWorksList]', e);
      failed = true;
    }
  }
  if (isStale()) return; // a newer page or group is loading
  results.value = resp?.results || [];
  count.value = resp?.meta?.count || 0;
  error.value = !failed ? '' : oqo ? "The works couldn't load. Try again, or see the Groups." : 'This answer has no list of works behind it.';
  busy.value = false;
  loaded.value = true;
  const xq = resp?.meta?.x_query;
  xQuery.value = failed ? null : xq || null;
  emit('oql', failed ? null : xq?.x_new_oql || xq?.oql || null);
}

// A new answer or a new group starts over at page 1.
watch(() => JSON.stringify(worksOqo.value), () => {
  if (page.value !== 1) page.value = 1;
  else load();
}, { immediate: true });
watch(page, load);
watch(sortBy, () => {
  if (page.value !== 1) page.value = 1;
  else load();
});
</script>

<style scoped>
.nl-works {
  transition: opacity 0.15s;
}
.nl-works--busy {
  opacity: 0.55;
}
.nl-works-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 44px;
  padding: 6px 16px;
}
.nl-works-count {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
.nl-works-empty {
  padding: 48px 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.55);
  font-size: 14px;
}
</style>
