<script setup>
import { ComboboxSeparator } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <ComboboxSeparator :class="cn('-mx-1 h-px bg-border', $props.class)" />
</template>
