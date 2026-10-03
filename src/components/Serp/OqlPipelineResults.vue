<template>
  <!-- Results of an OQL pipeline query (oxjob #1536): one row per group, one column
       per calculation (headed by its OQL words), the total row first, nested groups
       under their parents. Sort by any column. -->
  <v-card variant="outlined" class="bg-white oql-pipeline-results">
    <div class="results-card-head d-flex align-center">
      <span class="text-body-2 text-medium-emphasis">{{ headLabel }}</span>
      <v-spacer />
      <span v-if="costLabel" class="text-body-2 text-medium-emphasis">{{ costLabel }}</span>
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
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'total-row': row.isTotal, 'child-row': row.level > 0 }"
          >
            <td class="group-col" :style="{ paddingLeft: `${12 + row.level * 22}px` }">
              <span class="group-cell">
                <v-btn
                  v-if="row.hasChildren"
                  icon
                  variant="text"
                  size="x-small"
                  density="comfortable"
                  class="toggle-btn"
                  :aria-label="collapsed.has(row.id) ? 'Show groups' : 'Hide groups'"
                  @click="toggle(row.id)"
                >
                  <v-icon size="18">{{ collapsed.has(row.id) ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
                <span v-else-if="hasNesting" class="toggle-spacer" />
                <router-link v-if="row.link" :to="row.link" class="group-link">{{ row.label }}</router-link>
                <span v-else>{{ row.label }}</span>
              </span>
            </td>
            <td v-for="m in measures" :key="m.key" class="numeric">
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
  flattenGroups, formatMeasure, formatCost, groupLink, splitDepth,
} from '@/oqlPipeline';

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
const collapsed = ref(new Set());

const response = computed(() => serverSorted.value || props.resultsObject);
const meta = computed(() => response.value?.meta || {});
const measures = computed(() => meta.value.measures || []);
const groups = computed(() => response.value?.group_by || []);
const total = computed(() => response.value?.total || null);
const hasNesting = computed(() => splitDepth(groups.value) > 1 || !!total.value?.groups?.length);

const columns = computed(() => [
  { key: 'group', label: 'Group', numeric: false },
  ...measures.value.map((m) => ({ key: m.key, label: m.oql, numeric: true, measure: m })),
]);

// The total row's own inner splits start collapsed: they repeat the breakdown for
// every work and would push the groups off screen.
const TOTAL_ID = '#total';
function resetView() {
  sort.value = null;
  serverSorted.value = null;
  collapsed.value = new Set([TOTAL_ID]);
}
watch(() => props.resultsObject, resetView, { immediate: true });

function toggle(id) {
  const next = new Set(collapsed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsed.value = next;
}

const rows = computed(() => {
  // Local sort applies at every level; an API-sorted page is already in order.
  const localSort = serverSorted.value ? null : sort.value;
  const out = [];
  if (total.value) {
    const t = total.value;
    const children = t.groups || [];
    out.push({
      id: TOTAL_ID, level: 0, group: t, isTotal: true, hasChildren: children.length > 0,
      label: capitalize(t.key_display_name || 'all works'), link: null,
    });
    if (children.length && !collapsed.value.has(TOTAL_ID)) {
      out.push(...decorate(flattenGroups(children, {
        sort: localSort, collapsed: collapsed.value, level: 1, parentId: TOTAL_ID,
      })));
    }
  }
  out.push(...decorate(flattenGroups(groups.value, { sort: localSort, collapsed: collapsed.value })));
  return out;
});

function decorate(flat) {
  return flat.map((r) => ({
    ...r,
    label: r.group.key_display_name ?? String(r.group.key),
    link: groupLink(r.group.key),
  }));
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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

const headLabel = computed(() => {
  const m = meta.value;
  const nGroups = m.groups_count ?? groups.value.length;
  const groupWord = nGroups === 1 ? 'group' : 'groups';
  const works = m.count != null ? ` of ${m.count.toLocaleString()} works` : '';
  if (sorting.value) return 'Sorting…';
  return `${nGroups.toLocaleString()} ${groupWord}${works}`;
});

const costLabel = computed(() => {
  const c = formatCost(meta.value.cost);
  return c ? `Price: ${c}` : null;
});

const footNote = computed(() => {
  const m = meta.value;
  if (!m.more_groups) return null;
  const shown = groups.value.length.toLocaleString();
  const by = serverSorted.value && sort.value
    ? (measures.value.find((x) => x.key === sort.value.key)?.oql || sort.value.key)
    : 'count';
  const head = `Showing the top ${shown} groups by ${by}. Sort by a column to see the top groups by it.`;
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
.total-row td {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.03);
}
.child-row td {
  color: rgba(0, 0, 0, 0.75);
}
.group-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.toggle-btn {
  margin-left: -6px;
}
.toggle-spacer {
  display: inline-block;
  width: 22px;
}
.pipeline-foot {
  padding: 10px 14px;
}
</style>
