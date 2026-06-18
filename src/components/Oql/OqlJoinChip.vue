<!--
  OqlJoinChip — the JOIN-STRATEGY chip (`tok.t === 'joinkw'`) that sits right BEFORE a
  group's open paren, matching the OQL spec: `all ( … )` / `any ( … )`. It is the single locus
  that controls how that one parenthesis set joins its members — `all` (AND) or `any` (OR).
  (OQL decision 32 / oxjob #475, 2026-06-18.)

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
    prop  active   this chip is selected (or its row is) → painted black.
    emit  select   () — single click: select this join chip.
    emit  toggle   () — double click: flip all ⇄ any.
-->
<template>
  <span ref="el" class="join-chip" :class="{ selected: active }" tabindex="-1"
    @click.stop="onClick"
    @dblclick.stop.prevent="$emit('toggle')">{{ label }}</span>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "toggle"]);

// Focus the chip on click so a follow-up Enter reaches the builder's keydown handler
// (which toggles all ⇄ any while the chip is selected). The chip is `tabindex=-1`, so it
// only takes focus programmatically — never in the tab order.
const el = ref(null);
const onClick = () => { el.value?.focus?.(); emit("select"); };

// "all" (AND) / "any" (OR). Prefer the explicit text the layout split set; fall back
// to the join label.
const label = computed(() => {
  const t = (props.tok.text || "").trim().toLowerCase();
  if (t === "all" || t === "any") return t;
  return (props.tok.label || "and") === "or" ? "any" : "all";
});
</script>

<style scoped>
/* A wider sibling of the grey paren brick: exactly 2× the 28px paren width (56px),
   same height/radius/typography so the `( all` / `( any` pair reads as one unit. */
.join-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  flex: 0 0 auto;
  width: 56px;
  min-width: 56px;
  padding: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.6);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
  cursor: pointer;
  user-select: none;
}
.join-chip:hover { filter: brightness(0.97); }
/* selected → SOLID BLACK, white glyph (matches the other selected chips). */
.join-chip.selected { background: #1a1a1a; color: #fff; outline: none; }
</style>
