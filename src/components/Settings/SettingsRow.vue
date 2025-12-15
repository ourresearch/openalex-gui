<template>
  <div 
    class="flex justify-between items-center px-5 py-4 border-b border-border last:border-b-0 gap-6"
    :class="{ 
      'flex-col items-start gap-0': fullWidth, 
      'cursor-pointer hover:bg-accent transition-colors': clickable,
      'sm:flex-row': !fullWidth
    }"
    @click="clickable && $emit('click')"
  >
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-foreground leading-relaxed">
        {{ label }}
      </div>
      <div v-if="description" class="text-xs text-muted-foreground leading-relaxed mt-0.5" v-html="description">
      </div>
    </div>
    <div class="shrink-0 flex items-center" :class="{ 'mt-1.5 w-full': fullWidth }">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  description: String,
  fullWidth: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
/* Minimal scoped styles */
</style>
