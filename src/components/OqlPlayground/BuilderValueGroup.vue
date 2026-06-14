<template>
  <!-- A RECURSIVE value tree for ONE property (oxjob #428 iter 20 — Jason), now in
       LINE-FLOW (#2+#3): items are value leaves (BuilderValueBrick) OR nested value
       sub-groups, one conjunction per group, mixing only by nesting — the clause
       tree model inside a single filter's value. Mirrors the server's canonical
       render: `title contains (beaver and (dam or pond))` is ONE row.

       A flat value list renders INLINE: `( a or b )`. As soon as the group holds a
       SUB-CLAUSE it BREAKS into lines, with TRAILING connectors (`a and`, `(b or c)
       and`, last item bare) — the value tree's pretty-print convention. The value
       tree's open paren is on the predicate line (rendered by the row) when this is
       the row's ROOT value; a nested value sub-group renders its own `(` line. -->

  <!-- BLOCK: the value broke onto its own lines (trailing connectors) -->
  <template v-if="block">
    <!-- a nested value sub-group renders its OWN open paren line; the ROOT value's
         open paren is already on the predicate line (rendered by the row) -->
    <div v-if="!isRoot" class="bline" :style="{ '--depth': depth }">
      <div class="bl-body"><ParenBrick label="(" :actions="parenActions" /></div>
    </div>

    <!-- items, one level in; each carries a TRAILING connector except the last -->
    <template v-for="(it, i) in group.items" :key="it._id">
      <!-- a sub-group that itself breaks → recurse (its own ( / items / ) lines,
           the trailing connector rides on its close line) -->
      <BuilderValueGroup
        v-if="isBlockItem(it)"
        :group="it"
        :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity"
        :list-vocab="listVocab"
        :numeric="numeric"
        :single-value="false"
        :is-root="false"
        :depth="depth + 1"
        :trailing-connector="i < group.items.length - 1 ? group.vjoin : null"
        @change="$emit('change')"
        @toggle-trailing="toggleJoin"
        @remove-group="removeItem(i)"
        @add-sibling="addSiblingGroupAfter(i)"
      />
      <!-- a value leaf, or a FLAT sub-group → one line, value inline + trailing conn -->
      <div v-else class="bline" :style="{ '--depth': depth + 1 }">
        <div class="bl-body">
          <BuilderValueGroup v-if="isVGroup(it)"
            :group="it" :value-kind="valueKind" :autocomplete-entity="autocompleteEntity"
            :list-vocab="listVocab" :numeric="numeric" :single-value="false" :is-root="false"
            :depth="depth + 1"
            @change="$emit('change')" @remove-group="removeItem(i)" @add-sibling="addSiblingGroupAfter(i)" />
          <BuilderValueBrick v-else :item="it" :value-kind="valueKind" :numeric="numeric"
            :single-value="singleValue" :autocomplete-entity="autocompleteEntity"
            :removable="group.items.length > 1"
            @change="$emit('change')" @remove="removeItem(i)" @blur="onBrickBlur(i)" @enter="onValueEnter" />
          <v-chip v-if="i < group.items.length - 1" class="vjoin" size="small" label variant="flat"
            @click="toggleJoin">{{ group.vjoin }}</v-chip>
        </div>
      </div>
    </template>

    <!-- close paren line: ) [trailing conn for a nested group] [hover +/trash] -->
    <div class="bline vg-close" :style="{ '--depth': depth }"
      @mouseenter="closeHover = true" @mouseleave="closeHover = false">
      <div class="bl-body">
        <ParenBrick label=")" :actions="parenActions" />
        <v-chip v-if="trailingConnector" class="vjoin" size="small" label variant="flat"
          @click="$emit('toggle-trailing')">{{ trailingConnector }}</v-chip>
        <span class="vg-close-actions" :class="{ shown: closeHover }">
          <v-btn class="vg-act" icon size="x-small" variant="text" density="comfortable" @click="onAddSibling">
            <v-icon size="16">mdi-plus</v-icon>
            <v-tooltip activator="parent" location="top">Add a clause after this</v-tooltip>
          </v-btn>
          <v-btn class="vg-act" icon size="x-small" variant="text" density="comfortable" @click="removeGroup">
            <v-icon size="14">mdi-delete-outline</v-icon>
            <v-tooltip activator="parent" location="top">Delete this clause</v-tooltip>
          </v-btn>
        </span>
        <!-- entity-picker anchor for the paren menu's "Add value" (block mode) -->
        <BuilderAddValue v-if="isPicker && !singleValue" ref="addValueRef" anchor-only
          :value-kind="valueKind" :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab"
          @pick="addPickedValue" @abandon="onPickerAbandon" />
      </div>
    </div>
  </template>

  <!-- INLINE: a flat parenthesized value list (flows in the predicate line / its
       parent's item line). display:contents so the bricks join the surrounding row. -->
  <span v-else ref="rootEl" class="vgroup">
    <ParenBrick v-if="showParens" label="(" :actions="parenActions" />
    <template v-for="(it, i) in group.items" :key="it._id">
      <v-chip v-if="i > 0" class="vjoin" size="small" label variant="flat" @click="toggleJoin">{{ group.vjoin }}</v-chip>
      <BuilderValueBrick :item="it" :value-kind="valueKind" :numeric="numeric"
        :single-value="singleValue" :autocomplete-entity="autocompleteEntity"
        :removable="group.items.length > 1"
        @change="$emit('change')" @remove="removeItem(i)" @blur="onBrickBlur(i)" @enter="onValueEnter" />
    </template>
    <ParenBrick v-if="showParens" label=")" :actions="parenActions" />
    <BuilderAddValue v-if="!singleValue" ref="addValueRef" :value-kind="valueKind"
      :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab"
      @add="addEmptyValue" @pick="addPickedValue" @abandon="onPickerAbandon" />
  </span>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import ParenBrick from "@/components/OqlPlayground/ParenBrick.vue";
import BuilderValueBrick from "@/components/OqlPlayground/BuilderValueBrick.vue";
import BuilderAddValue from "@/components/OqlPlayground/BuilderAddValue.vue";
import {
  makeVLeaf, makeVGroup, isVGroup, vtreeHasValue, deMorganGroup,
} from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderValueGroup" });

const props = defineProps({
  group: { type: Object, required: true },
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  listVocab: { type: Boolean, default: false },
  numeric: { type: Boolean, default: false },
  // inequality operators take exactly one value -> no add-value, no negate
  singleValue: { type: Boolean, default: false },
  // true = the row's top-level value group (open paren on the predicate line);
  // false = a nested value sub-group (renders its own open paren line)
  isRoot: { type: Boolean, default: true },
  autofocus: { type: Number, default: 0 },
  // indent level of this group's paren lines (block mode)
  depth: { type: Number, default: 0 },
  // connector shown AFTER this (nested) group's close paren, when it's not the
  // last sibling in its parent group. Toggling it flips the PARENT's join.
  trailingConnector: { type: String, default: null },
});
const emit = defineEmits(["change", "abandoned", "remove-group", "add-sibling", "toggle-trailing"]);

const group = props.group; // shared reactive value-group (stable per :key)
const rootEl = ref(null);
const addValueRef = ref(null);
const closeHover = ref(false);

const isPicker = computed(() => props.valueKind === "entity");
// A group that holds a nested sub-clause breaks into lines; a flat list stays
// inline. Inline parens show for a nested group or once there are 2+ items.
const hasSubclause = computed(() => group.items.some(isVGroup));
const block = computed(() => hasSubclause.value);
const showParens = computed(() => !props.isRoot || group.items.length > 1 || hasSubclause.value);
// an item that itself breaks onto lines (a sub-group with its own sub-clause)
const isBlockItem = (it) => isVGroup(it) && it.items.some(isVGroup);

const focusValue = () => {
  if (isPicker.value) { addValueRef.value?.openPicker(); return; }
  nextTick(() => {
    const inputs = rootEl.value?.querySelectorAll(".val-input");
    if (inputs && inputs.length) inputs[inputs.length - 1].focus();
  });
};
onMounted(() => { if (props.autofocus) focusValue(); });
watch(() => props.autofocus, (v) => { if (v) focusValue(); });

// One shared conjunction for the group — toggling any join flips them all.
const toggleJoin = () => { group.vjoin = group.vjoin === "and" ? "or" : "and"; emit("change"); };

// ---- per-group paren dropdown ({ Add value, Add clause, Negate, Remove group }) ----
const parenActions = computed(() => {
  const out = [
    { key: "add", title: "Add value", icon: "mdi-plus", run: triggerAddValue },
    { key: "clause", title: "Add clause", icon: "mdi-plus-box-multiple-outline", run: addClause },
  ];
  if (!props.singleValue) out.push({ key: "neg", title: "Negate", icon: "mdi-not-equal-variant", run: negateGroup });
  out.push({ key: "rm", title: "Remove group", icon: "mdi-delete-outline", run: removeGroup });
  return out;
});
const triggerAddValue = () => { if (isPicker.value) addValueRef.value?.openPicker(); else addEmptyValue(); };
const addClause = () => {
  group.items.push(makeVGroup(group.vjoin === "and" ? "or" : "and",
    isPicker.value ? [] : [makeVLeaf("")]));
  emit("change");
};
const negateGroup = () => { deMorganGroup(group); emit("change"); };
const removeGroup = () => { emit("remove-group"); };
const addSiblingGroupAfter = (i) => {
  group.items.splice(i + 1, 0, makeVGroup(group.vjoin === "and" ? "or" : "and",
    isPicker.value ? [] : [makeVLeaf("")]));
  emit("change");
};
// The close-row `+` adds a SIBLING sub-clause. The sibling stays inside THIS
// filter's value — it never becomes a new top-level filter row (Jason 2026-06-13).
const onAddSibling = () => {
  if (!props.isRoot) { emit("add-sibling"); return; } // nested: parent adds the sibling
  const fresh = makeVGroup("and", isPicker.value ? [] : [makeVLeaf("")]);
  if (group.items.length && group.items.every(isVGroup)) {
    group.items.push(fresh);
  } else {
    const existing = makeVGroup(group.vjoin, [...group.items]);
    group.vjoin = "and";
    group.items = [existing, fresh];
  }
  emit("change");
};

// ---- add / remove values ----------------------------------------------------
const addEmptyValue = () => { group.items.push(makeVLeaf("")); emit("change"); };
// Enter in a text/number box adds another value box to THIS clause and focuses it
// (Jason iter 21). The empty box self-prunes on blur if left unfilled (use-it-or-
// lose-it), so a stray Enter costs nothing.
const onValueEnter = () => {
  addEmptyValue();
  nextTick(() => {
    const inputs = rootEl.value?.querySelectorAll(".val-input");
    if (inputs && inputs.length) inputs[inputs.length - 1].focus();
  });
};
const addPickedValue = ({ value, label }) => {
  if (!group.items.some((x) => !isVGroup(x) && x.value === value)) {
    group.items.push(makeVLeaf(value, label));
  }
  emit("change");
};
const onPickerAbandon = () => {
  if (props.isRoot && isPicker.value && !vtreeHasValue(group)) emit("abandoned");
};
const removeItem = (i) => {
  group.items.splice(i, 1);
  if (group.items.length === 0) {
    if (!props.isRoot) { emit("remove-group"); return; }   // empty sub-group self-prunes
    if (!isPicker.value) group.items.push(makeVLeaf(""));   // scalar keeps one input
    else addValueRef.value?.openPicker();                   // entity: reopen the picker
  }
  emit("change");
};
// Use-it-or-lose-it (Jason 2026-06-13): a value brick left EMPTY on blur prunes
// itself, and any clause it leaves empty disappears too.
const onBrickBlur = (i) => {
  setTimeout(() => {
    if (document.querySelector(".v-overlay--active")) return; // a menu is open
    const it = group.items[i];
    if (it && !isVGroup(it) && (it.value === "" || it.value == null)) {
      group.items.splice(i, 1);
      emit("change");
    }
    if (!vtreeHasValue(group)) {
      if (props.isRoot) emit("abandoned"); else emit("remove-group");
    }
  }, 150);
};

// Let the row's open-paren brick (on the predicate line) drive this group.
defineExpose({ triggerAddValue, addClause, negate: negateGroup });
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
/* inline mode: transparent so values flow in the surrounding row */
.vgroup { display: contents; }
/* the value-list and/or joiner — slate chip, toggles the join. Inline it's the
   infix between values (`a or b`); block it trails each item (`a or`). */
.vjoin {
  cursor: pointer;
  text-transform: lowercase;
  color: var(--conn-fg, #475569) !important;
  background: var(--conn-bg, #e2e8f0) !important;
}
/* close-paren controls (add sibling / delete) — hover-revealed; hidden via
   visibility (App.vue's ghost-variant reset forces button opacity to 1). */
.vg-close-actions {
  display: inline-flex;
  align-items: center;
  visibility: hidden;
}
.vg-close-actions.shown { visibility: visible; }
.vg-act :deep(.v-icon) { opacity: 0.5; }
.vg-act:hover :deep(.v-icon) { opacity: 1; }
</style>
