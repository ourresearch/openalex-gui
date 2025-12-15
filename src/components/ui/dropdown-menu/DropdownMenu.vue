<script setup>
import { DropdownMenuRoot } from 'radix-vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: undefined,
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
  modal: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:open'])
</script>

<template>
  <DropdownMenuRoot
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DropdownMenuRoot>
</template>
