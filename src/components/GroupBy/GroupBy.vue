<template>
  <v-card
    :min-height="compact ? undefined : 100"
    :min-width="minWidth"
    class="group-by flex-grow-1 bg-white"
    :class="{ 'group-by--compact': compact }"
    :variant="route.name === 'Serp' ? 'outlined' : 'flat'"
    :loading="isLoading"
    style="width: 100%;"
  >
    <v-toolbar flat color="transparent">
      <v-icon color="grey-darken-2 mr-1" v-if="filterConfig?.icon">{{ filterConfig.icon }}</v-icon>
      <v-toolbar-title class="group-by-title flex-grow-1">
        <span class="text-truncate">{{ filterConfig?.displayName === "Sustainable Development Goal" ? "SDG" : filters.titleCase(filterConfig?.displayName || '') }}</span>
      </v-toolbar-title>
      
      <v-spacer/>

      <div class="toolbar-actions flex-shrink-0">
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

      <div v-if="props.filterKey==='publication_year' || props.filterKey==='start_year'" style="min-width: 200px">
        <!-- Compact (flag-on rail, #440 r5): FIXED bins 2002→current year (zero-
             filled), no More button; a double-ended range slider below the
             histogram writes the year range filter on release. -->
        <template v-if="compact">
          <bar-graph
            :bars="fixedYearBars"
            style="height: 80px;"
            class="pa-2"
            @click="selectGroup"
          />
          <v-range-slider
            v-model="yearRange"
            :min="YEAR_MIN"
            :max="currentYear"
            :step="1"
            density="compact"
            hide-details
            color="grey-darken-3"
            track-size="3"
            thumb-size="12"
            class="year-range-slider px-3"
            @end="applyYearRange"
          />
          <div class="d-flex justify-space-between px-4 pb-2 text-caption text-medium-emphasis">
            <span>{{ yearRange[0] }}</span>
            <span>{{ yearRange[1] }}</span>
          </div>
        </template>
        <template v-else>
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
        </template>
      </div>
      <div v-else-if="myFilterConfig?.type === 'boolean'">
        <!-- Compact (flag-on rail, #440 r5): one short row — small donut + % on
             the left, raw count right-aligned (rhyming with the facet-row counts). -->
        <v-card
            v-if="compact && groupsTruncated?.length && groupsTruncated.some(g => g?.count > 0)"
            variant="flat"
            class="px-3 py-2 d-flex align-center color-3 hover-color-2"
            @click="isSelected = !isSelected"
        >
          <v-progress-circular
              size="28"
              width="9"
              rotate="270"
              :model-value="(groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100"
          />
          <span class="text-subtitle-1 font-weight-medium ml-3">
            {{ filters.toPrecision((groupsTruncated?.find(g => g?.value != 0)?.countScaled || 0) * 100, 3) }}%
          </span>
          <v-spacer />
          <span class="text-body-2 mr-1">
            {{ filters.toPrecision(groupsTruncated?.find(g => g?.value != 0)?.count || 0) }}
          </span>
        </v-card>
        <v-card
            v-else-if="!compact && groupsTruncated?.length && groupsTruncated.some(g => g?.count > 0)"
            variant="flat"
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

    <!-- Compact (#440 r5): no empty footers — actions render only when there's an
         actual More button, and never for the year widget (the fixed-bin histogram
         + range slider replace it). Flag-off (compact=false) keeps today's markup. -->
    <v-card-actions v-if="!hideMore && (!compact || (isMoreToShow && !isYearWidget))">
      <v-spacer/>
      <v-btn v-if="isMoreToShow && !(compact && isYearWidget)" size="small" rounded variant="text" @click="isDialogOpen = true">
        More...
      </v-btn>

    </v-card-actions>

    <v-dialog
      v-model="isDialogOpen"
      :width="600"
      scrollable
    >
      <v-card class="group-by-dialog">
        <v-text-field
          v-model="searchString"
          variant="plain"
          density="compact"
          bg-color="white"
          prepend-inner-icon="mdi-magnify"
          hide-details
          autofocus
          :placeholder="searchStringPlaceholder"
          class="group-by-search-field font-weight-regular"
          append-icon="mdi-close"
          @click:append="clickCloseSearch"
          />
        <v-divider />
        <v-card-text class="pa-0" style="height: 70vh;">
          <filter-select-add-option
              :filter-key="props.filterKey"
              :entity-type="props.entityType"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="apiRequestFilters"
              :defer-updates="true"
              :local-selection="localSelection"
              @close="closeDialog"
              @add="addFilter"
              @toggle-selection="toggleSelection"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3 justify-end">
          <v-btn
            variant="plain"
            class="text-black"
            @click="closeDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            variant="flat"
            color="black"
            @click="applySelections"
          >
            Apply
          </v-btn>
        </v-card-actions>
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
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { filtersFromUrlStr, createSimpleFilter } from '@/filterConfigs';

import BarGraph from '@/components/BarGraph.vue';
import GroupByTableRow from '@/components/GroupBy/GroupByTableRow.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'GroupBy' });

const props = defineProps({
  filterKey: String,
  entityType: String,
  filterBy: Array,
  isEntityPage: Boolean,
  hideMore: Boolean,
  // Flag-on rail's denser styling (#440 r5): compact boolean/OA row, fixed-bin
  // year histogram + range slider, rounded-square header buttons, no empty
  // footers. Flag-off paths never pass this.
  compact: Boolean,
});

const route = useRoute();

const isLoading = ref(false);
const searchString = ref('');
const isDialogOpen = ref(false);
const groups = ref([]);
const localSelection = ref([]);
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
const minWidth = computed(() => myFilterConfig.value?.type === 'selectEntity' ? 300 : 150);

// ---- Compact year widget: fixed bins + range slider (#440 r5) --------------
const isYearWidget = computed(() =>
  ['publication_year', 'start_year'].includes(props.filterKey)
);
const YEAR_MIN = 2002;
const currentYear = new Date().getFullYear();

// Always the same bins: 2002 → current year, zero-filled when a year has no
// group. Descending order to match BarGraph's row-reverse rendering (oldest
// year ends up leftmost), same as the API's chronological-desc groups.
const fixedYearBars = computed(() => {
  const countsByYear = {};
  groups.value.forEach((g) => { countsByYear[parseInt(g.value)] = g.count; });
  const bars = [];
  for (let y = currentYear; y >= YEAR_MIN; y--) {
    bars.push({ key: y, count: countsByYear[y] || 0 });
  }
  return bars;
});

// Double-ended slider state, two-way bound to the URL filter: the slider writes
// the filter on release (@end), and any filter change (chip edits, shared links)
// writes the slider (the route watcher below). Full range = no filter.
const yearRange = ref([YEAR_MIN, currentYear]);
function syncYearRangeFromUrl() {
  if (!isYearWidget.value) return;
  const f = filtersFromUrlStr(props.entityType, route.query.filter)
    .find((f) => f.key === props.filterKey);
  if (!f || f.value == null) {
    yearRange.value = [YEAR_MIN, currentYear];
    return;
  }
  const v = String(f.value);
  let lo = YEAR_MIN;
  let hi = currentYear;
  let m;
  if ((m = v.match(/^(\d{4})\s*-\s*(\d{4})$/))) {        // 2012-2026
    lo = +m[1];
    hi = +m[2];
  } else if ((m = v.match(/^(\d{4})-$/))) {              // 2020-  ("since" chip)
    lo = +m[1];
  } else if ((m = v.match(/^-(\d{4})$/))) {              // -2010  ("until" chip)
    hi = +m[1];
  } else if (/^\d{4}$/.test(v)) {                        // 2020
    lo = hi = +v;
  } else if (/^>\d{4}$/.test(v)) {
    lo = +v.slice(1) + 1;
  } else if (/^<\d{4}$/.test(v)) {
    hi = +v.slice(1) - 1;
  } else {
    return; // multi-value / negated etc — leave the slider where it is
  }
  yearRange.value = [Math.max(YEAR_MIN, lo), Math.min(currentYear, hi)];
}
// Index of this widget's filter in the live filter list. The url.js single-
// filter helpers (updateFilter/deleteFilter) address filters BY INDEX, not key —
// passing the key silently misses and createFilter appends a duplicate (that bug
// spammed the URL with stacked publication_year filters, #440 r5 fix).
function yearFilterIndex() {
  return url.readFilters(route).findIndex((f) => f.key === props.filterKey);
}
function applyYearRange() {
  const [lo, hi] = yearRange.value;
  const idx = yearFilterIndex();
  if (lo <= YEAR_MIN && hi >= currentYear) {
    if (idx >= 0) url.deleteFilter(props.entityType, idx);
    return;
  }
  // Handle-at-the-extreme = unbounded on that side, matching the chip idioms
  // ("Since 2020" → `2020-`, "Until 2010" → `-2010`) and staying fresh as new
  // years arrive. Both bounds interior → closed range; equal bounds → one year.
  let value;
  if (lo === hi) value = String(lo);
  else if (hi >= currentYear && lo > YEAR_MIN) value = `${lo}-`;
  else if (lo <= YEAR_MIN && hi < currentYear) value = `-${hi}`;
  else value = `${lo}-${hi}`;
  if (idx >= 0) {
    url.updateFilter(props.entityType, idx, value);
  } else {
    url.createFilter(props.entityType, props.filterKey, value);
  }
}
watch(() => route.query.filter, syncYearRangeFromUrl, { immediate: true });

const toggleSelection = (value) => {
  const index = localSelection.value.indexOf(value);
  if (index === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(index, 1);
  }
};

const applySelections = () => {
  // Get current filters and remove any with this key
  const currentFilters = url.readFilters(route).filter(f => f.key !== props.filterKey);
  
  // Add new filter with all selected values if any
  if (localSelection.value.length > 0) {
    const newFilterValue = localSelection.value.join('|');
    const newFilter = createSimpleFilter(props.entityType, props.filterKey, newFilterValue);
    currentFilters.push(newFilter);
  }
  
  url.pushNewFilters(currentFilters, props.entityType);
  closeDialog();
};

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
  // Year groups arrive already sorted chronologically (descending) from
  // api.getGroups — see the zd#8363 note there. No need to re-sort here.
  if (props.filterKey === 'start_year') {
    const currentYear = new Date().getFullYear();
    groups.value = result.filter(g => parseInt(g.value) <= currentYear);
  } else {
    groups.value = result;
  }
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
watch(isDialogOpen, (to) => {
  if (to) {
    // Initialize local selection from current filter state
    localSelection.value = [...(selectedGroupIds.value || [])];
  } else {
    closeDialog();
  }
});
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

/* Compact (flag-on rail, #440 r5): header buttons become small linear-style
   rounded squares with real spacing (the legacy -16px pull-in made the kebab and
   close buttons overlap). */
.group-by--compact .toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}
.group-by--compact .toolbar-actions .v-btn {
  margin-right: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}
.group-by--compact .toolbar-actions .v-btn :deep(.v-icon) {
  font-size: 18px;
}

/* Range slider under the compact year histogram: tighten the vertical rhythm. */
.group-by--compact .year-range-slider {
  margin-top: -6px;
}
.group-by--compact .year-range-slider :deep(.v-slider-track__fill),
.group-by--compact .year-range-slider :deep(.v-slider-track__background) {
  border-radius: 2px;
}
.group-by-search-field {
  padding: 8px 16px !important;
  
  :deep(.v-field__prepend-inner) {
    padding-left: 8px !important;
    padding-right: 12px !important;
    align-items: center !important;
  }
  
  :deep(.v-field__append-inner) {
    align-items: center !important;
    padding-top: 0 !important;
  }
  
  :deep(.v-field__input) {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    min-height: 32px !important;
  }
}
</style>