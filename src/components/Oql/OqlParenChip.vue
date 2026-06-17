<!--
  OqlParenChip — the parenthesis BLOCK (`tok.t === 'paren'`) in the OQL builder.
  Part of the all-bricks componentization (oxjob #467).

  INERT DECORATION as of the row-centric model (oxjob #475, 2026-06-17): a paren no longer
  selects anything itself. The LOGICAL ROW is the unit of selection — a click anywhere on the
  row's band (which a paren click bubbles up to) selects the row in the builder. The paren is
  just painted BLACK (`active`) when it's the broadest containing paren pair of the selected
  row, to show its shape. No handlers, no own state.

  PURELY PRESENTATIONAL — owns no query state. Reads `tok.text` + `active` (black when its
  row is selected). `cursor: pointer` is inherited from the clickable `.bline` band.

  Contract:
    prop  tok     the `paren` token. Reads: id (the group/vgroup id), text (`(` / `)`).
    prop  active  this paren is the broadest pair of the selected logical row (→ black).

  NB layout: `.paren-block` is fixed at 28px wide — #428's builder indent unit is
  `calc(28px + gap)`, so this width is LOAD-BEARING; keep it in lock-step if the
  indent math ever changes (oxjob #428).
-->
<template>
  <span class="paren-block" :class="{ selected: active }">{{ tok.text }}</span>
</template>

<script setup>
defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
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
.paren-block.selected { background: #1a1a1a; color: #fff; outline: none; }
</style>
