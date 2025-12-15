<template>
  <button
    :disabled="disabled"
    @click="isApplied = !isApplied"
    class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div class="shrink-0">
      <template v-if="isApplied">
        <MinusCircle v-if="isNegated" class="h-4 w-4" />
        <CheckSquare v-else class="h-4 w-4" />
      </template>
      <Square v-else class="h-4 w-4" />
    </div>
  
    <div class="flex-1 min-w-0">
      <div :class="{ 'line-through': isNegated }">
        {{ displayValue }}
        {{ (disabled) ? "(applied)" : "" }}
      </div>
      <div v-if="hint" class="text-xs text-muted-foreground">
        <span v-if="myEntityConfig">{{ filters.capitalize(filters.pluralize(myEntityConfig.displayName, 1)) }} </span>
        <span v-if="hint"> {{ filters.truncate(hint, 100) }}</span>
      </div>
    </div>
    
    <div class="text-sm text-muted-foreground shrink-0">
      <template v-if="isCountLoading">
        <div class="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
      </template>
      <template v-else>
        {{ filters.toPrecision(myCount) }}
      </template>
    </div>
  </button>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { MinusCircle, CheckSquare, Square } from 'lucide-vue-next';

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


<style scoped>
/* Minimal scoped styles */
</style>