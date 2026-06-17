<!--
  OqlConnChip — the connector (and / or) chip in the OQL builder.

  INERT DECORATION as of the row-centric model (oxjob #475, 2026-06-17): a conjunction is never
  individually selectable. A click on it bubbles up to the row's `.bline` band, which selects the
  line's logical row. The AND/OR join is flipped from the row toolbar (select the row, then "Use
  AND/OR"), not from the connector. It IS painted black (`active`) when it sits on a selected row's
  line, since selecting a row blacks out all its chips (Jason 2026-06-17).

  PURELY PRESENTATIONAL — owns no query state, no handlers. Reads only the `conn` token's
  label + `active`. `cursor: pointer` is inherited from the clickable `.bline` band.

  Contract:
    prop  tok     the `conn` token. Reads: label/text ("and"|"or").
    prop  active  this conjunction is on a selected row's line (→ black).
-->
<template>
  <span class="val-chip conn-chip" :class="{ selected: active }">{{ chipLabel }}</span>
</template>

<script setup>
import { computed } from "vue";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .conn-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});

const join = computed(() => (props.tok.label || props.tok.text || "and").trim().toLowerCase());
// The chip shows a compact glyph: "and" → "&" (per Jason); "or" stays "or".
const chipLabel = computed(() => (join.value === "and" ? "&" : join.value));
</script>

<!-- chip styles live in the shared oqlChip.css (imported in the script). -->
