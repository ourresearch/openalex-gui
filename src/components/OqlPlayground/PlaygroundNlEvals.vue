<template>
  <div class="playground-nl-evals">
    <div class="evals-intro">
      <h2 class="text-h5">NL evals</h2>
      <p class="text-body-2 text-medium-emphasis">
        One NL&nbsp;&rarr;&nbsp;OQO eval run &mdash; one row per English formulation, with its
        predicted OQO graded against the gold. The <strong>fail list</strong> is the point:
        read pred vs gold to tell a real model error from a bad or ambiguous gold.
      </p>
      <div class="run-meta text-caption text-medium-emphasis">
        run <code>{{ run.stamp }}</code> &middot; model <code>{{ run.model }}</code>
        &middot; {{ run.records.length }} formulations
        <template v-if="run.overall.exempt">
          &middot; {{ run.overall.exempt }} exempt (not graded)
        </template>
        <template v-if="run.cost">
          &middot; &approx;{{ run.cost.warm_cents_per_query }}&cent;/query warm
          (cache hit {{ run.cost.cache_hit }}/{{ run.cost.n }})
        </template>
        <span class="snapshot-note">
          &middot; read-only snapshot (regenerate via <code>scripts/gen_nl_eval.py</code>)
        </span>
      </div>
    </div>

    <!-- Headline + difficulty bars -->
    <v-card flat border rounded class="pa-4 mb-4">
      <div class="headline-row">
        <div class="headline-overall">
          <div class="text-h4" :class="`text-${pctColor(overallPct)}`">{{ overallPct }}%</div>
          <div class="text-caption text-medium-emphasis">
            overall &middot; {{ run.overall.pass }}/{{ run.overall.n }} pass
          </div>
        </div>
        <div class="headline-deciding">
          <div class="text-caption text-medium-emphasis mb-1">deciding tier</div>
          <div class="tier-chips">
            <v-chip size="small" color="green" variant="tonal" label>
              canonical {{ run.deciding.canonical || 0 }}
            </v-chip>
            <v-chip size="small" color="blue" variant="tonal" label>
              execution {{ run.deciding.execution || 0 }}
            </v-chip>
            <v-chip size="small" color="red-darken-1" variant="tonal" label>
              fail {{ run.deciding.fail || 0 }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Per-stratum breakdown -->
    <div class="strata-grid mb-4">
      <v-card
        v-for="dim in strataDims"
        :key="dim.key"
        flat
        border
        rounded
        class="pa-3"
      >
        <div class="text-subtitle-2 mb-2">{{ dim.label }}</div>
        <div
          v-for="cell in dim.cells"
          :key="cell.value"
          class="stratum-row"
          :class="{ 'stratum-row--active': isStratumActive(dim.key, cell.value) }"
          role="button"
          @click="toggleStratum(dim.key, cell.value)"
        >
          <span class="stratum-name">{{ cell.value }}</span>
          <span class="stratum-bar">
            <span
              class="stratum-bar-fill"
              :class="`bg-${pctColor(cell.pct)}`"
              :style="{ width: cell.pct + '%' }"
            />
          </span>
          <span class="stratum-num" :class="`text-${pctColor(cell.pct)}`">
            {{ cell.pct }}%
          </span>
          <span class="stratum-frac text-medium-emphasis">{{ cell.pass }}/{{ cell.total }}</span>
        </div>
      </v-card>
    </div>

    <!-- Filters -->
    <v-card flat border rounded class="pa-3 mb-3">
      <div class="filter-grid">
        <v-text-field
          v-model="search"
          label="Search NL / id / reason"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
        />
        <v-select
          v-model="resultFilter"
          :items="resultOptions"
          label="Result"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="selectedDifficulty"
          :items="difficultyOptions"
          label="Difficulty"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
        <v-select
          v-model="selectedEntity"
          :items="entityOptions"
          label="Entity"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
        <v-select
          v-model="selectedOperators"
          :items="operatorOptions"
          label="Operator"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          chips
          closable-chips
          clearable
        />
      </div>
      <div v-if="activeStrata.length" class="mt-2 d-flex align-center flex-wrap ga-1">
        <span class="text-caption text-medium-emphasis mr-1">stratum filters:</span>
        <v-chip
          v-for="s in activeStrata"
          :key="s.dim + ':' + s.value"
          size="x-small"
          label
          closable
          @click:close="toggleStratum(s.dim, s.value)"
        >{{ s.dim }}: {{ s.value }}</v-chip>
      </div>
    </v-card>

    <div class="text-caption text-medium-emphasis mb-2">
      Showing {{ filteredRows.length }} of {{ rows.length }} formulations
    </div>

    <!-- Records table (fail list is the default view) -->
    <v-data-table
      :headers="headers"
      :items="filteredRows"
      :sort-by="[{ key: 'passed', order: 'asc' }, { key: 'formulation_id', order: 'asc' }]"
      density="compact"
      items-per-page="50"
      :items-per-page-options="[25, 50, 100, -1]"
      item-value="rowKey"
      show-expand
      class="evals-table"
    >
      <template #item.passed="{ item }">
        <v-chip
          v-if="item.exempt"
          color="grey"
          size="x-small"
          label
          variant="tonal"
          :title="item.exempt"
        >exempt</v-chip>
        <v-chip
          v-else
          :color="item.passed ? 'green' : 'red-darken-1'"
          size="x-small"
          label
          variant="flat"
        >{{ item.passed ? "pass" : "fail" }}</v-chip>
      </template>

      <template #item.deciding_tier="{ value }">
        <v-chip :color="tierColor(value)" size="x-small" label variant="tonal">{{ value }}</v-chip>
      </template>

      <template #item.difficulty="{ value }">
        <span class="text-medium-emphasis">{{ value }}</span>
      </template>

      <template #item.text="{ value }">
        <span class="nl-cell">{{ value }}</span>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr class="expanded-row">
          <td :colspan="columns.length">
            <div class="detail-grid">
              <div class="detail-meta">
                <div><strong>{{ item.formulation_id }}</strong> &middot; difficulty {{ item.difficulty }}</div>
                <div class="text-body-2 mt-1">{{ item.text }}</div>
                <div class="text-caption text-medium-emphasis mt-2">
                  reason: {{ item.reason || "—" }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  strata:
                  <v-chip
                    v-for="tag in stratTags(item.strata)"
                    :key="tag"
                    size="x-small"
                    label
                    variant="tonal"
                    class="mr-1"
                  >{{ tag }}</v-chip>
                </div>
              </div>
              <div class="oqo-pair">
                <div class="oqo-col">
                  <div class="oqo-head text-caption">predicted OQO</div>
                  <CodeBlock :code="item.pred_oqo ? toYaml(item.pred_oqo) : '(no OQO produced)'" :line-numbers="!!item.pred_oqo" />
                </div>
                <div class="oqo-col">
                  <div class="oqo-head text-caption">gold OQO</div>
                  <CodeBlock :code="toYaml(item.gold_oqo)" />
                </div>
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
import { stringify as yamlStringify } from "yaml";
import { nlEvalRun } from "@/nlEvalRun";
import CodeBlock from "@/components/CodeBlock.vue";

defineOptions({ name: "PlaygroundNlEvals" });

const run = nlEvalRun;

// Each record is one NL formulation. formulation_id ("<case>.<n>") is unique per
// formulation, so it doubles as the table's stable row key.
const rows = run.records.map((r) => ({ ...r, rowKey: r.formulation_id }));

const overallPct = computed(() =>
  Math.round((100 * run.overall.pass) / (run.overall.n || 1))
);

// --- Pass-rate coloring (loosely tracks the d1≥90 / d2≥75 bars) -----------
const pctColor = (pct) => (pct >= 85 ? "green" : pct >= 70 ? "amber-darken-2" : "red-darken-1");
const tierColor = (t) => ({ canonical: "green", execution: "blue", fail: "red-darken-1" }[t] || "grey");

// --- Per-stratum cards from run.by_stratum --------------------------------
const DIM_LABELS = {
  difficulty: "Difficulty",
  entity: "Entity",
  operators: "Operator",
  group_by: "Group by",
  sort: "Sort",
};
const DIM_ORDER = ["difficulty", "entity", "operators", "group_by", "sort"];

const strataDims = DIM_ORDER.filter((k) => run.by_stratum[k]).map((key) => {
  const cells = Object.entries(run.by_stratum[key]).map(([value, [pass, total]]) => ({
    value,
    pass,
    total,
    pct: Math.round((100 * pass) / (total || 1)),
  }));
  // Difficulty sorts naturally; others by pass rate ascending (worst first —
  // those are where the gold-audit attention goes).
  cells.sort((a, b) =>
    key === "difficulty" ? a.value.localeCompare(b.value) : a.pct - b.pct
  );
  return { key, label: DIM_LABELS[key] || key, cells };
});

// --- Filters --------------------------------------------------------------
const search = ref("");
const resultFilter = ref("fail"); // fail list is the key view → default to it
const resultOptions = [
  { value: "all", title: "All" },
  { value: "fail", title: "Fails only" },
  { value: "pass", title: "Passes only" },
  { value: "exempt", title: "Exempt (not graded)" },
];
const selectedDifficulty = ref([]);
const selectedEntity = ref([]);
const selectedOperators = ref([]);

const difficultyOptions = [...new Set(rows.map((r) => r.difficulty))]
  .sort()
  .map((d) => ({ value: d, title: d }));
const entityOptions = [...new Set(rows.map((r) => r.strata.entity))].sort();
const operatorOptions = [...new Set(rows.flatMap((r) => r.strata.operators || []))].sort();

// Click-to-filter on a stratum card cell.
const activeStrata = ref([]); // [{dim, value}]
const isStratumActive = (dim, value) =>
  activeStrata.value.some((s) => s.dim === dim && s.value === value);
const toggleStratum = (dim, value) => {
  const i = activeStrata.value.findIndex((s) => s.dim === dim && s.value === value);
  if (i === -1) activeStrata.value = [...activeStrata.value, { dim, value }];
  else activeStrata.value = activeStrata.value.filter((_, j) => j !== i);
};

const matchesStratum = (r, s) => {
  const v = r.strata[s.dim];
  return Array.isArray(v) ? v.includes(s.value) : v === s.value;
};

const filteredRows = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  return rows.filter((r) => {
    // Exempt rows aren't graded — keep them out of pass/fail views, behind their
    // own filter option (and in "All").
    if (resultFilter.value === "exempt" && !r.exempt) return false;
    if (resultFilter.value !== "exempt" && resultFilter.value !== "all" && r.exempt) return false;
    if (resultFilter.value === "fail" && r.passed) return false;
    if (resultFilter.value === "pass" && !r.passed) return false;
    if (q) {
      const hay = `${r.formulation_id} ${r.text} ${r.reason || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (selectedDifficulty.value.length && !selectedDifficulty.value.includes(r.difficulty)) return false;
    if (selectedEntity.value.length && !selectedEntity.value.includes(r.strata.entity)) return false;
    if (
      selectedOperators.value.length &&
      !(r.strata.operators || []).some((o) => selectedOperators.value.includes(o))
    ) {
      return false;
    }
    // AND across active stratum-card filters.
    if (activeStrata.value.length && !activeStrata.value.every((s) => matchesStratum(r, s))) {
      return false;
    }
    return true;
  });
});

// --- Table ----------------------------------------------------------------
const headers = [
  { key: "passed", title: "Result", width: "84" },
  { key: "formulation_id", title: "ID", width: "96" },
  { key: "difficulty", title: "Diff", width: "64" },
  { key: "text", title: "NL formulation" },
  { key: "deciding_tier", title: "Tier", width: "110" },
];

const toYaml = (obj) => yamlStringify(obj).trimEnd();
const stratTags = (strata) =>
  Object.entries(strata).flatMap(([dim, v]) =>
    (Array.isArray(v) ? v : [v]).map((x) => `${dim}:${x}`)
  );
</script>

<style scoped>
.run-meta {
  margin-top: 4px;
}
.run-meta code {
  font-size: 0.9em;
}
.snapshot-note {
  opacity: 0.8;
}
.headline-row {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}
.headline-overall {
  text-align: center;
}
.tier-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.strata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.stratum-row {
  display: grid;
  grid-template-columns: 96px 1fr 44px 48px;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}
.stratum-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.stratum-row--active {
  background: rgba(25, 118, 210, 0.1);
}
.stratum-name {
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stratum-bar {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.stratum-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 4px;
}
.stratum-num {
  font-size: 0.78rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.stratum-frac {
  font-size: 0.72rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.nl-cell {
  font-size: 0.85rem;
}
.expanded-row td {
  background: rgba(0, 0, 0, 0.015);
  padding: 12px 16px !important;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.detail-meta :deep(.v-chip) {
  margin-top: 2px;
}
.oqo-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.oqo-head {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 2px;
}
@media (max-width: 860px) {
  .oqo-pair {
    grid-template-columns: 1fr;
  }
}
</style>
