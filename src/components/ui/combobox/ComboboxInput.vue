<script setup>
import { ComboboxInput } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  placeholder: String,
  autoFocus: Boolean,
})
</script>

<template>
  <ComboboxInput
    :auto-focus="autoFocus"
    :placeholder="placeholder"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      $props.class
    )"
  />
</template>
