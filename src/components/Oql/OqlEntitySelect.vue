<!--
  OqlEntitySelect — the entity-type selector BLOCK on line 1 of the OQL builder
  (`works` / `authors` / …). Part of the all-bricks componentization (oxjob #467).

  It's a thin wrapper over the shared <EntitySelectorButton> in controlled mode, with
  one builder tweak: the dropdown caret is HIDDEN (`:append-icon="null"`). Clicking a
  builder block always opens its menu, so the caret is redundant chrome here — every
  other builder brick relies on click-to-open without a caret too. (Jason, 2026-06-15.)

  PURELY PRESENTATIONAL — owns no query state. Reads the current entity and emits the
  chosen one; the parent assigns it (`getRows = $event`).

  Contract:
    prop  modelValue  the current entity type (`getRows`).
    emit  set-entity  (entityType) — a new entity was chosen.
-->
<template>
  <EntitySelectorButton :model-value="modelValue" :append-icon="null"
    :suffix="where ? 'where' : ''"
    @update:model-value="$emit('set-entity', $event)" />
</template>

<script setup>
import EntitySelectorButton from "@/components/EntitySelectorButton.vue";

defineProps({
  modelValue: { type: String, default: null },
  // When true, the chip reads `works where` (the leading `where` keyword folded INTO
  // this lavender block; the standalone `where` brick is suppressed in OqlKeywordChip).
  // Driven by ctx.hasWhere = "the committed query has a where clause" (oxjob #467).
  where: { type: Boolean, default: false },
});
defineEmits(["set-entity"]);
</script>
