<script setup>
import { ComboboxAnchor } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  asChild: Boolean,
})
</script>

<template>
  <ComboboxAnchor :as-child="asChild" :class="cn('flex items-center', $props.class)">
    <slot />
  </ComboboxAnchor>
</template>
