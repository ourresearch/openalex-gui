<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-chip
        v-bind="props"
        :disabled="isDisabled"
        variant="outlined"
        label
        class="font-weight-regular py-4 justify-center light-border"
      >
        {{ selectedOption }}
        <v-icon end>mdi-chevron-down</v-icon>
      </v-chip>
    </template>
    <v-list>
      <v-list-item
        v-for="(str, i) in options"
        :key="i"
        @click="setIsNegated(i)"
      >
        <template #prepend>
          <v-icon v-if="indexIsSelected(i)">mdi-check</v-icon>
          <v-icon v-else>mdi-blank</v-icon>
        </template>
        {{ str }}
      </v-list-item>
    </v-list>
  </v-menu>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { getFacetConfig } from '@/facetConfigs';

defineOptions({name: "FilterVerb"});

const props = defineProps({
  isNegated: Boolean,
  value: [String, Boolean],
  type: String,
  filterKey: String,
});

const emit = defineEmits(['set']);

// Store
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

// Methods
function setIsNegated(index) {
  emit('set', index !== 0);
}

function indexIsSelected(index) {
  return props.isNegated ? index === 1 : index === 0;
}
</script>


<style scoped lang="scss">
.light-border {
  border-color: #ddd !important;
}
</style>