<template>
  <div v-if="data">
    <template
      v-for="(filterKey, i) in rowsToShow"
    >
      <Separator
        v-if="filterKey === null"
        :key="'divider-'+i"
        class="my-3"
      />
      <entity-datum-row
        v-else
        :key="'data-'+filterKey"
        :filter-key="filterKey"
        :data="data"
        :type="type"
        :show-missing="type === 'locations'"
        class="px-4 pb-1"
      />
    </template>
  </div>
</template>


<script setup>
import { computed } from 'vue';

import { Separator } from '@/components/ui/separator';

import { getEntityConfig } from '@/entityConfigs';
import { getFacetConfig } from '@/facetConfigs';
import EntityDatumRow from '@/components/Entity/EntityDatumRow.vue';
import { entityTypeFromId } from '@/util';

defineOptions({ name: 'EntityNew' });

const props = defineProps({
  data: Object,
  type: String
});

const type = computed(() => props.type || entityTypeFromId(props.data?.id));
const myEntityConfig = computed(() => type.value ? getEntityConfig(type.value) : null);

// Check if a row has displayable data
const hasData = (filterKey) => {
  if (filterKey === null) return true; // Dividers are handled separately
  const facetConfig = getFacetConfig(type.value, filterKey);
  if (!facetConfig?.extractFn) return false;
  try {
    const value = facetConfig.extractFn(props.data);
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  } catch {
    return false;
  }
};

const rowsToShow = computed(() => {
  if (!myEntityConfig.value || !props.data) return [];
  const rows = [...(myEntityConfig.value.rowsToShowOnEntityPage || [])];
  
  // Filter out rows that don't have data (but keep nulls for now)
  const filteredRows = rows.filter(row => row === null || hasData(row));
  
  // Remove leading nulls
  while (filteredRows[0] === null) {
    filteredRows.shift();
  }
  
  // Remove trailing nulls
  while (filteredRows[filteredRows.length - 1] === null) {
    filteredRows.pop();
  }
  
  // Collapse consecutive nulls into single null
  const result = [];
  for (const row of filteredRows) {
    if (row === null && result[result.length - 1] === null) {
      continue; // Skip consecutive nulls
    }
    result.push(row);
  }
  
  return result;
});
</script>