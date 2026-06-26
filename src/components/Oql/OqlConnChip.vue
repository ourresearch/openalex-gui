<!--
  OqlConnChip — the connector (and / or) chip in the OQL builder.

  CONNECTOR-AS-UNIT EDITING (oxjob #507 Phase 3): the connector is now the EDIT UNIT.
  Clicking an inline `or`/`&` FLIPS that one connector and lets precedence restructure the
  group locally (e.g. `a or b or c`, click the 2nd `or` → `a or (b and c)`). This replaces
  the old clause-level join switch (the row toolbar "Use AND/OR"); there is no whole-clause
  join control anymore. The click emits `flip` (with the token's group id + `_opIndex`
  already on `tok`); the builder routes it through v2Edit.flipConnector. The COLUMN-grid
  connector cells (`.bl-conn-cell` in OqlQueryBuilder) carry the same handler for vertical
  groups — this chip covers the INLINE (OR-of-leaves) case.

  Still painted black (`active`) when it sits on a selected row's line. `.stop` on the click
  keeps it off the row-select band so a connector click flips rather than selects.

  Contract:
    prop  tok     the `conn` token. Reads: label/text ("and"|"or"), id, _opIndex.
    prop  active  this conjunction is on a selected row's line (→ black).
    emit  flip    user clicked the connector to flip it (payload: none — tok is in parent scope).
-->
<template>
  <span class="val-chip conn-chip conn-chip--editable"
    :class="{ selected: active, 'conn-chip--filter': tok._level === 'filter' }"
    role="button" tabindex="-1" :title="`change to ${join === 'and' ? 'or' : 'and'}`"
    @click.stop="$emit('flip')">{{ chipLabel }}</span>
</template>

<script setup>
import { computed } from "vue";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .conn-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
defineEmits(["flip"]);

const join = computed(() => (props.tok.label || props.tok.text || "and").trim().toLowerCase());
// The chip shows a compact glyph: "and" → "&" (per Jason); "or" stays "or".
const chipLabel = computed(() => (join.value === "and" ? "&" : join.value));
</script>

<style scoped>
/* Connector is interactive now (Phase 3): show it's clickable + a subtle hover — a darker
   tint of the conjunction (teal) hue, not a grey wash (#507 hover-bug fix, Jason 2026-06-24).
   Matches the shared `.val-chip.conn-chip:hover` in oqlChip.css so the result is identical
   whichever wins the specificity tie. */
.conn-chip--editable { cursor: pointer; }
.conn-chip--editable:hover { background: var(--vconn-bg-hov, #c7d8fb); border-radius: 3px; }
</style>

<!-- chip styles live in the shared oqlChip.css (imported in the script). -->
