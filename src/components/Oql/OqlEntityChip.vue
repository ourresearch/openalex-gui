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
  <!-- #603 round 27 (Jason): entity chips are PILLS (val-pill — a picked-from-a-list
       value reads as a stadium; typed values stay rectangles), and an or-joined value
       carries its `or` inside the chip as a faded prefix (orpfx). -->
  <span v-if="tok._placeholder || editOpen" class="val-chip val-typeon val-pill">
    <span v-if="tok._connPrefix" class="orpfx">{{ tok._connPrefix }}</span>
    <span v-if="tok.negated" class="notpfx">not</span>
    <input ref="typeonEl" class="typeon-input" :data-vid="tok.id" :placeholder="typeHint"
      spellcheck="false" autocomplete="off"
      @input="$emit('query-input', $event.target.value)"
      @keydown="$emit('query-keydown', $event)"
      @click.stop @mousedown.stop />
  </span>

  <!-- #603 round 31 (Jason): the chip's ONLY drag handle is the `or` prefix (OqlOrHandle);
       an entity value with no `or` isn't draggable. -->
  <span v-else class="val-chip val-pill" :class="{ selected: active, 'multi-selected': selected, dragging }"
    tabindex="0" :data-vid="tok.id"
    @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">
    <!-- OQL grouping parens (#523 round 9): faded, low-key, inside the chip fill — pedagogical only. -->
    <OqlOrHandle v-if="tok._connPrefix" :text="tok._connPrefix"
      @dragstart="onDragstart" @dragend="onDragend"
    /><span v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span
    ><span v-if="tok.negated" class="notpfx">not</span>{{ entityName }}<span
    v-if="tok._pClose" class="val-paren">{{ ')'.repeat(tok._pClose) }}</span>
  </span>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import OqlOrHandle from "@/components/Oql/OqlOrHandle.vue";
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
// (#561), so the hint is just the entity type you're searching. A committed chip's blank
// re-pick input (#603 r28) hints the CURRENT name instead — faded, so it reads as "replacing
// this", not as text still in the box.
const typeHint = computed(() => {
  if (props.tok._placeholderLabel) return props.tok._placeholderLabel.replace(/^new /, "");
  return entityName.value || "new value";
});

// RE-PICK edit (#561 follow-up): the builder flips this committed chip into the input.
// #603 r28 (Jason): it opens BLANK — small tweaks to a picked entity are rare, so the old
// prefilled-and-selected name was friction; the placeholder hints the entity type and the
// picker opens on its default (unfiltered) results.
const typeonEl = ref(null);
watch(() => props.editOpen, (open) => {
  if (!open) return;
  nextTick(() => {
    const el = typeonEl.value;
    if (!el) return;
    el.value = "";
    el.focus();
    emit("query-input", "");
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
