<!--
  OqlKeywordChip — the structural KEYWORD bricks (`tok.t === 'kw'`) that aren't the
  entity selector. Part of the all-bricks componentization (oxjob #467). Two variants:

    NEGATE  (`tok.label === 'not'` + a group `id`) — the clause-group `not` chrome:
            a clickable bold brick that toggles the group's negation off.
            Emits `negate-group`.
    INERT   (`where`, draft `and` / `or` lead-ins) — these are NOT interactive, so
            they render as PLAIN TEXT with no block/chip around them (Jason, 2026-06-15:
            "the only one that's not clickable — just make it text, no block").

  PURELY PRESENTATIONAL — owns no query state.

  Contract:
    prop  tok           the `kw` token. Reads: label, id, text.
    emit  negate-group  () — NEGATE variant clicked: toggle the group's negation.
-->
<template>
  <span v-if="isNegate" class="kw-not" tabindex="0"
    @click="$emit('negate-group')" @keydown.enter="$emit('negate-group')">not</span>
  <span v-else class="kw-text">{{ (tok.text || "").trim() }}</span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
});
defineEmits(["negate-group"]);

const isNegate = computed(() => props.tok.label === "not" && !!props.tok.id);
</script>

<style scoped>
/* INERT keyword (`where` / `and` / `or`): plain text, no brick. Uses the keyword
   role colour so it still reads as structural, just without the chip chrome. */
.kw-text {
  color: var(--kw-fg, #4e5662);
  font-size: var(--brick-fs, 0.8125rem);
  padding: 0 2px;
}
/* group `not` chrome — bold, clickable, value-toned so it reads as "negated". */
.kw-not {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: var(--brick-fs, 0.8125rem);
  color: var(--val-fg, #14625c);
  background: var(--val-bg, #d6f2ec);
  text-transform: lowercase;
}
.kw-not:hover { filter: brightness(0.96); }
.kw-not:focus { box-shadow: 0 0 0 1.5px var(--val-fg, #14625c) inset; outline: none; }
</style>
