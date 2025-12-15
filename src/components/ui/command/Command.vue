<script setup>
import { ComboboxRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <ComboboxRoot
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :class="cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      $props.class
    )"
  >
    <slot />
  </ComboboxRoot>
</template>
