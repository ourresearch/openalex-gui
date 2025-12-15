<script setup>
import { SelectRoot } from 'radix-vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  defaultValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue', 'update:open'])
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :open="open"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </SelectRoot>
</template>
