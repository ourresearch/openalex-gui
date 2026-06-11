<template>
  <div class="builder">
    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query out of bricks — no syntax to learn.
      </p>
    </header>

    <!-- where tree — the entity selector is brick line 1 of the no-code canvas -->
    <v-card variant="outlined" class="tree-card" :class="{ 'tree-card--embedded': embedded }">
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

      <!-- sort — its own numbered brick line; always shown (default surfaces
           too). Multiple sorts render inline; each gets a direction dropdown. -->
      <div class="brow sort-line">
        <span class="c-num">{{ sortLineNum }}</span>
        <span class="c-conn">
          <v-chip class="kw-chip" size="small" label variant="flat">sort</v-chip>
        </span>

        <!-- default (no explicit sort): one chip naming the engine default -->
        <v-menu v-if="!sortBy.length" location="bottom start" offset="4">
          <template #activator="{ props: mp }">
            <v-chip v-bind="mp" class="sort-chip is-default" label size="small"
              variant="flat" append-icon="mdi-menu-down">{{ defaultSortLabel }}</v-chip>
          </template>
          <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
            <v-list density="compact" class="py-0">
              <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                @click="addSortEntry(o.value)" />
            </v-list>
          </v-card>
        </v-menu>

        <!-- explicit sorts: [field ▾][asc/desc ▾][×] pairs -->
        <template v-for="(s, i) in sortBy" :key="i">
          <span v-if="i > 0" class="sort-sep">,</span>
          <v-menu location="bottom start" offset="4">
            <template #activator="{ props: mp }">
              <v-chip v-bind="mp" class="sort-chip" label size="small"
                variant="flat" append-icon="mdi-menu-down">{{ sortFieldTitle(s.column_id) }}</v-chip>
            </template>
            <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
              <v-list density="compact" class="py-0">
                <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                  :active="s.column_id === o.value" @click="s.column_id = o.value; onTreeChange()" />
              </v-list>
            </v-card>
          </v-menu>
          <v-menu location="bottom start" offset="4">
            <template #activator="{ props: mp }">
              <v-chip v-bind="mp" class="sort-chip" label size="small"
                variant="flat" append-icon="mdi-menu-down">{{ s.direction }}</v-chip>
            </template>
            <v-card min-width="100" class="menu-card">
              <v-list density="compact" class="py-0">
                <v-list-item title="desc" :active="s.direction === 'desc'" @click="s.direction = 'desc'; onTreeChange()" />
                <v-list-item title="asc" :active="s.direction === 'asc'" @click="s.direction = 'asc'; onTreeChange()" />
              </v-list>
            </v-card>
          </v-menu>
          <v-btn class="sort-remove" icon size="x-small" variant="text" density="comfortable"
            @click="removeSort(i)">
            <v-icon size="13">mdi-close</v-icon>
          </v-btn>
        </template>

        <!-- add another sort property -->
        <v-menu location="bottom start" offset="4">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" class="add-sort-btn" icon size="x-small" variant="text" density="comfortable">
              <v-icon size="16">mdi-plus</v-icon>
              <v-tooltip activator="parent" location="top">Add a sort</v-tooltip>
            </v-btn>
          </template>
          <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
            <v-list density="compact" class="py-0">
              <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                @click="addSortEntry(o.value)" />
            </v-list>
          </v-card>
        </v-menu>
      </div>

      <!-- root add line — the LAST line of the canvas (below sort): the main
           thing to do next. The caret can grow non-filter additions later. -->
      <div v-if="!rootHasPending" class="brow add-line">
        <span class="c-num">{{ sortLineNum + 1 }}</span>
        <span class="c-conn">
          <v-btn class="add-main" size="small" color="black" variant="flat" density="comfortable"
            @click="addRootFilter"><v-icon size="16" start>mdi-plus</v-icon>add</v-btn>
        </span>
        <v-menu location="bottom start" offset="2">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" class="add-caret" icon size="x-small" variant="text" density="comfortable">
              <v-icon size="16">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-plus-box-multiple-outline" title="Add filter group" @click="addRootGroup" />
          </v-list>
        </v-menu>
      </div>

      <!-- embedded (SERP): foot is integrated INTO the card, below a divider, so
           the builder + its valid/Run controls read as one self-contained card. -->
      <template v-if="embedded">
        <v-divider />
        <div class="builder-foot builder-foot--in-card">
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
      </template>
    </v-card>

    <!-- non-embedded (playground): foot sits below the card, as before -->
    <div v-if="!embedded" class="builder-foot">
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
  // SERP "Advanced" mode: render the valid/Run foot INSIDE the tree card (one
  // self-contained card). Playground leaves it false (foot below the card).
  embedded: { type: Boolean, default: false },
});
const emit = defineEmits(["run", "update:oql"]);

const store = useStore();
const route = useRoute();

const ENTITY_TYPES = [
  "works", "authors", "sources", "institutions",
  "topics", "publishers", "funders", "keywords",
];

const getRows = ref("works");
// Root starts EMPTY (iter 13): a fresh canvas is just Find + the add brick +
// sort. Filters only exist once a field is actually picked.
const root = reactive(makeGroup("and", []));
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
// (execution.py: _score vs -cited_by_percentile_year.max). Multiple sorts render
// inline, each with its own asc/desc dropdown; × reverts to default when the
// last one goes.
const treeHasSearch = (n) => n.type === "group"
  ? n.children.some(treeHasSearch)
  : typeof n.column_id === "string" && n.column_id.includes(".search");
const defaultSortLabel = computed(() => (treeHasSearch(root) ? "relevance" : "most cited"));
const sortFieldTitle = (col) =>
  (sortItems.value.find((o) => o.value === col) || {}).title || col;
const sortLineNum = computed(() => 2 + root.children.length); // entity=1, then filters
const addSortEntry = (col) => { sortBy.value.push({ column_id: col, direction: "desc" }); onTreeChange(); };
const removeSort = (i) => { sortBy.value.splice(i, 1); onTreeChange(); };

// ---- root add line (lives BELOW sort — iter 15) -------------------------------
const rootHasPending = computed(() =>
  root.children.some((c) => c.type === "leaf" && !c.column_id)
);
const addRootFilter = () => { root.children.push(makeLeaf()); onTreeChange(); };
const addRootGroup = () => { root.children.push(makeGroup("or", [makeLeaf()])); onTreeChange(); };

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
  --gx: 4px;            /* tight: bricks in a row are ONE unit (iter 14) */
  --num-w: 32px;        /* fits decimal numbers like 3.1 */
  --conn-w: 60px;       /* fits the "where" keyword brick */
  --indent: 100px;      /* one full gutter (num + gx + conn + gx) — nested clause inset */
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
.sort-line,
.add-line {
  display: flex;
  align-items: center;
  gap: var(--gx);
  padding: 2px 0;
  min-height: 34px;
}
.entity-line .c-num,
.sort-line .c-num,
.add-line .c-num {
  flex: 0 0 auto;
  min-width: var(--num-w);
  white-space: nowrap;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
.entity-line .c-conn,
.sort-line .c-conn,
.add-line .c-conn {
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
.sort-sep { color: rgba(0, 0, 0, 0.4); margin: 0 2px; }
.sort-remove { opacity: 0.4; }
.sort-remove:hover { opacity: 1; }
.add-sort-btn { opacity: 0.55; }
.add-sort-btn:hover { opacity: 1; }
/* the root add brick + caret (mirrors the subquery add line) */
.add-main { text-transform: none; letter-spacing: 0; min-width: var(--conn-w); padding: 0 6px; }
.add-caret { opacity: 0.55; margin-left: -2px; }
.add-caret:hover { opacity: 1; }
.menu-card { overflow: hidden; }
.builder-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
/* embedded foot: a footer strip inside the card (no top margin; padded like a
   card-actions bar). */
.builder-foot--in-card {
  margin-top: 0;
  padding: 10px 16px;
}
.tree-card--embedded {
  padding-bottom: 0;
}
</style>
