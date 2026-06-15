<!--
  OqlValueChip — the single entry point for every VALUE brick in the OQL builder
  (everything to the right of the operator). Dispatches on the `tok` flags to the
  right presentation for each value kind, and delegates the scalar/search case to
  the inline-editable OqlTextChip:

    tok._boolPhrase        -> boolean PHRASE chip ("it's open access"); click flips
                              it to the negative phrase.
    tok._kind === 'boolean'-> true/false menu chip (phrase-less bool fields).
    tok._kind === 'entity' -> entity value chip (click toggles negation, × removes).
    (else, scalar / search) -> <OqlTextChip> (own component).

  PURELY PRESENTATIONAL — owns no query state. It reads everything from `tok` (a
  `vbrick` token from OqlQueryBuilder's `displayLines`) and emits semantic intents
  that the parent maps onto the v2 edit ops + re-renders. This is the boundary that
  lets the builder's line-flow/layout logic (OqlQueryBuilder.vue) and the per-chip
  design (this component + OqlTextChip) evolve in separate sessions without
  contention (oxjob #467 / #428).

  Contract:
    prop  tok            the vbrick token. Reads: _boolPhrase, _kind, negated, value,
                         _sole, _entityName, display, text (+ whatever OqlTextChip reads).
    emit  value-input    (InputEvent)   — text chip: user typed.
    emit  value-keydown  (KeyboardEvent) — text chip: raw keydown.
    emit  value-blur     ()             — text chip: input blurred.
    emit  toggle-neg     ()             — text/entity/bool-phrase: toggle negation.
    emit  remove         ()             — text/entity: remove this value.
    emit  pick-bool      (Boolean)      — boolean menu: chose true/false.

  NOTE: the boolean menu's dropdown card is teleported to <body> by Vuetify, but it
  only needs `.menu-card { overflow: hidden }` (no --val-* custom props), and the
  activator chips stay in-tree so --val-bg/--val-fg cascade from .builder normally.
-->
<template>
  <!-- boolean PHRASE: the combined predicate+value brick ("it's open access").
       A blue value chip; clicking flips it to the negative phrase. -->
  <v-chip v-if="tok._boolPhrase" class="value-chip bool-phrase"
    :class="{ negated: tok.negated }" size="small" label variant="flat"
    @click="$emit('toggle-neg')">{{ tok.text }}</v-chip>

  <!-- boolean value: true/false menu (phrase-less bool fields only) -->
  <v-menu v-else-if="tok._kind === 'boolean'" location="bottom start" offset="4">
    <template #activator="{ props: mp }">
      <v-chip v-bind="mp" class="bool-chip" label size="small" variant="flat"
        append-icon="mdi-menu-down">{{ String(tok.value) }}</v-chip>
    </template>
    <v-card min-width="120" class="menu-card">
      <v-list density="compact" class="py-0">
        <v-list-item title="true" :active="tok.value === true" @click="$emit('pick-bool', true)" />
        <v-list-item title="false" :active="tok.value === false" @click="$emit('pick-bool', false)" />
      </v-list>
    </v-card>
  </v-menu>

  <!-- entity value chip: click toggles negation; × removes -->
  <v-chip v-else-if="tok._kind === 'entity'" class="value-chip"
    :class="{ negated: tok.negated }" size="small" label variant="flat"
    :closable="!tok._sole" @click="$emit('toggle-neg')" @click:close.stop="$emit('remove')">
    <span v-if="tok.negated" class="notpfx">not&nbsp;</span>{{ tok._entityName || tok.display || tok.text }}
  </v-chip>

  <!-- scalar / search value: inline-editable "text chip" (own component) -->
  <OqlTextChip v-else :tok="tok"
    @value-input="$emit('value-input', $event)"
    @value-keydown="$emit('value-keydown', $event)"
    @value-blur="$emit('value-blur')"
    @toggle-neg="$emit('toggle-neg')"
    @remove="$emit('remove')" />
</template>

<script setup>
import OqlTextChip from "@/components/Oql/OqlTextChip.vue";

defineProps({
  tok: { type: Object, required: true },
});

defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "remove", "pick-bool"]);
</script>

<style scoped>
/* Value-brick styling moved verbatim from OqlQueryBuilder.vue's scoped block.
   --val-bg / --val-fg cascade in from the .builder ancestor (oqlPalette.js). */
.bool-chip { cursor: pointer; background: var(--val-bg, #ccfbf1) !important; color: var(--val-fg, #0f766e) !important; }
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
  cursor: pointer;
}
/* `not` prefix on the entity value chip. (The scalar/search text chip has its own
   .notpfx in OqlTextChip.vue.) */
.notpfx { font-weight: 700; color: var(--val-fg, #14625c); }
.menu-card { overflow: hidden; }
</style>
