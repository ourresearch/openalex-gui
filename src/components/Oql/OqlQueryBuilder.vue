<template>
  <div class="builder" :style="OQL_ROLE_CSS_VARS" @keydown="onBuilderKeydown">
    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query out of bricks — no syntax to learn.
      </p>
    </header>

    <!-- Line-flow canvas (oxjob #428 #2+#3): mirror the canonical OQL pretty-print
         line-for-line. Every line is a `.bline` inside `.builder-lines`, which owns
         the CSS counter so numbers follow DOM order across the whole recursive tree
         (entity=1, filters 2..N, then the visible directive lines). Connectors are
         LEADING and inline (no gutter column); clauses are flush-left (NOT indented
         under `works`). -->
    <v-card variant="outlined" class="tree-card" :class="{ 'tree-card--embedded': embedded }">
      <v-progress-linear v-if="propsLoading" indeterminate color="deep-purple" />
      <div class="builder-lines">
      <!-- line 1: the entity selector (`works`), no "Find" keyword -->
      <div class="bline" :style="{ '--depth': 0 }">
        <div class="bl-body">
          <EntitySelectorButton v-model="getRows" />
        </div>
      </div>
      <BuilderFilterGroup
        :node="root"
        :properties="properties"
        :entity="getRows"
        :depth="0"
        is-root
        @change="onTreeChange"
      />

      <!-- sort by — its own numbered line. HIDDEN when sorting by the engine
           default (iter 17); shows only with an explicit sort, added via the Add
           caret. Each sort = [field ▾][asc/desc ▾][×]. -->
      <div v-if="sortShown" class="bline" :style="{ '--depth': 0 }">
        <div class="bl-body">
        <v-chip class="kw-chip" size="small" label variant="flat">sort by</v-chip>

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

        <!-- mid-creation sort entry (from "Add sort"): pick a field to commit
             the entry; close the menu without picking and the entry — and the
             row, if it was the only one — vanishes (finish it in one go). -->
        <template v-if="sortPending">
          <span v-if="sortBy.length" class="sort-sep">,</span>
          <v-menu v-model="sortPendingMenuOpen" location="bottom start" offset="4">
            <template #activator="{ props: mp }">
              <v-chip v-bind="mp" class="sort-chip pending" label size="small"
                variant="outlined">select field</v-chip>
            </template>
            <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
              <v-list density="compact" class="py-0">
                <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                  @click="addSortEntry(o.value)" />
              </v-list>
            </v-card>
          </v-menu>
        </template>

        <!-- add another sort property -->
        <v-menu v-if="sortBy.length" location="bottom start" offset="4">
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
      </div>

      <!-- return — which columns come back (OQL `return …`). HIDDEN when the
           columns are the entity default; two-way synced with the table's
           column selector (same useColumnsState — two controls, one state). -->
      <div v-if="returnShown" class="bline" :style="{ '--depth': 0 }">
        <div class="bl-body">
          <v-chip class="kw-chip" size="small" label variant="flat">return</v-chip>
          <v-chip v-for="c in returnColumns" :key="c.key" class="return-chip" label size="small" variant="flat"
            :closable="returnColumns.length > 1" @click:close="removeColumn(c.key)">{{ c.label }}</v-chip>
          <AddColumn :entity-type="getRows">
            <template #activator="{ props: mp }">
              <v-btn v-bind="mp" class="add-sort-btn" icon size="x-small" variant="text" density="comfortable">
                <v-icon size="16">mdi-plus</v-icon>
                <v-tooltip activator="parent" location="top">Add a column</v-tooltip>
              </v-btn>
            </template>
          </AddColumn>
          <v-btn class="sort-remove" icon size="x-small" variant="text" density="comfortable"
            @click="resetReturn">
            <v-icon size="13">mdi-close</v-icon>
            <v-tooltip activator="parent" location="top">Back to default columns</v-tooltip>
          </v-btn>
        </div>
      </div>

      <!-- root add line — the LAST line of the canvas: the main thing to do next.
           One button opens the full menu (no split-button chevron, iter 21). The two
           filter actions sit together above a divider — they're by far the most used
           — then sort / return columns below. -->
      <div v-if="!rootHasPending" class="bline" :style="{ '--depth': 0 }">
        <div class="bl-body">
          <v-menu location="bottom start" offset="2">
            <template #activator="{ props: mp }">
              <v-btn v-bind="mp" class="add-main" size="small" variant="outlined" density="comfortable">
                <v-icon size="16" start>mdi-plus</v-icon>add</v-btn>
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-plus" title="Add a filter" @click="addRootFilter" />
              <v-list-item prepend-icon="mdi-plus-box-multiple-outline" title="Add a filter clause" @click="addRootGroup" />
              <v-divider />
              <v-list-item prepend-icon="mdi-sort" title="Add sort" @click="startSortPending" />
              <v-list-item v-if="!returnShown" prepend-icon="mdi-table-column-plus-after" title="Add return columns" @click="returnForced = true" />
            </v-list>
          </v-menu>
        </div>
      </div>
      </div><!-- /.builder-lines -->

      <!-- embedded (SERP): foot is a real card footer — a full-width white strip
           with a top border, clearly separated from the card body. -->
      <template v-if="embedded">
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
          <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
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
      <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
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
import AddColumn from "@/components/Results/Table/AddColumn.vue";
import { resolveColumns } from "@/components/Results/Table/columnConfig";
import { useColumnsState } from "@/composables/useColumnsState";
import { useLocalColumns } from "@/composables/useLocalColumns";
import { facetConfigs } from "@/facetConfigs";
import {
  makeGroup, makeLeaf, buildOqo, rootFromOqo, valueKindForProperty, isVGroup,
} from "@/components/OqlPlayground/oqoTree";
import { OQL_ROLE_CSS_VARS } from "@/components/Oql/oqlPalette";

defineOptions({ name: "OqlQueryBuilder" });

// Shared builder used by BOTH the /query/oql/builder playground page and the SERP
// "Builder" mode. Behaviour is parameterized via props so the two hosts differ only
// in chrome (header) and what "Run" means:
//   - playground (defaults): shows the header, runs inline via api.executeOql and
//     shows a result count under the OQL box.
//   - SERP: `:show-header="false" :inline-run="false"` → "Run" emits the OQL string
//     so the SERP can write ?oql= and execute through its own submit path.
const props = defineProps({
  // Two-way bound OQL — the component's sole I/O contract (oxjob #428). Bind with
  // `v-model:oql`: the builder emits `update:oql` on every render, and a parent
  // assignment re-seeds the visual tree (echo-guarded so the builder's own output
  // doesn't trigger a reseed). null = uninitialised.
  oql: { type: String, default: null },
  // DEPRECATED back-compat seed: an OQL string to seed with ONCE on mount. Prefer
  // `v-model:oql`. Precedence on mount: oql > seedOql > (non-standalone) ?oql= URL.
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
  // Page-agnostic mode (oxjob #428, for the #440 side-by-side dialog): seed ONLY
  // from the `oql`/`seedOql` props (never the URL), and keep return-column state
  // local (no `?column=`/localStorage). The component becomes a pure OQL-in /
  // OQL-out projection that knows nothing about the page, route, or URL.
  standalone: { type: Boolean, default: false },
});
const emit = defineEmits(["run", "update:oql"]);

const store = useStore();
// Route is only consulted for the legacy ?oql= seed fallback, and never in
// standalone mode. useRoute() is always called (composables must run at setup),
// but its value is ignored when standalone.
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

// Per-query state is COMPONENT-LOCAL (oxjob #428 de-singleton) — the store no
// longer holds the rendered query, so two builders can be mounted at once (page
// + dialog) without clobbering each other. `renderedOql` is the canonical OQL the
// server last produced from our tree (the [Name]-annotated string shown/emitted).
const renderedOql = ref("");
const oxurl = ref("");
const validation = ref(null);
const rendering = ref(false);
const seedError = ref(null);
// Guard for the v-model echo: the last OQL we emitted upward. A parent reseed
// whose value equals this is just our own output bouncing back — ignore it.
let lastEmittedOql = null;

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

// ---- sort by brick line --------------------------------------------------------
// Sort lives INSIDE the canvas as its own numbered line, but only when an
// EXPLICIT sort is set (iter 17) — the engine default (relevance with a search
// clause, else most cited) stays implicit. Added via the Add caret: a pending
// "select field" entry whose menu must be finished in one go (close without
// picking → it vanishes). Each entry = [field ▾][asc/desc ▾][×].
const sortFieldTitle = (col) =>
  (sortItems.value.find((o) => o.value === col) || {}).title || col;
const sortPending = ref(false);
const sortPendingMenuOpen = ref(false);
const sortShown = computed(() => sortBy.value.length > 0 || sortPending.value);
const startSortPending = () => {
  sortPending.value = true;
  nextTick(() => { sortPendingMenuOpen.value = true; });
};
watch(sortPendingMenuOpen, (open) => {
  if (open) return;
  // a pick lands before close; abandon clears the pending entry
  setTimeout(() => { sortPending.value = false; }, 120);
});
const addSortEntry = (col) => {
  sortBy.value.push({ column_id: col, direction: "desc" });
  sortPending.value = false;
  onTreeChange();
};
const removeSort = (i) => { sortBy.value.splice(i, 1); onTreeChange(); };

// ---- return brick line (OQL `return …`) ----------------------------------------
// The return row and the table's column selector are TWO CONTROLS OVER ONE
// STATE: useColumnsState (URL `?column=` → localStorage → entity defaults).
// Editing either updates the other. Hidden while the columns are the entity
// default; "Add return columns" forces it visible to start editing.
// The OQO `select` speaks API select-field names while the table speaks gui
// facet keys — mapped both ways below (a gui key's selectable owner is itself
// or its first path segment, e.g. authorships.author.id → authorships).
// Return-columns state: URL-backed (?column= + localStorage) on a real page, or
// local-only in standalone mode so an embedded builder never touches the address
// bar. Same shape either way; the branch is stable for the component's lifetime.
const { columnKeys, defaultColumnKeys, removeColumn, setColumns } =
  props.standalone ? useLocalColumns(getRows) : useColumnsState(getRows);
const returnForced = ref(false);
const columnsAreDefault = computed(
  () => JSON.stringify(columnKeys.value) === JSON.stringify(defaultColumnKeys.value)
);
const returnShown = computed(() => !columnsAreDefault.value || returnForced.value);
const returnColumns = computed(() => resolveColumns(getRows.value, columnKeys.value));
const resetReturn = () => {
  returnForced.value = false;
  if (!columnsAreDefault.value) setColumns(defaultColumnKeys.value);
};
const selectNameForKey = (k) => {
  const base = String(k).split(":")[0];
  for (const cand of [base, base.split(".")[0]]) {
    const p = properties.value[cand];
    if (p && (p.actions || []).includes("select")) return cand;
  }
  return null;
};
const oqoSelect = computed(() => {
  if (columnsAreDefault.value) return null; // default columns → no `return` clause
  const names = [...new Set(columnKeys.value.map(selectNameForKey).filter(Boolean))];
  return names.length ? names : null;
});
// seed direction: OQO select names → gui column keys (best-effort; unmappable
// names are dropped with a warn — QA-051 discipline, never blank the table)
const SELECT_TO_COLUMN_ALIASES = { title: "display_name" }; // works: the title column IS display_name
const guiKeysFromSelect = (names) => {
  const out = [];
  const candidates = [...new Set([...columnKeys.value, ...defaultColumnKeys.value])];
  for (const raw of names) {
    const name = SELECT_TO_COLUMN_ALIASES[raw] || raw;
    if (resolveColumns(getRows.value, [name]).length) { out.push(name); continue; }
    const hit = candidates.find((k) => String(k).split(":")[0].split(".")[0] === name);
    if (hit) { out.push(hit); continue; }
    console.warn(`builder return: no table column for select field "${raw}" — dropped`);
  }
  return [...new Set(out)];
};
// table-side column edits re-render the OQL (and vice versa via commit)
watch(columnKeys, () => onTreeChange());

// ---- root add line (the LAST canvas line) ---------------------------------------
const rootHasPending = computed(() =>
  root.children.some((c) => c.type === "leaf" && !c.column_id)
);
const addRootFilter = () => { root.children.push(makeLeaf()); onTreeChange(); };
const addRootGroup = () => { root.children.push(makeGroup("or", [makeLeaf()])); onTreeChange(); };

// Line numbers are CSS counters (`.builder-lines` resets `bline`, each `.bline`
// increments it) — they follow DOM order across the recursive tree, so there's
// nothing to compute or thread here.

// ---- commit (tree -> oqo -> server render) --------------------------------
// Renders our tree to canonical OQL via the stateless store action and stores the
// result in LOCAL refs, then emits `update:oql` upward + resolves [Name] labels.
let commitSeq = 0;
const commit = async () => {
  const oqo = buildOqo({
    getRows: getRows.value, root, sortBy: sortBy.value, select: oqoSelect.value,
  });
  const seq = ++commitSeq;
  rendering.value = true;
  const data = await store.dispatch("oqlBuilder/renderOqo", oqo);
  if (seq !== commitSeq) return; // a newer commit superseded this one
  rendering.value = false;
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  emit("update:oql", renderedOql.value);
  applyNameAnnotations(renderedOql.value);
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

// ---- lazy [Name] resolution (#428) -----------------------------------------
// The server's rendered OQL annotates name-resolving values with their display
// name (`I27837315 [Kansas State University]`). Seeded entity/enum chips start
// with the bare id as their label (oqoTree import has no names) — harvest the
// annotations from every render and fill in any chip still showing its raw
// value. Free (no extra requests) and self-healing: the first post-seed render
// resolves the names.
const applyNameAnnotations = async (oql) => {
  if (!oql) return;
  const names = {};
  const re = /([^\s()[\]]+)\s+\[([^\][]+)\]/g;
  let m;
  while ((m = re.exec(oql))) names[m[1]] = m[2];
  if (!Object.keys(names).length) return;
  let touched = false;
  const fillGroup = (g) => {
    for (const it of g.items) {
      if (isVGroup(it)) { fillGroup(it); continue; }
      const v = String(it.value);
      if (it.label === v && names[v]) { it.label = names[v]; touched = true; }
    }
  };
  const walk = (n) => {
    if (n.type === "group") { n.children.forEach(walk); return; }
    const kind = valueKindForProperty(properties.value[n.column_id]);
    if (kind !== "entity" || !n.vtree) return;
    fillGroup(n.vtree); // recurse the value tree (nested sub-groups too)
  };
  if (suppressCommit) return; // mid-rebuild; the post-rebuild pass handles it
  suppressCommit = true;
  walk(root);
  if (touched) await nextTick(); // let the deep watcher fire while suppressed
  suppressCommit = false;
};

// Two-way binding (v-model:oql): a parent assignment re-seeds the visual tree.
// Echo-guarded — when the new value is the OQL we just emitted, it's our own
// output bouncing back, so don't rebuild (that would churn the tree mid-edit).
watch(() => props.oql, async (next) => {
  if (next == null) return;
  const incoming = String(next);
  if (incoming === lastEmittedOql) return;          // our own echo
  if (incoming === renderedOql.value) return;        // already showing it
  const data = await store.dispatch("oqlBuilder/seedFromOql", incoming);
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
});

// ---- seed from OQO (shared link / Apply / v-model push) --------------------
// Accepts the seedFromOql payload ({ oqo, oql, oxurl, validation }) and seeds both
// the visual tree AND the local rendered-state refs, so the foot + [Name] labels
// reflect the seed without waiting for a re-render commit.
const rebuildFromOqo = async (data) => {
  const oqo = data.oqo;
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
  // an OQL `return …` drives the table's column state (two controls, one
  // state); no `select` in the OQO leaves the columns untouched
  if (Array.isArray(oqo.select) && oqo.select.length) {
    const keys = guiKeysFromSelect(oqo.select);
    if (keys.length) setColumns(keys);
  }
  // adopt the seed render as our current local state (don't re-emit — this OQL
  // came from the parent/seed, so emitting it back would be a redundant echo)
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  await nextTick();
  suppressCommit = false;
  // fill chip labels from the seed render's [Name] annotations
  applyNameAnnotations(renderedOql.value);
};

// Cmd/Ctrl+Enter anywhere in the builder submits the query, same as the Run button
// (Jason iter 21). Keydown from a value input bubbles up to here natively.
const onBuilderKeydown = (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    runQuery();
  }
};

const running = ref(false);
const resultCount = ref(null);
const runQuery = async () => {
  const oql = renderedOql.value;
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
  // Seed precedence: oql (v-model) > seedOql (back-compat) > ?oql= URL (page only)
  const sharedOql = props.oql != null ? props.oql
    : props.seedOql != null ? props.seedOql
    : props.standalone ? null : route.query.oql;
  if (sharedOql) {
    const data = await store.dispatch("oqlBuilder/seedFromOql", String(sharedOql));
    if (data.oqo) { await rebuildFromOqo(data); return; }
    seedError.value = data.error;
  }
  commit();
});

// Let a host push a new query in imperatively without a remount (kept for
// back-compat; `v-model:oql` is the preferred path now).
defineExpose({ rebuildFromOql: async (oql) => {
  const data = await store.dispatch("oqlBuilder/seedFromOql", String(oql));
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
} });
</script>

<style scoped>
/* Line-flow canvas (oxjob #428 #2+#3 — Jason: the builder mirrors the canonical
   OQL pretty-print line-for-line). Every visual line is a `.bline`:
     [line number ::before]  [.bl-body — indented by --depth, content wraps]
   Connectors (where / and / or) are LEADING and inline (no gutter column).
   Indentation is padding-left on the body; the number stays in a fixed left
   column. Role colours (--kw-*, --conn-*, --prop-*, --rel-*, --val-*) are bound
   via :style from oqlPalette.js — the single source shared with the #357 text
   editor's syntax highlighting. Don't reintroduce hex values here. */
.builder {
  max-width: 900px;
  --gx: 4px;            /* tight: bricks in a row read as one unit */
  --num-w: 30px;        /* line-number column */
  --indent: 22px;       /* per-level body inset (one nesting level) */
  --brick-fs: 0.8125rem; /* ONE font size for every brick (iter 21 — Jason) */
}
/* Every brick (chips + the value text inputs) shares --brick-fs so nothing reads
   bigger than the rest. Scoped under .builder, so teleported menu content (rendered
   in a body-level overlay) keeps its normal sizing. */
.builder :deep(.v-chip.v-chip--size-small) { font-size: var(--brick-fs); }
.builder-head { margin-bottom: 18px; }
.tree-card { padding: 14px 16px; background: white; }
/* the lines region owns the CSS counter — numbers follow DOM order across the
   whole recursive tree (entity=1, filters 2..N, sort/return/add last). */
.builder-lines { counter-reset: bline; }
/* a single line: fixed number column + a flowing, depth-indented body. The local
   `.bline`/`.bl-body`/`.kw-chip` rules are duplicated in each builder component's
   scoped style (the counter name `bline` is document-global, so the count is
   continuous regardless of which component renders a given line). */
.bline {
  display: flex;
  align-items: flex-start;
  padding: 1px 0;
}
.bline::before {
  counter-increment: bline;
  content: counter(bline);
  flex: 0 0 auto;
  width: var(--num-w);
  margin-top: 7px;
  padding-right: 9px;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.32);
  user-select: none;
}
.bl-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gx);
  row-gap: 4px;
  min-height: 30px;
  padding-left: calc(var(--depth, 0) * var(--indent));
}
/* static keyword bricks (where / sort by / return / parens): solid gray, inert */
.kw-chip {
  justify-content: center;
  padding: 0 6px;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
.sort-chip {
  cursor: pointer;
  background: var(--val-bg) !important;
  color: var(--val-fg) !important;
}
.sort-chip.pending { background: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.return-chip {
  background: var(--val-bg) !important;
  color: var(--val-fg) !important;
}
.sort-sep { color: rgba(0, 0, 0, 0.4); margin: 0 2px; }
.sort-remove { opacity: 0.4; }
.sort-remove:hover { opacity: 1; }
.add-sort-btn { opacity: 0.55; }
.add-sort-btn:hover { opacity: 1; }
/* the root add brick — the last line of the canvas (one button, opens the menu) */
.add-main { text-transform: none; letter-spacing: 0; padding: 0 8px; }
.menu-card { overflow: hidden; }
.builder-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
/* embedded foot: a real card footer — break out of the card's 16px side padding so
   the top border spans the full card width, white background, clearly separated. */
.builder-foot--in-card {
  margin: 14px -16px 0;
  padding: 10px 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
}
.tree-card--embedded {
  padding-bottom: 0;
}
</style>
