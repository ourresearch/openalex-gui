<template>
  <span>
    <slot v-if="!active"></slot>
    <HoverCard v-else :open-delay="300" :close-delay="300">
      <HoverCardTrigger asChild>
        <span class="inline-block">
          <slot></slot>
        </span>
      </HoverCardTrigger>
      <HoverCardContent class="w-auto p-0" align="start">
        <button 
          @click="$emit('action-click')" 
          class="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded whitespace-nowrap"
        >
          <component :is="getIconComponent()" class="h-4 w-4" />
          {{ actionText }}
        </button>
      </HoverCardContent>
    </HoverCard>
  </span>
</template>

<script setup>
import { ref } from 'vue';

import { X, Trash2 } from 'lucide-vue-next';

import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

defineOptions({ name: 'HoverMenuWrapper' });

const props = defineProps({
  active: Boolean,
  actionText: {
    type: String,
    default: 'Remove Filter'
  },
  actionIcon: {
    type: String,
    default: 'mdi-close'
  }
});

const showMenu = ref(false);

function getIconComponent() {
  if (props.actionIcon === 'mdi-delete' || props.actionIcon === 'mdi-trash-can') return Trash2;
  return X;
}
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
