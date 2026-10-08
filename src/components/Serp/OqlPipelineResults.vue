<template>
  <!-- Results of an OQL pipeline query (oxjob #1536, flat since #1550): one row per
       group with a column per split and per calculation (headed by their OQL words),
       every row sortable on its own. The summary (the whole set, each split on its own)
       is not shown here yet (Jason, 2026-10-08: how to display it is unsolved). Export
       goes through the same Export dialog and exporter as works (Jason, 2026-10-08: OQL
       has no limits, so it writes every group, priced up front): the groups as one CSV,
       or the summary (one CSV, or a zip of one CSV per table with 2+ splits). -->
  <v-card variant="outlined" class="bg-white oql-pipeline-results">
    <div class="results-card-head d-flex align-center">
      <span class="text-body-2 text-medium-emphasis">{{ headLabel }}</span>
      <v-spacer />
      <span v-if="costLabel" class="text-body-2 text-medium-emphasis">{{ costLabel }}</span>
      <v-tooltip location="bottom" :text="exportTooltip" content-class="linear-tooltip">
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            icon
            variant="text"
            size="small"
            class="ml-1"
            :aria-label="exportTooltip"
            @click="exportButtonRef?.openExportDialog()"
          >
            <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
      <!-- The shared Export dialog (its own button hidden; dialogs are teleported). It
           reads this response from the store and switches to its calculation mode. -->
      <serp-results-export-button ref="exportButtonRef" class="d-none" />
    </div>
    <v-divider />

    <div class="pipeline-table-wrap">
      <table class="pipeline-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="['pipeline-th', col.numeric ? 'numeric' : 'group-col', { sorted: sort?.key === col.key }]"
              :aria-sort="sort?.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
              @click="onSort(col)"
            >
              <span class="th-inner">
                {{ col.label }}
                <v-icon v-if="sort?.key === col.key" size="14" class="sort-icon">
                  {{ sort.dir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td v-for="(g, i) in row.path" :key="i" class="group-col">
              <router-link v-if="groupLink(g.key)" :to="groupLink(g.key)" class="group-link">{{ label(g) }}</router-link>
              <span v-else>{{ label(g) }}</span>
            </td>
            <td v-for="m in rowMeasures" :key="m.key" class="numeric">
              {{ formatMeasure(m, row.group[m.key]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="footNote" class="pipeline-foot text-body-2 text-medium-emphasis">{{ footNote }}</div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { api } from '@/api';
import {
  flatRows, sortRows, formatMeasure, formatCost, groupLink, wholeSetMeasures, exportRows,
} from '@/oqlPipeline';
import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';

defineOptions({ name: 'OqlPipelineResults' });

const props = defineProps({
  resultsObject: { type: Object, required: true },
});

const route = useRoute();

// One split with more groups than came back (`meta.more_groups`) holds only the top
// page, so a sort on a calculated column asks the API for the top page by that column
// (`sort=<measure key>:<dir>`); otherwise every group is here and sorting is local.
const serverSorted = ref(null); // response of the API-side sort, or null
const sorting = ref(false);
const sort = ref(null); // {key, dir} | null = the API's order

const response = computed(() => serverSorted.value || props.resultsObject);
const meta = computed(() => response.value?.meta || {});
const measures = computed(() => meta.value.measures || []);
const splits = computed(() => meta.value.splits || []);
const depth = computed(() => splits.value.length);
// With no split the one row is the whole set, which has no share or own-field value.
const rowMeasures = computed(() => (depth.value ? measures.value : wholeSetMeasures(measures.value)));

const columns = computed(() => [
  ...splits.value.map((s, i) => ({ key: `split:${i}`, label: s.oql, numeric: false })),
  ...rowMeasures.value.map((m) => ({ key: m.key, label: m.oql, numeric: true, measure: m })),
]);

watch(() => props.resultsObject, () => {
  sort.value = null;
  serverSorted.value = null;
}, { immediate: true });

const allRows = computed(() => {
  if (depth.value) return flatRows(response.value?.group_by, depth.value);
  const all = props.resultsObject?.summary?.all;
  return all ? [{ id: 'all', path: [], group: all }] : [];
});
// Local sort; an API-sorted page is already in order.
const rows = computed(() => (serverSorted.value ? allRows.value : sortRows(allRows.value, sort.value)));

function label(g) {
  return g.key_display_name ?? String(g.key);
}

async function onSort(col) {
  // First click: biggest first (names A-Z); a second click flips it.
  const firstDir = col.numeric ? 'desc' : 'asc';
  const dir = sort.value?.key === col.key
    ? (sort.value.dir === 'asc' ? 'desc' : 'asc')
    : firstDir;
  sort.value = { key: col.key, dir };
  if (!props.resultsObject?.meta?.more_groups || !col.numeric) {
    serverSorted.value = null;
    return;
  }
  const oql = props.resultsObject.meta.x_query?.oql || route.query.oql;
  const asked = sort.value;
  sorting.value = true;
  try {
    const resp = await api.executeOql(oql, { sort: `${col.key}:${dir}` });
    if (sort.value === asked) serverSorted.value = resp;
  } catch (e) {
    // Fall back to sorting the page we have.
    if (sort.value === asked) serverSorted.value = null;
  } finally {
    if (sort.value === asked) sorting.value = false;
  }
}

// ---- Export: the shared Export dialog (oxjob #1550) -------------------------------
const exportButtonRef = ref(null);
const exportTooltip = computed(() => {
  const n = exportRows(props.resultsObject, 'groups-csv');
  if (!depth.value) return 'Export';
  return n == null ? 'Export every group' : `Export ${n.toLocaleString()} ${n === 1 ? 'group' : 'groups'}`;
});

const headLabel = computed(() => {
  const m = meta.value;
  if (sorting.value) return 'Sorting…';
  const works = m.count != null ? `${m.count.toLocaleString()} works` : '';
  if (!depth.value) return works;
  // nested splits: every combination is here, one row each; one split: the API's
  // count of its groups (it may hold only the top page)
  const nGroups = depth.value > 1 ? allRows.value.length : (m.groups_count ?? allRows.value.length);
  return `${nGroups.toLocaleString()} ${nGroups === 1 ? 'group' : 'groups'}${works ? ` of ${works}` : ''}`;
});

const costLabel = computed(() => {
  const c = formatCost(meta.value.cost);
  return c ? `Price: ${c}` : null;
});

const footNote = computed(() => {
  const m = meta.value;
  if (!m.more_groups) return null;
  const shown = allRows.value.length.toLocaleString();
  const by = serverSorted.value && sort.value
    ? (measures.value.find((x) => x.key === sort.value.key)?.oql || sort.value.key)
    : 'count';
  const head = serverSorted.value
    ? `Showing the top ${shown} groups by ${by}.`
    : `Showing the top ${shown} groups by ${by}. Sort by a column to see the top groups by it.`;
  // A mean (or median, min, max) over many groups puts one-work groups first; the
  // language's answer is a count filter on the split.
  const m2 = serverSorted.value && measures.value.find((x) => x.key === sort.value?.key);
  if (m2 && ['mean', 'median', 'min', 'max'].includes(m2.measure)) {
    return `${head} Groups with a few works can top a ${m2.measure}; to skip them, add a count filter to the split, e.g. "where count of those works > (20)".`;
  }
  return head;
});
</script>

<style scoped>
.results-card-head {
  padding: 6px 12px 6px 14px;
  min-height: 44px;
}
.pipeline-table-wrap {
  overflow-x: auto;
}
.pipeline-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.pipeline-th {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.48);
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.pipeline-th:hover {
  background: rgba(0, 0, 0, 0.05);
}
.pipeline-th.sorted {
  color: rgba(0, 0, 0, 0.8);
}
.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.sort-icon {
  color: inherit;
}
.group-col {
  text-align: left;
}
.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pipeline-table td {
  padding: 6px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.pipeline-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.03);
}
.pipeline-foot {
  padding: 10px 14px;
}
</style>
