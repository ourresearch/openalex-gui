<template>
  <!-- ONE value leaf of the value tree (oxjob #428 iter 20): an entity chip or an
       inline-editable scalar/search box, with bold `not(…)` negation. Rendered the
       same way in inline value lists AND inside a SubclauseBox row, so the brick is
       defined once. The GROUP owns add/remove-group/abandon-when-empty; this brick
       only edits/negates/removes its own value. -->
  <!-- entity value chip. Bold `not(…)` when negated; click opens { Negate, View ↗ }. -->
  <v-menu v-if="isPicker" location="bottom start" offset="4">
    <template #activator="{ props: mp }">
      <v-chip v-bind="mp" class="value-chip" size="small" label variant="flat" :closable="removable"
        @click:close.stop="$emit('remove')">
        <span v-if="item.neg" class="notpfx">not(</span>{{ item.label }}<span v-if="item.neg" class="notpfx">)</span>
      </v-chip>
    </template>
    <v-card min-width="160" class="menu-card"><v-list density="compact" class="py-0">
      <v-list-item v-if="!singleValue" :title="item.neg ? 'Negated ✓' : 'Negate'"
        prepend-icon="mdi-not-equal-variant" @click="toggleNeg" />
      <v-list-item title="View ↗" prepend-icon="mdi-open-in-new" @click="viewEntity" />
    </v-list></v-card>
  </v-menu>

  <!-- scalar / search value (inline editable). Numbers strongly typed; a bold
       `not( … )` wraps the input when negated (the prefix opens a tiny menu). -->
  <span v-else class="val-wrap" :class="{ invalid: isInvalid, numeric, negated: item.neg }">
    <v-menu v-if="item.neg" location="bottom start" offset="2">
      <template #activator="{ props: mp }"><span v-bind="mp" class="notpfx clickable">not(</span></template>
      <v-card class="menu-card"><v-list density="compact" class="py-0">
        <v-list-item title="Negated ✓" @click="clearNeg" />
      </v-list></v-card>
    </v-menu>
    <input class="val-input" :type="numeric ? 'number' : 'text'" :value="item.value"
      :placeholder="numeric ? 'number' : 'text'" :inputmode="numeric ? 'numeric' : 'text'"
      step="1" spellcheck="false"
      @input="onScalarInput" @keydown="onScalarKeydown" @blur="$emit('blur')" />
    <span v-if="item.neg" class="notpfx">)</span>
    <v-icon v-if="removable" size="13" class="val-remove" @click="$emit('remove')">mdi-close</v-icon>
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
const emit = defineEmits(["change", "remove", "blur"]);

// the value leaf is a shared reactive object (keyed by the parent) — mutate via a
// local alias so eslint's no-mutating-props is satisfied while edits still propagate
const leaf = props.item;

const isPicker = computed(() => props.valueKind === "entity");
const isInvalid = computed(() =>
  props.numeric && leaf.value !== "" && leaf.value != null && isNaN(Number(leaf.value)));

const clearNeg = () => { leaf.neg = false; emit("change"); };
const toggleNeg = () => { leaf.neg = !leaf.neg; emit("change"); };
const viewEntity = () => {
  const v = String(leaf.value);
  // openalex_id values address the entity directly; list-vocab values hang off
  // their type's list page (e.g. types/article, countries/FR)
  const url = /^[A-Za-z]\d+$/.test(v) || /^https?:/.test(v)
    ? (v.startsWith("http") ? v : `https://openalex.org/${v}`)
    : `https://openalex.org/${props.autocompleteEntity || "works"}/${v}`;
  window.open(url, "_blank", "noopener");
};

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
  }
};
</script>

<style scoped>
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
  cursor: pointer;
}
.notpfx { font-weight: 700; }
.notpfx.clickable { cursor: pointer; }
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
  font-size: 0.85rem; color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
.menu-card { overflow: hidden; }
</style>
