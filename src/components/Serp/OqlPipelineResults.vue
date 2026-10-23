<template>
  <!-- Results of an OQL pipeline query (oxjob #1536, flat since #1550): one row per
       group with a column per split and per calculation (headed by their OQL words),
       every row sortable on its own. The summary (the whole set, each split on its own)
       is not shown here yet (Jason, 2026-10-08: how to display it is unsolved). Export
       goes through the same Export dialog and exporter as works (Jason, 2026-10-08: OQL
       has no limits, so it writes every group, priced up front), as one file with nothing
       to choose (Jason, 2026-10-09): no split, one CSV; splits, a zip of every group and
       the summary. -->
  <v-card variant="outlined" class="bg-white oql-pipeline-results">
    <div class="results-card-head d-flex align-center">
      <span class="text-body-2 text-medium-emphasis">{{ headLabel }}</span>
      <!-- The table's order (oxjob #1658): the same order as the column headers and
           the OQL's ending (`, highest mean FWCI first`). -->
      <sort-menu class="ml-2" :x-query="meta.x_query" @pick="setOrder" />
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
              :class="['pipeline-th', col.numeric ? 'numeric' : 'group-col',
                       { sorted: sort?.key === col.key, unsortable: !col.sortable }]"
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
            <td v-for="m in rowMeasures" :key="m.key" :class="textKeys.has(m.key) ? 'text-col' : 'numeric'">
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
import { useStore } from 'vuex';

import {
  flatRows, sortRows, formatMeasure, formatCost, groupLink, wholeSetMeasures, exportRows, isTextMeasure,
} from '@/oqlPipeline';
import { orderLabel } from '@/sortMenu';
import { useQueryOrder } from '@/composables/useQueryOrder';
import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';
import SortMenu from '@/components/Serp/SortMenu.vue';

defineOptions({ name: 'OqlPipelineResults' });

const props = defineProps({
  resultsObject: { type: Object, required: true },
});

// The table's order is the query's (oxjob #1658): a header click or a menu pick runs the
// query with it (the API sorts every group), and the OQL and the link end with its words.
// The clicked order shows at once (`clicked`, a local sort of the rows here) until its run
// comes back. Shortcut: every click is a run (the query's price, 1-10 credits, ~0.3 s) even
// when all groups are here; sorting here and asking the free translate for the OQL would
// skip it, but would patch the echo the page reads its OQL, menu and link from.
const store = useStore();
const { setOrder } = useQueryOrder();
const clicked = ref(null); // {key, dir} | null

const meta = computed(() => props.resultsObject?.meta || {});
const measures = computed(() => meta.value.measures || []);
const splits = computed(() => meta.value.splits || []);
const depth = computed(() => splits.value.length);
// With no split the one row is the whole set, which has no share or own-field value.
const rowMeasures = computed(() => (depth.value ? measures.value : wholeSetMeasures(measures.value)));

// A group's own name or code (`last known institution`) is text, not a number (#1555).
const textKeys = computed(() => new Set(
  rowMeasures.value.filter((m) => isTextMeasure(m, allRows.value)).map((m) => m.key),
));

// The API sorts a table by its first split's key (`key`) or by a number (its key); an inner
// split keeps its own order, and an ID split sorts by the ID string (`in institution ID
// order`, the split's `key_order: 'id'`), no use to people. Those headers don't sort.
const columns = computed(() => [
  ...splits.value.map((s, i) => ({
    key: `split:${i}`, label: s.oql, numeric: false,
    sortable: i === 0 && ['alphabetical', 'year'].includes(s.key_order),
  })),
  ...rowMeasures.value.map((m) => ({
    key: m.key, label: m.oql, numeric: !textKeys.value.has(m.key), measure: m, sortable: depth.value > 0,
  })),
]);

// The run is back (or failed): show what the API sent.
watch(() => props.resultsObject, () => { clicked.value = null; }, { immediate: true });
watch(() => store.state.isLoading, (loading) => { if (!loading) clicked.value = null; });

// The order the shown groups came in, as a column: the echo's `sort_by` (`key` = the
// first split); none = the default (most works first; years oldest first).
const echoed = computed(() => {
  const s = meta.value.x_query?.oqo?.sort_by?.[0];
  if (!s) return null;
  return { key: s.column_id === 'key' ? 'split:0' : s.column_id, dir: s.direction === 'asc' ? 'asc' : 'desc' };
});
const sort = computed(() => clicked.value || echoed.value);
const defaultSort = computed(() => (splits.value[0]?.column_id === 'publication_year'
  ? { key: 'split:0', dir: 'asc' } : { key: 'count', dir: 'desc' }));

const allRows = computed(() => {
  if (depth.value) return flatRows(props.resultsObject?.group_by, depth.value);
  const all = props.resultsObject?.summary?.all;
  return all ? [{ id: 'all', path: [], group: all }] : [];
});
// The API's order; a clicked order is shown at once, sorted here, until its run returns.
const rows = computed(() => (clicked.value ? sortRows(allRows.value, clicked.value) : allRows.value));

function label(g) {
  return g.key_display_name ?? String(g.key);
}

function onSort(col) {
  if (!col.sortable) return;
  // First click: biggest first (names A-Z); a click on the sorted column flips it.
  const now = sort.value || defaultSort.value;
  const dir = now.key === col.key
    ? (now.dir === 'asc' ? 'desc' : 'asc')
    : (col.numeric ? 'desc' : 'asc');
  clicked.value = { key: col.key, dir };
  setOrder([{ column_id: col.key === 'split:0' ? 'key' : col.key, direction: dir }]);
}

// ---- Export: the shared Export dialog (oxjob #1550) -------------------------------
const exportButtonRef = ref(null);
const exportTooltip = computed(() => {
  const n = exportRows(props.resultsObject);
  if (!depth.value) return 'Export';
  const groups = n == null ? 'every group' : `${n.toLocaleString()} ${n === 1 ? 'group' : 'groups'}`;
  return `Export ${groups} and the summary`;
});

const headLabel = computed(() => {
  const m = meta.value;
  if (clicked.value) return 'Sorting…';
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
  // the order every group was sorted by, in the menu's words (the API sorts them all)
  const head = `Showing the first ${shown} groups: ${orderLabel(m.x_query?.order).toLowerCase()}.`;
  // A mean (or median, min, max) over many groups puts one-work groups first; the
  // language's answer is a count floor (`Only ... with at least 20 works ...`).
  const m2 = echoed.value && measures.value.find((x) => x.key === echoed.value.key);
  if (m2 && ['mean', 'median', 'min', 'max'].includes(m2.measure)) {
    return `${head} Groups with a few works can top a ${m2.measure}; to skip them, add a floor, e.g. "Only ... with at least 20 works".`;
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
.pipeline-th.unsortable {
  cursor: default;
}
.pipeline-th.unsortable:hover {
  background: none;
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
.text-col {
  text-align: left;
  min-width: 12em;
  max-width: 28em;
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
