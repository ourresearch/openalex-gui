<script setup>
import { TabsRoot } from 'radix-vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  defaultValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
