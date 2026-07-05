<!--
  OqlEntityChip — the value chip for a resolved ENTITY value (e.g. `institution is
  I97018004` → "Harvard University"). Display-only now (oxjob #428 toolbar-actions move):
  its Negate / Delete actions live in the builder toolbar when the chip is highlighted.

  Single-click SELECTS the chip; double-click / Enter RE-PICKS the entity (the builder opens
  the entity picker in replace mode — oxjob #428, 2026-06-17); Cmd/Ctrl+Enter adds a sibling
  value; Backspace/Delete removes it; it stays draggable for drag-to-delete.

  PURELY PRESENTATIONAL. The negation `not` renders INSIDE the chip fill as a bold leading
  sub-part (LEGO negate), matching the text chip.

  Contract:
    prop  tok       reads: id, negated, _sole, _entityName / display / text, _placeholder.
    prop  active    this chip is the highlighted one.
    emit  add       () — add a sibling value to the right (Cmd/Ctrl+Enter).
    emit  remove    () — remove this value.
    emit  select / batch-menu / select-clear — selection gestures (#472).
-->
<template>
  <!-- PLACEHOLDER: a not-yet-picked entity value — same green chip as a committed value,
       marking WHERE the picked value lands while the invisible picker is open. Inert. -->
  <!-- data-vid (id is `<draftId>_ph`) so the draft's value picker can anchor its dropdown
       UNDER this placeholder instead of offset to the right of the zero-width anchor (#494) -->
  <!-- The `not` prefix mirrors the picker's NOT-first toggle (#561): checking "not" before
       picking a value shows the negation on the placeholder immediately. -->
  <span v-if="tok._placeholder" class="val-chip val-placeholder" :data-vid="tok.id"><span
    v-if="tok.negated" class="notpfx">not</span>{{ placeholderLabel }}</span>

  <span v-else class="val-chip" :class="{ selected: active, 'multi-selected': selected, dragging }"
    tabindex="0" :data-vid="tok.id" draggable="true"
    @click="onClick" @dblclick="onDblclick" @keydown="onKeydown" @dragstart="onDragstart" @dragend="onDragend">
    <!-- OQL grouping parens (#523 round 9): faded, low-key, inside the chip fill — pedagogical only. -->
    <span v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span
    ><span v-if="tok.negated" class="notpfx">not</span>{{ entityName }}<span
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
const emit = defineEmits(["add", "remove", "request-edit", "select", "batch-menu", "select-clear"]);

const entityName = computed(() => props.tok._entityName || props.tok.display || props.tok.text);
const placeholderLabel = computed(() => props.tok._placeholderLabel || "new value");

// Single-click selects; double-click / Enter re-picks (request-edit); Cmd/Ctrl+Enter adds a
// sibling; Backspace/Delete deletes.
const { dragging, onClick, onDblclick, onKeydown, onDragstart, onDragend } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: () => emit("request-edit"),
  onCmdEnter: () => emit("add"),
  onDelete: () => emit("remove"),
  selectedRef: () => props.selected,
  selectionActiveRef: () => props.selectionActive,
  onSelect: (p) => emit("select", p),
  onBatchMenu: (el) => emit("batch-menu", el),
  onSelectClear: () => emit("select-clear"),
});
</script>

<!-- All chip styles live in the shared oqlChip.css (imported in the script). -->
