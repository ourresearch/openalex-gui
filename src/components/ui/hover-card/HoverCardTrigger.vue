<script setup>
import { HoverCardTrigger } from 'radix-vue'

defineProps({
  asChild: Boolean,
})
</script>

<template>
  <HoverCardTrigger :as-child="asChild">
    <slot />
  </HoverCardTrigger>
</template>
