<template>
  <div class="playground-cases">
    <div class="cases-intro">
      <h2 class="text-h5">Cases</h2>
      <p class="text-body-2 text-medium-emphasis">
        The OQL v2 normative corpus &mdash; one row per worked example, straight from
        <code>openalex-elastic-api/docs/oql/corpus.yaml</code> (#330). The
        <strong>oxurl</strong> column shows whether a case maps to a classic
        OpenAlex URL; the rows with <em>no</em> oxurl are exactly where OQO buys new
        search functionality. Click a row to open its search in the production SERP.
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
          v-model="selectedOxurl"
          :items="oxurlOptions"
          label="oxurl"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
        <v-select
          v-model="selectedCategories"
          :items="categoryOptions"
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
          v-model="selectedProvenance"
          :items="provenanceOptions"
          label="Provenance"
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
        </div>
      </div>
    </v-card>

    <div class="d-flex align-center mb-2">
      <div class="text-caption text-medium-emphasis">
        Showing {{ filteredRows.length }} of {{ rows.length }} cases
      </div>
      <v-spacer />

      <!-- Column picker -->
      <v-menu :close-on-content-click="false" location="bottom end">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            size="small"
            variant="text"
            prepend-icon="mdi-view-column-outline"
          >
            Columns
          </v-btn>
        </template>
        <v-card min-width="220">
          <v-list density="compact" class="py-1">
            <v-list-subheader>Show columns</v-list-subheader>
            <v-list-item
              v-for="col in pickableColumns"
              :key="col.key"
              @click="toggleColumn(col.key)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="visibleColumns.includes(col.key)"
                  density="compact"
                  @click.stop="toggleColumn(col.key)"
                />
              </template>
              <v-list-item-title>{{ col.title }}</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item @click="resetColumns">
              <template #prepend>
                <v-icon size="18" class="ml-1 mr-3">mdi-restore</v-icon>
              </template>
              <v-list-item-title>Reset to default</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
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
      :row-props="rowProps"
      @click:row="onRowClick"
    >
      <!-- oxurl: link / translator-gap / not-representable -->
      <template #item.oxurl="{ item }">
        <a
          v-if="item.oxurl"
          :href="item.oxurl"
          target="_blank"
          rel="noopener"
          class="oxurl-icon"
          title="Open this search in the production SERP"
          @click.stop
        >
          <v-icon size="18" color="green-darken-1">mdi-open-in-new</v-icon>
        </a>
        <v-tooltip
          v-else-if="item.oxurl_representable"
          text="Representable per the spec, but the translator can't render it yet — a translator gap to fix."
          location="top"
        >
          <template #activator="{ props }">
            <v-icon v-bind="props" size="18" color="amber-darken-2">mdi-alert</v-icon>
          </template>
        </v-tooltip>
        <v-tooltip
          v-else
          text="No classic OpenAlex URL — this is a query OQO can express but the URL syntax can't."
          location="top"
        >
          <template #activator="{ props }">
            <v-icon v-bind="props" size="18" color="grey">mdi-close-circle-outline</v-icon>
          </template>
        </v-tooltip>
      </template>

      <template #item.status="{ value }">
        <v-chip :color="statusColor(value)" size="x-small" label variant="flat">
          {{ value }}
        </v-chip>
      </template>

      <template #item.provenance="{ item }">
        <div class="prov-cell">
          <v-chip size="x-small" label variant="tonal" class="prov-type">
            {{ item.provenance.type }}
          </v-chip>
          <a
            v-if="item.provenance.url"
            :href="item.provenance.url"
            target="_blank"
            rel="noopener"
            class="prov-label prov-label--link"
            :title="item.provenance.url"
            @click.stop
          >{{ item.provenance.label }}<v-icon size="11">mdi-open-in-new</v-icon></a>
          <span v-else class="prov-label">{{ item.provenance.label }}</span>
        </div>
      </template>

      <template #item.oql="{ value }">
        <code class="oql-cell">{{ value }}</code>
      </template>

      <template #item.complexity="{ value }">
        <span>{{ value === null ? "—" : value }}</span>
      </template>

      <template #item.oxurlRaw="{ item }">
        <code v-if="item.oxurl" class="oxurl-raw">{{ prettyUrl(item.oxurl) }}</code>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.note="{ value }">
        <span class="text-body-2">{{ value }}</span>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr class="expanded-detail">
          <td :colspan="columns.length">
            <div class="detail-grid">
              <div v-if="item.oxurl">
                <div class="detail-label">oxurl (production SERP)</div>
                <a :href="item.oxurl" target="_blank" rel="noopener" class="detail-link">
                  {{ item.oxurl }}
                </a>
              </div>
              <div v-else-if="item.oxurl_representable">
                <div class="detail-label">oxurl</div>
                <span class="detail-flag detail-flag--gap">
                  Translator gap — representable per spec, but
                  <code>query_translation</code> can't render it yet.
                </span>
              </div>
              <div v-else>
                <div class="detail-label">oxurl</div>
                <span class="detail-flag detail-flag--none">
                  No classic OpenAlex URL — OQO expresses this, the URL syntax can't.
                </span>
              </div>
              <div v-if="item.oqo">
                <div class="detail-label">OQO (YAML)</div>
                <pre class="detail-pre">{{ toYaml(item.oqo) }}</pre>
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
import { computed, ref, watch } from "vue";
import { stringify as yamlStringify } from "yaml";
import { oqlCorpus } from "@/oqlCorpus";
import { oqoLeafCount } from "@/oqlCorpusMetrics";

defineOptions({ name: "PlaygroundCases" });

// oxurl state: "ok" (rendered URL) > "gap" (representable but translator can't
// render) > "none" (no classic URL — OQO buys new functionality). The numeric
// rank makes the oxurl column sortable.
const oxurlState = (r) =>
  r.oxurl ? "ok" : r.oxurl_representable ? "gap" : "none";
const oxurlRank = { ok: 2, gap: 1, none: 0 };

// category, provenance, oxurl_representable + oxurl are explicit data from the
// corpus (#345); only complexity is computed here.
const rows = oqlCorpus.map((r) => ({
  ...r,
  complexity: oqoLeafCount(r.oqo),
  oxurlRank: oxurlRank[oxurlState(r)],
}));

// --- Columns -------------------------------------------------------------
const ALL_COLUMNS = [
  { key: "id", title: "ID", width: "72" },
  { key: "oxurl", title: "oxurl", width: "78", align: "center", value: (r) => r.oxurlRank },
  { key: "category", title: "Category", width: "150" },
  { key: "provenance", title: "Provenance", width: "210", sortable: false },
  { key: "status", title: "Status", width: "84" },
  { key: "oql", title: "OQL" },
  { key: "complexity", title: "Complexity", width: "104", align: "end" },
  { key: "oxurlRaw", title: "oxurl (URL)", width: "280", sortable: false },
  { key: "note", title: "Note", sortable: false },
];
const DEFAULT_VISIBLE = ["id", "oxurl", "category", "provenance", "status", "oql", "complexity"];
const STORAGE_KEY = "oqlPlayground.cases.columns";

const pickableColumns = ALL_COLUMNS;

const loadColumns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      return saved.filter((k) => ALL_COLUMNS.some((c) => c.key === k));
    }
  } catch (e) { /* ignore bad storage */ }
  return [...DEFAULT_VISIBLE];
};
const visibleColumns = ref(loadColumns());
watch(visibleColumns, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
}, { deep: true });

const toggleColumn = (key) => {
  const i = visibleColumns.value.indexOf(key);
  if (i === -1) visibleColumns.value = [...visibleColumns.value, key];
  else if (visibleColumns.value.length > 1) {
    visibleColumns.value = visibleColumns.value.filter((k) => k !== key);
  }
};
const resetColumns = () => { visibleColumns.value = [...DEFAULT_VISIBLE]; };

// Headers keep the canonical column order, filtered to the visible set.
const headers = computed(() =>
  ALL_COLUMNS.filter((c) => visibleColumns.value.includes(c.key))
);

// --- Filters -------------------------------------------------------------
const categoryOptions = [...new Set(rows.map((r) => r.category))].sort();
const provenanceOptions = [...new Set(rows.map((r) => r.provenance.type))].sort();
const statusOptions = [...new Set(rows.map((r) => r.status))].sort();
const oxurlOptions = [
  { title: "Has oxurl", value: "ok" },
  { title: "Translator gap", value: "gap" },
  { title: "No oxurl (OQO-only)", value: "none" },
];

const complexityValues = rows.map((r) => r.complexity).filter((c) => c !== null);
const complexityBounds = [Math.min(...complexityValues), Math.max(...complexityValues)];

const search = ref("");
const selectedOxurl = ref([]);
const selectedCategories = ref([]);
const selectedProvenance = ref([]);
const selectedStatuses = ref([]);
const complexityRange = ref([...complexityBounds]);
const expanded = ref([]);

const filteredRows = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.id} ${r.oql} ${r.note}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (selectedOxurl.value.length && !selectedOxurl.value.includes(oxurlState(r))) return false;
    if (selectedCategories.value.length && !selectedCategories.value.includes(r.category)) return false;
    if (selectedProvenance.value.length && !selectedProvenance.value.includes(r.provenance.type)) return false;
    if (selectedStatuses.value.length && !selectedStatuses.value.includes(r.status)) return false;
    // Cases with no OQO (errors / boundary) have no complexity; let status own
    // them and always pass them through the complexity range.
    if (
      r.complexity !== null &&
      (r.complexity < complexityRange.value[0] || r.complexity > complexityRange.value[1])
    ) {
      return false;
    }
    return true;
  });
});

// --- Row click → production SERP ----------------------------------------
const rowProps = ({ item }) => ({ class: item.oxurl ? "row-clickable" : "" });
const onRowClick = (event, { item }) => {
  // Don't hijack clicks on the expand chevron or any inner link/button.
  if (event?.target?.closest?.("button, a")) return;
  if (item.oxurl) window.open(item.oxurl, "_blank", "noopener");
};

const statusColor = (status) =>
  ({ ok: "green", error: "red", hint: "amber", boundary: "blue-grey" }[status] || "grey");

// OQO rendered as YAML (the `yaml` lib quotes values as needed — no ambiguity).
const toYaml = (obj) => yamlStringify(obj).trimEnd();
const prettyUrl = (url) => {
  try { return decodeURIComponent(url); } catch (e) { return url; }
};
</script>

<style scoped>
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
.oxurl-icon {
  display: inline-flex;
  text-decoration: none;
}
.prov-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}
.prov-type {
  align-self: flex-start;
}
.prov-label {
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}
.prov-label--link {
  color: #1565c0;
  text-decoration: none;
}
.prov-label--link:hover {
  text-decoration: underline;
}
.oxurl-raw {
  font-family: "Roboto Mono", monospace;
  font-size: 0.72rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: rgba(0, 0, 0, 0.7);
}
:deep(.row-clickable) {
  cursor: pointer;
}
:deep(.row-clickable:hover) {
  background: rgba(0, 0, 0, 0.03);
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
.detail-link {
  font-family: "Roboto Mono", monospace;
  font-size: 0.8rem;
  word-break: break-all;
  color: #1565c0;
}
.detail-flag {
  font-size: 0.82rem;
}
.detail-flag--gap {
  color: #b26a00;
}
.detail-flag--none {
  color: rgba(0, 0, 0, 0.6);
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
