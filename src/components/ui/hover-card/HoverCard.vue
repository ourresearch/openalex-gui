<script setup>
import { HoverCardRoot } from 'radix-vue'

const props = defineProps({
  defaultOpen: Boolean,
  open: Boolean,
  openDelay: {
    type: Number,
    default: 700,
  },
  closeDelay: {
    type: Number,
    default: 300,
  },
})

const emit = defineEmits(['update:open'])
</script>

<template>
  <HoverCardRoot
    v-bind="props"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </HoverCardRoot>
</template>
