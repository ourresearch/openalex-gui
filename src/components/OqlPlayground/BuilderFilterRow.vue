<template>
  <!-- One filter clause, LINE-FLOW (oxjob #428 #2+#3). The predicate
       `[conn] [field] [op] [value]` is one `.bline`; when the value is a nested
       boolean tree it BREAKS — the open paren sits at the END of this predicate
       line (Jason's key ask) and BuilderValueGroup renders the value items + the
       close paren on the following lines. A flat/single value stays inline. -->
  <div class="bline" :class="{ 'row-hover': rowHover }" :style="{ '--depth': depth }"
    @mouseenter="rowHover = true" @mouseleave="rowHover = false">
    <div class="bl-body">
      <!-- leading connector (where / and / or). "where" is a static keyword; the
           join is a toggle that flips this clause group's conjunction. -->
      <template v-if="connectorText">
        <v-chip v-if="connectorToggle" class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
        <v-chip v-else class="kw-chip" size="small" label variant="flat">{{ connectorText }}</v-chip>
      </template>

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
           access" / "it's not(open access)"), the way OQL itself renders booleans. -->
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

        <!-- entity / scalar, INLINE (flat list or single value): the value bricks
             flow on this predicate line. Keyed by the vtree id so picking a new
             field (fresh vtree) re-mounts a clean editor + fires its autofocus. -->
        <BuilderValueGroup
          v-else-if="usesValueGroup && !valueIsBlock"
          ref="valueGroupRef"
          :key="node.vtree._id"
          :group="node.vtree"
          :depth="depth"
          is-root
          :value-kind="valueKind"
          :autocomplete-entity="autocompleteEntity"
          :list-vocab="isListVocab"
          :numeric="node.numeric"
          :autofocus="valueFocus"
          :single-value="singleValue"
          @change="$emit('change')"
          @abandoned="onValueAbandoned"
          @remove-group="$emit('remove')"
        />

        <!-- entity / scalar, BLOCK (nested boolean tree): the open paren lands here
             at the end of the predicate line; the items + close paren follow below. -->
        <ParenBrick v-else-if="usesValueGroup && valueIsBlock" label="(" :actions="openParenActions" />
      </template>

      <!-- remove = a small trash at the END of the row content, hover-revealed.
           Suppressed for a BLOCK value — its close-paren line owns delete. -->
      <v-btn v-if="canRemove && !valueIsBlock" class="row-trash" icon size="x-small" variant="text"
        density="comfortable" @click="$emit('remove')">
        <v-icon size="14">mdi-delete-outline</v-icon>
        <v-tooltip activator="parent" location="top">Remove this filter</v-tooltip>
      </v-btn>
    </div>
  </div>

  <!-- BLOCK value continuation: the value items (one level in) + the close paren
       line. The open paren is already on the predicate line above. -->
  <BuilderValueGroup
    v-if="usesValueGroup && valueIsBlock"
    ref="valueGroupRef"
    :key="`block-${node.vtree._id}`"
    :group="node.vtree"
    :depth="depth"
    is-root
    :value-kind="valueKind"
    :autocomplete-entity="autocompleteEntity"
    :list-vocab="isListVocab"
    :numeric="node.numeric"
    :single-value="singleValue"
    @change="$emit('change')"
    @abandoned="onValueAbandoned"
    @remove-group="$emit('remove')"
  />
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from "vue";
import BuilderValueGroup from "@/components/OqlPlayground/BuilderValueGroup.vue";
import BuilderFieldDialog from "@/components/OqlPlayground/BuilderFieldDialog.vue";
import ParenBrick from "@/components/OqlPlayground/ParenBrick.vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
import {
  uiOperatorsForProperty, valueKindForProperty, autocompleteEntityFor,
  matchOperator, initialVTreeFor, vtreeHasValue, isInequalityOp, isListVocabEntity, isVGroup,
} from "@/components/OqlPlayground/oqoTree";
import { fieldKeys, popularFieldKeys, fieldIcon } from "@/components/OqlPlayground/builderFieldMeta";

defineOptions({ name: "BuilderFilterRow" });

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  // Indent level of this row's predicate line.
  depth: { type: Number, default: 0 },
  // Leading connector word: "where" (root's first, static) or "and"/"or" (toggles
  // the group join). null = none (a clause's first child).
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
  canRemove: { type: Boolean, default: true },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node; // shared reactive tree node (stable per :key)
const valueGroupRef = ref(null);

// ---- property + derived -----------------------------------------------------
const prop = computed(() => props.properties[node.column_id] || null);
const valueKind = computed(() => valueKindForProperty(prop.value));
const autocompleteEntity = computed(() => autocompleteEntityFor(prop.value));
// entity values come from a fixed `/{entity-type}` list (type/country/…) vs the
// `/autocomplete/{entity}` search (iter 20: both are "entity", no enum kind)
const isListVocab = computed(() => isListVocabEntity(prop.value));
// the value editor uses the value-tree component (entity/scalar/text — not boolean,
// not unary, and only once a field with a fresh vtree is picked)
const usesValueGroup = computed(() =>
  !!(prop.value && !node.unary && valueKind.value !== "boolean" && node.vtree));
// the value is a nested sub-clause tree → it breaks onto its own lines (the open
// paren goes on the predicate line, the items + close paren below)
const valueIsBlock = computed(() => !!(node.vtree && node.vtree.items.some(isVGroup)));

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

// Row-hover state drives the hover-revealed controls (trash + add-value +).
// JS-driven (a class), not CSS :hover — see the style note below.
const rowHover = ref(false);

// Bumped whenever a fresh value editor should grab focus (field/operator picked).
const valueFocus = ref(0);
const fieldDialog = ref(false);
const fieldMenuOpen = ref(false);

// ---- ephemeral creation (iter 13) --------------------------------------------
// A pending row (no field yet) auto-opens its field menu. Closing the menu (or the
// "More" dialog) without picking a field abandons the row. Likewise a row whose
// VALUE editor is abandoned while empty removes itself.
onMounted(() => {
  if (!node.column_id) nextTick(() => { fieldMenuOpen.value = true; });
});
watch(fieldMenuOpen, (open) => {
  if (open) return;
  setTimeout(() => {
    if (!node.column_id && !fieldDialog.value) emit("remove");
  }, 120);
});
watch(fieldDialog, (open) => {
  if (open) return;
  setTimeout(() => { if (!node.column_id) emit("remove"); }, 120);
});
const onValueAbandoned = () => {
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
  node.op = first.op; node.neg = false; node.unary = first.unary;
  node.numeric = k === "number";
  node.vtree = first.unary ? null : initialVTreeFor(k);
  if (!first.unary) valueFocus.value++;
  emit("change");
};

// ---- operator ---------------------------------------------------------------
const operatorItems = computed(() => uiOperatorsForProperty(prop.value));
const currentOp = computed(() => matchOperator(prop.value, node.op, node.unary));
const isUnary = computed(() => !!node.unary);
// Inequalities take exactly one value — `year >= (2016 or 2020)` is never meant.
const singleValue = computed(() => isInequalityOp(node.op));
// the unary option ("is unknown"), surfaced inside the condensed sentence menu
const unaryOp = computed(() => operatorItems.value.find((o) => o.unary) || null);
const pickOperator = (key) => {
  const o = operatorItems.value.find((x) => x.key === key);
  if (!o) return;
  node.op = o.op; node.neg = false; node.unary = o.unary;
  if (o.unary) node.vtree = null;
  else if (!node.vtree) { node.vtree = initialVTreeFor(valueKind.value); valueFocus.value++; }
  else if (isInequalityOp(o.op) && node.vtree.items.length > 1) {
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

// ---- open-paren menu (block value) ------------------------------------------
// The open paren sits on the predicate line but its actions operate on the value
// group below — delegate to the mounted BuilderValueGroup's exposed methods (single
// source of truth for those mutations). "Remove group" on the root value = delete
// the whole filter row.
const openParenActions = computed(() => {
  const out = [
    { key: "add", title: "Add value", icon: "mdi-plus", run: () => valueGroupRef.value?.triggerAddValue() },
    { key: "clause", title: "Add clause", icon: "mdi-plus-box-multiple-outline", run: () => valueGroupRef.value?.addClause() },
  ];
  if (!singleValue.value) out.push({ key: "neg", title: "Negate", icon: "mdi-not-equal-variant", run: () => valueGroupRef.value?.negate() });
  out.push({ key: "rm", title: "Remove group", icon: "mdi-delete-outline", run: () => emit("remove") });
  return out;
});
</script>

<style scoped>
/* Line primitives (duplicated per builder component; counter `bline` is global). */
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
/* hover-revealed row controls (iter 19): the trash and the add-value + only
   appear while the pointer is over the row. The reveal is driven by a JS class
   (.row-hover), not CSS :hover. And NOTE: App.vue's ghost-variant reset forces
   `opacity: 1 !important` on every text-variant v-btn, so hide via VISIBILITY and
   dim via the inner icon's opacity. The picker + stays visible while its menu is
   open (aria-expanded) even if the pointer leaves. */
.row-trash { visibility: hidden; }
.bline.row-hover .row-trash { visibility: visible; }
.row-trash :deep(.v-icon) { opacity: 0.45; }
.row-trash:hover :deep(.v-icon) { opacity: 1; }
.bline :deep(.add-val-btn) { visibility: hidden; }
.bline.row-hover :deep(.add-val-btn),
.bline :deep(.add-val-btn[aria-expanded="true"]) { visibility: visible; }
/* connector (and/or) brick — amber, toggles the join */
.conn-chip {
  cursor: pointer;
  justify-content: center;
  padding: 0 6px;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* static keyword bricks (where) — solid gray, inert */
.kw-chip {
  justify-content: center;
  padding: 0 6px;
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
</style>
