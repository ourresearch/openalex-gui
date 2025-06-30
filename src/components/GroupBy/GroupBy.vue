<template>
  <v-card
    min-height="100"
    :min-width="minWidth"
    class="group-by rounded-o flex-grow-1"
    flat
    :loading="isLoading"
    style="width: 100%;"
  >
    <v-toolbar flat color="transparent">
      <v-icon color="grey-darken-2 mr-1" v-if="filterConfig?.icon">{{ filterConfig.icon }}</v-icon>
      <v-toolbar-title class="group-by-title flex-grow-1">
        <span>{{ filters.titleCase(filterConfig?.displayName || '') }}</span>
      </v-toolbar-title>
      
      <v-spacer/>

      <div class="toolbar-actions">
        <v-menu location="bottom">
          <template v-slot:activator="{props}">
            <v-btn icon v-bind="props">
              <v-icon color="grey-darken-2">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item :href="csvUrl">
              <template #prepend>
                <v-icon color="grey-darken-2">mdi-tray-arrow-down</v-icon>
              </template>
              <v-list-item-title class="mr-2">Export</v-list-item-title>
              <template #append>
                <v-list-item-subtitle>.csv</v-list-item-subtitle>
              </template>
            </v-list-item>

            <v-list-item :href="apiUrl" target="_blank">
              <template #prepend>
                <v-icon color="grey-darken-2">mdi-api</v-icon>
              </template>
              <v-list-item-title class="mr-2">View in API</v-list-item-title>
              <template #append>
                <v-list-item-subtitle>.json</v-list-item-subtitle>
              </template>
            </v-list-item>

          </v-list>
        </v-menu>

        <v-btn v-if="!props.isEntityPage" icon @click="url.toggleGroupBy(props.filterKey)">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </div>

    </v-toolbar>
    <div v-if="groupsTruncated?.length || selectedGroupIds?.length" class="card-body">

      <div v-if="props.filterKey==='publication_year'" style="min-width: 200px">
        <bar-graph
          v-if="groupsTruncated?.length > 1"
          :bars="groupsTruncated?.map(g => { return {key: g.value, count: g.count}})"
          style="height: 100px;"
          class="pa-2"
          @click="selectGroup"
        />
        <div v-else-if="groupsTruncated?.length > 0" class="text-h4 pa-3 hover-color-1" style="cursor: pointer;" @click="isSelected = false">
          <v-icon class="mr-2 ml-1">mdi-checkbox-marked</v-icon>
          {{ groupsTruncated[0]?.value }}
        </div>
      </div>
      <div v-else-if="myFilterConfig?.type === 'boolean'">
        <v-card
            v-if="groupsTruncated?.length && groupsTruncated.some(g => g?.count > 0)"
            flat
            class="pa-2 pl-3 pb-5 d-flex align-center color-3 hover-color-2"
            @click="isSelected = !isSelected"
        >
          <v-progress-circular
              size="60"
              width="20"
              rotate="270"
              :model-value="(groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100"
          />
          <div class="ml-3">
            <div class="text-h4">
              {{ filters.toPrecision((groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100, 3) }}%
            </div>
            <div class="text-body-2">
              {{ filters.toPrecision(groupsTruncated?.find(g => g?.value != 0)?.count || 0) }}
            </div>
          </div>
        </v-card>
      </div>

      <v-table dense class="bg-transparent" v-else style="width: 100%;">
        <tbody>
        <group-by-table-row
          v-for="row in groupsTruncated"
          :key="row.value + row.count"
          :filter-key="props.filterKey"
          :value="row.value"
          :display-value="row.displayValue"
          :count="row.count"
          :hide-checkbox="route.name !== 'Serp'"
        />
        </tbody>
      </v-table>
    </div>

    <v-card-actions >
      <v-spacer/>
      <v-btn v-if="isMoreToShow" size="small" rounded variant="text" @click="isDialogOpen = true">
        More...
      </v-btn>

    </v-card-actions>

    <v-dialog
      v-model="isDialogOpen"
      :width="600"
      scrollable
    >
      <v-card rounded class="group-by-dialog">
        <v-text-field
          v-model="searchString"
          variant="plain"
          density="compact"
          bg-color="white"
          prepend-inner-icon="mdi-magnify"
          hide-details
          autofocus
          :placeholder="searchStringPlaceholder"
          style=""
          class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
          append-icon="mdi-close"
          @click:append="clickCloseSearch"
          />
        <v-divider />
        <v-card-text class="pa-0" style="height: 80vh;">
          <filter-select-add-option
              :filter-key="props.filterKey"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="url.readFilters(route)"
              @close="closeDialog"
              @add="addFilter"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { api } from '@/api';
import { url } from '@/url';
import filters from '@/filters';
import { facetConfigs, getFacetConfig } from '@/facetConfigs';
import { filtersFromUrlStr } from '@/filterConfigs';

import BarGraph from '@/components/BarGraph.vue';
import GroupByTableRow from '@/components/GroupBy/GroupByTableRow.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'GroupBy' });

const props = defineProps({
  filterKey: String,
  entityType: String,
  filterBy: Array,
  isEntityPage: Boolean
});

const route = useRoute();

const isLoading = ref(false);
const searchString = ref('');
const isDialogOpen = ref(false);
const groups = ref([]);
const maxResults = 5;
const maxResultsRange = 25;

const isSelected = computed({
  get: () => url.isFilterApplied(route, props.entityType, props.filterKey),
  set: (to) => {
    if (to) url.upsertFilter(props.entityType, props.filterKey, true);
    else url.deleteFilter(props.entityType, props.filterKey);
  }
});

const searchStringPlaceholder = computed(() => {
  const pluralDisplayName = filters.pluralize(filterConfig.value?.displayName, 2);
  return 'Search ' + pluralDisplayName;
});

const myFilterConfig = computed(() => facetConfigs(props.entityType).find(c => c.key === props.filterKey));
const filterConfig = computed(() => getFacetConfig(props.entityType, props.filterKey));
const apiRequestFilters = computed(() => props.filterBy?.length ? props.filterBy : filtersFromUrlStr(props.entityType, route.query.filter));

const apiUrl = computed(() => url.makeGroupByUrl(props.entityType, props.filterKey, { includeEmail: false, filters: apiRequestFilters.value }));
const csvUrl = computed(() => url.makeGroupByUrl(props.entityType, props.filterKey, { includeEmail: false, formatCsv: true, filters: apiRequestFilters.value }));

const selectedGroupIds = computed(() => url.readFilterOptionsByKey(route, props.entityType, props.filterKey));

const groupsTruncated = computed(() => {
  const limit = myFilterConfig.value?.type === 'range' ? maxResultsRange : maxResults;
  return groups.value.slice(0, limit);
});

const isMoreToShow = computed(() => groups.value.length > groupsTruncated.value.length);
const minWidth = computed(() => myFilterConfig.value?.type === 'select' ? 300 : 150);

const addFilter = (id) => {
  url.createFilter(props.entityType, props.filterKey, id);
  isDialogOpen.value = false;
};

const clickCloseSearch = () => {
  if (searchString.value) searchString.value = '';
  else closeDialog();
};

const closeDialog = () => {
  searchString.value = '';
  isDialogOpen.value = false;
};

const getGroups = async () => {
  if (!props.filterKey) return;
  isLoading.value = true;
  const result = await api.getGroups(props.entityType, props.filterKey, {
    hideUnknown: true,
    filters: apiRequestFilters.value
  });
  if (props.filterKey === 'publication_year') {
    result.sort((a, b) => parseInt(a.value) > parseInt(b.value) ? -1 : 1);
  }
  groups.value = result;
  isLoading.value = false;
};

const selectGroup = (val) => {
  if (myFilterConfig.value?.type === 'boolean') {
    url.upsertFilter(props.entityType, props.filterKey, val !== 0);
  } else if (myFilterConfig.value?.type === 'range') {
    url.upsertFilter(props.entityType, props.filterKey, val);
  } else {
    if (url.isFilterApplied(route, props.entityType, props.filterKey)) {
      url.addFilterOption(props.entityType, props.filterKey, val);
    } else {
      url.upsertFilter(props.entityType, props.filterKey, val);
    }
  }
};

watch(
  () => [route.params, route.query.filter],
  getGroups,
  { immediate: true, deep: true }
);
watch(isDialogOpen, (to) => { if (!to) closeDialog(); });
</script>


<style scoped lang="scss">
.group-by .v-toolbar-title {
  margin-inline-start: 6px !important;
}
.group-by-title {
  flex-grow: 1;
  min-width: 120px
}
.group-by-title * {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}
.toolbar-actions .v-btn {
  margin-right: -16px;
}
</style>