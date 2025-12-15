<script setup>
import { PopoverTrigger } from 'radix-vue'
</script>

<template>
  <PopoverTrigger as-child>
    <slot />
  </PopoverTrigger>
</template>
