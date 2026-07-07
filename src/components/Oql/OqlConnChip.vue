<!--
  OqlConnChip — the connector (and / or) chip in the OQL builder.

  INERT DECORATION (oxjob #560, Jason QA 2026-07-05): clicking a connector chip does
  NOTHING — no flip, no menu, no row-select. This reverts the #507 Phase 3
  "connector-as-unit editing" click-to-flip on the INLINE chip; joins stay editable via
  the `any(`/`all(` join-chip menu (value groups) and the column-grid connector cells
  (filter groups, `.bl-conn-cell` in OqlQueryBuilder). The bare `@click.stop` swallows
  the click so it can't bubble into the row-select band ("no selection" is part of the
  spec, not just "no flip").

  Still painted black (`active`) when it sits on a selected row's line.

  Contract:
    prop  tok     the `conn` token. Reads: label/text ("and"|"or"), _level.
    prop  active  this conjunction is on a selected row's line (→ black).
-->
<template>
  <span class="val-chip conn-chip conn-chip--inert"
    :class="{ selected: active, 'conn-chip--filter': tok._level === 'filter' }"
    @click.stop>{{ chipLabel }}</span>
</template>

<script setup>
import { computed } from "vue";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .conn-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});

const join = computed(() => (props.tok.label || props.tok.text || "and").trim().toLowerCase());
// #575 round 4 (Jason): the chip shows the WORD — "and" / "or" — no more `&` glyph
// anywhere (--chip-w was widened to fit a three-letter word).
const chipLabel = computed(() => join.value);
</script>

<style scoped>
/* Inert: default cursor. The no-tint hover lives in the shared oqlChip.css conn rules. */
.conn-chip--inert { cursor: default; user-select: none; }
</style>

<!-- chip styles live in the shared oqlChip.css (imported in the script). -->
