<script setup>
import { ComboboxContent } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <ComboboxContent
    :class="cn('max-h-[300px] overflow-y-auto overflow-x-hidden', $props.class)"
  >
    <slot />
  </ComboboxContent>
</template>
