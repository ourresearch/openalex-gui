<template>
  <div class="playground-cases">
    <div class="cases-intro">
      <h2 class="text-h5">Cases</h2>
      <p class="text-body-2 text-medium-emphasis">
        The OQL v2 normative corpus &mdash; one row per worked example. Click a row for its case page.
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
          v-model="selectedCategories"
          :items="categoryOptions"
          :menu-props="{ class: 'playground-filter-menu' }"
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
          :menu-props="{ class: 'playground-filter-menu' }"
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
          v-model="selectedStates"
          :items="stateOptions"
          :menu-props="{ class: 'playground-filter-menu' }"
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
      item-value="id"
      class="cases-table"
      :row-props="rowProps"
      @click:row="onRowClick"
    >
      <!-- Status: the whole possibility landscape — ok / rejected / out of scope / translator gap / spec gap -->
      <template #item.state="{ item }">
        <v-tooltip :text="stateTip(item)" location="top" max-width="320">
          <template #activator="{ props }">
            <a
              v-if="item.state === 'ok'"
              v-bind="props"
              :href="item.oxurl"
              target="_blank"
              rel="noopener"
              class="state-link"
            >
              <v-chip
                :color="stateMeta.ok.color"
                size="x-small"
                label
                variant="flat"
                append-icon="mdi-open-in-new"
              >ok</v-chip>
            </a>
            <v-chip
              v-else
              v-bind="props"
              :color="stateMeta[item.state].color"
              size="x-small"
              label
              variant="flat"
            >{{ stateMeta[item.state].label }}</v-chip>
          </template>
        </v-tooltip>
      </template>

      <template #item.provenance="{ item }">
        <span class="prov-type-text">{{ item.provenance.type }}</span>
      </template>

      <template #item.oql="{ value }">
        <code class="oql-cell">{{ value }}</code>
      </template>

      <template #item.complexity="{ value }">
        <span>{{ value === null ? "—" : value }}</span>
      </template>

      <template #item.note="{ value }">
        <span class="text-body-2">{{ value }}</span>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { oqlCorpus } from "@/oqlCorpus";
import { oqoLeafCount } from "@/oqlCorpusMetrics";

const router = useRouter();

defineOptions({ name: "PlaygroundCases" });

// The whole possibility landscape carved into five non-overlapping sectors,
// derived from the corpus fields (status + oxurl_representable + oxurl):
//   ok            — valid OQL that maps to a classic URL (click → SERP)
//   rejected      — invalid OQL the parser correctly refuses (working as intended)
//   out-of-scope  — intentionally not supported by OQL/OQO; never expected to render
//   translator-gap— should render to a URL but query_translation can't yet (bug)
//   spec-gap      — not expressible in OQL/OQO at all yet (OQLO spec/grammar gap)
// The two gaps are real failures (red); "rejected" + "out-of-scope" are
// working-as-intended (amber / neutral) — there is nothing to fix.
const caseState = (r) =>
  r.status === "error"
    ? "rejected"
    : r.status === "out-of-scope"
      ? "out-of-scope"
      : r.oxurl
        ? "ok"
        : r.oxurl_representable
          ? "translator-gap"
          : "spec-gap";

const stateMeta = {
  "ok": { label: "ok", color: "green", rank: 0 },
  "rejected": { label: "rejected", color: "amber-darken-2", rank: 1 },
  "out-of-scope": { label: "out of scope", color: "blue-grey-lighten-1", rank: 2 },
  "translator-gap": { label: "translator gap", color: "red-darken-1", rank: 3 },
  "spec-gap": { label: "spec gap", color: "red-darken-1", rank: 4 },
};

const stateTip = (r) => {
  if (r.state === "ok") return "Valid & maps to a classic URL — click to open the production SERP.";
  if (r.state === "rejected") {
    return r.diagnostic
      ? `Invalid OQL, correctly rejected (working as intended): ${r.diagnostic}`
      : "Invalid OQL the parser correctly rejects — working as intended.";
  }
  if (r.state === "out-of-scope")
    return "Intentionally out of scope for OQL/OQO — a deliberate boundary, not a gap to fix.";
  if (r.state === "translator-gap")
    return "Should render to a classic URL but query_translation can't yet — a translator bug to fix.";
  return "Not expressible in OQL/OQO yet — needs an OQLO spec/grammar addition.";
};

// category, provenance, oxurl_representable + oxurl are explicit data from the
// corpus (#345); complexity + state are derived here.
const rows = oqlCorpus.map((r) => ({
  ...r,
  complexity: oqoLeafCount(r.oqo),
  state: caseState(r),
}));

// --- Columns -------------------------------------------------------------
const ALL_COLUMNS = [
  { key: "id", title: "ID", width: "72" },
  { key: "state", title: "Status", width: "132", value: (r) => stateMeta[r.state].rank },
  { key: "category", title: "Category", width: "150" },
  { key: "provenance", title: "Provenance", width: "150", value: (r) => r.provenance.type },
  { key: "oql", title: "OQL" },
  { key: "complexity", title: "Complexity", width: "104", align: "end" },
  { key: "note", title: "Note", sortable: false },
];
const DEFAULT_VISIBLE = ["id", "state", "category", "provenance", "oql", "complexity"];
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
// Each dropdown option carries a `subtitle` (via Vuetify's per-item `props`)
// explaining what it means — that's where the old intro-paragraph legend lives now.
const categoryMeta = {
  "entity references": "Filtering by a specific entity (author, institution, source…).",
  "boolean logic": "AND / OR / NOT combinations of clauses.",
  "search semantics": "Free-text, exact-phrase, and semantic search behavior.",
  "proximity & wildcards": "Phrase-proximity and wildcard matching.",
  "filter, sort & sample": "Filters, result ordering, and random sampling.",
  "group by": "Faceted aggregation (group_by).",
  "librarian & SR queries": "Real systematic-review / librarian queries.",
};
const provenanceMeta = {
  "spec design": "Authored for the OQL spec spine.",
  "analytics question": "From an OpenAlex analytics question (OAQ#/AKQ#).",
  "librarian guide": "From a librarian or vendor search guide.",
  "vendor docs": "From a competing DSL's docs (Scopus, WoS, Dimensions).",
  "zendesk ticket": "From a real user support ticket.",
};
const categoryOptions = [...new Set(rows.map((r) => r.category))]
  .sort()
  .map((c) => ({ value: c, title: c, props: { subtitle: categoryMeta[c] } }));
const provenanceOptions = [...new Set(rows.map((r) => r.provenance.type))]
  .sort()
  .map((p) => ({ value: p, title: p, props: { subtitle: provenanceMeta[p] } }));
const stateOptions = [
  { value: "ok", title: "ok", props: { subtitle: "Valid OQL that maps to a classic URL — opens the SERP." } },
  { value: "rejected", title: "rejected", props: { subtitle: "Invalid OQL the parser correctly refuses — working as intended." } },
  { value: "out-of-scope", title: "out of scope", props: { subtitle: "Intentionally not supported by OQL/OQO — a deliberate boundary, not a gap." } },
  { value: "translator-gap", title: "translator gap", props: { subtitle: "Should render to a URL but the translator can't yet — a bug to fix." } },
  { value: "spec-gap", title: "spec gap", props: { subtitle: "Not expressible in OQL/OQO yet — needs a spec addition." } },
];

const complexityValues = rows.map((r) => r.complexity).filter((c) => c !== null);
const complexityBounds = [Math.min(...complexityValues), Math.max(...complexityValues)];

const search = ref("");
const selectedStates = ref([]);
const selectedCategories = ref([]);
const selectedProvenance = ref([]);
const complexityRange = ref([...complexityBounds]);

const filteredRows = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.id} ${r.oql} ${r.note}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (selectedStates.value.length && !selectedStates.value.includes(r.state)) return false;
    if (selectedCategories.value.length && !selectedCategories.value.includes(r.category)) return false;
    if (selectedProvenance.value.length && !selectedProvenance.value.includes(r.provenance.type)) return false;
    // Rejected / gap rows have no OQO, hence no complexity; let Status own them
    // and always pass them through the complexity range.
    if (
      r.complexity !== null &&
      (r.complexity < complexityRange.value[0] || r.complexity > complexityRange.value[1])
    ) {
      return false;
    }
    return true;
  });
});

// --- Row click → the case's detail page ---------------------------------
const rowProps = () => ({ class: "row-clickable" });
const onRowClick = (event, { item }) => {
  // Don't hijack clicks on an inner link (e.g. the green "ok" chip → SERP).
  if (event?.target?.closest?.("button, a")) return;
  router.push({ name: "QueryOqlCase", params: { id: item.id } });
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
.state-link {
  display: inline-flex;
  text-decoration: none;
}
.prov-type-text {
  font-size: 0.82rem;
  color: rgba(0, 0, 0, 0.72);
}
:deep(.row-clickable) {
  cursor: pointer;
}
:deep(.row-clickable:hover) {
  background: rgba(0, 0, 0, 0.03);
}
@media (max-width: 960px) {
  .filter-grid,
  .range-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Not scoped: the v-select menu is teleported outside this component's DOM. -->
<style>
.playground-filter-menu {
  min-width: 300px !important;
}
.playground-filter-menu .v-list-item-subtitle {
  white-space: normal;
  -webkit-line-clamp: unset;
  opacity: 0.7;
  margin-top: 1px;
}
</style>
