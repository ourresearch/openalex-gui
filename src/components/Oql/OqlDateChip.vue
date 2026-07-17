<!--
  OqlDateChip — the value chip for a DATE value (e.g. `date is 2020-05-17`). Display-only
  now (oxjob #428 toolbar-actions move): the Linear-style calendar moved to the builder
  toolbar's "Edit" popover (OqlDatePicker). The chip shows the date as ISO (matching how
  OQL writes it); single-click selects, double-click / Enter opens the toolbar calendar.

  PURELY PRESENTATIONAL. Negation renders INSIDE the chip fill as a bold leading `not`.

  Contract:
    prop  tok       reads: id, negated, value/display/text (the ISO date string).
    prop  active    this chip is the highlighted one.
    emit  add           () — add a sibling value to the right (Cmd/Ctrl+Enter).
    emit  remove        () — remove this value (⌫).
    emit  request-edit  () — open the toolbar calendar.
    emit  select / select-clear — selection gestures (#472).
  NOTE focus: the span keeps :data-vid="tok.id" so the parent's focusValueSoon can land
  on a freshly-added (empty) date value.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <!-- #603 round 31 (Jason): dates aren't multi-value / or-joined, so they're not draggable —
         the only value-chip drag handle is the `or` prefix, which a date never has. -->
    <span class="val-chip" :class="{ selected: active, 'multi-selected': selected, 'val-placeholder': isEmpty }"
      tabindex="0" :data-vid="tok.id"
      @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">
      <!-- value-block parens, INSIDE the chip fill like every other value chip (#560 Phase 2) -->
      <span v-if="tok._connPrefix" class="orpfx">{{ tok._connPrefix }}</span
      ><span v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span
      ><span v-if="tok.negated" class="notpfx">not</span>{{ displayLabel }}<span
      v-if="tok._pClose" class="val-paren">{{ ')'.repeat(tok._pClose) }}</span>
    </span>
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
const emit = defineEmits(["add", "remove", "request-edit", "select", "select-clear"]);

// Display the committed value as ISO (YYYY-MM-DD) — aligns with how OQL writes dates.
const pad = (n) => String(n).padStart(2, "0");
const parseStrict = (str) => {
  const s = String(str || "").trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return { y: +m[1], m: +m[2], d: +m[3] };
  if ((m = s.match(/^(\d{4})-(\d{1,2})$/))) return { y: +m[1], m: +m[2], d: 1 };
  if ((m = s.match(/^(\d{4})$/))) return { y: +m[1], m: 1, d: 1 };
  return null;
};
const rawValue = computed(() => {
  const t = props.tok;
  return String(t.value != null ? t.value : (t.display != null ? t.display : t.text || "")).trim();
});
const isEmpty = computed(() => !rawValue.value.length);
const displayLabel = computed(() => {
  if (isEmpty.value) return "pick a date";
  const p = parseStrict(rawValue.value);
  return p ? `${p.y}-${pad(p.m)}-${pad(p.d)}` : rawValue.value;
});

// Single-click selects + opens the menu; Enter opens the calendar; Cmd/Ctrl+Enter
// adds a sibling; ⌫ deletes.
const { onClick, onDblclick, onKeydown } = useChipShortcuts({
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

<style scoped>
.val-leaf { display: inline-flex; align-items: center; }
</style>
