<script setup>
import { computed } from 'vue'
import { PaginationRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: '',
  },
  total: {
    type: Number,
    default: 0,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  page: {
    type: Number,
    default: 1,
  },
  siblingCount: {
    type: Number,
    default: 1,
  },
  showEdges: {
    type: Boolean,
    default: true,
  },
  defaultPage: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:page'])
</script>

<template>
  <PaginationRoot
    :total="total"
    :items-per-page="itemsPerPage"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    :default-page="defaultPage"
    :page="page"
    @update:page="emit('update:page', $event)"
  >
    <nav
      role="navigation"
      aria-label="pagination"
      :class="cn('mx-auto flex w-full justify-center', props.class)"
    >
      <slot />
    </nav>
  </PaginationRoot>
</template>
