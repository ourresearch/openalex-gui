<template>
  <nav class="-mt-6 mb-6" aria-label="Breadcrumb">
    <ol class="flex items-center flex-wrap gap-1 list-none p-0 m-0">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1">
        <router-link
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          {{ item.text }}
        </router-link>
        <span v-else class="text-sm font-medium text-foreground">{{ item.text }}</span>
        <ChevronRight
          v-if="index < items.length - 1"
          class="h-3.5 w-3.5 text-muted-foreground"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next';

defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => items.every(item => item.text)
  }
});
</script>

<style scoped>
/* Minimal scoped styles */
</style>
