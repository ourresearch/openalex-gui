<script setup>
import { AvatarFallback } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <AvatarFallback
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-muted', $props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
