<template>
  <DropdownMenu>
    <DropdownMenuTrigger :disabled="isDisabled">
      <Badge
        variant="outline"
        class="font-normal py-1 px-2 cursor-pointer"
        :class="{ 'opacity-50 cursor-not-allowed': isDisabled }"
      >
        {{ selectedOption }}
        <ChevronDown class="h-3 w-3 ml-1" />
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem
        v-for="(str, i) in options"
        :key="i"
        @click="setIsNegated(i)"
      >
        <Check v-if="indexIsSelected(i)" class="h-4 w-4 mr-2" />
        <span v-else class="w-4 mr-2"></span>
        {{ str }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { ChevronDown, Check } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';

import { getFacetConfig } from '@/facetConfigs';

defineOptions({name: "FilterVerb"});

const props = defineProps({
  isNegated: Boolean,
  value: [String, Boolean],
  type: String,
  filterKey: String,
});

const emit = defineEmits(['set']);

const store = useStore();
const entityType = computed(() => store.getters.entityType);

const myConfig = computed(() =>
  getFacetConfig(entityType.value, props.filterKey)
);

const options = computed(() => {
  if (props.type === 'boolean') {
    return ['is', 'is not'];
  } else if (props.type === 'range') {
    return props.value.includes('-') ? ['is within range'] : ['is'];
  } else if (props.type === 'search') {
    return [myConfig.value?.verb ?? 'includes'];
  } else if (props.type === 'select') {
    return props.value.includes('|') ? ['is any of', 'is none of'] : ['is', 'is not'];
  }
  return null;
});

const selectedOption = computed(() =>
  props.isNegated ? options.value?.[1] : options.value?.[0]
);

const isDisabled = computed(() =>
  ['range', 'search'].includes(props.type)
);

function setIsNegated(index) {
  emit('set', index !== 0);
}

function indexIsSelected(index) {
  return props.isNegated ? index === 1 : index === 0;
}
</script>


<style scoped>
/* Minimal scoped styles */
</style>