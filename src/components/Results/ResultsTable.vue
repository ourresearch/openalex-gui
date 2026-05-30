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
            v-for="col in columns"
            :key="col.key"
            class="results-table-header"
            :class="[col.widthClass, { 'numeric-cell': col.isNumeric, 'bool-cell': col.isBoolean }]"
          >
            {{ col.label }}
          </th>
          <th class="results-table-header add-column-cell">
            <v-btn
              icon
              variant="text"
              size="small"
              title="Add column"
              aria-label="Add column"
              @click="onAddColumn"
            >
              <v-icon color="grey-darken-1">mdi-plus</v-icon>
            </v-btn>
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
            :class="[col.widthClass, { 'numeric-cell': col.isNumeric }, boolTdClass(col, result)]"
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
import { computed } from 'vue';
import { useStore } from 'vuex';
import filters from '@/filters';
import { getFacetConfig } from '@/facetConfigUtils';
import CellValue from '@/components/Results/Table/CellValue.vue';
import { useMasterSelection } from '@/composables/useMasterSelection';

defineOptions({ name: 'ResultsTable' });

const emit = defineEmits(['add-column']);

const store = useStore();
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();

const props = defineProps({
  resultsObject: { type: Object, default: null },
  entityType: { type: String, required: true },
  // Ordered list of column keys to render. Phase 2 ships hardcoded per-entity
  // defaults; Phase 3 wires this to the `column` URL param + localStorage.
  columnKeys: { type: Array, default: null },
});

// Hardcoded Phase-2 defaults. Phase 3 moves these to entityConfigs.defaultColumns
// and drives them from the URL. Unknown entity types fall back to the mandatory
// identity column only.
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

const DEFAULT_COLUMNS = {
  works: [
    'display_name',
    'authorships.author.id',
    'publication_year',
    'cited_by_count',
    'open_access.is_oa',
  ],
};

const results = computed(() => props.resultsObject?.results ?? []);

// Resolve each requested key to a renderable column descriptor. getFacetConfig
// returns null for unknown keys (logs, never throws); we drop those and any
// config lacking a `column` block, so a bad key degrades gracefully instead of
// blanking the table (QA-051 discipline).
const columns = computed(() => {
  const keys = props.columnKeys ?? DEFAULT_COLUMNS[props.entityType] ?? ['display_name'];
  return keys
    .map((key) => {
      const config = getFacetConfig(props.entityType, key);
      if (!config || !config.column?.render) return null;
      return {
        key,
        config,
        label: filters.capitalize(config.column.label ?? config.displayName ?? key),
        render: config.column.render,
        booleanValues: config.booleanValues ?? null,
        // Alignment is display logic common to all numbers — derived from the
        // render kind here, NOT carried per-property in the config.
        isNumeric: NUMERIC_KINDS.has(config.column.render.kind),
        isBoolean: config.column.render.kind === 'boolean',
        isColumnMandatory: !!config.isColumnMandatory,
        widthClass: widthClassFor(config.column.render.kind, !!config.isColumnMandatory),
      };
    })
    .filter(Boolean);
});

// Per-row selection reuses the same `selection` Vuex module as the list view
// (master checkbox + select-all banner live in SelectionToolbar above the table).
function isSelected(id) {
  return store.getters['selection/isSelected'](id);
}
function toggleSelection(id) {
  store.commit('selection/toggleId', id);
}

// The column picker is built in Phase 4; for now this just surfaces the intent.
function onAddColumn() {
  emit('add-column');
}

// Per-cell tint for boolean columns: green = true, red = false, none = null.
// (The check/✗ glyph itself is rendered by CellValue.)
function boolTdClass(col, result) {
  if (!col.isBoolean) return '';
  const v = getCellValue(col, result);
  if (v === null || v === undefined || v === '') return 'bool-cell';
  return v ? 'bool-cell bool-true' : 'bool-cell bool-false';
}

// The value handed to CellValue for a given column/row. The mandatory identity
// column links to the row's own entity, so it gets the whole row object (the
// entityLink kind reads display_name + id off it). Everything else runs the
// property's extractFn. extractFn is wrapped so a malformed row degrades to an
// empty cell rather than throwing mid-render.
function getCellValue(col, result) {
  if (col?.isColumnMandatory) return result;
  const extractFn = col?.config?.extractFn;
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

/* Boolean columns: icon centered horizontally + vertically; the cell is
   color-coded (light green = true, light red = false; no tint when null). */
.results-table :deep(.bool-cell) {
  text-align: center;
  vertical-align: middle;
}
.results-table :deep(td.bool-true) {
  background: rgba(76, 175, 80, 0.16);
}
.results-table :deep(td.bool-false) {
  background: rgba(244, 67, 54, 0.12);
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
