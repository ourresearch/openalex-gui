<!--
  OqlKbdHint — a shortcut hint rendered as one or more "keycaps" for the OQL chip
  context menus (oxjob #467). Each key in `keys` becomes its OWN keycap (white fill,
  hairline light-gray outline); a combo like Cmd+Enter is therefore two separate caps
  sitting next to each other — never one outline around both. The `⌫` glyph cap is a
  touch larger via the `.glyph` class so it reads at a glance.

  Pass the keys already platform-resolved, e.g. `:keys="[cmdLabel, 'enter']"`.
-->
<template>
  <span class="mi-keys">
    <kbd v-for="(k, i) in keys" :key="i" class="mi-key" :class="{ glyph: glyphKeys.includes(k) }">{{ k }}</kbd>
  </span>
</template>

<script setup>
defineProps({
  keys: { type: Array, required: true },
});
// Single-character symbol caps (e.g. the Backspace glyph) get the slightly larger size.
const glyphKeys = ["⌫", "⌥", "⌘", "↵", "⏎"];
</script>

<!-- styles (.mi-keys / .mi-key) live in the shared oqlChip.css so the menus stay
     identical across chips; the card is teleported to <body> so global selectors apply. -->
