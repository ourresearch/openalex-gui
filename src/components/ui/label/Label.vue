<script setup>
import { Label } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  for: {
    type: String,
    default: '',
  },
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <Label
    :for="$props.for"
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      $props.class
    )"
  >
    <slot />
  </Label>
</template>
