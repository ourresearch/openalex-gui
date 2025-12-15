<script setup>
import { ProgressRoot, ProgressIndicator } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  class: {
    type: String,
    default: '',
  },
  indeterminate: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <ProgressRoot
    :model-value="indeterminate ? undefined : modelValue"
    :max="max"
    :class="cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', $props.class)"
  >
    <ProgressIndicator
      :class="cn(
        'h-full w-full flex-1 bg-primary transition-all',
        indeterminate && 'animate-pulse'
      )"
      :style="indeterminate ? {} : { transform: `translateX(-${100 - (modelValue / max) * 100}%)` }"
    />
  </ProgressRoot>
</template>
