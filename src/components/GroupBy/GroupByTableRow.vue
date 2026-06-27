<template>
  <tr @click="clickRow" class="group-by-table-row hover-color-2">
    <td v-if="!hideCheckbox" class="pr-0" style="width: 1px; white-space: nowrap">
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="text-body-2" :class="{ isNegated }">
      {{ displayValue }}
    </td>
    <td class="range text-body-2 text-right align-baseline">
      {{ filters.toPrecision(myCount) }}
    </td>
  </tr>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';
import { api } from '@/api';
import filters from '@/filters';
import { createSimpleFilter, setStringIsNegated } from '@/filterConfigs';
import { getEntityConfig } from '@/entityConfigs';
import { selectedValues as oqoSelectedValues } from '@/components/Oql/refinements';

defineOptions({ name: 'GroupByTableRow' });

const props = defineProps({
  filterKey: String,
  value: String,
  displayValue: String,
  count: [Number, null],
  hideCheckbox: Boolean,
});

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const myCount = ref(props.count);

// OQL mode (oxjob #528): wire this list-row facet to the query store as a
// "refine results" facet — a click toggles a top-level AND clause on the OQL
// query (OR-within-facet) instead of rewriting the legacy ?filter= URL. Flag-off
// keeps the entire url.* path below. (Count always arrives via props in OQL mode,
// so the route.query.filter count-fetch watcher stays dormant.)
const oqlMode = computed(() => !!store.getters.featureFlags?.['oql'] && !!route.query.oql);

const index = computed(() => url.findFilterIndex(route, entityType.value, props.filterKey, props.value));

const isApplied = computed({
  get() {
    if (oqlMode.value) {
      return oqoSelectedValues(store.getters['query/queryFilterRows'], props.filterKey)
        .map(String)
        .includes(String(props.value));
    }
    if (route.name === 'EntityPage') return false;
    return url.isFilterOptionApplied(route, entityType.value, props.filterKey, props.value);
  },
  set(to) {
    if (oqlMode.value) {
      // toggleRefinementValue flips membership; only dispatch when the desired
      // state differs from the current one (defensive — clickRow already flips).
      const has = oqoSelectedValues(store.getters['query/queryFilterRows'], props.filterKey)
        .map(String)
        .includes(String(props.value));
      if (to !== has) {
        store.dispatch('query/toggleRefinementValue', { columnId: props.filterKey, value: props.value });
      }
      return;
    }
    if (to) {
      if (route.name === 'EntityPage') {
        const myEntityType = route.params.entityType;
        const myEntityId = route.params.entityId;
        const myEntityConfig = getEntityConfig(myEntityType);
        const myEntityWorksFilter = createSimpleFilter('works', myEntityConfig.filterKey, myEntityId);
        const myRowFilter = createSimpleFilter('works', props.filterKey, props.value);
        url.pushNewFilters([myEntityWorksFilter, myRowFilter], 'works');
      } else {
        url.createFilter(entityType.value, props.filterKey, props.value);
      }
    } else {
      url.deleteFilterOptionByKey(entityType.value, props.filterKey, props.value);
    }
  },
});

const isNegated = computed({
  get() {
    return url.readIsFilterNegated(route, entityType.value, index.value);
  },
  set(to) {
    const newValue = setStringIsNegated(props.value, to);
    if (index.value >= 0) {
      url.setIsFilterOptionNegated(entityType.value, props.filterKey, props.value, to);
    } else {
      url.createFilter(entityType.value, props.filterKey, newValue);
    }
  },
});

const clickRow = () => {
  isApplied.value = !isApplied.value;
};

const getMyCount = async () => {
  if (props.count !== null) {
    myCount.value = props.count;
    return;
  }
  const allFilters = url.readFilters(route);
  const filtersWithoutMyFilter = allFilters.toSpliced(index.value, 1);
  const filterWithOnlyMyValue = createSimpleFilter(entityType.value, props.filterKey, props.value, isNegated.value);
  const queryFilters = isNegated.value ? allFilters : [...filtersWithoutMyFilter, filterWithOnlyMyValue];
  const count = await api.getResultsCount(entityType.value, queryFilters);
  myCount.value = count;
};

watch(
  () => route.query.filter,
  () => { getMyCount();},
  { immediate: true, deep: true }
);
</script>


<style scoped lang="scss">
.isNegated {
  text-decoration: line-through !important;
}
.group-by-table-row {
  cursor: pointer;
}
.group-by-table-row td   {
  height: 32px !important;
}
</style>