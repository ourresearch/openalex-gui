<script setup>
import { AccordionRoot } from 'radix-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'single',
  },
  defaultValue: [String, Array],
  modelValue: [String, Array],
  collapsible: {
    type: Boolean,
    default: true,
  },
  disabled: Boolean,
  dir: String,
  orientation: {
    type: String,
    default: 'vertical',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <AccordionRoot
    v-bind="props"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </AccordionRoot>
</template>
