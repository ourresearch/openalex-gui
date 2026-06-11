<template>
  <div class="builder">
    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query by picking fields, operators, and values — no syntax to learn.
        It stays in sync with the OQL below.
      </p>
    </header>

    <!-- where tree — the entity selector is line 0 of the same no-code canvas -->
    <v-card variant="outlined" class="tree-card">
      <v-progress-linear v-if="propsLoading" indeterminate color="deep-purple" />
      <div class="brow entity-line">
        <span class="c-num">1</span>
        <span class="c-conn"><span class="conn-word">Find</span></span>
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
    </v-card>

    <!-- sort -->
    <div class="sort-block">
      <div class="block-label text-overline">Sort by</div>
      <div v-for="(s, i) in sortBy" :key="i" class="sort-row">
        <v-select
          class="sort-field"
          :items="sortItems"
          v-model="s.column_id"
          item-title="title"
          item-value="value"
          placeholder="field"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onTreeChange"
        />
        <v-btn-toggle
          v-model="s.direction"
          density="compact"
          variant="outlined"
          divided
          mandatory
          @update:model-value="onTreeChange"
        >
          <v-btn value="asc" size="small">asc</v-btn>
          <v-btn value="desc" size="small">desc</v-btn>
        </v-btn-toggle>
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="removeSort(i)" />
      </div>
      <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addSort">Add sort</v-btn>
    </div>

    <!-- OQL panel -->
    <v-card variant="outlined" class="oql-card">
      <div class="oql-head">
        <span class="text-overline">OQL</span>
        <v-chip
          v-if="validation"
          size="x-small"
          :color="validation.valid ? 'green' : 'red'"
          variant="tonal"
          class="ml-2"
        >{{ statusLabel }}</v-chip>
        <v-progress-circular v-if="rendering" indeterminate size="14" width="2" class="ml-2" />
        <v-spacer />
        <v-btn size="x-small" variant="text" prepend-icon="mdi-content-copy" @click="copyOql">Copy</v-btn>
      </div>
      <v-textarea
        v-model="oqlDraft"
        class="oql-text"
        rows="3"
        auto-grow
        density="compact"
        variant="solo-filled"
        flat
        hide-details
        spellcheck="false"
      />
      <div class="oql-foot">
        <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
        <span v-else-if="oqlDirty" class="text-caption text-medium-emphasis">edited — Apply to update the builder</span>
        <v-spacer />
        <v-btn
          size="small"
          variant="tonal"
          :disabled="!oqlDirty"
          @click="applyOql"
        >Apply to builder</v-btn>
        <v-btn size="small" color="primary" class="ml-2" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
      </div>
      <div v-if="inlineRun && resultCount != null" class="oql-foot">
        <span class="text-caption">{{ resultCount.toLocaleString() }} results</span>
      </div>
    </v-card>
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

const sortItems = computed(() =>
  Object.values(properties.value)
    .filter((p) => (p.actions || []).includes("sort"))
    .map((p) => ({ title: p.display_name || p.name, value: p.name }))
    .sort((a, b) => a.title.localeCompare(b.title))
);

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

// ---- sort helpers ---------------------------------------------------------
const addSort = () => { sortBy.value.push({ column_id: null, direction: "desc" }); };
const removeSort = (i) => { sortBy.value.splice(i, 1); onTreeChange(); };

// ---- OQL panel ------------------------------------------------------------
const oqlDraft = ref("");
const oqlDirty = computed(() => oqlDraft.value.trim() !== (store.state.oqlBuilder.oql || "").trim());
// keep the draft mirroring the rendered OQL until the user edits it
watch(() => store.state.oqlBuilder.oql, (oql) => {
  oqlDraft.value = oql || "";
  emit("update:oql", oql || "");
});

const applyOql = async () => {
  const oqo = await store.dispatch("oqlBuilder/seedFromOql", oqlDraft.value);
  if (oqo) rebuildFromOqo(oqo);
};
const copyOql = () => {
  navigator.clipboard?.writeText(store.state.oqlBuilder.oql || oqlDraft.value || "");
  store.commit("snackbar", "Copied OQL");
};

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
  const oql = store.state.oqlBuilder.oql || oqlDraft.value;
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
/* Grid system (oxjob #428 iter 8). One set of column widths + role colours, set
   here and inherited by every builder row/group/value via CSS vars, so the whole
   canvas lines up in a tight tabular grid:
     number col | connector col (Find / where / and·or) | property | relation | value
   Colours by semantic role — connectors=slate, property=violet, relation=grey,
   value=teal — so joining words and values never share a colour. */
.builder {
  max-width: 900px;
  --gx: 8px;
  --num-w: 24px;
  --conn-w: 50px;
  --indent: 90px;       /* one full gutter (num + conn + gaps) — nested clause inset */
  --prop-bg: #ede9fe;   /* violet-100 */
  --prop-fg: #5b21b6;   /* violet-800 */
  --conn-fg: #475569;   /* slate-600 */
  --conn-bg: #e2e8f0;   /* slate-200 */
  --rel-fg: #64748b;    /* slate-500 (muted relation) */
  --val-bg: #ccfbf1;    /* teal-100 */
  --val-fg: #0f766e;    /* teal-700 */
}
.builder-head { margin-bottom: 18px; }
.tree-card { padding: 14px 16px; }
/* Entity selector = the canvas's first line. Unnumbered; "Find" sits in the
   connector column (aligned under where/and/or); the entity chip lands in the
   property column like every other property name. */
.entity-line {
  display: flex;
  align-items: center;
  gap: var(--gx);
  padding: 2px 0;
  min-height: 34px;
}
.entity-line .c-num {
  flex: 0 0 auto;
  width: var(--num-w);
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
.entity-line .c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
.entity-line .conn-word { color: var(--conn-fg); font-size: 0.78rem; }
.sort-block { margin: 20px 0; }
.block-label { opacity: 0.7; }
.sort-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.sort-field { max-width: 280px; }
.oql-card { margin-top: 16px; }
.oql-head {
  display: flex;
  align-items: center;
  padding: 8px 12px 0;
}
.oql-text :deep(textarea) {
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}
.oql-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 12px;
}
</style>
