<!--
  OqlJoinChip — the JOIN-STRATEGY chip (`tok.t === 'joinkw'`) that opens a group: it carries the
  keyword AND the open paren on one block — `all (` / `any (` — matching the OQL spec. It is the
  single locus that controls how that one parenthesis set joins its members — `all` (AND) or
  `any` (OR). (OQL decision 32 / oxjob #475, 2026-06-18.) The keyword is BOLD (not monospace);
  the `(` rides with it, styled to match the closing paren block.

  It behaves like a BUTTON, not a selectable chip (Jason 2026-06-18): a single click PUSHES it
  — toggles all ⇄ any — there is no selected state of its own. It only paints black when its
  containing row is selected (the row paints all its chips black).

  Replaces the old infix `and`/`or` connector chips AND the row toolbar's "Use AND/OR" button:
  the join is now changed HERE, on the block itself. Unlike the inert paren/conn decorations,
  this chip is INTERACTIVE and follows the builder's chip convention:

    • single click  → SELECT it (stops propagation so it doesn't bubble to the row band).
    • double click  → its PRIMARY ACTION: toggle all ⇄ any (and stops the band's dbl-click).
    • when selected, Enter (handled by the builder) also toggles.

  Width is exactly 2× the paren chip (56px = 2 × 28px), per Jason — so the join control reads
  as a wider sibling of the `(` it precedes.

  PURELY PRESENTATIONAL — owns no query state. Reads the join `label`/`text` + `active`.

  Contract:
    prop  tok      the `joinkw` token. Reads: id (the group/vgroup id), text ("all"|"any"),
                   label ("and"|"or").
    prop  active   this chip's row is selected → painted black.
    emit  toggle   () — click (or double-click): flip all ⇄ any.
-->
<template>
  <span class="join-chip" :class="{ selected: active }"
    @click.stop="$emit('toggle')"
    @dblclick.stop.prevent="$emit('toggle')"><span class="jc-kw">{{ label }}</span><span class="jc-paren">(</span></span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
defineEmits(["toggle"]);

// "all" (AND) / "any" (OR) — the keyword with the open paren stripped (it's a separate span
// in the template). Falls back to the join label.
const label = computed(() => {
  const t = (props.tok.text || "").replace(/\(/g, "").trim().toLowerCase();
  if (t === "all" || t === "any") return t;
  return (props.tok.label || "and") === "or" ? "any" : "all";
});
</script>

<style scoped>
/* A wide block that opens the group: exactly 2× the 28px paren width (56px). Holds the bold
   keyword + the open paren; same height/radius so it pairs with the close-paren block. */
.join-chip {
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
/* keyword: BOLD, the app's sans font (NOT monospace) — Jason 2026-06-18. */
.jc-kw {
  color: rgba(0, 0, 0, 0.72);
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
}
/* the open paren: monospace + paren colour, so it matches the closing `)` paren block. */
.jc-paren {
  color: rgba(0, 0, 0, 0.5);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
}
.join-chip:hover { filter: brightness(0.97); }
/* selected → SOLID BLACK, white glyphs (matches the other selected chips). */
.join-chip.selected { background: #1a1a1a; }
.join-chip.selected .jc-kw,
.join-chip.selected .jc-paren { color: #fff; }
</style>
