<script setup>
import { PaginationFirst } from 'radix-vue'
import { ChevronFirst } from 'lucide-vue-next'
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
  <PaginationFirst
    :as-child="asChild"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10',
      $props.class
    )"
  >
    <slot>
      <ChevronFirst class="h-4 w-4" />
    </slot>
  </PaginationFirst>
</template>
