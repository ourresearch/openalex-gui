<script setup>
import { TooltipRoot } from 'radix-vue'

const props = defineProps({
  delayDuration: {
    type: Number,
    default: 200,
  },
  open: {
    type: Boolean,
    default: undefined,
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])
</script>

<template>
  <TooltipRoot
    :delay-duration="delayDuration"
    :open="open"
    :default-open="defaultOpen"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </TooltipRoot>
</template>
