<!--
  OqlValueChip — the single entry point for every VALUE brick in the OQL builder
  (everything to the right of the operator). Dispatches on the `tok` flags to the
  right per-type chip, each of which converged onto the same click→menu pattern
  (oxjob #467 round 2):

    tok._boolPhrase  OR  tok._kind === 'boolean'  -> <OqlBoolChip>  (Negate · Delete)
    tok._kind === 'entity'                        -> <OqlEntityChip> (New · Negate · Delete)
    (else, scalar / search)                       -> <OqlTextChip>  (Edit · New · Negate · Delete)

  PURELY PRESENTATIONAL — owns no query state. It reads everything from `tok` (a
  `vbrick` token from OqlQueryBuilder's `displayLines`) and forwards semantic intents
  that the parent maps onto the v2 edit ops + re-renders. This is the boundary that
  lets the builder's line-flow/layout logic (OqlQueryBuilder.vue) and the per-chip
  design (these chip components) evolve in separate sessions without contention
  (oxjob #467 / #428).

  Contract (intents forwarded to the parent):
    value-input / value-keydown / value-blur  — text chip editing.
    toggle-neg   — text / entity / bool-phrase: toggle negation.
    pick-bool    (Boolean) — true/false boolean: set the (flipped) value.
    add          — text / entity: add a sibling VALUE to the right (edit.addValue).
    add-filter   — boolean: add a sibling FILTER (works). new-clause: STUB.
    new-clause   — boolean: add a sub-clause (STUB for now).
    remove       — remove this value.
-->
<template>
  <!-- boolean (phrase "it's open access", or phrase-less true/false) -->
  <OqlBoolChip v-if="tok._boolPhrase || tok._kind === 'boolean'" :tok="tok"
    @toggle-neg="$emit('toggle-neg')"
    @pick-bool="$emit('pick-bool', $event)"
    @add-filter="$emit('add-filter')"
    @new-clause="$emit('new-clause')"
    @remove="$emit('remove')" />

  <!-- entity value chip -->
  <OqlEntityChip v-else-if="tok._kind === 'entity'" :tok="tok"
    @toggle-neg="$emit('toggle-neg')"
    @add="$emit('add')"
    @remove="$emit('remove')" />

  <!-- scalar / search value: inline-editable "text chip" -->
  <OqlTextChip v-else :tok="tok"
    @value-input="$emit('value-input', $event)"
    @value-keydown="$emit('value-keydown', $event)"
    @value-blur="$emit('value-blur')"
    @toggle-neg="$emit('toggle-neg')"
    @add="$emit('add')"
    @remove="$emit('remove')" />
</template>

<script setup>
import OqlTextChip from "@/components/Oql/OqlTextChip.vue";
import OqlEntityChip from "@/components/Oql/OqlEntityChip.vue";
import OqlBoolChip from "@/components/Oql/OqlBoolChip.vue";

defineProps({
  tok: { type: Object, required: true },
});

defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "pick-bool", "add", "add-filter", "new-clause", "remove"]);
</script>
