<!--
  OqlBoolChip — the value chip for a BOOLEAN value. Display-only now (oxjob #428
  toolbar-actions move): the two-option chooser (true/false, or phrase ⇄ negated phrase)
  lives in the builder toolbar's "Edit" popover when the chip is highlighted.

  Covers both boolean bricks:
    • true/false value (`tok._kind === 'boolean'`)  — shows `true` / `false`.
    • boolean PHRASE (`tok._boolPhrase`)             — a combined predicate+value
      ("it's open access"); the toolbar's two options are the affirmative phrasing and
      its negation, and picking the other toggles negation.

  Single-click SELECTS; double-click / Enter opens the toolbar chooser; Backspace/Delete
  deletes. PURELY PRESENTATIONAL.

  Contract:
    prop  tok       reads: id, negated, value, text, _boolPhrase, _kind.
    prop  active    this chip is the highlighted one.
    emit  remove        () — remove this value.
    emit  request-edit  () — open the toolbar true/false chooser.
    emit  select / batch-menu / select-clear — selection gestures (#472).
-->
<template>
  <span class="val-chip" :class="{ selected: active, 'multi-selected': selected, negated: tok.negated, dragging }"
    tabindex="0" :data-vid="tok.id" draggable="true"
    @click="onClick" @keydown="onKeydown"
    @dragstart="onDragstart" @dragend="onDragend">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .val-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
  // multi-select (oxjob #472)
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "request-edit", "select", "batch-menu", "select-clear"]);

const isPhrase = computed(() => !!props.tok._boolPhrase);
const label = computed(() => (isPhrase.value ? props.tok.text : String(props.tok.value)));

// Single-click selects + opens the menu; Enter opens the chooser; ⌫ deletes.
const { dragging, onClick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: () => emit("request-edit"),
  onDelete: () => emit("remove"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});
</script>

<!-- All chip styles live in the shared oqlChip.css (imported in the script). -->
