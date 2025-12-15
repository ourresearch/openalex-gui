<script setup>
import { ComboboxContent, ComboboxPortal, ComboboxViewport } from 'radix-vue'
import { cn } from '@/lib/utils'

defineProps({
  class: {
    type: String,
    default: '',
  },
  position: {
    type: String,
    default: 'popper',
  },
})
</script>

<template>
  <ComboboxPortal>
    <ComboboxContent
      :position="position"
      :class="cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        $props.class
      )"
    >
      <ComboboxViewport
        :class="cn(
          'p-1',
          position === 'popper' && 'h-[var(--radix-combobox-content-available-height)] w-full min-w-[var(--radix-combobox-trigger-width)]'
        )"
      >
        <slot />
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</template>
