<!--
  OqlCloseAddChip — the combined ADD + CLOSE-PAREN block `[+)]` that closes a group (oxjob #475,
  Jason 2026-06-18). It replaces the old adjacent `[+][)]` pair (and the bare `[)]` on a clause
  group's close line) with ONE 2× block — the visual mirror of the `[all (]` / `[any (]` open
  block. Clicking it runs the group's ADD action:
    • VALUE group  → insert another value into the group.
    • CLAUSE/root group → insert a new filter into the group.

  Same width (56px) and metrics as the join chip, so a group reads `all ( … +)` — a wide open
  block and a wide close block bracketing the members. The `+` is the action; the `)` matches the
  closing-paren styling.

  It paints BLACK (`active`) when its row is selected (matches the row's other chips). The click
  `.stop`s so adding never bubbles to the `.bline` band and selects the row.

  Contract:
    prop  active  this block's row is selected (→ black).
    prop  label   tooltip text (e.g. "Insert value" / "Insert filter").
    emit  add     () — run the group's add action.
-->
<template>
  <span class="close-add-chip" :class="{ selected: active }" role="button" tabindex="0"
    @click.stop="$emit('add')"
    @keydown.enter.prevent="$emit('add')"
    @keydown.space.prevent="$emit('add')"><v-icon class="cac-plus" size="16">mdi-plus</v-icon><span class="cac-paren">)</span>
    <v-tooltip activator="parent" location="top">{{ label }}</v-tooltip>
  </span>
</template>

<script setup>
import "@/components/Oql/oqlChip.css"; // shared --val-* cascade / brick metrics
defineProps({
  active: { type: Boolean, default: false },
  label: { type: String, default: "Insert" },
});
defineEmits(["add"]);
</script>

<style scoped>
/* Mirror of the join (open) block: 2× the 28px paren width (56px), same height/radius. */
.close-add-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  box-sizing: border-box;
  height: 26px;
  flex: 0 0 auto;
  width: 56px;
  min-width: 56px;
  padding: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.07);
  cursor: pointer;
  user-select: none;
}
.cac-plus { color: var(--val-fg, #14625c); opacity: 0.9; }
/* the close paren: monospace + paren colour, matching OqlParenChip and the join block's `(`. */
.cac-paren {
  color: rgba(0, 0, 0, 0.5);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
}
.close-add-chip:hover { filter: brightness(0.96); }
.close-add-chip:focus { box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; outline: none; }
/* selected row → SOLID BLACK, white glyphs (matches the row's other chips). */
.close-add-chip.selected { background: #1a1a1a; filter: none; box-shadow: none; }
.close-add-chip.selected .cac-plus,
.close-add-chip.selected .cac-paren { color: #fff; }
</style>
