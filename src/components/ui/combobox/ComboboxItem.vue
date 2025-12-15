<script setup>
import { computed } from 'vue'
import { ComboboxItem, ComboboxItemIndicator } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: '',
  },
  value: {
    type: [String, Number, Object],
    required: true,
  },
  disabled: Boolean,
})

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
</script>

<template>
  <ComboboxItem
    v-bind="delegatedProps"
    :class="cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
      props.class
    )"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ComboboxItemIndicator>
        <Check class="h-4 w-4" />
      </ComboboxItemIndicator>
    </span>
    <slot />
  </ComboboxItem>
</template>
