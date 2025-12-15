<script setup>
import { ComboboxGroup } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <ComboboxGroup :class="cn('overflow-hidden p-1 text-foreground', $props.class)">
    <slot />
  </ComboboxGroup>
</template>
