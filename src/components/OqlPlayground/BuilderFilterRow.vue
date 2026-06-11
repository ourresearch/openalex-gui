<template>
  <div class="filter-row">
    <span class="clause-num">{{ number }}</span>

    <!-- inline join word (on every row after the first); controls the group's join -->
    <v-chip v-if="showJoin" class="join-chip" size="small" label variant="tonal" color="deep-purple"
      @click="$emit('toggle-join')">{{ join }}</v-chip>
    <span v-else class="join-spacer"></span>

    <!-- FIELD chip — reuses the SERP's shared SelectionMenu (popular-first +
         search-all + "More"), fed from the builder's own OQL property vocabulary. -->
    <SelectionMenu
      :all-keys="allFieldKeys"
      :popular-keys="popularFields"
      :get-display-name="getFieldDisplayName"
      :get-icon="getFieldIcon"
      location="bottom start"
      :offset="[4, 0]"
      search-placeholder="Search all fields"
      more-dialog-title="All fields"
      @select="pickField"
    >
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="part-chip" :class="{ unset: !prop }" label size="small"
          :variant="prop ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
          {{ prop ? (prop.display_name || prop.name) : 'select field' }}
        </v-chip>
      </template>
    </SelectionMenu>

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
      <!-- boolean: inline toggle -->
      <v-btn-toggle v-if="valueKind === 'boolean'" :model-value="boolValue" @update:model-value="onBool"
        density="compact" variant="outlined" divided mandatory class="bool-toggle">
        <v-btn :value="true" size="x-small">true</v-btn>
        <v-btn :value="false" size="x-small">false</v-btn>
      </v-btn-toggle>

      <!-- entity / scalar: recursive value tree (multi-value + nested boolean values) -->
      <BuilderValueGroup
        v-else-if="node.vtree"
        :group="node.vtree"
        :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity"
        :numeric="node.numeric"
        is-root
        @change="$emit('change')"
      />
    </template>

    <v-spacer />
    <v-btn v-if="canRemove" class="row-remove" icon="mdi-close" size="x-small" variant="text"
      density="comfortable" @click="$emit('remove')" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import BuilderValueGroup from "@/components/OqlPlayground/BuilderValueGroup.vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
import {
  uiOperatorsForProperty, valueKindForProperty, autocompleteEntityFor,
  matchOperator, initialVTreeFor,
} from "@/components/OqlPlayground/oqoTree";
import { fieldKeys, popularFieldKeys, fieldIcon } from "@/components/OqlPlayground/builderFieldMeta";

defineOptions({ name: "BuilderFilterRow" });

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  number: { type: String, default: "" },
  showJoin: { type: Boolean, default: false },
  join: { type: String, default: "and" },
  canRemove: { type: Boolean, default: true },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node; // shared reactive tree node (stable per :key)

// ---- property + derived -----------------------------------------------------
const prop = computed(() => props.properties[node.column_id] || null);
const valueKind = computed(() => valueKindForProperty(prop.value));
const autocompleteEntity = computed(() => autocompleteEntityFor(prop.value));

// ---- field picker (shared SelectionMenu) ------------------------------------
const allFieldKeys = computed(() => fieldKeys(props.properties));
const popularFields = computed(() => popularFieldKeys(props.entity, allFieldKeys.value));
const getFieldDisplayName = (k) => props.properties[k]?.display_name || k;
const getFieldIcon = (k) => fieldIcon(props.entity, k, props.properties);

const pickField = (v) => {
  const k = valueKindForProperty(props.properties[v]);
  const opts = uiOperatorsForProperty(props.properties[v]);
  const first = opts[0] || { op: "is", neg: false, unary: false };
  node.column_id = v;
  node.op = first.op; node.neg = first.neg; node.unary = first.unary;
  node.numeric = k === "number";
  node.vtree = first.unary ? null : initialVTreeFor(k);
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
  if (o.unary) node.vtree = null;
  else if (!node.vtree) node.vtree = initialVTreeFor(valueKind.value);
  emit("change");
};

// ---- boolean ----------------------------------------------------------------
const boolValue = computed(() => node.vtree?.items?.[0]?.value);
const onBool = (val) => {
  if (val == null || !node.vtree?.items?.[0]) return;
  node.vtree.items[0].value = val;
  node.vtree.items[0].label = String(val);
  emit("change");
};
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
.part-chip:not(.op-chip):not(.unset) {
  background-color: rgba(0, 0, 0, 0.07) !important;
  color: rgba(0, 0, 0, 0.87) !important;
}
.part-chip.unset { background-color: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.op-chip { color: rgba(0, 0, 0, 0.78) !important; }
.bool-toggle { height: 28px; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
.row-remove { opacity: 0.5; }
.row-remove:hover { opacity: 1; }
</style>
