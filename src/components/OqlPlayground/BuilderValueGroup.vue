<template>
  <!-- A RECURSIVE value tree for ONE property (oxjob #428 iter 20 — Jason). Items are
       value leaves (BuilderValueBrick) OR nested value sub-groups, one conjunction per
       group, mixing only by nesting — the clause-tree model inside a single filter's
       value. Mirrors the server's canonical render: `title contains (beaver and (dam
       or pond))` is ONE row, not distributed.

       A flat value list renders INLINE: `( a or b )`. As soon as the group holds a
       SUB-CLAUSE it renders as a SubclauseBox — the SAME dashed-box + gutter layout the
       clause tree uses (shared component), so a value subquery looks exactly like a
       dedicated clause subquery: left margin at the property column, a fixed-width
       first column with `(` / and·or / `)` bricks, content one column to the right.

       Negation is a per-value bit shown as a bold `not(…)` brick (BuilderValueBrick);
       negating a GROUP applies De Morgan in place so the OQO stays in NNF. -->
  <span ref="rootEl" class="vgroup" :class="{ 'vgroup-block': block }">
    <!-- BLOCK: a parenthesized SubclauseBox (shared with the clause tree). The box's
         close-row `+`/trash add a sibling / delete this group (routed up); adding a
         value INTO the group is via the paren menus. -->
    <template v-if="block">
      <SubclauseBox :join="group.vjoin" :row-keys="group.items.map((it) => it._id)"
        @toggle-join="toggleJoin" @add-sibling="onAddSibling" @remove-self="$emit('remove-group')">
        <template #open><ParenBrick label="(" :actions="parenActions" wide /></template>
        <template #row="{ index }">
          <BuilderValueGroup v-if="isVGroup(group.items[index])"
            :group="group.items[index]" :value-kind="valueKind" :autocomplete-entity="autocompleteEntity"
            :list-vocab="listVocab" :numeric="numeric" :single-value="false" :is-root="false"
            @change="$emit('change')" @remove-group="removeItem(index)" @add-sibling="addSiblingGroupAfter(index)" />
          <BuilderValueBrick v-else :item="group.items[index]" :value-kind="valueKind" :numeric="numeric"
            :single-value="singleValue" :autocomplete-entity="autocompleteEntity"
            :removable="group.items.length > 1"
            @change="$emit('change')" @remove="removeItem(index)" @blur="onBrickBlur(index)" />
        </template>
        <template #close><ParenBrick label=")" :actions="parenActions" wide /></template>
      </SubclauseBox>
      <!-- entity-picker anchor for the paren menu's "Add value" (scalar adds inline) -->
      <BuilderAddValue v-if="isPicker && !singleValue" ref="addValueRef" anchor-only
        :value-kind="valueKind" :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab"
        @pick="addPickedValue" @abandon="onPickerAbandon" />
    </template>

    <!-- INLINE: a flat parenthesized value list -->
    <template v-else>
      <ParenBrick v-if="showParens" label="(" :actions="parenActions" />
      <template v-for="(it, i) in group.items" :key="it._id">
        <v-chip v-if="i > 0" class="vjoin" size="small" label variant="flat" @click="toggleJoin">{{ group.vjoin }}</v-chip>
        <BuilderValueGroup v-if="isVGroup(it)" :group="it" :value-kind="valueKind"
          :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab" :numeric="numeric"
          :single-value="false" :is-root="false" @change="$emit('change')"
          @remove-group="removeItem(i)" @add-sibling="addSiblingGroupAfter(i)" />
        <BuilderValueBrick v-else :item="it" :value-kind="valueKind" :numeric="numeric"
          :single-value="singleValue" :autocomplete-entity="autocompleteEntity"
          :removable="group.items.length > 1"
          @change="$emit('change')" @remove="removeItem(i)" @blur="onBrickBlur(i)" />
      </template>
      <ParenBrick v-if="showParens" label=")" :actions="parenActions" />
      <BuilderAddValue v-if="!singleValue" ref="addValueRef" :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab"
        @add="addEmptyValue" @pick="addPickedValue" @abandon="onPickerAbandon" />
    </template>
  </span>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import SubclauseBox from "@/components/OqlPlayground/SubclauseBox.vue";
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
  // true = the row's top-level value group; false = a nested value sub-group
  isRoot: { type: Boolean, default: true },
  autofocus: { type: Number, default: 0 },
});
const emit = defineEmits(["change", "abandoned", "remove-group", "add-sibling"]);

const group = props.group; // shared reactive value-group (stable per :key)
const rootEl = ref(null);
const addValueRef = ref(null);

const isPicker = computed(() => props.valueKind === "entity");
// A group that holds a nested sub-clause renders as a SubclauseBox; a flat list
// stays inline. Inline parens show for a nested sub-group or once there are 2+ items.
const hasSubclause = computed(() => group.items.some(isVGroup));
const block = computed(() => hasSubclause.value);
const showParens = computed(() => !props.isRoot || group.items.length > 1 || hasSubclause.value);

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
  // a fresh nested sub-group with the opposite conjunction, seeded with one value
  group.items.push(makeVGroup(group.vjoin === "and" ? "or" : "and",
    isPicker.value ? [] : [makeVLeaf("")]));
  emit("change");
};
const negateGroup = () => { deMorganGroup(group); emit("change"); };
const removeGroup = () => { emit("remove-group"); };
// a sibling of a nested value sub-group is another sub-group in this parent
const addSiblingGroupAfter = (i) => {
  group.items.splice(i + 1, 0, makeVGroup(group.vjoin === "and" ? "or" : "and",
    isPicker.value ? [] : [makeVLeaf("")]));
  emit("change");
};
// The box's close-row `+` adds a SIBLING sub-clause. The sibling stays inside THIS
// filter's value — it never becomes a new top-level filter row (that's the line-N
// "add" button's job; Jason 2026-06-13).
const onAddSibling = () => {
  if (!props.isRoot) { emit("add-sibling"); return; } // nested: parent adds the sibling
  // Top-level value box: keep both clauses inside the value. If the value is one
  // compound, wrap the current content as sub-clause #1 and add an empty sub-clause
  // #2, so the two are siblings joined by the group's conjunction (AND default,
  // toggleable to OR independently). If it's already a list of sub-clauses, append.
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
// itself, and any clause it leaves empty disappears too — so clicking around to
// learn the UI doesn't spawn orphan empty boxes. Grace + overlay guard so opening
// a menu (operator/field/value picker) mid-edit doesn't nuke the value.
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
</script>

<style scoped>
/* Inline mode: the group is transparent (display:contents) so its values flow in
   the row's wrapping body. Block mode: the group is a full-width line so the
   SubclauseBox breaks below the operator and aligns at the property column. */
.vgroup { display: contents; }
.vgroup-block { display: block; flex: 0 0 100%; min-width: 0; }
/* the value-list and/or joiner (inline mode) — a chip, slate, toggles the join */
.vjoin {
  cursor: pointer;
  text-transform: lowercase;
  color: var(--conn-fg, #475569) !important;
  background: var(--conn-bg, #e2e8f0) !important;
}
</style>
