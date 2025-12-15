<script setup>
import { ComboboxEmpty } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <ComboboxEmpty :class="cn('py-6 text-center text-sm', $props.class)">
    <slot />
  </ComboboxEmpty>
</template>
