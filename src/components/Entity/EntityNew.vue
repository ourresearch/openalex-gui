<template>
  <div v-if="data">
    <template
      v-for="(filterKey, i) in rowsToShow"
    >
      <v-divider
        v-if="filterKey === null"
        :key="'divider-'+i"
        class="ma-3"
      />
      <entity-datum-row
        v-else
        :key="'data-'+filterKey"
        :filter-key="filterKey"
        :data="data"
        :type="type"
        class="px-4 pb-1"
      />
    </template>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { getEntityConfig } from '@/entityConfigs';
import EntityDatumRow from '@/components/Entity/EntityDatumRow.vue';
import { entityTypeFromId } from '@/util';

defineOptions({ name: 'EntityNew' });

const props = defineProps({
  data: Object
});

const type = computed(() => entityTypeFromId(props.data?.id));
const myEntityConfig = computed(() => getEntityConfig(type.value));

const rowsToShow = computed(() => {
  const rows = [...(myEntityConfig.value.rowsToShowOnEntityPage || [])];
  while (rows[0] === null) {
    rows.shift();
  }
  return rows;
});
</script>