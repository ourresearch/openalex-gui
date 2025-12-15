<script setup>
import { AccordionItem } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    required: true,
  },
  disabled: Boolean,
})
</script>

<template>
  <AccordionItem
    :value="value"
    :disabled="disabled"
    :class="cn('border-b', $props.class)"
  >
    <slot />
  </AccordionItem>
</template>
