<script setup>
import { computed } from 'vue'
import { RadioGroupRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: '',
  },
  defaultValue: String,
  modelValue: String,
  disabled: Boolean,
  name: String,
  required: Boolean,
  orientation: {
    type: String,
    default: 'vertical',
  },
})

const emit = defineEmits(['update:modelValue'])

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
</script>

<template>
  <RadioGroupRoot
    v-bind="delegatedProps"
    :class="cn('grid gap-2', props.class)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </RadioGroupRoot>
</template>
