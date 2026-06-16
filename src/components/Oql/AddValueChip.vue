<!--
  AddValueChip — the trailing square green "+" add-value chip (oxjob #428, affordance
  overhaul change 4). Rendered as the LAST chip on every MULTI-VALUE filter (entity or
  text/search; NOT booleans/dates/numbers), it's the direct, in-place way to add another
  value to that filter's value list — superseding the value chip's "New" menu item.

  Visually it's a green value-coloured square (same --val-bg/--val-fg as a value chip)
  sized to the paren block (28px wide, 26px tall) so it lines up on the builder's indent
  grid. PURELY PRESENTATIONAL — it owns no query state; clicking emits `add` and the
  parent runs the v2 edit op (entity → opens the in-place picker; text → a focused box).

  Contract:
    emit  add  () — add another value to this filter's list.
-->
<template>
  <span class="add-value-chip" tabindex="0" role="button"
    @click="$emit('add')"
    @keydown.enter.prevent="$emit('add')"
    @keydown.space.prevent="$emit('add')">
    <v-icon size="16">mdi-plus</v-icon>
    <v-tooltip activator="parent" location="top">Add value</v-tooltip>
  </span>
</template>

<script setup>
import "@/components/Oql/oqlChip.css"; // shared --val-* cascade / brick metrics
defineEmits(["add"]);
</script>

<style scoped>
/* Square green brick, sized to the paren block (28px == the builder's --indent unit)
   and the value-chip height (26px). Colours cascade from the .builder ancestor. */
.add-value-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  width: 28px;
  min-width: 28px;
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--val-bg, #d6f2ec);
  color: var(--val-fg, #14625c);
  cursor: pointer;
}
.add-value-chip:hover { filter: brightness(0.95); }
.add-value-chip:focus { box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; outline: none; }
.add-value-chip .v-icon { opacity: 0.85; }
</style>
