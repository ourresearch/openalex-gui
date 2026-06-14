<template>
  <!-- ONE value leaf of the value tree (oxjob #428 iter 20): an entity chip or an
       inline-editable scalar/search box, with bold `not(…)` negation. Rendered the
       same way in inline value lists AND inside a SubclauseBox row, so the brick is
       defined once. The GROUP owns add/remove-group/abandon-when-empty; this brick
       only edits/negates/removes its own value. -->
  <!-- entity value chip. Negation (#363): bold `not` PREFIX, no parens. Clicking the
       chip toggles negation directly — no menu (Jason iter 21: "easy peasy"). -->
  <v-chip v-if="isPicker" class="value-chip" :class="{ negated: item.neg }" size="small" label variant="flat"
    :closable="removable" @click="onEntityClick" @click:close.stop="$emit('remove')">
    <span v-if="item.neg" class="notpfx">not&nbsp;</span>{{ item.label }}
  </v-chip>

  <!-- scalar / search value (inline editable). Numbers strongly typed. Negation
       (#363, iter 21): a bold dark-green `not` sits OUTSIDE the field border — it's
       part of the chip's CHROME, not the text field. Click it to clear negation. -->
  <span v-else class="val-leaf" :class="{ negated: item.neg }">
    <span v-if="item.neg" class="notpfx clickable" title="Remove negation" @click="clearNeg">not</span>
    <span class="val-wrap" :class="{ invalid: isInvalid, numeric }">
      <input class="val-input" :type="numeric ? 'number' : 'text'" :value="item.value"
        :placeholder="numeric ? 'number' : 'text'" :inputmode="numeric ? 'numeric' : 'text'"
        step="1" spellcheck="false"
        @input="onScalarInput" @keydown="onScalarKeydown" @blur="$emit('blur')" />
      <v-icon v-if="removable" size="13" class="val-remove" @click="$emit('remove')">mdi-close</v-icon>
    </span>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { extractLeadingNot } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderValueBrick" });

const props = defineProps({
  item: { type: Object, required: true },        // a value leaf { value, label, neg }
  valueKind: { type: String, default: "text" },  // entity | text | number
  numeric: { type: Boolean, default: false },
  singleValue: { type: Boolean, default: false }, // inequality: no negate
  autocompleteEntity: { type: String, default: null },
  removable: { type: Boolean, default: true },    // show the × (group has >1 value)
});
const emit = defineEmits(["change", "remove", "blur", "enter"]);

// the value leaf is a shared reactive object (keyed by the parent) — mutate via a
// local alias so eslint's no-mutating-props is satisfied while edits still propagate
const leaf = props.item;

const isPicker = computed(() => props.valueKind === "entity");
const isInvalid = computed(() =>
  props.numeric && leaf.value !== "" && leaf.value != null && isNaN(Number(leaf.value)));

const clearNeg = () => { leaf.neg = false; emit("change"); };
const toggleNeg = () => { leaf.neg = !leaf.neg; emit("change"); };
// Non-text (entity) negation = click-to-toggle, no menu (Jason iter 21). Inequality
// single values can't be negated (reverse the operator instead) — guard on that.
const onEntityClick = () => { if (!props.singleValue) toggleNeg(); };

const onScalarInput = (e) => {
  const raw = e.target.value;
  if (!props.singleValue) {
    const { neg, text } = extractLeadingNot(raw);
    if (neg) {
      leaf.neg = true; leaf.value = text; leaf.label = text;
      if (e.target.value !== text) e.target.value = text; // drop the typed `not `
      emit("change");
      return;
    }
  }
  leaf.value = raw;
  leaf.label = String(raw);
  emit("change");
};
const onScalarKeydown = (e) => {
  // front-backspace (cursor at the very start, nothing selected) removes the `not`
  if (e.key === "Backspace" && leaf.neg &&
      e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    leaf.neg = false; e.preventDefault(); emit("change");
    return;
  }
  // plain Enter adds another value box to this same clause (Jason iter 21).
  // Cmd/Ctrl+Enter runs the query — handled at the builder root via native event
  // bubbling, so just let it pass through here.
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    emit("enter");
  }
};
</script>

<style scoped>
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
  cursor: pointer;
  font-size: var(--brick-fs, 0.8125rem);
}
/* the `not` is part of the chip CHROME (dark green, bold) — NOT the text field */
.notpfx { font-weight: 700; color: var(--val-fg, #14625c); }
.notpfx.clickable { cursor: pointer; }
/* a scalar/search leaf: [bold green `not`]  [bordered text field]. The `not` lives
   OUTSIDE the field border (Jason iter 21: frame vs painting). */
.val-leaf {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  padding: 2px 6px;
}
.val-wrap.invalid { border-color: rgb(211, 47, 47) !important; background: rgba(211, 47, 47, 0.06) !important; }
.val-input {
  border: none; outline: none; background: transparent;
  font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
.menu-card { overflow: hidden; }
</style>
