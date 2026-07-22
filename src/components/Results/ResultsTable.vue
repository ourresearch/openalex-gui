<template>
  <div class="results-table-scroll">
    <table class="serp-results-table results-table">
      <thead>
        <tr>
          <th class="results-table-header checkbox-cell">
            <v-checkbox-btn
              density="compact"
              :model-value="masterChecked"
              :indeterminate="masterIndeterminate"
              @update:model-value="onMasterClick"
            />
          </th>
          <th
            v-for="(col, i) in columns"
            :key="col.key"
            class="results-table-header"
            :class="[
              col.widthClass,
              {
                'numeric-cell': col.isNumeric,
                'bool-cell': col.isBoolean,
                'drag-over': dragOverIndex === i && dragIndex !== i,
                'dragging': dragIndex === i,
              },
            ]"
            draggable="true"
            @dragstart="onHeaderDragStart(i, $event)"
            @dragover.prevent="onHeaderDragOver(i)"
            @dragleave="onHeaderDragLeave(i)"
            @drop="onHeaderDrop(i)"
            @dragend="onHeaderDragEnd"
          >
            <!-- The whole header is the menu trigger: label + sort indicator live
                 inside ColumnHeaderMenu's activator slot, so clicking anywhere on
                 the header opens the menu. Dragging the header reorders columns. -->
            <column-header-menu
              :column="col"
              :total="columns.length"
              :sort-field="sortField"
              :sort-direction="sortDirection"
              @sort="(dir) => onSort(col, dir)"
              @filter="onFilter(col)"
              @remove="onRemove(col)"
            >
              <span class="column-header-label">{{ col.label }}</span>
              <v-icon
                v-if="sortField === col.baseKey"
                size="14"
                class="column-header-sort-indicator"
              >{{ sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
            </column-header-menu>
          </th>
          <th class="results-table-header add-column-cell">
            <add-column :entity-type="entityType" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.id">
          <td class="checkbox-cell">
            <v-checkbox-btn
              density="compact"
              :model-value="isSelected(result.id)"
              @click.stop
              @update:model-value="toggleSelection(result.id)"
            />
          </td>
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.widthClass,
              { 'numeric-cell': col.isNumeric, 'bool-cell': col.isBoolean },
            ]"
          >
            <cell-value
              :value="getCellValue(col, result)"
              :render="col.render"
              :boolean-values="col.booleanValues"
            />
          </td>
          <td class="add-column-cell"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import filters from '@/filters';
import { url } from '@/url';
import { resolveColumns } from '@/components/Results/Table/columnConfig';
import { useColumnsState } from '@/composables/useColumnsState';
import CellValue from '@/components/Results/Table/CellValue.vue';
import AddColumn from '@/components/Results/Table/AddColumn.vue';
import ColumnHeaderMenu from '@/components/Results/Table/ColumnHeaderMenu.vue';
import { useMasterSelection } from '@/composables/useMasterSelection';

defineOptions({ name: 'ResultsTable' });

const store = useStore();
const route = useRoute();
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();

const props = defineProps({
  resultsObject: { type: Object, default: null },
  entityType: { type: String, required: true },
});

// "Filter by this…" is routed up to ExpertSerp, which owns the (headless) filter
// value-picker so the property's existing filter UI is reused verbatim.
const emit = defineEmits(['filter-column']);

// The ordered column keys are the sticky per-entity preference (localStorage,
// falling back to per-entity defaults) — resolved in useColumnsState. The
// mutations (drag-reorder/remove) silently persist; they never touch the URL
// or the query (#661 column-model redesign).
const { columnKeys, removeColumn, setColumns } = useColumnsState(toRef(props, 'entityType'));

// OQL mode: sort is transient client state in the canonical query store
// (`state.query.sort`, #661 — never in the OQO or the URL; POSTed as a sibling
// param). So both the active-sort read and the sort write must branch on mode,
// mirroring NoviceSortButton's gate. Basic/chip (OXURL) + flag-off keep ?sort=.
const inOqlMode = computed(
  () => !!store.getters.featureFlags['oql'] && !!route.query.oql,
);
const storeSortBy = computed(() => store.state.query?.sort || []);

// Active sort state, reflected on the headers (check next to the active
// direction + a small arrow indicator beside the label). In OQL mode the
// primary store sort is shown; otherwise the URL sort.
const sortField = computed(() =>
  inOqlMode.value ? (storeSortBy.value[0]?.column_id ?? '') : url.getSortField(route),
);
const sortDirection = computed(() =>
  inOqlMode.value
    ? (storeSortBy.value[0]?.direction === 'asc' ? 'asc' : 'desc')
    : url.getSortDirection(route),
);

function onSort(col, dir) {
  if (inOqlMode.value) {
    // Drive the canonical store → POST-OQO (same path as NoviceSortButton).
    store.dispatch('query/setSort', { field: col.baseKey, direction: dir });
  } else {
    url.setSortDirection(col.baseKey, dir);
  }
}
function onFilter(col) {
  emit('filter-column', col.baseKey);
}
function onRemove(col) {
  // No column is special anymore (Title included); useColumnsState.removeColumn
  // enforces the ≥1-column floor (and the header menu disables Remove on the
  // last column).
  removeColumn(col.key);
}

// ---- header drag-to-reorder (native HTML5 DnD, same pattern as
// ColumnEditorPanel's chips). Indices are positions in the VISIBLE `columns`
// array; the reorder is applied to `columnKeys` by key so any keys that
// resolveColumns dropped (unknown/ineligible) keep their relative places.
const dragIndex = ref(null);
const dragOverIndex = ref(null);
function onHeaderDragStart(i, e) {
  dragIndex.value = i;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    // Firefox needs data set for the drag to fire.
    e.dataTransfer.setData('text/plain', String(i));
  }
}
function onHeaderDragOver(i) {
  dragOverIndex.value = i;
}
function onHeaderDragLeave(i) {
  if (dragOverIndex.value === i) dragOverIndex.value = null;
}
function onHeaderDrop(targetIndex) {
  const from = dragIndex.value;
  dragIndex.value = null;
  dragOverIndex.value = null;
  if (from === null || from === targetIndex) return;
  const fromKey = columns.value[from]?.key;
  const toKey = columns.value[targetIndex]?.key;
  if (!fromKey || !toKey) return;
  const keys = [...columnKeys.value];
  const fromIdx = keys.indexOf(fromKey);
  const toIdx = keys.indexOf(toKey);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = keys.splice(fromIdx, 1);
  keys.splice(toIdx, 0, moved);
  setColumns(keys);
}
function onHeaderDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

// Render kinds that are right-aligned + monospaced for easy column comparison.
const NUMERIC_KINDS = new Set(['number', 'currency']);

// Width behaviour by render kind. We keep the browser's auto table-layout and
// only nudge it: narrow scalar columns shrink to their content, list columns
// are capped so long author runs don't dominate, and the identity (title)
// column claims the leftover space. No hard pixel widths.
const NARROW_KINDS = new Set(['number', 'currency', 'year', 'boolean']);
const LIST_KINDS = new Set(['entityList', 'stringList']);
function widthClassFor(kind, isIdentity) {
  if (isIdentity) return 'col-title';
  if (NARROW_KINDS.has(kind)) return 'col-narrow';
  if (LIST_KINDS.has(kind)) return 'col-list';
  return 'col-text';
}

const results = computed(() => props.resultsObject?.results ?? []);

// Resolve the ordered keys to renderable column descriptors. resolveColumns
// drops unknown/ineligible/malformed keys (with a console.warn) and never
// throws, so a bad stored column key degrades gracefully instead of blanking
// the table (QA-051 discipline). We then layer on the display-only flags
// (alignment + width hints) derived from the render kind.
const columns = computed(() =>
  resolveColumns(props.entityType, columnKeys.value).map((col) => ({
    ...col,
    label: filters.capitalize(col.label),
    // Alignment is display logic common to all numbers — derived from the
    // render kind here, NOT carried per-property in the config.
    isNumeric: NUMERIC_KINDS.has(col.render.kind),
    isBoolean: col.render.kind === 'boolean',
    widthClass: widthClassFor(col.render.kind, col.isIdentityColumn),
  })),
);

// Per-row selection reuses the same `selection` Vuex module as the list view
// (master checkbox + select-all banner live in SelectionToolbar above the table).
function isSelected(id) {
  return store.getters['selection/isSelected'](id);
}
function toggleSelection(id) {
  store.commit('selection/toggleId', id);
}

// The value handed to CellValue for a given column/row. The identity column
// (Title) links to the row's own entity, so it gets the whole row object (the
// entityLink kind reads display_name + id off it). Everything else runs the
// property's extractFn. extractFn is wrapped so a malformed row degrades to an
// empty cell rather than throwing mid-render.
function getCellValue(col, result) {
  if (col?.isIdentityColumn) return result;
  const extractFn = col?.extractFn;
  if (typeof extractFn !== 'function') return null;
  try {
    return extractFn(result);
  } catch (e) {
    // Never throw mid-render — a malformed row degrades to an empty cell.
    console.warn(`ResultsTable: extractFn threw for column "${col.key}"`, e);
    return null;
  }
}
</script>

<style scoped>
.results-table-scroll {
  width: 100%;
  overflow-x: auto;
}
.results-table {
  width: 100%;
  font-size: 0.875rem;
}
.results-table-header {
  text-align: left;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

/* The entire header is the menu trigger (ColumnHeaderMenu's activator slot holds
   the label + sort indicator). Numeric/boolean headers keep their justification
   so the clickable trigger fills the cell. */
.results-table-header :deep(.column-header-trigger) {
  width: 100%;
}
.numeric-cell :deep(.column-header-trigger) {
  justify-content: flex-end;
}
.bool-cell :deep(.column-header-trigger) {
  justify-content: center;
}
.column-header-sort-indicator {
  color: rgba(0, 0, 0, 0.5);
}
/* The caret is subtle until the header is hovered or its menu is open, keeping
   the header clean while still hinting at the dropdown. */
.results-table-header :deep(.column-header-caret) {
  opacity: 0;
  transition: opacity 0.1s ease;
}
.results-table-header:hover :deep(.column-header-caret),
.results-table-header :deep(.column-header-trigger[aria-expanded="true"]) .column-header-caret {
  opacity: 1;
}
.results-table :deep(td) {
  vertical-align: top;
  padding: 10px;
}
/* Horizontal row dividers only — no vertical borders (border-collapse is set
   globally on .serp-results-table). */
.results-table :deep(tbody td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
/* Rows aren't clickable as a whole (only the title link navigates), so don't
   show the global pointer cursor; keep the subtle hover highlight. */
.results-table :deep(tbody tr) {
  cursor: default;
}

/* Column widths: auto table-layout + light per-kind hints (see widthClassFor).
   Title claims leftover space; lists are capped; scalar columns shrink. */
.col-title { min-width: 320px; }
.col-list { max-width: 220px; }
.col-text { max-width: 320px; }
.col-narrow {
  width: 1%;
  white-space: nowrap;
}

/* Numeric columns: right-aligned + monospaced tabular figures so digits line
   up for easy column-to-column comparison. Display logic, kept out of config. */
.numeric-cell {
  text-align: right;
}
.results-table :deep(td.numeric-cell) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Boolean columns: check (true) / ✗ (false) icon centered horizontally +
   vertically. No cell tint. */
.results-table :deep(.bool-cell) {
  text-align: center;
  vertical-align: middle;
}

/* Header drag-to-reorder affordances: the dragged header dims; the header
   under the cursor gets an insertion tint (same visual language as the
   column-editor chips). */
.results-table-header.dragging {
  opacity: 0.4;
}
.results-table-header.drag-over {
  background: rgba(25, 118, 210, 0.08);
}

/* Far-left selection checkbox column — narrow, top-aligned to match list view.
   The master "select all" checkbox sits in the header row above. */
.results-table :deep(.checkbox-cell) {
  width: 1%;
  white-space: nowrap;
  padding: 4px 0 4px 8px;
  vertical-align: top;
}
.results-table :deep(.checkbox-cell .v-selection-control) {
  min-height: auto;
}

/* Trailing "add column" affordance — narrow, right-edge of the header strip. */
.results-table :deep(.add-column-cell) {
  width: 1%;
  white-space: nowrap;
  padding: 2px 4px;
  text-align: right;
}
</style>
