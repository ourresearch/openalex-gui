<!--
  OqlValueChip — the single entry point for every VALUE brick (everything to the right of
  the operator). Dispatches on the `tok` flags to the right per-type chip. All four chips
  are DISPLAY-ONLY now (oxjob #428 toolbar-actions move): their actions (negate / delete /
  the bool & date editors) live in the builder toolbar when the chip is highlighted. The
  text chip keeps its in-place edit input.

    tok._boolPhrase  OR  tok._kind === 'boolean'  -> <OqlBoolChip>   (toolbar: Edit/Delete)
    tok._kind === 'entity'                        -> <OqlEntityChip> (toolbar: Negate/Delete)
    tok._kind === 'date'                          -> <OqlDateChip>   (toolbar: Edit/Negate/Delete)
    (else, scalar / search)                       -> <OqlTextChip>   (toolbar: Edit/Negate/Delete)

  PURELY PRESENTATIONAL. Forwards selection + edit-request intents up to the builder.

  Contract (intents forwarded to the parent):
    value-input / value-keydown / value-blur  — text chip editing.
    add          — text / entity / date: add a sibling VALUE to the right.
    remove       — remove this value.
    request-edit — open this chip's editor in the toolbar (bool/date) — text edits in place.
    select / batch-menu / select-clear — selection gestures (#472).
  Props: active (single-highlight) and editOpen (toolbar "Edit" → text in-place edit).
-->
<template>
  <!-- boolean (phrase "it's open access", or phrase-less true/false) -->
  <OqlBoolChip v-if="tok._boolPhrase || tok._kind === 'boolean'" :tok="tok" :active="active"
    :selected="selected" :selection-active="selectionActive"
    @toggle="$emit('toggle')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')"
    @remove="$emit('remove')" />

  <!-- entity value chip -->
  <OqlEntityChip v-else-if="tok._kind === 'entity'" :tok="tok" :active="active"
    :selected="selected" :selection-active="selectionActive"
    @request-edit="$emit('request-edit')"
    @add="$emit('add')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')"
    @remove="$emit('remove')" />

  <!-- date value chip -->
  <OqlDateChip v-else-if="tok._kind === 'date'" :tok="tok" :active="active"
    :selected="selected" :selection-active="selectionActive"
    @request-edit="$emit('request-edit')"
    @add="$emit('add')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')"
    @remove="$emit('remove')" />

  <!-- scalar / search value: inline-editable "text chip" -->
  <OqlTextChip v-else :tok="tok" :active="active" :edit-open="editOpen"
    :selected="selected" :selection-active="selectionActive"
    @value-input="$emit('value-input', $event)"
    @value-keydown="$emit('value-keydown', $event)"
    @value-blur="$emit('value-blur')"
    @edit-start="$emit('edit-start')"
    @add="$emit('add')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')"
    @remove="$emit('remove')" />
</template>

<script setup>
import OqlTextChip from "@/components/Oql/OqlTextChip.vue";
import OqlEntityChip from "@/components/Oql/OqlEntityChip.vue";
import OqlBoolChip from "@/components/Oql/OqlBoolChip.vue";
import OqlDateChip from "@/components/Oql/OqlDateChip.vue";

defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
  editOpen: { type: Boolean, default: false },
  // multi-select (oxjob #472): forwarded straight through to the per-type chip.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});

defineEmits(["value-input", "value-keydown", "value-blur", "edit-start", "add", "remove", "request-edit",
  "toggle", "select", "batch-menu", "select-clear"]);
</script>
