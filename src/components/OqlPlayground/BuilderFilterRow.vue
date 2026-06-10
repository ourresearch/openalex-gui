<template>
  <div class="filter-row">
    <span class="clause-num">{{ number }}</span>

    <!-- inline join word (on every row after the first); controls the group's join -->
    <v-chip v-if="showJoin" class="join-chip" size="small" label variant="tonal" color="deep-purple"
      @click="$emit('toggle-join')">{{ join }}</v-chip>
    <span v-else class="join-spacer"></span>

    <!-- FIELD chip -->
    <v-menu v-model="fieldMenu" location="bottom start" offset="4" :close-on-content-click="false">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="part-chip" :class="{ unset: !prop }" label size="small"
          :variant="prop ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
          {{ prop ? (prop.display_name || prop.name) : 'field' }}
        </v-chip>
      </template>
      <v-card min-width="280" max-width="360" class="menu-card">
        <v-text-field v-model="fieldSearch" autofocus placeholder="Search fields" density="compact"
          variant="plain" hide-details prepend-inner-icon="mdi-magnify" class="px-2 pt-1" />
        <v-divider />
        <div class="menu-list">
          <v-list density="compact" class="py-0">
            <v-list-item v-for="it in filteredFieldItems" :key="it.value" :title="it.title"
              :subtitle="it.hint" @click="pickField(it.value)" />
            <v-list-item v-if="!filteredFieldItems.length" class="text-medium-emphasis text-center py-3">
              No matching fields
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-menu>

    <!-- OPERATOR chip -->
    <v-menu v-if="prop" location="bottom start" offset="4">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="part-chip op-chip" label size="small" variant="text"
          append-icon="mdi-menu-down">{{ currentOp ? currentOp.label : 'is' }}</v-chip>
      </template>
      <v-card min-width="160" class="menu-card">
        <v-list density="compact" class="py-0">
          <v-list-item v-for="o in operatorItems" :key="o.key" :title="o.label"
            :active="currentOp && o.key === currentOp.key" @click="pickOperator(o.key)" />
        </v-list>
      </v-card>
    </v-menu>

    <!-- VALUE -->
    <div v-if="prop && !isUnary" class="value-area">
      <!-- entity: chips + searchable adder -->
      <template v-if="valueKind === 'entity'">
        <template v-for="(v, i) in node.values" :key="i">
          <span v-if="i > 0" class="val-or">or</span>
          <v-chip class="value-chip" size="small" label closable @click:close="removeValue(i)">{{ v.label }}</v-chip>
        </template>
        <v-menu v-model="valueMenu" location="bottom start" offset="4" :close-on-content-click="false">
          <template #activator="{ props: mp }">
            <v-chip v-bind="mp" class="part-chip add-value" label size="small" variant="outlined"
              prepend-icon="mdi-plus">value</v-chip>
          </template>
          <v-card min-width="300" max-width="380" class="menu-card">
            <v-text-field v-model="valueSearch" autofocus density="compact" variant="plain" hide-details
              prepend-inner-icon="mdi-magnify" :placeholder="`Search ${autocompleteEntity || 'values'}`"
              class="px-2 pt-1" />
            <v-divider />
            <div class="menu-list">
              <v-list density="compact" class="py-0">
                <v-list-item v-if="valueLoading" class="text-center py-3">
                  <v-progress-circular indeterminate size="18" width="2" color="grey" />
                </v-list-item>
                <v-list-item v-for="r in valueResults" :key="r.id || r.value" :title="r.display_name || r.value"
                  :subtitle="r.hint" @click="addEntityValue(r)" />
                <v-list-item v-if="!valueLoading && !valueResults.length && valueSearch"
                  class="text-medium-emphasis text-center py-3">No matches</v-list-item>
              </v-list>
            </div>
          </v-card>
        </v-menu>
      </template>

      <!-- boolean: inline toggle -->
      <v-btn-toggle v-else-if="valueKind === 'boolean'" :model-value="boolValue" @update:model-value="onBool"
        density="compact" variant="outlined" divided mandatory class="bool-toggle">
        <v-btn :value="true" size="x-small">true</v-btn>
        <v-btn :value="false" size="x-small">false</v-btn>
      </v-btn-toggle>

      <!-- scalar (text / search / number / enum): edit directly, multi-value with + -->
      <template v-else>
        <template v-for="(v, i) in node.values" :key="i">
          <span v-if="i > 0" class="val-or">or</span>
          <span class="val-wrap" :class="{ invalid: isInvalid(v) }">
            <input class="val-input" :value="v.value" :placeholder="scalarPlaceholder"
              :inputmode="valueKind === 'number' ? 'decimal' : 'text'" spellcheck="false"
              @input="onScalarInput(i, $event)" />
            <v-icon v-if="node.values.length > 1" size="13" class="val-remove" @click="removeValue(i)">mdi-close</v-icon>
          </span>
        </template>
        <v-btn class="add-scalar" size="x-small" variant="text" icon="mdi-plus" density="comfortable"
          @click="addEmptyScalar" />
      </template>
    </div>

    <v-spacer />
    <v-btn v-if="canRemove" class="row-remove" icon="mdi-close" size="x-small" variant="text"
      density="comfortable" @click="$emit('remove')" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { debounce } from "lodash";
import { api } from "@/api";
import {
  uiOperatorsForProperty, valueKindForProperty, autocompleteEntityFor,
  matchOperator, makeValue,
} from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterRow" });

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  number: { type: String, default: "" },
  showJoin: { type: Boolean, default: false },
  join: { type: String, default: "and" },
  canRemove: { type: Boolean, default: true },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node; // shared reactive tree node (stable per :key)

const fieldMenu = ref(false);
const fieldSearch = ref("");
const valueMenu = ref(false);
const valueSearch = ref("");

// ---- property + derived -----------------------------------------------------
const prop = computed(() => props.properties[node.column_id] || null);
const valueKind = computed(() => valueKindForProperty(prop.value));
const autocompleteEntity = computed(() => autocompleteEntityFor(prop.value));

const fieldItems = computed(() => {
  const seenSearch = new Set();
  const out = [];
  for (const p of Object.values(props.properties)) {
    const acts = p.actions || [];
    const isFilter = acts.includes("filter");
    const isSearch = acts.includes("search");
    if (!isFilter && !isSearch) continue;
    if (p.name.endsWith(".search.exact")) continue;
    if (isSearch && !isFilter) {
      const dn = (p.display_name || p.name).toLowerCase();
      if (seenSearch.has(dn)) continue;
      seenSearch.add(dn);
    }
    out.push({ value: p.name, title: p.display_name || p.name, hint: p.type });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
});
const filteredFieldItems = computed(() => {
  const t = fieldSearch.value.trim().toLowerCase();
  if (!t) return fieldItems.value;
  return fieldItems.value.filter((it) => it.title.toLowerCase().includes(t) || it.value.toLowerCase().includes(t));
});

const initialValuesFor = (kind) =>
  kind === "boolean" ? [makeValue(true, "true")] : kind === "entity" ? [] : [makeValue("")];

const pickField = (v) => {
  node.column_id = v;
  const opts = uiOperatorsForProperty(props.properties[v]);
  const first = opts[0] || { op: "is", neg: false, unary: false };
  const k = valueKindForProperty(props.properties[v]);
  node.op = first.op; node.neg = first.neg; node.unary = first.unary;
  node.numeric = k === "number";
  node.values = initialValuesFor(k);
  fieldMenu.value = false; fieldSearch.value = "";
  emit("change");
};

// ---- operator ---------------------------------------------------------------
const operatorItems = computed(() => uiOperatorsForProperty(prop.value));
const currentOp = computed(() => matchOperator(prop.value, node.op, node.neg, node.unary));
const isUnary = computed(() => !!node.unary);
const pickOperator = (key) => {
  const o = operatorItems.value.find((x) => x.key === key);
  if (!o) return;
  node.op = o.op; node.neg = o.neg; node.unary = o.unary;
  if (o.unary) node.values = [];
  else if (node.values.length === 0) node.values = initialValuesFor(valueKind.value);
  emit("change");
};

// ---- scalar values (inline editable) ---------------------------------------
const scalarPlaceholder = computed(() =>
  valueKind.value === "number" ? "number" : valueKind.value === "enum" ? "value" : "text"
);
const isInvalid = (v) =>
  valueKind.value === "number" && v.value !== "" && v.value != null && isNaN(Number(v.value));

const onScalarInput = (i, e) => {
  // store the raw string while typing (coercion to Number happens at serialize
  // time via node.numeric, so decimals/partial input don't fight the cursor)
  node.values[i] = makeValue(e.target.value);
  emit("change");
};
const addEmptyScalar = () => { node.values.push(makeValue("")); emit("change"); };

// ---- boolean ----------------------------------------------------------------
const boolValue = computed(() => { const v = node.values[0]?.value; return v === undefined ? true : v; });
const onBool = (val) => { if (val == null) return; node.values = [makeValue(val, String(val))]; emit("change"); };

// ---- shared ----------------------------------------------------------------
const removeValue = (i) => { node.values.splice(i, 1); emit("change"); };

// ---- entity value search ----------------------------------------------------
const valueResults = ref([]);
const valueLoading = ref(false);
const addEntityValue = (r) => {
  const id = r.short_id || r.id || r.value;
  if (!node.values.some((x) => x.value === id)) node.values.push(makeValue(id, r.display_name || id));
  valueSearch.value = ""; valueResults.value = []; emit("change");
};
const runValueSearch = debounce(async (q) => {
  if (valueKind.value !== "entity" || !autocompleteEntity.value) { valueResults.value = []; return; }
  valueLoading.value = true;
  try { valueResults.value = (await api.getAutocomplete(autocompleteEntity.value, { q })) || []; }
  catch { valueResults.value = []; }
  finally { valueLoading.value = false; }
}, 250);
watch(valueSearch, (q) => { if (valueKind.value === "entity") runValueSearch(q); });
watch(valueMenu, (open) => { if (open && valueKind.value === "entity" && !valueResults.value.length) runValueSearch(""); });
</script>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 3px 0;
  min-height: 36px;
}
.clause-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
  min-width: 30px;
  text-align: right;
}
.join-chip { cursor: pointer; min-width: 38px; justify-content: center; text-transform: lowercase; }
.join-spacer { display: inline-block; width: 38px; }
.part-chip { cursor: pointer; }
.part-chip:not(.op-chip):not(.add-value):not(.unset) {
  background-color: rgba(0, 0, 0, 0.07) !important;
  color: rgba(0, 0, 0, 0.87) !important;
}
.part-chip.unset { background-color: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.op-chip { color: rgba(0, 0, 0, 0.78) !important; }
.add-value { border-style: dashed; }

.value-area { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.value-chip { background: rgba(103, 58, 183, 0.12) !important; color: rgba(0, 0, 0, 0.87) !important; }
.val-or { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(0, 0, 0, 0.4); }

/* inline editable scalar value (auto-grows to fit content) */
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 2px 6px;
}
.val-wrap.invalid { border-color: rgb(211, 47, 47); background: rgba(211, 47, 47, 0.06); }
.val-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.87);
  min-width: 56px;
  max-width: 360px;
  field-sizing: content; /* auto-grow width to content (Chrome) */
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
.add-scalar { opacity: 0.7; }
.bool-toggle { height: 28px; }

.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
.row-remove { opacity: 0.5; }
.row-remove:hover { opacity: 1; }
</style>
