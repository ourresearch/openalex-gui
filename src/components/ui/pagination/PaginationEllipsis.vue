<script setup>
import { MoreHorizontal } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <span
    aria-hidden
    :class="cn('flex h-9 w-9 items-center justify-center', $props.class)"
  >
    <MoreHorizontal class="h-4 w-4" />
    <span class="sr-only">More pages</span>
  </span>
</template>
