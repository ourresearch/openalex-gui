<!--
  OqlJoinChip — the JOIN-STRATEGY chip (`tok.t === 'joinkw'`) that opens a group: it carries the
  keyword AND the open paren on one block — `all (` / `any (` — matching the OQL spec. It is the
  single locus that controls how that one parenthesis set joins its members — `all` (AND) or
  `any` (OR). (OQL decision 32 / oxjob #475, 2026-06-18.) The keyword is BOLD (not monospace);
  the `(` rides with it, styled to match the closing paren block.

  Menus-on-chips pivot (oxjob #475, 2026-06-19):
    • single click  → `menu` (emit the chip el): the builder opens this chip's dropdown
      (any/All radios + add value / select another / delete, or the reduced root variant).
      The any/all radios switch the join (double-click toggle removed — Jason 2026-06-22).
  It paints black when its containing row/clause is the scope-highlighted selection.

  Width is exactly 2× the paren chip (56px = 2 × 28px), per Jason — so the join control reads
  as a wider sibling of the `(` it precedes.

  PURELY PRESENTATIONAL — owns no query state. Reads the join `label`/`text` + `active`.

  Contract:
    prop  tok      the `joinkw` token. Reads: id (the group/vgroup id), text ("all"|"any"),
                   label ("and"|"or").
    prop  active   this chip's row is selected → painted black.
    emit  menu     (el) — single click: open this chip's dropdown menu, anchored at `el`.
-->
<template>
  <span class="join-chip" :class="{ selected: active }"
    @click.stop="$emit('menu', $event.currentTarget, $event)"><span class="jc-kw">{{ label }}</span><span class="jc-paren">(</span></span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
defineEmits(["menu"]);

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
  gap: 0;                 /* `any(` reads as one token — no space (Jason 2026-06-19). */
  box-sizing: border-box;
  height: 26px;
  flex: 0 0 auto;
  /* the join block IS the indent unit; the close `)` is half its width (shared vars). */
  width: var(--join-w, 40px);
  min-width: var(--join-w, 40px);
  padding: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.07);
  cursor: pointer;
  user-select: none;
}
/* keyword + paren are BOTH monospace now (Jason 2026-06-19 — monospace everything), so
   `any(` / `all(` reads as one mono token that pairs with the closing `)` block. */
.jc-kw {
  color: rgba(0, 0, 0, 0.72);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
}
.jc-paren {
  color: rgba(0, 0, 0, 0.5);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
}
.join-chip:hover { background: rgba(0, 0, 0, 0.16); }   /* hover → clearly darker (Jason 2026-06-20) */
/* selected → SOLID BLACK, white glyphs (matches the other selected chips). */
.join-chip.selected { background: #1a1a1a; }
.join-chip.selected .jc-kw,
.join-chip.selected .jc-paren { color: #fff; }
</style>
