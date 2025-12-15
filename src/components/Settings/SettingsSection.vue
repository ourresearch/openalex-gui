<template>
  <div class="mt-10 first:mt-0">
    <h3 v-if="title" class="text-base font-medium text-foreground mb-3">
      {{ title }}
    </h3>
    <div class="bg-background border border-border rounded-lg overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String
})
</script>

<style scoped>
/* Minimal scoped styles */
</style>
