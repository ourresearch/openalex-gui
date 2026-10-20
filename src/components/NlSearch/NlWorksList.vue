<template>
  <!-- A calculation's Works tab (oxjob #1745, after Jason 2026-10-20): the works its groups are
       counted from, the way Splunk's Events tab sits beside Statistics and Visualization and
       Tableau's "View Data" has Summary and Full Data tabs. A click on a group in the chart
       narrows this list to that group's works (drill-through, as in Metabase and Excel). -->
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
      <span v-if="loaded" class="nl-works-count">· most cited first</span>
    </div>
    <v-divider />

    <div v-if="error" class="nl-works-empty">{{ error }}</div>
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
import SlidingPagination from '@/components/SlidingPagination.vue';

defineOptions({ name: 'NlWorksList' });

const props = defineProps({
  // The calculation's response: its echoed query names the starting set of works.
  resultsObject: Object,
  // {rows, label}: filter rows that pick one group's works, from the chart (or null).
  drill: { type: Object, default: null },
});
const emit = defineEmits(['clear-drill']);

const PER_PAGE = 25;
const page = ref(1);
const results = shallowRef([]);
const count = ref(0);
const busy = ref(false);
const loaded = ref(false);
const error = ref('');

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
      resp = await api.executeOqo(oqo, { page: page.value, per_page: PER_PAGE, sort: 'cited_by_count:desc' });
    } catch (e) {
      console.warn('[NlWorksList]', e);
      failed = true;
    }
  }
  if (isStale()) return; // a newer page or group is loading
  results.value = resp?.results || [];
  count.value = resp?.meta?.count || 0;
  error.value = !failed ? '' : oqo ? "The works couldn't load. Try again, or see the Table." : 'This answer has no list of works behind it.';
  busy.value = false;
  loaded.value = true;
}

// A new answer or a new group starts over at page 1.
watch(() => JSON.stringify(worksOqo.value), () => {
  if (page.value !== 1) page.value = 1;
  else load();
}, { immediate: true });
watch(page, load);
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
