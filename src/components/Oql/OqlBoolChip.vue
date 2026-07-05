<!--
  OqlBoolChip — the value chip for a BOOLEAN value. Display-only now (oxjob #428
  toolbar-actions move): the two-option chooser (true/false, or phrase ⇄ negated phrase)
  lives in the builder toolbar's "Edit" popover when the chip is highlighted.

  Covers both boolean bricks:
    • true/false value (`tok._kind === 'boolean'`)  — shows `true` / `false`.
    • boolean PHRASE (`tok._boolPhrase`)             — a combined predicate+value
      value; the toolbar's two options are True and False (oxjob #363) and
      its negation, and picking the other toggles negation.

  Single-click TOGGLES the chip (oxjob #507, Jason 2026-06-25): true↔false, or an
  affirmative↔negated phrase. (A boolean has only two states, so a plain click flipping it
  is the fastest edit — it replaces the old select-then-edit dance.) Cmd/Ctrl/Shift-click
  still MULTI-SELECTS (for batch delete); Backspace/Delete deletes. PURELY PRESENTATIONAL.

  Contract:
    prop  tok       reads: id, negated, value, text, _boolPhrase, _kind.
    prop  active    this chip is the highlighted one.
    emit  toggle        () — flip this boolean (the builder picks value-flip vs negate).
    emit  remove        () — remove this value.
    emit  select / batch-menu / select-clear — selection gestures (#472).
-->
<template>
  <span class="val-chip" :class="{ selected: active, 'multi-selected': selected, negated: tok.negated, dragging }"
    tabindex="0" :data-vid="tok.id" draggable="true"
    @click="onBoolClick" @keydown="onKeydown"
    @dragstart="onDragstart" @dragend="onDragend">
    <!-- value-block parens, INSIDE the chip fill like every other value chip (#560 Phase 2) -->
    <span v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span
    >{{ label }}<span
    v-if="tok._pClose" class="val-paren">{{ ')'.repeat(tok._pClose) }}</span>
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
const emit = defineEmits(["toggle", "remove", "select", "batch-menu", "select-clear"]);

const isPhrase = computed(() => !!props.tok._boolPhrase);
const label = computed(() => (isPhrase.value ? props.tok.text : String(props.tok.value)));

// Cmd/Ctrl-click multi-selects, ⌫ deletes (via useChipShortcuts); a PLAIN click toggles.
const { dragging, onClick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDelete: () => emit("remove"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});
// PLAIN click → toggle the boolean; modifier-click falls through to multi-select (#507).
const onBoolClick = (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) { onClick(e); return; }
  e.stopPropagation();
  emit("toggle");
};
</script>

<!-- All chip styles live in the shared oqlChip.css (imported in the script). -->
