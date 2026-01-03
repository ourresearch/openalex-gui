<template>
  <span
    class="oql-segment"
    :class="segmentClass"
  >{{ segment.text }}</span>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'OqlSegment' });

const props = defineProps({
  segment: {
    type: Object,
    required: true
  }
});

const segmentClass = computed(() => {
  return `oql-segment--${props.segment.kind}`;
});
</script>

<style lang="scss" scoped>
.oql-segment {
  // Base segment styling
  &--keyword {
    color: #666;
  }

  &--column {
    color: #333;
    font-weight: 500;
  }

  &--operator {
    color: #666;
  }

  &--value {
    color: #1976d2;
  }

  &--id {
    color: #888;
    font-size: 0.9em;
  }

  &--text {
    // Whitespace/formatting - no special styling
  }
}
</style>
