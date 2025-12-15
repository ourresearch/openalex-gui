<script setup>
import { ComboboxItem } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  value: {
    type: [String, Object],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <ComboboxItem
    :value="value"
    :disabled="disabled"
    :class="cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      $props.class
    )"
    @select="emit('select', $event)"
  >
    <slot />
  </ComboboxItem>
</template>
