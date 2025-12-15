<script setup>
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'border-green-500 bg-green-50 text-green-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  open: {
    type: Boolean,
    default: true,
  },
  class: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div
    :class="cn(toastVariants({ variant }), $props.class)"
    :data-state="open ? 'open' : 'closed'"
  >
    <slot />
  </div>
</template>
