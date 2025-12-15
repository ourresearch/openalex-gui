<script setup>
import { PaginationListItem } from 'radix-vue'
</script>

<template>
  <PaginationListItem v-bind="$attrs">
    <slot />
  </PaginationListItem>
</template>
