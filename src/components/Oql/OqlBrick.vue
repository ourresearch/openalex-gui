<!--
  OqlBrick — the single dispatcher for EVERY brick in the OQL no-code builder
  (oxjob #467, "componentize ALL brick types"). It routes on `tok.t` to the right
  per-type chip and re-emits a UNION of their intents, so OqlQueryBuilder's template
  collapses from a big v-if/else token chain to one `<OqlBrick :tok :ctx @… />` per
  token. The builder binds every intent it cares about and never branches on type; a
  brick simply never emits intents that don't apply to it.

  Chip ownership (all #467 files):
    kw + _entity              -> <OqlEntitySelect>   set-entity
    kw (not chrome / inert)   -> <OqlKeywordChip>    negate-group  (inert → plain text)
    conn (and/or)             -> inline chip         toggle-join
    paren ( ( / ) )           -> <OqlParenChip>      inert (#428 Phase B) — emits nothing
    col (field)               -> <OqlFieldChip>      select-field · open-field-menu ·
                                                     more-fields · delete-filter ·
                                                     add-filter (Cmd+Enter) · change-field
    op (predicate)            -> folded into the col chip (parent drops the token)
    vbrick (value)            -> <OqlValueChip>      value-* · toggle-neg · pick-bool ·
                                                     pick-date · add · remove
    text (rare passthrough)   -> inline span

  #428 Phase B removed the menu-driven clause/value-add intents (new-clause, group,
  delete-group): clause creation is #472's select-and-wrap, value-add is the trailing
  green "+" AddValueChip + Cmd/Ctrl+Enter, group/whole-group delete is the per-line 🗑.

  NOT handled here: the INVISIBLE `addvalue` entity picker (BuilderAddValue). It's an
  anchor the parent opens programmatically via registerPicker/openPicker — not a chip
  with design/affordances — so it stays parent-rendered. (oxjob #467 contract.)

  Intents emit PAYLOAD ONLY (no `tok`): the parent's own v-for still has `tok` in
  scope, so it binds e.g. `@select-field="pickField(tok, $event)"`. PURELY
  PRESENTATIONAL — all query mutation stays in the parent's v2 edit ops.

  Props:
    tok   the layout token (from OqlQueryBuilder's displayLines).
    ctx   catalog/helpers the field picker needs: { allFieldKeys, popularFields,
          getFieldDisplayName, getFieldIcon, openFieldMenuId, properties }.
-->
<template>
  <!-- ENTITY selector (`works`/`authors` on line 1) -->
  <OqlEntitySelect v-if="tok.t === 'kw' && tok._entity" :model-value="ctx.entity" :where="ctx.hasWhere"
    @set-entity="$emit('set-entity', $event)" />

  <!-- KEYWORD: group `not` chrome (clickable) OR inert `and`/`or` (plain text). The
       leading `where` is folded into the entity chip above, so OqlKeywordChip drops it. -->
  <OqlKeywordChip v-else-if="tok.t === 'kw'" :tok="tok"
    @negate-group="$emit('negate-group')" />

  <!-- CONNECTOR (and/or) — single-click dropdown (and/or checkboxes) · double-click toggle -->
  <OqlConnChip v-else-if="tok.t === 'conn'" :tok="tok"
    @toggle-join="$emit('toggle-join')" />

  <!-- PAREN block — inert (#428 Phase B): decorative, emits nothing. Its old
       controls moved to the per-line +/🗑 affordance + #472's wrap gesture. -->
  <OqlParenChip v-else-if="tok.t === 'paren'" :tok="tok" />

  <!-- COLUMN (field / property). The predicate (op) is FOLDED INTO this chip now
       (oxjob #467, Jason 2026-06-15): the parent drops the separate `op` token and
       hands its text/operator-options on `tok._predicate`/`tok._ops`, so the field
       chip reads "keyword is" and a numeric field picks its operator from this menu. -->
  <OqlFieldChip v-else-if="tok.t === 'col'" :tok="tok" :ctx="ctx"
    :selected="selected" :selection-active="selectionActive"
    @select-field="$emit('select-field', $event)"
    @open-field-menu="$emit('open-field-menu', $event)"
    @more-fields="$emit('more-fields')"
    @delete-filter="$emit('delete-filter')"
    @add-filter="$emit('add-filter')"
    @change-field="$emit('change-field', $event)"
    @change-operator="$emit('change-operator', $event)"
    @select="$emit('select', $event)"
    @batch-menu="$emit('batch-menu', $event)"
    @select-clear="$emit('select-clear')" />

  <!-- VALUE brick (entity / boolean / scalar-search) -->
  <OqlValueChip v-else-if="tok.t === 'vbrick'" :tok="tok"
    :selected="selected" :selection-active="selectionActive"
    @value-input="$emit('value-input', $event)"
    @value-keydown="$emit('value-keydown', $event)"
    @value-blur="$emit('value-blur')"
    @toggle-neg="$emit('toggle-neg')"
    @add="$emit('add')"
    @remove="$emit('remove')"
    @pick-bool="$emit('pick-bool', $event)"
    @pick-date="$emit('pick-date', $event)"
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
  // multi-select (oxjob #472): only the value brick consumes these; other brick types ignore them.
  selected: { type: Boolean, default: false },
  selectionActive: { type: Boolean, default: false },
});

defineEmits([
  // structural
  "set-entity", "negate-group", "toggle-join",
  // field (predicate folded in: change-operator picks a numeric field's operator)
  "select-field", "open-field-menu", "more-fields", "delete-filter", "change-field", "change-operator",
  // value
  "value-input", "value-keydown", "value-blur", "toggle-neg", "add", "pick-bool", "pick-date", "remove",
  // multi-select (oxjob #472)
  "select", "batch-menu", "select-clear",
  // filter-level: Cmd/Ctrl+Enter "add a sibling filter" shortcut (field chip)
  "add-filter",
]);
</script>

<style scoped>
/* Inline-brick styling mirrored from OqlQueryBuilder's scoped CSS so the dispatcher
   is self-contained; #428 deletes its copies when it swaps OqlBrick in. Role colours
   (--conn-*, --rel-*) cascade from the .builder ancestor (oqlPalette.js). The connector
   (and/or) chip is now its own component (OqlConnChip) with styles in oqlChip.css. */
.paren-brick {
  color: rgba(0, 0, 0, 0.55);
  font-family: "JetBrains Mono", monospace;
  padding: 0 1px;
}
</style>
