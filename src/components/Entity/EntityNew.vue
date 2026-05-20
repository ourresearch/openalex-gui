<template>
  <div v-if="data">
    <template
      v-for="(filterKey, i) in rowsToShow"
    >
      <template v-if="filterKey === null">
        <v-divider :key="'divider-'+i" class="ma-3" />
        <!-- Optional injection point for the drawer's stats block, which sits
             between the first metadata chunk (year..language) and everything
             below it (topic..). Fires once, right after the first null divider. -->
        <slot v-if="i === firstDividerIndex" name="after-first-divider" />
      </template>
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
import { getEntityConfig } from '@/entityConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import EntityDatumRow from '@/components/Entity/EntityDatumRow.vue';
import * as openalexId from '@/openalexId';

defineOptions({ name: 'EntityNew' });

const props = defineProps({
  data: Object,
  type: String
});

const type = computed(() => props.type || openalexId.getEntityType(props.data?.id));
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
  let rows = [...(myEntityConfig.value.rowsToShowOnEntityPage || [])];

  // Hide "In DOAJ" for repositories — it's not relevant
  if (type.value === 'sources' && props.data.type === 'repository') {
    rows = rows.filter(row => row !== 'is_in_doaj');
  }

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

// Index of the first null divider in the final rendered row list (or -1 if
// none). The `after-first-divider` slot fires here exactly once.
const firstDividerIndex = computed(() => rowsToShow.value.indexOf(null));
</script>