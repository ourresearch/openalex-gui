<script setup>
import { TooltipProvider } from 'radix-vue'

defineProps({
  delayDuration: {
    type: Number,
    default: 200,
  },
  skipDelayDuration: {
    type: Number,
    default: 300,
  },
})
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration" :skip-delay-duration="skipDelayDuration">
    <slot />
  </TooltipProvider>
</template>
