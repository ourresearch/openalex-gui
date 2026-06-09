<template>
  <div class="filter-row">
    <span class="clause-num">{{ number }}</span>

    <!-- inline join word (on every row after the first); controls the group's join -->
    <v-chip
      v-if="showJoin"
      class="join-chip"
      size="small"
      label
      variant="tonal"
      color="deep-purple"
      @click="$emit('toggle-join')"
    >{{ join }}</v-chip>
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
    <template v-if="prop && !isUnary">
      <!-- entity / enum: chips + adder menu -->
      <template v-if="valueKind === 'entity' || valueKind === 'enum'">
        <v-chip v-for="(v, i) in node.values" :key="i" class="value-chip" size="small" label
          closable @click:close="removeValue(i)">{{ v.label }}</v-chip>
        <v-menu v-model="valueMenu" location="bottom start" offset="4" :close-on-content-click="false">
          <template #activator="{ props: mp }">
            <v-chip v-bind="mp" class="part-chip add-value" label size="small" variant="outlined"
              prepend-icon="mdi-plus">value</v-chip>
          </template>
          <v-card min-width="300" max-width="380" class="menu-card">
            <v-text-field v-model="valueSearch" autofocus density="compact" variant="plain" hide-details
              prepend-inner-icon="mdi-magnify"
              :placeholder="valueKind === 'entity' ? `Search ${autocompleteEntity || 'values'}` : 'Type a value, Enter to add'"
              class="px-2 pt-1" @keydown.enter="onValueEnter" />
            <v-divider />
            <div class="menu-list">
              <v-list density="compact" class="py-0">
                <v-list-item v-if="valueLoading" class="text-center py-3">
                  <v-progress-circular indeterminate size="18" width="2" color="grey" />
                </v-list-item>
                <v-list-item v-for="r in valueResults" :key="r.id || r.value" :title="r.display_name || r.value"
                  :subtitle="r.hint" @click="addEntityValue(r)" />
                <v-list-item v-if="!valueLoading && valueKind === 'enum' && valueSearch"
                  :title="'Add: ' + valueSearch" @click="addRawValue(valueSearch)" />
                <v-list-item v-if="!valueLoading && !valueResults.length && valueKind === 'entity' && valueSearch"
                  class="text-medium-emphasis text-center py-3">No matches</v-list-item>
              </v-list>
            </div>
          </v-card>
        </v-menu>
      </template>

      <!-- boolean -->
      <v-menu v-else-if="valueKind === 'boolean'" location="bottom start" offset="4">
        <template #activator="{ props: mp }">
          <v-chip v-bind="mp" class="part-chip" label size="small" variant="flat"
            append-icon="mdi-menu-down">{{ boolValue ? 'true' : 'false' }}</v-chip>
        </template>
        <v-card min-width="140" class="menu-card">
          <v-list density="compact" class="py-0">
            <v-list-item title="true" :active="boolValue === true" @click="onBool(true)" />
            <v-list-item title="false" :active="boolValue === false" @click="onBool(false)" />
          </v-list>
        </v-card>
      </v-menu>

      <!-- number / text / search -->
      <v-menu v-else location="bottom start" offset="4" :close-on-content-click="false">
        <template #activator="{ props: mp }">
          <v-chip v-bind="mp" class="part-chip value-input-chip" :class="{ unset: !singleValue }" label
            size="small" :variant="singleValue ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
            {{ singleValue !== '' ? singleValue : 'value' }}
          </v-chip>
        </template>
        <v-card min-width="220" class="menu-card pa-2">
          <v-text-field :model-value="singleValue" @update:model-value="onSingle"
            :type="valueKind === 'number' ? 'number' : 'text'" autofocus density="compact"
            variant="outlined" hide-details
            :placeholder="valueKind === 'number' ? 'number' : 'text'" />
        </v-card>
      </v-menu>
    </template>

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

// field menu items: filterable OR searchable properties; drop noisy .exact
// variants and dedupe search targets by display name.
const fieldItems = computed(() => {
  const seenSearch = new Set();
  const out = [];
  for (const p of Object.values(props.properties)) {
    const acts = p.actions || [];
    const isFilter = acts.includes("filter");
    const isSearch = acts.includes("search");
    if (!isFilter && !isSearch) continue;
    if (p.name.endsWith(".search.exact")) continue; // exact variants = noise for v1
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

const pickField = (v) => {
  node.column_id = v;
  const opts = uiOperatorsForProperty(props.properties[v]);
  const first = opts[0] || { op: "is", neg: false, unary: false };
  node.op = first.op; node.neg = first.neg; node.unary = first.unary;
  node.values = valueKindForProperty(props.properties[v]) === "boolean" ? [makeValue(true, "true")] : [];
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
  emit("change");
};

// ---- values -----------------------------------------------------------------
const singleValue = computed(() => (node.values[0]?.value ?? ""));
const boolValue = computed(() => { const v = node.values[0]?.value; return v === undefined ? true : v; });

const onSingle = (val) => { node.values = val === "" || val == null ? [] : [makeValue(val)]; emit("change"); };
const onBool = (val) => { node.values = [makeValue(val, String(val))]; emit("change"); };
const removeValue = (i) => { node.values.splice(i, 1); emit("change"); };
const addRawValue = (val) => {
  const v = String(val).trim(); if (!v) return;
  if (!node.values.some((x) => x.value === v)) node.values.push(makeValue(v));
  valueSearch.value = ""; emit("change");
};
const addEntityValue = (r) => {
  const id = r.short_id || r.id || r.value;
  if (!node.values.some((x) => x.value === id)) node.values.push(makeValue(id, r.display_name || id));
  valueSearch.value = ""; valueResults.value = []; emit("change");
};
const onValueEnter = () => { if (valueKind.value === "enum") addRawValue(valueSearch.value); };

// entity/enum value search (entity kind → live autocomplete)
const valueResults = ref([]);
const valueLoading = ref(false);
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
/* readable filled chips for field + scalar value + boolean (Vuetify's default
   flat chip is too low-contrast — force a legible grey fill + dark text) */
.part-chip:not(.op-chip):not(.add-value):not(.unset) {
  background-color: rgba(0, 0, 0, 0.07) !important;
  color: rgba(0, 0, 0, 0.87) !important;
}
.part-chip.unset {
  background-color: transparent !important;
  color: rgba(0, 0, 0, 0.55) !important;
}
.op-chip { color: rgba(0, 0, 0, 0.78) !important; }
.value-chip {
  background: rgba(103, 58, 183, 0.12) !important;
  color: rgba(0, 0, 0, 0.87) !important;
}
.add-value { border-style: dashed; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
.row-remove { opacity: 0.5; }
.row-remove:hover { opacity: 1; }
</style>
