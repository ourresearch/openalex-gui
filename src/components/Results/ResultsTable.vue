<template>
  <div class="results-table-scroll">
    <table class="serp-results-table results-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align }"
            class="results-table-header"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.id">
          <td
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align }"
          >
            <CellValue
              :value="cellValue(col, result)"
              :render="col.render"
              :boolean-values="col.booleanValues"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import filters from '@/filters';
import { getFacetConfig } from '@/facetConfigUtils';
import CellValue from '@/components/Results/Table/CellValue.vue';

defineOptions({ name: 'ResultsTable' });

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
        align: config.column.align ?? 'left',
        isColumnMandatory: !!config.isColumnMandatory,
      };
    })
    .filter(Boolean);
});

// The value handed to CellValue for a given column/row. The mandatory identity
// column links to the row's own entity, so it gets the whole row object (the
// entityLink kind reads display_name + id off it). Everything else runs the
// property's extractFn. extractFn is wrapped so a malformed row degrades to an
// empty cell rather than throwing mid-render.
function cellValue(col, result) {
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
  max-width: 320px;
}
</style>
