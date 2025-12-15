<script setup>
import { PaginationPrev } from 'radix-vue'
import { ChevronLeft } from 'lucide-vue-next'
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
  <PaginationPrev
    :as-child="asChild"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-1 pl-2.5',
      $props.class
    )"
  >
    <slot>
      <ChevronLeft class="h-4 w-4" />
      <span>Previous</span>
    </slot>
  </PaginationPrev>
</template>
