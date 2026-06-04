<template>
  <div class="playground-cases">
    <div class="cases-intro">
      <h2 class="text-h5">Cases</h2>
      <p class="text-body-2 text-medium-emphasis">
        The OQL v2 normative corpus &mdash; one row per worked example, straight from
        <code>openalex-elastic-api/docs/oql/corpus.yaml</code> (#330). Filter by category,
        length, or complexity; expand a row to see its OQO and notes.
      </p>
    </div>

    <!-- Filters -->
    <v-card flat border rounded class="cases-filters pa-3 mb-4">
      <div class="filter-grid">
        <v-text-field
          v-model="search"
          label="Search OQL / id / note"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
        />
        <v-select
          v-model="selectedGroups"
          :items="groupOptions"
          label="Category"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
        <v-select
          v-model="selectedStatuses"
          :items="statusOptions"
          label="Status"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
      </div>

      <div class="range-grid mt-3">
        <div class="range-block">
          <div class="range-label">
            Complexity (OQO leaves): {{ complexityRange[0] }}&ndash;{{ complexityRange[1] }}
          </div>
          <v-range-slider
            v-model="complexityRange"
            :min="complexityBounds[0]"
            :max="complexityBounds[1]"
            :step="1"
            density="compact"
            hide-details
            thumb-label
          />
          <v-checkbox
            v-model="includeNoComplexity"
            label="Include cases with no OQO (errors / boundary)"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </v-card>

    <div class="text-caption text-medium-emphasis mb-2">
      Showing {{ filteredRows.length }} of {{ rows.length }} cases
    </div>

    <!-- Table -->
    <v-data-table
      :headers="headers"
      :items="filteredRows"
      :sort-by="[{ key: 'id', order: 'asc' }]"
      density="compact"
      items-per-page="50"
      :items-per-page-options="[25, 50, 100, -1]"
      show-expand
      v-model:expanded="expanded"
      item-value="id"
      class="cases-table"
    >
      <template #item.status="{ value }">
        <v-chip :color="statusColor(value)" size="x-small" label variant="flat">
          {{ value }}
        </v-chip>
      </template>
      <template #item.oql="{ value }">
        <code class="oql-cell">{{ value }}</code>
      </template>
      <template #item.complexity="{ value }">
        <span>{{ value === null ? "—" : value }}</span>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr class="expanded-detail">
          <td :colspan="columns.length">
            <div class="detail-grid">
              <div v-if="item.oqo">
                <div class="detail-label">OQO</div>
                <pre class="detail-pre">{{ pretty(item.oqo) }}</pre>
              </div>
              <div v-if="item.diagnostic">
                <div class="detail-label">Diagnostic</div>
                <code>{{ item.diagnostic }}</code>
              </div>
              <div v-if="item.note">
                <div class="detail-label">Note</div>
                <p class="text-body-2">{{ item.note }}</p>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { oqlCorpus } from "@/oqlCorpus";
import { oqoLeafCount } from "@/oqlCorpusMetrics";

defineOptions({ name: "PlaygroundCases" });

// Enrich each corpus row with computed metrics once.
const rows = oqlCorpus.map((r) => ({
  ...r,
  complexity: oqoLeafCount(r.oqo),
}));

const headers = [
  { title: "ID", key: "id", width: "90" },
  { title: "Category", key: "group", width: "140" },
  { title: "Status", key: "status", width: "90" },
  { title: "OQL", key: "oql" },
  { title: "Complexity", key: "complexity", width: "120", align: "end" },
];

const groupOptions = [...new Set(rows.map((r) => r.group).filter(Boolean))].sort();
const statusOptions = [...new Set(rows.map((r) => r.status))].sort();

const complexityValues = rows.map((r) => r.complexity).filter((c) => c !== null);
const complexityBounds = [Math.min(...complexityValues), Math.max(...complexityValues)];

const search = ref("");
const selectedGroups = ref([]);
const selectedStatuses = ref([]);
const complexityRange = ref([...complexityBounds]);
const includeNoComplexity = ref(true);
const expanded = ref([]);

const filteredRows = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.id} ${r.oql} ${r.note}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (selectedGroups.value.length && !selectedGroups.value.includes(r.group)) return false;
    if (selectedStatuses.value.length && !selectedStatuses.value.includes(r.status)) return false;
    if (r.complexity === null) {
      if (!includeNoComplexity.value) return false;
    } else if (
      r.complexity < complexityRange.value[0] ||
      r.complexity > complexityRange.value[1]
    ) {
      return false;
    }
    return true;
  });
});

const statusColor = (status) =>
  ({ ok: "green", error: "red", hint: "amber", boundary: "blue-grey" }[status] || "grey");

const pretty = (obj) => JSON.stringify(obj, null, 2);
</script>

<style scoped>
.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr;
  gap: 12px;
}
.range-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 520px;
}
.range-label {
  font-size: 0.8rem;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.6);
}
.oql-cell {
  font-family: "Roboto Mono", monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.expanded-detail td {
  background: rgba(0, 0, 0, 0.02);
  padding: 12px 16px !important;
}
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}
.detail-pre {
  font-family: "Roboto Mono", monospace;
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.04);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre;
}
@media (max-width: 960px) {
  .filter-grid,
  .range-grid {
    grid-template-columns: 1fr;
  }
}
</style>
