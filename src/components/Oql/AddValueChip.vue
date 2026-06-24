<!--
  AddValueChip — the trailing square green "+" add-value chip (oxjob #428, affordance
  overhaul change 4). Rendered as the LAST chip on every MULTI-VALUE filter (entity or
  text/search; NOT booleans/dates/numbers), it's the direct, in-place way to add another
  value to that filter's value list — superseding the value chip's "New" menu item.

  Visually it's a green value-coloured square (same --val-bg/--val-fg as a value chip)
  sized to the paren block (28px wide, 26px tall) so it lines up on the builder's indent
  grid. PURELY PRESENTATIONAL — it owns no query state; clicking emits `add` and the
  parent runs the v2 edit op (entity → opens the in-place picker; text → a focused box).

  It paints BLACK (`active`) when its row is selected, so it matches the rest of the row's
  chips (oxjob #475, Jason 2026-06-17). The click `.stop`s so adding a value never bubbles
  to the `.bline` band and selects the row.

  The tooltip names the action and shows the equivalent keyboard shortcut as keycaps
  (OqlKbdHint, oxjob #475): the INSIDE chip (add a value to this clause) is Enter; the
  block-group SIBLING chip (add a value on the next row, outside the parens) is Cmd/Ctrl+Enter.

  Contract:
    prop  active    this chip's row is selected (→ black).
    prop  label     tooltip text (e.g. "Add value" / "Add sibling").
    prop  shortcut  already-resolved keycaps, e.g. ['Enter'] or ['⌘','Enter']; omit if none.
    emit  add       () — add another value to this filter's list.
-->
<template>
  <span class="add-value-chip" :class="{ selected: active }" tabindex="0" role="button"
    @click.stop="$emit('add')"
    @keydown.enter.prevent="$emit('add')"
    @keydown.space.prevent="$emit('add')">
    <v-icon size="16">mdi-plus</v-icon>
    <v-tooltip activator="parent" location="top">
      <span class="addchip-tip">{{ label }}<OqlKbdHint v-if="shortcut.length" :keys="shortcut" /></span>
    </v-tooltip>
  </span>
</template>

<script setup>
import OqlKbdHint from "@/components/Oql/OqlKbdHint.vue";
import "@/components/Oql/oqlChip.css"; // shared --val-* cascade / brick metrics + .mi-key caps
defineProps({
  active: { type: Boolean, default: false },
  label: { type: String, default: "Add value" },
  shortcut: { type: Array, default: () => [] },
});
defineEmits(["add"]);
</script>

<style scoped>
/* GHOST button (Jason 2026-06-18): just the icon, no fill — the background appears on hover.
   Sized to the paren block (28px == the builder's --indent unit) and value-chip height (26px). */
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
  background: transparent;
  color: var(--val-fg, #14625c);
  cursor: pointer;
}
.add-value-chip:hover { background: var(--val-bg, #d6f2ec); }
.add-value-chip:focus { background: var(--val-bg, #d6f2ec); box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; outline: none; }
.add-value-chip .v-icon { opacity: 0.85; }
/* selected row → SOLID BLACK, white glyph (matches the row's other chips, oxjob #475). */
.add-value-chip.selected { background: var(--val-bg-sel, #1a1a1a); color: var(--val-fg-sel, #fff); filter: none; box-shadow: none; }
/* tooltip: label + keycaps on one row (the keycap chrome itself lives in oqlChip.css). */
.addchip-tip { display: inline-flex; align-items: center; gap: 8px; }
</style>
