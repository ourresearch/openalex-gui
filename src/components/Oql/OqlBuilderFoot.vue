<!--
  OqlBuilderFoot — the builder's status/Run strip (valid chip · spinner · seed error ·
  result count · host foot-actions · Run). OqlQueryBuilder mounts it in TWO spots — inside
  the v-card as a real card footer when embedded (SERP), below the card otherwise — ONE
  component so the two can't drift (they were hand-synced template copies before the
  2026-07-05 cleanup). The `.builder-foot` / `.builder-foot--in-card` styles stay in the
  parent (its scoped rules reach this component's root element).

  The `foot-actions` slot is host-injected chrome (e.g. the #463 "view code" button) the
  parent forwards through; this component knows nothing about it.
-->
<template>
  <div class="builder-foot" :class="{ 'builder-foot--in-card': inCard }">
    <v-chip v-if="validation" size="x-small" :color="validation.valid ? 'green' : 'red'" variant="tonal">{{ statusLabel }}</v-chip>
    <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
    <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
    <span v-if="resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
    <v-spacer />
    <slot name="foot-actions" />
    <v-btn size="small" variant="flat" color="black" :loading="running" @click="$emit('run')">{{ runLabel }}</v-btn>
  </div>
</template>

<script setup>
defineProps({
  inCard: { type: Boolean, default: false },
  validation: { type: Object, default: null },
  statusLabel: { type: String, default: "" },
  rendering: { type: Boolean, default: false },
  seedError: { type: String, default: null },
  // null hides the count (the parent passes null unless inlineRun produced one).
  resultCount: { type: Number, default: null },
  running: { type: Boolean, default: false },
  runLabel: { type: String, default: "Run" },
});
defineEmits(["run"]);
</script>
