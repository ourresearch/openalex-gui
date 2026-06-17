<!--
  OqlBrick — the single dispatcher for EVERY brick in the OQL no-code builder. Routes on
  `tok.t` to the right per-type chip and re-emits a UNION of their intents, so the builder
  binds them all and never branches on type.

  Chip ownership:
    kw + _entity              -> <OqlEntitySelect>   set-entity
    kw (not chrome / inert)   -> <OqlKeywordChip>    negate-group
    conn (and/or)             -> <OqlConnChip>       select · request-edit (toolbar chooser)
    paren ( ( / ) )           -> <OqlParenChip>      inert
    col (field)               -> <OqlFieldChip>      select-field · open-field-menu ·
                                                     more-fields · delete-filter ·
                                                     add-filter (Cmd+Enter) · request-edit
    op (predicate)            -> folded into the col chip (parent drops the token)
    vbrick (value)            -> <OqlValueChip>      value-* · add · remove · request-edit
    text (rare passthrough)   -> inline span

  oxjob #428 (2026-06-17): the per-chip pop-up menus were removed; a chip's actions now
  live in the builder toolbar (OqlChipActions) when the chip is highlighted. So chips emit
  `select` (highlight) + `request-edit` (open the chip's toolbar editor); negate/delete/
  bool/date/operator/connector edits are emitted by the TOOLBAR, not the chips. `active`
  marks the highlighted chip; `editOpen` tells the text chip to enter in-place edit.

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

  <!-- CONNECTOR (and/or) — selectable; its and/or chooser opens in the toolbar -->
  <OqlConnChip v-else-if="tok.t === 'conn'" :tok="tok" :active="active"
    @select="$emit('select', $event)"
    @request-edit="$emit('request-edit')" />

  <!-- PAREN block — selectable: click selects the logical row, dblclick/Enter toggles join. -->
  <OqlParenChip v-else-if="tok.t === 'paren'" :tok="tok" :active="active"
    @select="$emit('select', $event)"
    @request-edit="$emit('request-edit')" />

  <!-- COLUMN (field / property). The predicate (op) is FOLDED INTO this chip. -->
  <OqlFieldChip v-else-if="tok.t === 'col'" :tok="tok" :ctx="ctx" :active="active"
    :selected="selected" :selection-active="selectionActive"
    @select-field="$emit('select-field', $event)"
    @open-field-menu="$emit('open-field-menu', $event)"
    @more-fields="$emit('more-fields')"
    @delete-filter="$emit('delete-filter')"
    @add-filter="$emit('add-filter')"
    @request-edit="$emit('request-edit')"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')" />

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
  // highlight → open this chip's editor in the toolbar
  "request-edit",
  // multi-select (oxjob #472)
  "select", "batch-menu", "select-clear",
  // Cmd/Ctrl+Enter "add a sibling filter" (field chip)
  "add-filter",
]);
</script>

<style scoped>
.paren-brick {
  color: rgba(0, 0, 0, 0.55);
  font-family: "JetBrains Mono", monospace;
  padding: 0 1px;
}
</style>
