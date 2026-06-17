<!--
  OqlParenChip — the parenthesis BLOCK (`tok.t === 'paren'`) in the OQL builder.
  Part of the all-bricks componentization (oxjob #467).

  SELECTABLE as of #428 (2026-06-17): clicking a paren selects the whole LOGICAL ROW it
  belongs to (the builder works out whether that's a filter expression's value-bag or a
  standalone subclause, and highlights its mate + the property/conjunctions accordingly).
  Double-click / Enter while selected toggles that row's join strategy (and ⇄ or). So the
  paren emits `select` (highlight the row) and `request-edit` (toggle the join) — the
  builder owns the actual structure logic.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok.text` + `active` (black when its
  row is selected).

  Contract:
    prop  tok           the `paren` token. Reads: id (the group/vgroup id), text (`(` / `)`).
    prop  active        this paren is part of the selected logical row (→ black).
    emit  select        ({id,mode,el}) — selection gesture.
    emit  request-edit  () — toggle the row's join (and ⇄ or).

  NB layout: `.paren-block` is fixed at 28px wide — #428's builder indent unit is
  `calc(28px + gap)`, so this width is LOAD-BEARING; keep it in lock-step if the
  indent math ever changes (oxjob #428).
-->
<template>
  <span class="paren-block" :class="{ selected: active }" tabindex="0"
    @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">{{ tok.text }}</span>
</template>

<script setup>
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "request-edit"]);

// Single-click selects the row this paren belongs to; double-click / Enter toggles its join.
const { onClick, onDblclick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: () => emit("request-edit"),
  onSelect: (p) => emit("select", p),
});
</script>

<style scoped>
/* Mirrors the builder's grey brick, fixed 28px so it == the builder's --indent unit
   exactly (border-box). Now interactive (#428): clickable/focusable + black when its
   logical row is selected. (oxjob #428 / #467.) */
.paren-block {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  flex: 0 0 auto;
  width: 28px;
  min-width: 28px;
  padding: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.6);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
  cursor: pointer;
}
.paren-block:hover { filter: brightness(0.97); }
/* selected → SOLID BLACK, white glyph (Jason 2026-06-17). */
.paren-block.selected,
.paren-block:focus { background: #1a1a1a; color: #fff; outline: none; }
</style>
