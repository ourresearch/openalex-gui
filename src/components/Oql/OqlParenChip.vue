<!--
  OqlParenChip — the parenthesis BLOCK (`tok.t === 'paren'`) in the OQL builder.
  Part of the all-bricks componentization (oxjob #467).

  INERT as of #428 Phase B (2026-06-16): a grey monospace brick (`(` or `)`) that
  is now PURELY DECORATIVE — no click, no menu, no keyboard intents. Its old
  controls moved to the logical line the paren terminates: the per-line **+** / 🗑
  affordance (add sibling filter / delete the whole group) in OqlQueryBuilder, and
  clause CREATION now happens only via #472's select-multiple-then-wrap gesture.

  PURELY PRESENTATIONAL — owns no query state, emits nothing. Reads `tok.text`.

  Contract:
    prop  tok           the `paren` token. Reads: text (`(` / `)`).

  NB layout: `.paren-block` is fixed at 28px wide — #428's builder indent unit is
  `calc(28px + gap)`, so this width is LOAD-BEARING; keep it in lock-step if the
  indent math ever changes (oxjob #428).
-->
<template>
  <v-chip class="paren-block" label size="small" variant="flat">{{ tok.text }}</v-chip>
</template>

<script setup>
defineProps({
  tok: { type: Object, required: true },
});
</script>

<style scoped>
/* Mirrors OqlQueryBuilder's `.paren-block`: a grey brick, fixed 28px so it == the
   builder's --indent unit exactly (border-box). Inert now (#428 Phase B) — no
   pointer/hover/focus affordance. (oxjob #428 / #467.) */
.paren-block {
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  min-width: 28px;
  padding: 0;
  background: rgba(0, 0, 0, 0.07) !important;
  color: rgba(0, 0, 0, 0.6) !important;
  font-family: "JetBrains Mono", monospace;
  font-weight: 700 !important;
}
</style>
