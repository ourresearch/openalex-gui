<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-chip
        v-bind="props"
        :disabled="isDisabled"
        variant="outlined"
        label
        class="font-weight-regular py-2 justify-center light-border text-body-2"
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

import { getFacetConfig } from '@/facetConfigUtils';

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
    // Negated search shipped engine-side 2026-08-24 (oxjob #633, elastic-api
    // 48db821): `filter=display_name.search:!dog` is the exact complement. So
    // the default verb gets its negation. Facets with a CUSTOM verb (`is
    // exactly`, `starts with`) stay single-option: their negation grammar (and
    // for doi_starts_with, engine support) is unsettled.
    const verb = myConfig.value?.verb;
    return verb ? [verb] : ['includes', 'does not include'];
  } else if (props.type === 'selectEntity') {
    return props.value.includes('|') ? ['is any of', 'is none of'] : ['is', 'is not'];
  }
  return null;
});

const selectedOption = computed(() =>
  props.isNegated ? options.value?.[1] : options.value?.[0]
);

const isDisabled = computed(() =>
  props.type === 'range' ||
  (props.type === 'search' && (options.value?.length ?? 0) < 2)
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