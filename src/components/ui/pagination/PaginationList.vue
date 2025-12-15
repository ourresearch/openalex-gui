<script setup>
import { PaginationList } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <PaginationList
    v-slot="{ items }"
    :class="cn('flex flex-row items-center gap-1', $props.class)"
  >
    <slot :items="items" />
  </PaginationList>
</template>
