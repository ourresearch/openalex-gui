<template>
  <div class="builder">
    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query out of bricks — no syntax to learn.
      </p>
    </header>

    <!-- where tree — the entity selector is brick line 1 of the no-code canvas -->
    <v-card variant="outlined" class="tree-card">
      <v-progress-linear v-if="propsLoading" indeterminate color="deep-purple" />
      <div class="brow entity-line">
        <span class="c-num">1</span>
        <span class="c-conn">
          <v-chip class="kw-chip" size="small" label variant="flat">Find</v-chip>
        </span>
        <EntitySelectorButton v-model="getRows" />
      </div>
      <BuilderFilterGroup
        :node="root"
        :properties="properties"
        :entity="getRows"
        :start-num="2"
        :depth="0"
        is-root
        @change="onTreeChange"
      />

      <!-- sort — its own numbered brick line; always shown (default surfaces too) -->
      <div class="brow sort-line">
        <span class="c-num">{{ sortLineNum }}</span>
        <span class="c-conn">
          <v-chip class="kw-chip" size="small" label variant="flat">sort</v-chip>
        </span>
        <v-menu location="bottom start" offset="4">
          <template #activator="{ props: mp }">
            <v-chip v-bind="mp" class="sort-chip" :class="{ 'is-default': !explicitSort }" label size="small"
              variant="flat" append-icon="mdi-menu-down">{{ sortFieldLabel }}</v-chip>
          </template>
          <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
            <v-list density="compact" class="py-0">
              <v-list-item :title="`${defaultSortLabel} (default)`" :active="!explicitSort" @click="clearSort" />
              <v-divider />
              <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                :active="explicitSort && sortBy[0].column_id === o.value" @click="pickSort(o.value)" />
            </v-list>
          </v-card>
        </v-menu>
        <v-chip v-if="explicitSort" class="sort-chip" label size="small" variant="flat"
          @click="toggleSortDirection">{{ sortBy[0].direction }}</v-chip>
      </div>
    </v-card>

    <!-- foot: validity + Run (the live OQL text is gone — switch modes to view OQL) -->
    <div class="builder-foot">
      <v-chip
        v-if="validation"
        size="x-small"
        :color="validation.valid ? 'green' : 'red'"
        variant="tonal"
      >{{ statusLabel }}</v-chip>
      <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
      <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
      <span v-if="inlineRun && resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
      <v-spacer />
      <v-btn size="small" color="primary" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { debounce } from "lodash";
import { api } from "@/api";
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import EntitySelectorButton from "@/components/EntitySelectorButton.vue";
import { facetConfigs } from "@/facetConfigs";
import { makeGroup, makeLeaf, buildOqo, rootFromOqo } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "OqlQueryBuilder" });

// Shared builder used by BOTH the /query/oql/builder playground page and the SERP
// "Builder" mode. Behaviour is parameterized via props so the two hosts differ only
// in chrome (header) and what "Run" means:
//   - playground (defaults): shows the header, runs inline via api.executeOql and
//     shows a result count under the OQL box.
//   - SERP: `:show-header="false" :inline-run="false"` → "Run" emits the OQL string
//     so the SERP can write ?oql= and execute through its own submit path.
const props = defineProps({
  // Initial OQL to seed the builder with. When null, falls back to ?oql= in the URL
  // (the playground's existing shared-link behaviour).
  seedOql: { type: String, default: null },
  // Initial entity override (e.g. the SERP's current entity type).
  entity: { type: String, default: null },
  showHeader: { type: Boolean, default: true },
  // true: Run executes here + shows count. false: Run emits "run" with the OQL.
  inlineRun: { type: Boolean, default: true },
  runLabel: { type: String, default: "Run" },
});
const emit = defineEmits(["run", "update:oql"]);

const store = useStore();
const route = useRoute();

const ENTITY_TYPES = [
  "works", "authors", "sources", "institutions",
  "topics", "publishers", "funders", "keywords",
];

const getRows = ref("works");
const root = reactive(makeGroup("and", [makeLeaf()]));
const sortBy = ref([]);
let suppressCommit = false;

const properties = computed(() => store.getters["oqlBuilder/propsFor"](getRows.value) || {});
const propsLoading = computed(() => store.state.oqlBuilder.propertiesLoading);
const validation = computed(() => store.state.oqlBuilder.validation);
const rendering = computed(() => store.state.oqlBuilder.rendering);
const seedError = computed(() => store.state.oqlBuilder.seedError);

const statusLabel = computed(() => {
  const v = validation.value;
  if (!v) return "";
  if (!v.valid) return `${(v.errors || []).length || 1} error${(v.errors || []).length === 1 ? "" : "s"}`;
  // `url_not_representable` just means the query is too expressive for the legacy
  // ?filter= URL (e.g. nested boolean logic) — irrelevant in an OQL-native builder.
  const w = (v.warnings || []).filter((x) => x.type !== "url_not_representable").length;
  return w ? `valid · ${w} warning${w === 1 ? "" : "s"}` : "valid";
});

// Sortable fields come from facetConfigs (same source as the SERP's sort menu —
// `/properties` exposes no `sort` action, so the old registry-driven list was
// always empty). Falls back to the works pair like NoviceSortButton does.
const sortItems = computed(() => {
  let opts = [];
  try {
    opts = facetConfigs(getRows.value)
      .filter((c) => (c.actionsPopular || []).includes("sort") || (c.actions || []).includes("sort"))
      .map((c) => ({ title: c.displayName, value: c.key }));
  } catch { /* entity may have no configs */ }
  if (!opts.length) {
    opts = [
      { title: "citation count", value: "cited_by_count" },
      { title: "publication date", value: "publication_year" },
    ];
  }
  const seen = new Set();
  return opts.filter((o) => !seen.has(o.value) && seen.add(o.value));
});

// ---- sort brick line ---------------------------------------------------------
// Sort lives INSIDE the canvas as its own numbered line, and we always say what
// the sort is even when it's the implicit default. The engine's default for works
// is relevance when the query has a search clause, else most-cited
// (execution.py: _score vs -cited_by_percentile_year.max).
const explicitSort = computed(() => !!(sortBy.value.length && sortBy.value[0].column_id));
const treeHasSearch = (n) => n.type === "group"
  ? n.children.some(treeHasSearch)
  : typeof n.column_id === "string" && n.column_id.includes(".search");
const defaultSortLabel = computed(() => (treeHasSearch(root) ? "relevance" : "most cited"));
const sortFieldLabel = computed(() => {
  if (!explicitSort.value) return defaultSortLabel.value;
  const col = sortBy.value[0].column_id;
  return (sortItems.value.find((o) => o.value === col) || {}).title || col;
});
const sortLineNum = computed(() => 2 + root.children.length + 1); // entity=1, filters, add row
const pickSort = (col) => {
  if (!sortBy.value.length) sortBy.value.push({ column_id: col, direction: "desc" });
  else sortBy.value[0].column_id = col;
  onTreeChange();
};
const clearSort = () => { sortBy.value = []; onTreeChange(); };
const toggleSortDirection = () => {
  sortBy.value[0].direction = sortBy.value[0].direction === "desc" ? "asc" : "desc";
  onTreeChange();
};

// ---- commit (tree -> oqo -> server render) --------------------------------
const commit = () => {
  const oqo = buildOqo({ getRows: getRows.value, root, sortBy: sortBy.value });
  store.dispatch("oqlBuilder/renderOqo", oqo);
};
const debouncedCommit = debounce(commit, 350);

const onTreeChange = () => {
  if (suppressCommit) return;
  debouncedCommit();
};
// deep-watch the whole tree so child mutations (values, operators) commit too
watch(root, () => onTreeChange(), { deep: true });
watch(sortBy, () => onTreeChange(), { deep: true });

// ---- entity change: (re)load properties -----------------------------------
watch(getRows, async () => {
  await store.dispatch("oqlBuilder/loadProperties", getRows.value);
  onTreeChange();
});

// keep hosts (SERP mode switcher) in sync with the rendered OQL
watch(() => store.state.oqlBuilder.oql, (oql) => {
  emit("update:oql", oql || "");
});

// ---- seed from OQO (shared link / Apply) ----------------------------------
const rebuildFromOqo = async (oqo) => {
  suppressCommit = true;
  if (oqo.get_rows && ENTITY_TYPES.includes(oqo.get_rows)) {
    getRows.value = oqo.get_rows;
    await store.dispatch("oqlBuilder/loadProperties", oqo.get_rows);
  }
  const fresh = rootFromOqo(oqo);
  root.join = fresh.join;
  root.children = fresh.children;
  sortBy.value = (oqo.sort_by || []).map((s) => ({
    column_id: s.column_id,
    direction: s.direction || "asc",
  }));
  await nextTick();
  suppressCommit = false;
};

const running = ref(false);
const resultCount = ref(null);
const runQuery = async () => {
  const oql = store.state.oqlBuilder.oql;
  if (!props.inlineRun) {
    emit("run", oql);
    return;
  }
  running.value = true;
  resultCount.value = null;
  try {
    const data = await api.executeOql(oql);
    resultCount.value = data?.meta?.count ?? null;
  } catch (e) {
    store.commit("snackbar", { msg: "Query failed to run", color: "error" });
  } finally {
    running.value = false;
  }
};

// ---- init -----------------------------------------------------------------
onMounted(async () => {
  if (props.entity && ENTITY_TYPES.includes(props.entity)) getRows.value = props.entity;
  await store.dispatch("oqlBuilder/loadProperties", getRows.value);
  const sharedOql = props.seedOql != null ? props.seedOql : route.query.oql;
  if (sharedOql) {
    const oqo = await store.dispatch("oqlBuilder/seedFromOql", String(sharedOql));
    if (oqo) { await rebuildFromOqo(oqo); return; }
  }
  commit();
});

// Let a host (the SERP) push a new query in without a remount.
defineExpose({ rebuildFromOql: async (oql) => {
  const oqo = await store.dispatch("oqlBuilder/seedFromOql", String(oql));
  if (oqo) await rebuildFromOqo(oqo);
} });
</script>

<style scoped>
/* Brick grid (oxjob #428; "bricks" per Jason iter 12 — Lego/Scratch inspo: the
   query is bricks you clip together). One set of column widths + role colours,
   set here and inherited by every builder row/group/value via CSS vars:
     number col | connector col (Find / where / and·or) | property | relation | value
   Every word lives in a brick. Colours by semantic role — keywords (Find/where/
   sort) = solid gray STATIC bricks (you can't do anything with them, unlike the
   rest), conjunctions (and/or) = amber, property = violet, relation = sky,
   value = teal. */
.builder {
  max-width: 900px;
  --gx: 8px;
  --num-w: 32px;        /* fits decimal numbers like 3.1 */
  --conn-w: 60px;       /* fits the "where" keyword brick */
  --indent: 108px;      /* one full gutter (num + conn + gaps) — nested clause inset */
  --prop-bg: #ede9fe;   /* violet-100 */
  --prop-fg: #5b21b6;   /* violet-800 */
  --kw-fg: #475569;     /* slate-600 — Find / where / sort */
  --kw-bg: #e2e8f0;     /* slate-200 — solid, inert, not-a-button */
  --conn-fg: #92400e;   /* amber-800 — and / or */
  --conn-bg: #fef3c7;   /* amber-100 */
  --rel-fg: #0369a1;    /* sky-700 — is / contains */
  --rel-bg: #e0f2fe;    /* sky-100 */
  --val-bg: #ccfbf1;    /* teal-100 */
  --val-fg: #0f766e;    /* teal-700 */
}
.builder-head { margin-bottom: 18px; }
.tree-card { padding: 14px 16px; }
/* Entity selector = the canvas's first line. Unnumbered; "Find" sits in the
   connector column (aligned under where/and/or); the entity chip lands in the
   property column like every other property name. */
.entity-line,
.sort-line {
  display: flex;
  align-items: center;
  gap: var(--gx);
  padding: 2px 0;
  min-height: 34px;
}
.entity-line .c-num,
.sort-line .c-num {
  flex: 0 0 auto;
  min-width: var(--num-w);
  white-space: nowrap;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
.entity-line .c-conn,
.sort-line .c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
/* static keyword bricks: equal width (fill the connector column), solid gray,
   visibly inert — not buttons */
.kw-chip {
  width: var(--conn-w);
  justify-content: center;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
.sort-chip {
  cursor: pointer;
  background: var(--val-bg) !important;
  color: var(--val-fg) !important;
}
.sort-chip.is-default { opacity: 0.75; }
.menu-card { overflow: hidden; }
.builder-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
</style>
