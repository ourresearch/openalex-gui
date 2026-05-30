<template>
  <div class="results-table-scroll">
    <table class="serp-results-table results-table" :class="{ 'has-pinned': pinnedKey }">
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
              { 'numeric-cell': col.isNumeric, 'bool-cell': col.isBoolean, 'pinned-col': col.key === pinnedKey },
            ]"
          >
            <div class="column-header-inner">
              <span class="column-header-label">{{ col.label }}</span>
              <v-icon
                v-if="sortField === col.baseKey"
                size="14"
                class="column-header-sort-indicator"
              >{{ sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
              <column-header-menu
                :column="col"
                :index="i"
                :total="columns.length"
                :sort-field="sortField"
                :sort-direction="sortDirection"
                :pinned="col.key === pinnedKey"
                @sort="(dir) => onSort(col, dir)"
                @filter="onFilter(col)"
                @move="(dir) => onMove(col, dir)"
                @pin="onPin(col)"
                @remove="onRemove(col)"
              />
            </div>
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
              { 'numeric-cell': col.isNumeric, 'bool-cell': col.isBoolean, 'pinned-col': col.key === pinnedKey },
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

// The ordered column keys come from the URL (`?column=…`), falling back to
// localStorage then per-entity defaults — resolved in useColumnsState. The
// mutations (move/remove) write the URL + mirror localStorage.
const { columnKeys, moveColumn, removeColumn } = useColumnsState(toRef(props, 'entityType'));

// Active sort state, reflected on the headers (check next to the active
// direction + a small arrow indicator beside the label).
const sortField = computed(() => url.getSortField(route));
const sortDirection = computed(() => url.getSortDirection(route));

// Pinned column (leftmost-sticky). MVP is a single pin held in component state
// (multi-pin + persistence are deferred — see PLAN Phase 5).
const pinnedKey = ref(null);

function onSort(col, dir) {
  url.setSortDirection(col.baseKey, dir);
}
function onFilter(col) {
  emit('filter-column', col.baseKey);
}
function onMove(col, dir) {
  moveColumn(col.key, dir);
}
function onPin(col) {
  pinnedKey.value = pinnedKey.value === col.key ? null : col.key;
}
function onRemove(col) {
  if (col.isColumnMandatory) return; // keep ≥1 identity column
  if (pinnedKey.value === col.key) pinnedKey.value = null;
  removeColumn(col.key);
}

// Render kinds that are right-aligned + monospaced for easy column comparison.
const NUMERIC_KINDS = new Set(['number', 'currency']);

// Width behaviour by render kind. We keep the browser's auto table-layout and
// only nudge it: narrow scalar columns shrink to their content, list columns
// are capped so long author runs don't dominate, and the identity (title)
// column claims the leftover space. No hard pixel widths.
const NARROW_KINDS = new Set(['number', 'currency', 'year', 'boolean']);
const LIST_KINDS = new Set(['entityList', 'stringList']);
function widthClassFor(kind, isMandatory) {
  if (isMandatory) return 'col-title';
  if (NARROW_KINDS.has(kind)) return 'col-narrow';
  if (LIST_KINDS.has(kind)) return 'col-list';
  return 'col-text';
}

const results = computed(() => props.resultsObject?.results ?? []);

// Resolve the ordered keys to renderable column descriptors. resolveColumns
// drops unknown/ineligible/malformed keys (with a console.warn) and never
// throws, so a bad URL `column=` value degrades gracefully instead of blanking
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
    widthClass: widthClassFor(col.render.kind, col.isColumnMandatory),
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

// The value handed to CellValue for a given column/row. The mandatory identity
// column links to the row's own entity, so it gets the whole row object (the
// entityLink kind reads display_name + id off it). Everything else runs the
// property's extractFn. extractFn is wrapped so a malformed row degrades to an
// empty cell rather than throwing mid-render.
function getCellValue(col, result) {
  if (col?.isColumnMandatory) return result;
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

/* Header label + sort indicator + caret menu sit on one line. The caret is
   subtle until the header (or the menu) is hovered/active, keeping the header
   clean while still discoverable. */
.column-header-inner {
  display: flex;
  align-items: center;
  gap: 2px;
}
.numeric-cell .column-header-inner {
  justify-content: flex-end;
}
.bool-cell .column-header-inner {
  justify-content: center;
}
.column-header-sort-indicator {
  color: rgba(0, 0, 0, 0.5);
}
.results-table-header :deep(.column-header-caret) {
  opacity: 0;
  transition: opacity 0.1s ease;
}
.results-table-header:hover :deep(.column-header-caret),
.results-table-header :deep(.column-header-caret[aria-expanded="true"]) {
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

/* Pinned column (leftmost-sticky). MVP single-pin: the pinned column sticks at
   the left edge, just right of the (also-sticky) checkbox column, and stays
   visible while the rest of the table scrolls horizontally. A subtle right
   shadow separates it from the scrolling content. */
.results-table.has-pinned :deep(.checkbox-cell) {
  position: sticky;
  left: 0;
  background: #fff;
}
.results-table.has-pinned :deep(th.checkbox-cell) {
  z-index: 3;
}
.results-table.has-pinned :deep(td.checkbox-cell) {
  z-index: 2;
}
.results-table :deep(.pinned-col) {
  position: sticky;
  /* Offset by the checkbox column's effective width so the two sticky columns
     don't overlap on scroll. */
  left: 44px;
  background: #fff;
  box-shadow: 6px 0 6px -4px rgba(0, 0, 0, 0.12);
}
.results-table :deep(th.pinned-col) {
  z-index: 3;
}
.results-table :deep(td.pinned-col) {
  z-index: 2;
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
