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
  <!-- PLACEHOLDER: a not-yet-picked entity value — TYPE-ON-CHIP (oxjob #561): the user types
       their autocomplete query directly on this chip; the picker menu (options + "not" footer,
       no search box) hangs under it. The input carries data-vid (draft id is `<draftId>_ph`) so
       the picker anchors here (#494) and the builder's focusValueSoon can land. The `not`
       prefix mirrors the picker's NOT-first toggle (#561): checking "not" before picking shows
       the negation immediately; nothing submits until a value is picked. -->
  <span v-if="tok._placeholder" class="val-chip val-typeon">
    <span v-if="tok.negated" class="notpfx">not</span>
    <input class="typeon-input" :data-vid="tok.id" :placeholder="typeHint"
      spellcheck="false" autocomplete="off"
      @input="$emit('query-input', $event.target.value)"
      @keydown="$emit('query-keydown', $event)"
      @click.stop @mousedown.stop />
  </span>

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
const emit = defineEmits(["add", "remove", "request-edit", "select", "batch-menu", "select-clear",
  // type-on-chip placeholder input (#561): the autocomplete query + its keyboard nav
  "query-input", "query-keydown"]);

const entityName = computed(() => props.tok._entityName || props.tok.display || props.tok.text);
// The old "new institution" placeholder label, minus the "new " — the chip is an input now
// (#561), so the hint is just the entity type you're searching.
const typeHint = computed(() =>
  (props.tok._placeholderLabel || "new value").replace(/^new /, ""));

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
