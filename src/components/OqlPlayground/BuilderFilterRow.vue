<template>
  <div class="brow">
    <!-- rows inside a subquery carry no line number (iter 15) -->
    <span v-if="number !== ''" class="c-num">{{ number }}</span>
    <span class="c-conn">
      <v-chip v-if="connectorText && connectorToggle" class="conn-chip" size="small" label variant="flat"
        @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
      <v-chip v-else-if="connectorText" class="kw-chip" size="small" label
        variant="flat">{{ connectorText }}</v-chip>
    </span>

    <!-- everything after the gutter wraps INSIDE this body (iter 18): the
         number/connector stay pinned to the first line, and wrapped values
         share the property column's left margin instead of dropping to a
         flush-left block. -->
    <div class="row-body">

    <!-- FIELD (property) chip — shared SelectionMenu (popular + search + "More").
         Controlled open: a pending row (no field yet) auto-opens this menu;
         closing it without picking abandons the row (iter 13). In condensed
         boolean mode the sentence brick replaces this chip; the menu keeps a
         zero-size anchor so "change field…" can still open it. -->
    <SelectionMenu
      v-model:open="fieldMenuOpen"
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
        <span v-if="condensed" v-bind="mp" class="field-anchor"></span>
        <v-chip v-else v-bind="mp" class="prop-chip" :class="{ unset: !prop }" label size="small"
          :variant="prop ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
          {{ prop ? (prop.display_name || prop.name) : 'select field' }}
        </v-chip>
      </template>
    </SelectionMenu>
    <!-- "More" → categorized field tour (grouped by registry category) -->
    <BuilderFieldDialog v-model="fieldDialog" :properties="properties" @select="pickField" />

    <!-- CONDENSED BOOLEAN — the whole clause is ONE sentence brick ("it's open
         access" / "it's not open access"), the way OQL itself renders booleans.
         Phrasings come from /properties bool_true/bool_false (eapi #428 v2.1.0);
         booleans without a curated sentence fall back to the chips below. -->
    <v-menu v-if="condensed" location="bottom start" offset="4">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="prop-chip bool-sentence" label size="small" variant="flat"
          append-icon="mdi-menu-down">{{ boolValue === false ? boolPhrase.false : boolPhrase.true }}</v-chip>
      </template>
      <v-card min-width="220" class="menu-card">
        <v-list density="compact" class="py-0">
          <v-list-item :title="boolPhrase.true" :active="boolValue === true" @click="onBool(true)" />
          <v-list-item :title="boolPhrase.false" :active="boolValue === false" @click="onBool(false)" />
          <template v-if="unaryOp">
            <v-divider />
            <v-list-item :title="unaryOp.label" @click="pickOperator(unaryOp.key)" />
          </template>
          <v-divider />
          <v-list-item title="change field…" class="change-field" @click="fieldMenuOpen = true" />
        </v-list>
      </v-card>
    </v-menu>

    <!-- OPERATOR (relation) -->
    <v-menu v-if="prop && !condensed" location="bottom start" offset="4">
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
      <!-- boolean without a curated sentence: value brick + true/false dropdown -->
      <v-menu v-if="valueKind === 'boolean' && !condensed" location="bottom start" offset="4">
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
           new field (fresh vtree) re-mounts a clean editor + fires its autofocus.
           (NOT for booleans — condensed mode handles its own value; without the
           kind guard the v-else-if falls through and renders a stray editor.) -->
      <BuilderValueGroup
        v-else-if="valueKind !== 'boolean' && node.vtree"
        :key="node.vtree._id"
        :group="node.vtree"
        :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity"
        :numeric="node.numeric"
        :autofocus="valueFocus"
        :single-value="singleValue"
        is-root
        @change="$emit('change')"
        @abandoned="onValueAbandoned"
      />
    </template>

    </div>

    <v-btn v-if="canRemove" class="row-remove" icon="mdi-close" size="x-small" variant="text"
      density="comfortable" @click="$emit('remove')" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from "vue";
import BuilderValueGroup from "@/components/OqlPlayground/BuilderValueGroup.vue";
import BuilderFieldDialog from "@/components/OqlPlayground/BuilderFieldDialog.vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
import {
  uiOperatorsForProperty, valueKindForProperty, autocompleteEntityFor,
  matchOperator, initialVTreeFor, vtreeHasValue, isInequalityOp,
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

// Condensed boolean (#428): when the registry carries the curated OQL sentence
// pair, the whole clause renders as one brick. Unary ("is unknown") rows keep
// the regular field+operator chips — the sentence doesn't apply.
const boolPhrase = computed(() => {
  const p = prop.value;
  return p && p.bool_true && p.bool_false ? { true: p.bool_true, false: p.bool_false } : null;
});
const condensed = computed(() => valueKind.value === "boolean" && !node.unary && !!boolPhrase.value);

// ---- field picker (shared SelectionMenu) ------------------------------------
const allFieldKeys = computed(() => fieldKeys(props.properties));
const popularFields = computed(() => popularFieldKeys(props.entity, allFieldKeys.value));
const getFieldDisplayName = (k) => props.properties[k]?.display_name || k;
const getFieldIcon = (k) => fieldIcon(props.entity, k, props.properties);

// Bumped whenever a fresh value editor should grab focus (field/operator picked).
const valueFocus = ref(0);
const fieldDialog = ref(false);
const fieldMenuOpen = ref(false);

// ---- ephemeral creation (iter 13) --------------------------------------------
// A pending row (no field yet — just added via the add brick) auto-opens its
// field menu. Closing the menu (or the "More" dialog) without picking a field
// abandons the row: it disappears and the add brick reappears. Likewise a row
// whose VALUE editor is abandoned while empty removes itself — a filter can't
// sit there empty.
onMounted(() => {
  if (!node.column_id) nextTick(() => { fieldMenuOpen.value = true; });
});
watch(fieldMenuOpen, (open) => {
  if (open) return;
  // delay: a select lands before close; "More" flips fieldDialog right after close
  setTimeout(() => {
    if (!node.column_id && !fieldDialog.value) emit("remove");
  }, 120);
});
watch(fieldDialog, (open) => {
  if (open) return;
  setTimeout(() => { if (!node.column_id) emit("remove"); }, 120);
});
const onValueAbandoned = () => {
  // grace period: ignore if focus just moved into another menu of this row
  setTimeout(() => {
    if (node.column_id && !node.unary && !vtreeHasValue(node.vtree)
        && !document.querySelector(".v-overlay--active")) {
      emit("remove");
    }
  }, 150);
};

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
// Inequalities take exactly one value — `year >= (2016 or 2020)` is never meant.
const singleValue = computed(() => isInequalityOp(node.op));
// the unary option ("is unknown"), surfaced inside the condensed sentence menu
const unaryOp = computed(() => operatorItems.value.find((o) => o.unary) || null);
const pickOperator = (key) => {
  const o = operatorItems.value.find((x) => x.key === key);
  if (!o) return;
  node.op = o.op; node.neg = o.neg; node.unary = o.unary;
  if (o.unary) node.vtree = null;
  else if (!node.vtree) { node.vtree = initialVTreeFor(valueKind.value); valueFocus.value++; }
  else if (isInequalityOp(o.op) && node.vtree.items.length > 1) {
    // switching a multi-value row to an inequality keeps just the first filled value
    const filled = (it) => it.value !== "" && it.value != null;
    node.vtree.items = [node.vtree.items.find(filled) || node.vtree.items[0]];
  }
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
  align-items: flex-start;
  gap: var(--gx);
  flex-wrap: nowrap;
  padding: 2px 0;
  min-height: 34px;
}
/* the wrapping body: number/connector/remove are pinned to the first line; the
   property/operator/values flow and wrap here, so wrapped lines align at the
   property column (iter 18) */
.row-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gx);
  row-gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 30px;
}
.c-num {
  flex: 0 0 auto;
  min-width: var(--num-w);
  white-space: nowrap;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 8px;
}
.c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
  margin-top: 2px;
}
.row-remove { margin-top: 2px; }
/* all gutter bricks are equal width (fill the connector column) */
.conn-chip {
  cursor: pointer;
  width: var(--conn-w);
  justify-content: center;
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
/* zero-size anchor keeping the field menu attachable in condensed mode */
.field-anchor { width: 0; height: 0; padding: 0; display: inline-block; }
.change-field { color: rgba(0, 0, 0, 0.55); }
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
