<!--
  OqlBrick — the single dispatcher for EVERY brick in the OQL no-code builder. Routes on
  `tok.t` to the right per-type chip and re-emits a UNION of their intents, so the builder
  binds them all and never branches on type.

  Chip ownership:
    kw + _entity              -> <OqlEntitySelect>   set-entity
    kw (not chrome / inert)   -> <OqlKeywordChip>    negate-group
    conn (and/or)             -> <OqlConnChip>       INERT (click bubbles to row band)
    paren ( ( / ) )           -> <OqlParenChip>      INERT decoration (active → black)
    col (field)               -> <OqlFieldChip>      LOCKED: inert decoration (active → black);
                                                     PICKER (draft): select-field ·
                                                     open-field-menu · more-fields · delete-filter
    op (predicate)            -> folded into the col chip (parent drops the token)
    vbrick (value)            -> <OqlValueChip>      value-* · add · remove · request-edit · select
    text (rare passthrough)   -> inline span

  oxjob #475 (2026-06-17): row-centric selection. The LOGICAL ROW is the unit of selection —
  a click on a row's band (which parens/conjunctions/property bubble up to) selects the row in
  the builder. Structural chips (conn/paren/locked col) are INERT decorations: no select, no
  edit — just painted `active` (black) as the selected row's shape indicator (conjunctions are
  never painted). Only VALUE chips remain individually selectable (select · request-edit) and
  the draft field PICKER stays interactive. `editOpen` tells the text chip to enter in-place edit.

  Intents emit PAYLOAD ONLY (no `tok`): the parent's v-for still has `tok` in scope.
  PURELY PRESENTATIONAL.
-->
<template>
  <!-- ENTITY selector (`works`/`authors` on line 1) -->
  <OqlEntitySelect v-if="tok.t === 'kw' && tok._entity" :model-value="ctx.entity" :where="ctx.hasWhere"
    @set-entity="$emit('set-entity', $event)" />

  <!-- KEYWORD: group `not` chrome (clickable) OR inert text. -->
  <OqlKeywordChip v-else-if="tok.t === 'kw'" :tok="tok"
    @negate-group="$emit('negate-group')" />

  <!-- CONNECTOR (and/or) — INERT decoration (oxjob #475): clicks bubble to the row band. -->
  <OqlConnChip v-else-if="tok.t === 'conn'" :tok="tok" />

  <!-- PAREN block — INERT decoration: black when it's the selected row's broadest pair;
       clicks bubble to the `.bline` band → row selection. (oxjob #475) -->
  <OqlParenChip v-else-if="tok.t === 'paren'" :tok="tok" :active="active" />

  <!-- COLUMN (field / property). The predicate (op) is FOLDED INTO this chip. LOCKED is an
       inert decoration (black when its filter is the selected row); PICKER (draft) still
       opens the field-chooser menu. (oxjob #475) -->
  <OqlFieldChip v-else-if="tok.t === 'col'" :tok="tok" :ctx="ctx" :active="active"
    @select-field="$emit('select-field', $event)"
    @open-field-menu="$emit('open-field-menu', $event)"
    @more-fields="$emit('more-fields')"
    @delete-filter="$emit('delete-filter')" />

  <!-- VALUE brick (entity / boolean / date / scalar-search) -->
  <OqlValueChip v-else-if="tok.t === 'vbrick'" :tok="tok" :active="active" :edit-open="editOpen"
    :selected="selected" :selection-active="selectionActive"
    @value-input="$emit('value-input', $event)"
    @value-keydown="$emit('value-keydown', $event)"
    @value-blur="$emit('value-blur')"
    @add="$emit('add')"
    @remove="$emit('remove')"
    @request-edit="$emit('request-edit')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')" />

  <!-- raw passthrough text (rare) -->
  <span v-else-if="tok.t === 'text'" class="paren-brick">{{ tok.text }}</span>
</template>

<script setup>
import OqlEntitySelect from "@/components/Oql/OqlEntitySelect.vue";
import OqlKeywordChip from "@/components/Oql/OqlKeywordChip.vue";
import OqlConnChip from "@/components/Oql/OqlConnChip.vue";
import OqlParenChip from "@/components/Oql/OqlParenChip.vue";
import OqlFieldChip from "@/components/Oql/OqlFieldChip.vue";
import OqlValueChip from "@/components/Oql/OqlValueChip.vue";

defineProps({
  tok: { type: Object, required: true },
  ctx: { type: Object, default: () => ({}) },
  // single highlight (oxjob #428) + text in-place edit trigger
  active: { type: Boolean, default: false },
  editOpen: { type: Boolean, default: false },
  // multi-select (oxjob #472): only value/field bricks consume these.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});

defineEmits([
  // structural
  "set-entity", "negate-group",
  // field
  "select-field", "open-field-menu", "more-fields", "delete-filter",
  // value editing (text in-place)
  "value-input", "value-keydown", "value-blur", "add", "remove",
  // highlight → open this chip's editor in the toolbar (value chips only)
  "request-edit",
  // multi-select (oxjob #472) — value chips only now
  "select", "batch-menu", "select-clear",
]);
</script>

<style scoped>
.paren-brick {
  color: rgba(0, 0, 0, 0.55);
  font-family: "JetBrains Mono", monospace;
  padding: 0 1px;
}
</style>
