<template>
  <div class="brow">
    <!-- number + connector columns (top-level rows) -->
    <template v-if="!nested">
      <span class="c-num">{{ number }}</span>
      <span class="c-conn">
        <span v-if="connectorText && connectorToggle" class="conn-chip" @click="$emit('toggle-join')">{{ connectorText }}</span>
        <span v-else-if="connectorText" class="conn-word">{{ connectorText }}</span>
      </span>
    </template>
    <!-- nested rows: the decimal number slides right into the gutter; no connector -->
    <span v-else class="c-num c-num-nested">{{ number }}</span>

    <!-- FIELD (property) chip — shared SelectionMenu (popular + search + "More") -->
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
        <v-chip v-bind="mp" class="prop-chip" :class="{ unset: !prop }" label size="small"
          :variant="prop ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
          {{ prop ? (prop.display_name || prop.name) : 'select field' }}
        </v-chip>
      </template>
    </SelectionMenu>

    <!-- OPERATOR (relation) -->
    <v-menu v-if="prop" location="bottom start" offset="4">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="op-chip" label size="small" variant="text"
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
      <!-- boolean: inline toggle (it's-phrasing deferred until /properties exposes it) -->
      <v-btn-toggle v-if="valueKind === 'boolean'" :model-value="boolValue" @update:model-value="onBool"
        density="compact" variant="outlined" divided mandatory class="bool-toggle">
        <v-btn :value="true" size="x-small">true</v-btn>
        <v-btn :value="false" size="x-small">false</v-btn>
      </v-btn-toggle>

      <!-- entity / scalar: flat value list -->
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
  // Grid placement: nested rows push the decimal number into the gutter and show
  // no per-row connector (the group join lives in the group's header).
  nested: { type: Boolean, default: false },
  // Connector word in the gutter for top-level rows: "where" (first, static) or
  // "and"/"or" (toggles the group join). null = none.
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
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
/* Grid row. Column widths + colours come from CSS vars set on .builder so every
   row, the group headers, the add lines and the entity line all line up. */
.brow {
  display: flex;
  align-items: center;
  gap: var(--gx);
  flex-wrap: wrap;
  padding: 2px 0;
  min-height: 34px;
}
.c-num {
  flex: 0 0 auto;
  width: var(--num-w);
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
/* nested rows: number spans num+gap+connector and right-aligns at the property edge */
.c-num-nested { width: calc(var(--num-w) + var(--gx) + var(--conn-w)); }
.c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
.conn-word { color: var(--conn-fg); font-size: 0.78rem; }
.conn-chip {
  cursor: pointer;
  color: var(--conn-fg);
  background: var(--conn-bg);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.72rem;
  text-transform: lowercase;
}
.prop-chip { cursor: pointer; }
.prop-chip:not(.unset) {
  background-color: var(--prop-bg) !important;
  color: var(--prop-fg) !important;
}
.prop-chip.unset { background-color: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.op-chip { cursor: pointer; color: var(--rel-fg) !important; }
.bool-toggle { height: 28px; }
.menu-card { overflow: hidden; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
