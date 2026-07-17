<!--
  OqlOrHandle — the `or` conjunction prefix that DOUBLES as a value chip's drag handle
  (#603 round 31, Jason). An or-joined value carries its `or` inside the chip (faded, #603
  r27); Jason made that spot the ONLY place a value chip can be grabbed for reorder/delete:
    • at rest it reads as the faded `or` conjunction;
    • on chip hover the `or` swaps to a grip glyph (grab cursor) — "this is the grab point";
    • dragging it starts the chip drag (the parent wires @dragstart/@dragend to its
      useChipShortcuts handlers, which begin the shared drag + the drag-out-to-delete).
  A value with NO `or` (the first in a list) simply doesn't render this, so it isn't
  draggable — exactly Jason's spec.

  It swallows its own click/mousedown so grabbing the handle never selects/edits the chip.
-->
<template>
  <span class="orpfx orpfx--handle" draggable="true" title="drag to reorder"
    @click.stop @mousedown.stop
    @dragstart="$emit('dragstart', $event)" @dragend="$emit('dragend', $event)">
    <span class="orpfx-text">{{ text }}</span>
    <span class="orpfx-grip" aria-hidden="true"></span>
  </span>
</template>

<script setup>
import "@/components/Oql/oqlChip.css"; // shared .orpfx / .val-chip styles

defineProps({ text: { type: String, required: true } });
defineEmits(["dragstart", "dragend"]);
</script>
