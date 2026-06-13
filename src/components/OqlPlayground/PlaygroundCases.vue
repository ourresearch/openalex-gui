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
          v-model="selectedTags"
          :items="tagOptions"
          :menu-props="{ class: 'playground-filter-menu' }"
          label="Tags"
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
      <!-- Status: the whole possibility landscape — has-oxurl / oql-only / server gap / rejected / out of scope / translator gap -->
      <template #item.state="{ item }">
        <v-tooltip :text="stateTip(item)" location="top" max-width="320">
          <template #activator="{ props }">
            <a
              v-if="item.state === 'has-oxurl'"
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

      <template #item.tags="{ item }">
        <span class="tags-cell">
          <span v-for="t in item.tags" :key="t" class="tag-chip">{{ t }}</span>
        </span>
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

// The whole possibility landscape carved into six non-overlapping sectors. For
// ok/hint rows it is the corpus's authored `oxurl_status` (#384); error and
// out-of-scope rows are keyed off `status`:
//   has-oxurl          — valid OQL that maps to a classic URL (click → SERP)
//   oql-only           — valid query the server runs, but OXURL can't express it
//                        (an OQL expressiveness WIN over the classic URL syntax)
//   server-unsupported — valid OQO the live API can't execute yet (#297)
//   translator-bug     — should render to a URL per spec but the translator can't (bug)
//   rejected           — invalid OQL the parser correctly refuses (working as intended)
//   out-of-scope       — intentionally not supported by OQL/OQO; a deliberate boundary
// Only `translator-bug` is a real defect (red). `oql-only` is a positive
// (deep-purple); the rest are neutral/working-as-intended.
const caseState = (r) =>
  r.status === "error"
    ? "rejected"
    : r.status === "out-of-scope"
      ? "out-of-scope"
      : r.oxurl_status;

const stateMeta = {
  "has-oxurl": { label: "ok", color: "green", rank: 0 },
  "oql-only": { label: "OQL-only", color: "deep-purple", rank: 1 },
  "server-unsupported": { label: "server gap", color: "blue-grey-darken-1", rank: 2 },
  "rejected": { label: "rejected", color: "amber-darken-2", rank: 3 },
  "out-of-scope": { label: "out of scope", color: "blue-grey-lighten-1", rank: 4 },
  "translator-bug": { label: "translator gap", color: "red-darken-1", rank: 5 },
};

const stateTip = (r) => ({
  "has-oxurl": "Valid & maps to a classic URL — click to open the production SERP.",
  "oql-only":
    "An OQL expressiveness win: the server runs it, but no classic URL can — | ORs only " +
    "within one key, and this ORs across two (bare words → stemmed .search, " +
    "\"quoted phrases\" → no-stem .search.exact).",
  "server-unsupported":
    "Valid OQO, but the live API can't execute it yet (e.g. multi-dim group_by → #297). " +
    "The URL renders; the server won't run it.",
  "translator-bug":
    "Should render to a classic URL per spec, but the translator can't yet — a bug to fix.",
  "rejected": r.diagnostic
    ? `Invalid OQL, correctly rejected (working as intended): ${r.diagnostic}`
    : "Invalid OQL the parser correctly rejects — working as intended.",
  "out-of-scope":
    "Intentionally out of scope for OQL/OQO — a deliberate boundary, not a gap to fix.",
}[r.state]);

// tags, provenance, oxurl_status + oxurl are explicit data from the
// corpus (#345, #384, #432); complexity + state are derived here.
const rows = oqlCorpus.map((r) => ({
  ...r,
  complexity: oqoLeafCount(r.oqo),
  state: caseState(r),
}));

// --- Columns -------------------------------------------------------------
const ALL_COLUMNS = [
  { key: "id", title: "ID", width: "72" },
  { key: "state", title: "Status", width: "132", value: (r) => stateMeta[r.state].rank },
  { key: "tags", title: "Tags", width: "200", value: (r) => r.tags.join(" ") },
  { key: "provenance", title: "Provenance", width: "150", value: (r) => r.provenance.type },
  { key: "oql", title: "OQL" },
  { key: "complexity", title: "Complexity", width: "104", align: "end" },
  { key: "note", title: "Note", sortable: false },
];
const DEFAULT_VISIBLE = ["id", "state", "tags", "provenance", "oql", "complexity"];
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
// Tag descriptions (#432). Tags are multi-valued + free-form — a case carries
// every DSL feature it exercises. Any tag without an entry here still filters;
// it just shows no subtitle. Keep in rough sync with KNOWN_TAGS in
// openalex-elastic-api/tests/oql/test_corpus_roundtrip.py.
const tagMeta = {
  "negation": "NOT / exclusion — the NOT keyword, predicate negation, or a negated leaf.",
  "boolean-logic": "AND / OR combinations of clauses.",
  "boolean-nesting": "Nested boolean groups — parenthesized AND/OR trees.",
  "phrase-exact": "Exact-phrase / quoted matching (.exact, \"…\").",
  "proximity": "Phrase-proximity matching (NEAR / within-N).",
  "wildcard": "Truncation / wildcard matching (foo*).",
  "search-semantics": "Free-text, stemming, and semantic search behavior.",
  "entity-references": "Filtering by a specific entity (author, institution, source…).",
  "group-by": "Faceted aggregation (group_by).",
  "sort": "Result ordering (sort by).",
  "sample": "Random sampling.",
  "filter": "Basic field filters, ranges, and predicates.",
  "sr-transcription": "Verbatim librarian / systematic-review boolean strategy.",
};
const provenanceMeta = {
  "spec design": "Authored for the OQL spec spine.",
  "analytics question": "From an OpenAlex analytics question (OAQ#/AKQ#).",
  "librarian guide": "From a librarian or vendor search guide.",
  "vendor docs": "From a competing DSL's docs (Scopus, WoS, Dimensions).",
  "zendesk ticket": "From a real user support ticket.",
  "systematic review": "A real search strategy mined from a published systematic review.",
};
const tagOptions = [...new Set(rows.flatMap((r) => r.tags))]
  .sort()
  .map((t) => ({ value: t, title: t, props: { subtitle: tagMeta[t] } }));
const provenanceOptions = [...new Set(rows.map((r) => r.provenance.type))]
  .sort()
  .map((p) => ({ value: p, title: p, props: { subtitle: provenanceMeta[p] } }));
const stateOptions = [
  { value: "has-oxurl", title: "ok", props: { subtitle: "Valid OQL that maps to a classic URL — opens the SERP." } },
  { value: "oql-only", title: "OQL-only", props: { subtitle: "The server runs it, but OXURL can't express it — an OQL expressiveness win." } },
  { value: "server-unsupported", title: "server gap", props: { subtitle: "Valid OQO the live API can't execute yet (e.g. multi-dim group_by, #297)." } },
  { value: "rejected", title: "rejected", props: { subtitle: "Invalid OQL the parser correctly refuses — working as intended." } },
  { value: "out-of-scope", title: "out of scope", props: { subtitle: "Intentionally not supported by OQL/OQO — a deliberate boundary, not a gap." } },
  { value: "translator-bug", title: "translator gap", props: { subtitle: "Should render to a URL but the translator can't yet — a bug to fix." } },
];

const complexityValues = rows.map((r) => r.complexity).filter((c) => c !== null);
const complexityBounds = [Math.min(...complexityValues), Math.max(...complexityValues)];

const search = ref("");
const selectedStates = ref([]);
const selectedTags = ref([]);
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
    // OR semantics across selected tags: a case matches if it carries ANY of them.
    if (selectedTags.value.length && !selectedTags.value.some((t) => r.tags.includes(t))) return false;
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
.tags-cell {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-chip {
  font-size: 0.72rem;
  line-height: 1.4;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.74);
  white-space: nowrap;
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
