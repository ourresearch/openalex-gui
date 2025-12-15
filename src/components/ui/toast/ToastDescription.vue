<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div :class="cn('text-sm opacity-90', $props.class)">
    <slot />
  </div>
</template>
