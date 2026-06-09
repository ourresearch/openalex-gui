<template>
  <div class="filter-row">
    <!-- property -->
    <v-autocomplete
      class="row-field field-prop"
      :items="propertyItems"
      v-model="columnId"
      item-title="title"
      item-value="value"
      placeholder="field"
      density="compact"
      variant="outlined"
      hide-details
      hide-no-data
      auto-select-first
    />

    <!-- operator -->
    <v-select
      v-if="prop"
      class="row-field field-op"
      :items="operatorItems"
      v-model="opKey"
      item-title="label"
      item-value="key"
      density="compact"
      variant="outlined"
      hide-details
    />

    <!-- value(s) -->
    <div v-if="prop && !isUnary" class="value-area">
      <!-- entity / enum: chips + adder -->
      <template v-if="valueKind === 'entity'">
        <v-chip
          v-for="(v, i) in node.values"
          :key="i"
          class="value-chip"
          size="small"
          closable
          @click:close="removeValue(i)"
        >{{ v.label }}</v-chip>
        <EntityAutocomplete
          v-if="autocompleteEntity"
          :key="adderKey"
          class="value-adder"
          :entityType="autocompleteEntity"
          showWorkCounts
          @entity-selected="onEntityPicked"
        />
      </template>

      <template v-else-if="valueKind === 'enum'">
        <v-combobox
          class="row-field field-value"
          :model-value="node.values.map(v => v.value)"
          @update:model-value="onComboValues"
          multiple
          chips
          closable-chips
          density="compact"
          variant="outlined"
          hide-details
          placeholder="value"
        />
      </template>

      <template v-else-if="valueKind === 'boolean'">
        <v-btn-toggle
          :model-value="boolValue"
          @update:model-value="onBool"
          density="compact"
          variant="outlined"
          divided
          mandatory
        >
          <v-btn :value="true" size="small">true</v-btn>
          <v-btn :value="false" size="small">false</v-btn>
        </v-btn-toggle>
      </template>

      <template v-else-if="valueKind === 'number'">
        <v-text-field
          class="row-field field-value"
          type="number"
          :model-value="singleValue"
          @update:model-value="onSingle"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="number"
        />
      </template>

      <template v-else>
        <v-text-field
          class="row-field field-value"
          :model-value="singleValue"
          @update:model-value="onSingle"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="value"
        />
      </template>
    </div>

    <v-btn
      class="row-remove"
      icon="mdi-close"
      size="x-small"
      variant="text"
      density="comfortable"
      @click="$emit('remove')"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import EntityAutocomplete from "@/components/EntityAutocomplete.vue";
import {
  uiOperatorsForProperty,
  valueKindForProperty,
  autocompleteEntityFor,
  matchOperator,
  makeValue,
} from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterRow" });

const props = defineProps({
  node: { type: Object, required: true },     // leaf node (mutated in place)
  properties: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["remove", "change"]);

// Shared reactive tree node (owned by PlaygroundBuilder, stable per :key) — edited
// in place; alias so we're not mutating the prop binding itself.
const node = props.node;

const adderKey = ref(0); // remount EntityAutocomplete after each pick (it self-clears)

// ---- property -------------------------------------------------------------
const propertyItems = computed(() =>
  Object.values(props.properties)
    .filter((p) => (p.actions || []).includes("filter"))
    .map((p) => ({ title: p.display_name || p.name, value: p.name, hint: p.type }))
    .sort((a, b) => a.title.localeCompare(b.title))
);

const prop = computed(() => props.properties[node.column_id] || null);
const valueKind = computed(() => valueKindForProperty(prop.value));
const autocompleteEntity = computed(() => autocompleteEntityFor(prop.value));

const columnId = computed({
  get: () => node.column_id || null,
  set: (v) => {
    node.column_id = v;
    // reset operator + values to the new property's defaults
    const opts = uiOperatorsForProperty(props.properties[v]);
    const first = opts[0] || { op: "is", neg: false, unary: false };
    node.op = first.op;
    node.neg = first.neg;
    node.unary = first.unary;
    // boolean columns need a concrete value (else they serialize as "is unknown")
    node.values =
      valueKindForProperty(props.properties[v]) === "boolean"
        ? [makeValue(true, "true")]
        : [];
    emit("change");
  },
});

// ---- operator -------------------------------------------------------------
const operatorItems = computed(() => uiOperatorsForProperty(prop.value));
const currentOp = computed(() =>
  matchOperator(prop.value, node.op, node.neg, node.unary)
);
const opKey = computed({
  get: () => currentOp.value?.key || null,
  set: (key) => {
    const o = operatorItems.value.find((x) => x.key === key);
    if (!o) return;
    node.op = o.op;
    node.neg = o.neg;
    node.unary = o.unary;
    if (o.unary) node.values = [];
    emit("change");
  },
});
const isUnary = computed(() => !!node.unary);

// ---- values ---------------------------------------------------------------
const singleValue = computed(() => (node.values[0]?.value ?? ""));
const boolValue = computed(() => {
  const v = node.values[0]?.value;
  return v === undefined ? true : v;
});

const onSingle = (val) => {
  node.values = val === "" || val == null ? [] : [makeValue(val)];
  emit("change");
};
const onBool = (val) => {
  node.values = [makeValue(val, String(val))];
  emit("change");
};
const onComboValues = (vals) => {
  node.values = (vals || []).map((v) =>
    typeof v === "object" ? v : makeValue(v)
  );
  emit("change");
};
const onEntityPicked = (entity) => {
  const id = entity.short_id || entity.id;
  if (!node.values.some((v) => v.value === id)) {
    node.values.push(makeValue(id, entity.display_name || id));
  }
  adderKey.value++;
  emit("change");
};
const removeValue = (i) => {
  node.values.splice(i, 1);
  emit("change");
};
</script>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}
.field-prop { min-width: 190px; max-width: 240px; }
.field-op { min-width: 130px; max-width: 170px; flex: 0 0 auto; }
.field-value { min-width: 160px; }
.value-area {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1 1 auto;
  min-width: 180px;
}
.value-chip { margin-right: 2px; }
.value-adder { min-width: 200px; flex: 1 1 auto; }
.row-field :deep(.v-field) { font-size: 0.9rem; }
.row-remove { margin-left: auto; opacity: 0.6; }
.row-remove:hover { opacity: 1; }
</style>
