<template>
  <Card
    class="flex-1 bg-white w-full"
    :class="route.name === 'Serp' ? 'border' : 'border-0'"
    :style="{ minHeight: '100px', minWidth: minWidth + 'px' }"
  >
    <div class="flex items-center p-3 border-b">
      <component v-if="filterConfig?.icon" :is="getIconComponent(filterConfig.icon)" class="h-4 w-4 mr-2 text-muted-foreground" />
      <span class="flex-1 font-medium truncate">
        {{ filterConfig?.displayName === "Sustainable Development Goal" ? "SDG" : filters.titleCase(filterConfig?.displayName || '') }}
      </span>
      
      <div class="flex items-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              <MoreVertical class="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem as="a" :href="csvUrl">
              <Download class="h-4 w-4 mr-2 text-muted-foreground" />
              Export
              <span class="ml-auto text-xs text-muted-foreground">.csv</span>
            </DropdownMenuItem>

            <DropdownMenuItem as="a" :href="apiUrl" target="_blank">
              <Code class="h-4 w-4 mr-2 text-muted-foreground" />
              View in API
              <span class="ml-auto text-xs text-muted-foreground">.json</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button v-if="!props.isEntityPage" variant="ghost" size="icon" @click="url.toggleGroupBy(props.filterKey)">
          <X class="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div v-if="isLoading" class="absolute inset-x-0 top-0 h-1 bg-primary/20 overflow-hidden">
        <div class="h-full w-1/3 bg-primary animate-pulse"></div>
      </div>
    </div>
    <div v-if="groupsTruncated?.length || selectedGroupIds?.length" class="card-body">

      <div v-if="props.filterKey==='publication_year' || props.filterKey==='start_year'" style="min-width: 200px">
        <bar-graph
          v-if="groupsTruncated?.length > 1"
          :bars="groupsTruncated?.map(g => { return {key: g.value, count: g.count}})"
          style="height: 100px;"
          class="pa-2"
          @click="selectGroup"
        />
        <div v-else-if="groupsTruncated?.length > 0" class="text-2xl p-3 hover:bg-accent cursor-pointer" @click="isSelected = false">
          <CheckSquare class="h-5 w-5 mr-2 ml-1 inline" />
          {{ groupsTruncated[0]?.value }}
        </div>
      </div>
      <div v-else-if="myFilterConfig?.type === 'boolean'">
        <div
            v-if="groupsTruncated?.length && groupsTruncated.some(g => g?.count > 0)"
            class="p-2 pl-3 pb-5 flex items-center bg-secondary hover:bg-accent cursor-pointer"
            @click="isSelected = !isSelected"
        >
          <Progress 
            :model-value="(groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100"
            class="w-16 h-16"
          />
          <div class="ml-3">
            <div class="text-2xl font-semibold">
              {{ filters.toPrecision((groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100, 3) }}%
            </div>
            <div class="text-sm text-muted-foreground">
              {{ filters.toPrecision(groupsTruncated?.find(g => g?.value != 0)?.count || 0) }}
            </div>
          </div>
        </div>
      </div>

      <table class="w-full bg-transparent" v-else>
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
      </table>
    </div>

    <div class="p-3 flex justify-end">
      <Button v-if="isMoreToShow" variant="ghost" size="sm" @click="isDialogOpen = true">
        More...
      </Button>
    </div>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[600px]">
        <div class="flex items-center border-b pb-3">
          <Search class="h-5 w-5 mr-3 text-muted-foreground" />
          <Input
            v-model="searchString"
            autofocus
            :placeholder="searchStringPlaceholder"
            class="flex-1 border-0 text-lg focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon" @click="clickCloseSearch">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea class="h-[60vh]">
          <filter-select-add-option
              :filter-key="props.filterKey"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="url.readFilters(route)"
              @close="closeDialog"
              @add="addFilter"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { MoreVertical, Download, Code, X, CheckSquare, Search, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign, Calendar, BarChart3 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';

import { api } from '@/api';
import { url } from '@/url';
import filters from '@/filters';
import { facetConfigs, getFacetConfig } from '@/facetConfigs';
import { filtersFromUrlStr } from '@/filterConfigs';

import BarGraph from '@/components/BarGraph.vue';
import GroupByTableRow from '@/components/GroupBy/GroupByTableRow.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'GroupBy' });

const iconMap = {
  'mdi-file-document-outline': FileText,
  'mdi-account-outline': Users,
  'mdi-book-open-page-variant-outline': BookOpen,
  'mdi-domain': Building2,
  'mdi-town-hall': Landmark,
  'mdi-lightbulb-outline': Lightbulb,
  'mdi-map-marker-outline': MapPin,
  'mdi-trophy-outline': Award,
  'mdi-cash-multiple': DollarSign,
  'mdi-calendar': Calendar,
  'mdi-chart-bar': BarChart3,
};

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

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


<style scoped>
/* Minimal scoped styles */
</style>