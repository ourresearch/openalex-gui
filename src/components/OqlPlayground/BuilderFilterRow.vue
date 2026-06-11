<template>
  <div class="brow">
    <span class="c-num">{{ number }}</span>
    <span class="c-conn">
      <v-chip v-if="connectorText && connectorToggle" class="conn-chip" size="small" label variant="flat"
        @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
      <v-chip v-else-if="connectorText" class="kw-chip" size="small" label
        variant="flat">{{ connectorText }}</v-chip>
    </span>

    <!-- FIELD (property) chip — shared SelectionMenu (popular + search + "More") -->
    <SelectionMenu
      :all-keys="allFieldKeys"
      :popular-keys="popularFields"
      :get-display-name="getFieldDisplayName"
      :get-icon="getFieldIcon"
      location="bottom start"
      :offset="[4, 0]"
      search-placeholder="Search all fields"
      custom-more
      @select="pickField"
      @more="fieldDialog = true"
    >
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="prop-chip" :class="{ unset: !prop }" label size="small"
          :variant="prop ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
          {{ prop ? (prop.display_name || prop.name) : 'select field' }}
        </v-chip>
      </template>
    </SelectionMenu>
    <!-- "More" → categorized field tour (grouped by registry category) -->
    <BuilderFieldDialog v-model="fieldDialog" :properties="properties" @select="pickField" />

    <!-- OPERATOR (relation) -->
    <v-menu v-if="prop" location="bottom start" offset="4">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="op-chip" label size="small" variant="flat"
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
      <!-- boolean: one value brick + dropdown, same UX as the enum select bricks.
           (Condensing property+value into ONE "it's open access" brick needs
           bool_true/bool_false on /properties — oxjob #447.) -->
      <v-menu v-if="valueKind === 'boolean'" location="bottom start" offset="4">
        <template #activator="{ props: mp }">
          <v-chip v-bind="mp" class="bool-chip" label size="small" variant="flat"
            append-icon="mdi-menu-down">{{ String(boolValue) }}</v-chip>
        </template>
        <v-card min-width="120" class="menu-card">
          <v-list density="compact" class="py-0">
            <v-list-item title="true" :active="boolValue === true" @click="onBool(true)" />
            <v-list-item title="false" :active="boolValue === false" @click="onBool(false)" />
          </v-list>
        </v-card>
      </v-menu>

      <!-- entity / scalar: flat value list. Keyed by the vtree id so picking a
           new field (fresh vtree) re-mounts a clean editor + fires its autofocus. -->
      <BuilderValueGroup
        v-else-if="node.vtree"
        :key="node.vtree._id"
        :group="node.vtree"
        :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity"
        :numeric="node.numeric"
        :autofocus="valueFocus"
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
import { computed, ref } from "vue";
import BuilderValueGroup from "@/components/OqlPlayground/BuilderValueGroup.vue";
import BuilderFieldDialog from "@/components/OqlPlayground/BuilderFieldDialog.vue";
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
  // Connector word in the gutter: "where" (root's first, static) or "and"/"or"
  // (toggles the group join). null = none (a clause's first child).
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

// Bumped whenever a fresh value editor should grab focus (field/operator picked).
const valueFocus = ref(0);
const fieldDialog = ref(false);

const pickField = (v) => {
  const k = valueKindForProperty(props.properties[v]);
  const opts = uiOperatorsForProperty(props.properties[v]);
  const first = opts[0] || { op: "is", neg: false, unary: false };
  node.column_id = v;
  node.op = first.op; node.neg = first.neg; node.unary = first.unary;
  node.numeric = k === "number";
  node.vtree = first.unary ? null : initialVTreeFor(k);
  if (!first.unary) valueFocus.value++;
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
  else if (!node.vtree) { node.vtree = initialVTreeFor(valueKind.value); valueFocus.value++; }
  emit("change");
};

// ---- boolean (one value brick + true/false dropdown) --------------------------
const boolValue = computed(() => node.vtree?.items?.[0]?.value);
const onBool = (val) => {
  if (val == null || !node.vtree?.items?.[0]) return;
  node.vtree.items[0].value = val;
  node.vtree.items[0].label = String(val);
  emit("change");
};
</script>

<style scoped>
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
  min-width: var(--num-w);
  white-space: nowrap;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
.c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
.conn-chip {
  cursor: pointer;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* static keyword bricks (Find / where / sort): equal width, solid gray, inert */
.kw-chip {
  width: var(--conn-w);
  justify-content: center;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
.prop-chip { cursor: pointer; }
.prop-chip:not(.unset) {
  background-color: var(--prop-bg) !important;
  color: var(--prop-fg) !important;
}
.prop-chip.unset { background-color: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.op-chip {
  cursor: pointer;
  color: var(--rel-fg) !important;
  background: var(--rel-bg) !important;
}
/* boolean value brick — teal like every other value */
.bool-chip {
  cursor: pointer;
  background: var(--val-bg, #ccfbf1) !important;
  color: var(--val-fg, #0f766e) !important;
}
.menu-card { overflow: hidden; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
