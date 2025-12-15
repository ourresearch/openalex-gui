<script setup>
import { ComboboxRoot } from 'radix-vue'

const props = defineProps({
  modelValue: [String, Array],
  defaultValue: [String, Array],
  open: Boolean,
  defaultOpen: Boolean,
  searchTerm: String,
  multiple: Boolean,
  disabled: Boolean,
  name: String,
  dir: String,
  filterFunction: Function,
  displayValue: Function,
})

const emit = defineEmits(['update:modelValue', 'update:open', 'update:searchTerm'])
</script>

<template>
  <ComboboxRoot
    v-bind="props"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
    @update:search-term="emit('update:searchTerm', $event)"
  >
    <slot />
  </ComboboxRoot>
</template>
