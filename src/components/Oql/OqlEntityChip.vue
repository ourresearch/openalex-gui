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
    emit  select / select-clear — selection gestures (#472).
-->
<template>
  <!-- PLACEHOLDER: a not-yet-picked entity value — TYPE-ON-CHIP (oxjob #561): the user types
       their autocomplete query directly on this chip; the picker menu (options + "not" footer,
       no search box) hangs under it. The input carries data-vid (draft id is `<draftId>_ph`) so
       the picker anchors here (#494) and the builder's focusValueSoon can land. The `not`
       prefix mirrors the picker's NOT-first toggle (#561): checking "not" before picking shows
       the negation immediately; nothing submits until a value is picked. -->
  <!-- The same input serves the RE-PICK edit (Jason follow-up 2026-07-05): double-click /
       Enter on a committed chip flips it into this input, prefilled with the current name and
       selected, so the chip itself is the search bar (editOpen, driven by the builder's
       editingEntityId). Escape / click-away / pick all restore the display chip. -->
  <span v-if="tok._placeholder || editOpen" class="val-chip val-typeon">
    <span v-if="tok.negated" class="notpfx">not</span>
    <input ref="typeonEl" class="typeon-input" :data-vid="tok.id" :placeholder="typeHint"
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
import { computed, ref, watch, nextTick } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .val-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
  // RE-PICK edit (#561 follow-up): the builder asks this committed chip to become the
  // type-on search input (double-click / Enter / toolbar Edit → editingEntityId).
  editOpen: { type: Boolean, default: false },
  // multi-select (oxjob #472)
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});
const emit = defineEmits(["add", "remove", "request-edit", "select", "select-clear",
  // type-on-chip placeholder input (#561): the autocomplete query + its keyboard nav
  "query-input", "query-keydown"]);

const entityName = computed(() => props.tok._entityName || props.tok.display || props.tok.text);
// The old "new institution" placeholder label, minus the "new " — the chip is an input now
// (#561), so the hint is just the entity type you're searching.
const typeHint = computed(() =>
  (props.tok._placeholderLabel || "new value").replace(/^new /, ""));

// RE-PICK edit (#561 follow-up): when the builder flips this committed chip into the input,
// prefill it with the current name, select it (type-to-replace, like the text chip's edit),
// and emit the name as the query so the picker opens on relevant results.
const typeonEl = ref(null);
watch(() => props.editOpen, (open) => {
  if (!open) return;
  nextTick(() => {
    const el = typeonEl.value;
    if (!el) return;
    el.value = entityName.value || "";
    el.focus();
    el.select();
    emit("query-input", el.value);
  });
});

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
  onSelectClear: () => emit("select-clear"),
});
</script>

<!-- All chip styles live in the shared oqlChip.css (imported in the script). -->
