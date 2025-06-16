<template>
  <v-list-item
    :disabled="disabled"
    @click="isApplied = !isApplied"
  >
    <template #prepend>
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>
  
    <v-list-item-title :class="{isNegated}">
      {{ displayValue }}
      {{ (disabled) ? "(applied)" : "" }}
    </v-list-item-title>
    <v-list-item-subtitle v-if="hint" style="white-space: normal;">
      <span v-if="myEntityConfig">{{ filters.capitalize(filters.pluralize(myEntityConfig.displayName, 1)) }} </span>
      <span v-if="hint"> {{ filters.truncate(hint, 100) }}</span>
    </v-list-item-subtitle>
    
    <v-list-item-subtitle class="text-body-1">
      <template v-if="isCountLoading">
        <v-progress-circular indeterminate size="10" width="2" color="grey"/>
      </template>
      <template>
        {{ filters.toPrecision(myCount) }}
      </template>
    </v-list-item-subtitle>
  </v-list-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import filters from '@/filters';
import { url } from '@/url';
import { api } from '@/api';
import { getEntityConfig } from '@/entityConfigs';
import { getFacetConfig } from '@/facetConfigs';

defineOptions({name: "FilterSelectEditRow"});

const props = defineProps({
  filterKey: String,
  filterIndex: Number,
  value: String,
  displayValue: String,
  count: [Number, null],
  disabled: Boolean,
  hint: String,
  isFromAutocomplete: Boolean
});

const route = useRoute();
const store = useStore();
const entityType = computed(() => store.getters.entityType);

// Local state
const myCount = ref(props.count);
const isCountLoading = ref(false);

const myConfig = computed(() => getFacetConfig(entityType.value, props.filterKey));
const myEntityConfig = computed(() => getEntityConfig(myConfig.value?.entityId));

const index = computed(() =>
  url.findFilterIndex(route, entityType.value, props.filterKey, props.value)
);

// Two-way binding
const isApplied = computed({
  get() {
    return url.isFilterOptionApplied(route, entityType.value, props.filterKey, props.value);
  },
  set(to) {
    if (props.filterIndex >= 0) {
      console.log('FilterSelectEditRow set()', props.filterIndex);
      to
        ? url.addFilterOption(entityType.value, props.filterIndex, props.value)
        : url.deleteFilterOption(entityType.value, props.filterIndex, props.value);
    } else {
      to
        ? url.createFilter(entityType.value, props.filterKey, props.value)
        : url.deleteFilterOptionByKey(entityType.value, props.filterKey, props.value);
    }
  }
});

const isNegated = computed(() =>
  url.readIsFilterNegated(route, entityType.value, index.value)
);

// Methods
async function getMyCount() {
  if (!props.isFromAutocomplete) { return; }
  isCountLoading.value = true;
  myCount.value = undefined;

  const filterSet = url.upsertFilterOptionNoPush(
    entityType.value,
    props.filterKey,
    props.value
  );

  const count = await api.getResultsCount(entityType.value, filterSet);
  myCount.value = count;
  isCountLoading.value = false;
}

// Watch for route filter changes
watch(
  () => route.query.filter,
  () => {
    getMyCount();
  },
  { immediate: true }
);
</script>


<style scoped lang="scss">
.isNegated {
  text-decoration: line-through !important;
}
.v-list-item__icon {
  margin: 0;
  align-self: normal;
}
.group-by-table-row {
  cursor: pointer;
}
</style>