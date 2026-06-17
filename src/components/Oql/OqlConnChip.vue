<!--
  OqlConnChip — the connector (and / or) chip in the OQL builder. Display-only now
  (oxjob #428 toolbar-actions move, 2026-06-17): the and/or chooser moved to the
  builder toolbar's "Edit" popover. Single-click SELECTS the connector (highlight +
  its toolbar actions); double-click / Enter asks the builder to open that chooser.

  PURELY PRESENTATIONAL — owns no query state. Reads the `conn` layout token; emits
  `select` (highlight) and `request-edit` (open the toolbar and/or chooser). The actual
  flip is `edit.toggleJoin`, mapped by the parent from the toolbar chooser.

  Contract:
    prop  tok       the `conn` token. Reads: id, label/text ("and"|"or").
    prop  active    this connector is the highlighted chip.
    emit  select        ({id,mode,el}) — selection gesture.
    emit  request-edit  () — open the and/or chooser in the toolbar.
-->
<template>
  <span class="val-chip conn-chip" :class="{ selected: active }"
    tabindex="0" @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">
    {{ chipLabel }}
  </span>
</template>

<script setup>
import { computed } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .conn-chip styles

const props = defineProps({
  tok: { type: Object, required: true },
  active: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "request-edit"]);

const join = computed(() => (props.tok.label || props.tok.text || "and").trim().toLowerCase());
// The chip shows a compact glyph: "and" → "&" (per Jason); "or" stays "or".
const chipLabel = computed(() => (join.value === "and" ? "&" : join.value));

// Single-click selects; double-click / Enter opens the toolbar and/or chooser.
const { onClick, onDblclick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onEdit: () => emit("request-edit"),
  onSelect: (p) => emit("select", p),
});
</script>

<!-- chip styles live in the shared oqlChip.css (imported in the script). -->
