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
    <v-toolbar flat color="transparent" :height="compact ? 40 : undefined">
      <!-- Compact (#440 r6): a drag grip replaces the property icon — property
           icons are exhausted (tag = topic/domain/field/subfield…); icons mean
           CATEGORIES, not properties. Revealed on card hover; mousedown arms the
           parent column's draggable (classic handle pattern, see GroupByViews). -->
      <v-icon
        v-if="compact"
        size="18"
        class="drag-grip"
        title="Drag to reorder"
        @mousedown="emit('grip-down')"
      >mdi-drag</v-icon>
      <v-icon color="grey-darken-2 mr-1" v-else-if="filterConfig?.icon">{{ filterConfig.icon }}</v-icon>
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
    <!-- Compact (#440 r7): divider between the widget header and body. -->
    <v-divider v-if="compact" />
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
            track-size="2"
            thumb-size="12"
            thumb-label
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
          <span class="text-body-2 mr-1 oa-count">
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
import { useStore } from 'vuex';

import { api } from '@/api';
import { url } from '@/url';
import filters from '@/filters';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { filtersFromUrlStr, createSimpleFilter } from '@/filterConfigs';
import { selectedValues as oqoSelectedValues } from '@/components/Oql/refinements';

import BarGraph from '@/components/BarGraph.vue';
import GroupByTableRow from '@/components/GroupBy/GroupByTableRow.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'GroupBy' });

// grip-down: compact drag handle pressed — the parent (GroupByViews) arms this
// widget's column as draggable (#440 r6).
const emit = defineEmits(['grip-down']);

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
const store = useStore();

// OQL mode (oxjob #528): when the OQL flag is on and the route carries an `?oql`
// query, the canonical query lives in the `query` store (queryOqo), NOT the legacy
// `?filter=` OXURL param. In that mode the stats widgets are "refine results"
// facets wired to the store: counts are aggregated against the live OQL query and
// re-fetched on every edit, and a click adds/toggles a top-level AND clause via the
// query/refinement actions (see refinements.js). Flag-off (ExpertSerp) keeps the
// entire legacy `?filter=` path below untouched.
const oqlMode = computed(() => !!store.getters.featureFlags?.['oql'] && !!route.query.oql);
const executionOqo = computed(() => store.getters['query/executionOqo']);
const queryFilterRows = computed(() => store.getters['query/queryFilterRows']);

const isLoading = ref(false);
const searchString = ref('');
const isDialogOpen = ref(false);
const groups = ref([]);
const localSelection = ref([]);
const maxResults = 5;
const maxResultsRange = 25;

const isSelected = computed({
  get: () => {
    if (oqlMode.value) return oqoSelectedValues(queryFilterRows.value, props.filterKey).length > 0;
    return url.isFilterApplied(route, props.entityType, props.filterKey);
  },
  set: (to) => {
    if (oqlMode.value) {
      if (to) store.dispatch('query/setRefinementValue', { columnId: props.filterKey, value: true });
      else store.dispatch('query/removeRefinement', { columnId: props.filterKey });
      return;
    }
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

const selectedGroupIds = computed(() => {
  if (oqlMode.value) return oqoSelectedValues(queryFilterRows.value, props.filterKey).map(String);
  return url.readFilterOptionsByKey(route, props.entityType, props.filterKey);
});

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
  // Source the current year value from the query store (OQL mode) or the legacy
  // ?filter= param (flag-off). Parsing of the value expression is identical.
  let rawValue;
  if (oqlMode.value) {
    const vals = oqoSelectedValues(queryFilterRows.value, props.filterKey);
    rawValue = vals.length ? vals[0] : null;
  } else {
    const f = filtersFromUrlStr(props.entityType, route.query.filter)
      .find((f) => f.key === props.filterKey);
    rawValue = f ? f.value : null;
  }
  if (rawValue == null) {
    yearRange.value = [YEAR_MIN, currentYear];
    return;
  }
  const v = String(rawValue);
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
  const isFullRange = lo <= YEAR_MIN && hi >= currentYear;
  // Handle-at-the-extreme = unbounded on that side, matching the chip idioms
  // ("Since 2020" → `2020-`, "Until 2010" → `-2010`) and staying fresh as new
  // years arrive. Both bounds interior → closed range; equal bounds → one year.
  let value;
  if (lo === hi) value = String(lo);
  else if (hi >= currentYear && lo > YEAR_MIN) value = `${lo}-`;
  else if (lo <= YEAR_MIN && hi < currentYear) value = `-${hi}`;
  else value = `${lo}-${hi}`;

  if (oqlMode.value) {
    // OQL mode: the year range is just a single-value refinement on the column.
    if (isFullRange) store.dispatch('query/removeRefinement', { columnId: props.filterKey });
    else store.dispatch('query/setRefinementValue', { columnId: props.filterKey, value });
    return;
  }

  const idx = yearFilterIndex();
  if (isFullRange) {
    if (idx >= 0) url.deleteFilter(props.entityType, idx);
    return;
  }
  if (idx >= 0) {
    url.updateFilter(props.entityType, idx, value);
  } else {
    url.createFilter(props.entityType, props.filterKey, value);
  }
}
watch(
  () => [route.query.filter, store.state.query.editEpoch],
  syncYearRangeFromUrl,
  { immediate: true }
);

const toggleSelection = (value) => {
  const index = localSelection.value.indexOf(value);
  if (index === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(index, 1);
  }
};

const applySelections = () => {
  if (oqlMode.value) {
    // OQL mode: the dialog owns the whole selection → replace this facet's
    // refinement with exactly the chosen values (OR-within-facet).
    store.dispatch('query/setRefinementValues', {
      columnId: props.filterKey,
      values: [...localSelection.value],
    });
    closeDialog();
    return;
  }
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
  if (oqlMode.value) {
    store.dispatch('query/toggleRefinementValue', { columnId: props.filterKey, value: id });
    isDialogOpen.value = false;
    return;
  }
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
  // OQL mode: aggregate against the live OQL query via POST-OQO (non-lossy for
  // arbitrary nested boolean trees). Flag-off: legacy GET with the ?filter= context.
  let result;
  if (oqlMode.value) {
    if (!executionOqo.value) { isLoading.value = false; return; }
    result = await api.getGroupsForOqo(props.entityType, props.filterKey, executionOqo.value, {
      hideUnknown: true,
    });
  } else {
    result = await api.getGroups(props.entityType, props.filterKey, {
      hideUnknown: true,
      filters: apiRequestFilters.value
    });
  }
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
  // On an entity page (e.g. a source), clicking a value in this widget should
  // narrow within this entity's works (this source + the chosen year), not
  // launch a brand-new global works search. Combine the entity's own works
  // filter (passed in via filterBy) with the clicked value and navigate to a
  // works search — mirroring the GroupByTableRow entity-page behavior.
  if (props.isEntityPage) {
    const rowFilter = createSimpleFilter(props.entityType, props.filterKey, val);
    url.pushNewFilters([...(props.filterBy || []), rowFilter], props.entityType);
    return;
  }
  const type = myFilterConfig.value?.type;
  if (oqlMode.value) {
    // OQL mode: refine the query model. Boolean/range facets carry a single value
    // (replace); everything else multi-selects (OR-within-facet toggle). Each adds
    // a top-level AND clause — see refinements.js / the query/* actions.
    if (type === 'boolean') {
      store.dispatch('query/setRefinementValue', { columnId: props.filterKey, value: val !== 0 });
    } else if (type === 'range') {
      store.dispatch('query/setRefinementValue', { columnId: props.filterKey, value: val });
    } else {
      store.dispatch('query/toggleRefinementValue', { columnId: props.filterKey, value: val });
    }
    return;
  }
  if (type === 'boolean') {
    url.upsertFilter(props.entityType, props.filterKey, val !== 0);
  } else if (type === 'range') {
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
  // Flag-off re-fetches on the ?filter= URL; OQL mode re-fetches on every query
  // edit (the store bumps editEpoch). Watching both is safe: in flag-off editEpoch
  // never changes, and in OQL mode ?filter= is empty/constant.
  () => [route.params, route.query.filter, store.state.query.editEpoch],
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
  /* Pull the buttons out so the ✕ ICON's right edge sits on the same right
     margin the row numbers align on (measured: td padding 16px + 1px border vs
     the icon's 5px inset inside its 28px button → -7px). #440 r6. */
  margin-right: -7px;
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

/* Range slider under the compact year histogram: tight against the bars (#440
   r6 — "push it up closer, ~50%"), thin track, labels only while dragging. */
.group-by--compact .year-range-slider {
  margin-top: -14px;
}
/* Thumb label (#440 r7): solid black pill with white text (the default
   semi-transparent theme color was lost against the bars), and shown ONLY while
   the handle is actually pressed — Vuetify otherwise keeps it up after release
   while the thumb retains focus. */
.group-by--compact .year-range-slider :deep(.v-slider-thumb__label) {
  display: none;
  background: #000 !important;
  color: #fff;
}
.group-by--compact .year-range-slider :deep(.v-slider-thumb__label::before) {
  color: #000 !important;
  border-top-color: #000 !important;
}
.group-by--compact .year-range-slider :deep(.v-slider-thumb--pressed .v-slider-thumb__label) {
  display: flex;
}
.group-by--compact .year-range-slider :deep(.v-slider-track__fill),
.group-by--compact .year-range-slider :deep(.v-slider-track__background) {
  border-radius: 2px;
}

/* ---- r6 chrome: denser, divider-free stats widgets ---- */

/* Smaller header: 40px toolbar (set via :height) + smaller title. */
.group-by--compact .group-by-title {
  font-size: 0.9rem;
  font-weight: 500;
}
/* Header grid alignment (#440 r7, pixel-measured): grip sits exactly over the
   row checkboxes (16px pad, both icons 18px), title text over the row labels
   (checkbox td 16+18 + label td's own 16px pad → 16px after the 18px grip). */
.group-by--compact :deep(.v-toolbar__content) {
  padding-left: 16px;
}
.group-by--compact .v-toolbar-title {
  margin-inline-start: 16px !important;
}

/* Drag grip (replaces the property icon): always visible (#440 r7 — a hover-
   reveal left a "random blank spot" in the card's most important corner),
   darkens on hover, grab cursor. */
.group-by--compact .drag-grip {
  color: rgba(0, 0, 0, 0.35);
  cursor: grab;
  transition: color 0.15s ease;
  flex-shrink: 0;
}
.group-by--compact .drag-grip:hover {
  color: rgba(0, 0, 0, 0.7);
}
.group-by--compact .drag-grip:active {
  cursor: grabbing;
}

/* Shorter footer (#440 r7): the More... strip was eating vertical space. */
.group-by--compact :deep(.v-card-actions) {
  min-height: 0;
  padding: 0 8px 4px;
}

/* Rows: no dividers, top-aligned, tighter vertical rhythm. */
.group-by--compact :deep(.group-by-table-row td) {
  border-bottom: none !important;
  vertical-align: top;
  height: auto !important;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
}
.group-by--compact :deep(.group-by-table-row td:first-child .v-icon) {
  font-size: 18px;
  margin-top: 1px;
}

/* Counts in monospace + tabular figures (InfoVis: magnitudes line up).
   !important because Vuetify's .text-body-2 utility sets font-family with
   !important; ours wins on specificity. */
.group-by--compact :deep(td.range),
.group-by--compact .oa-count {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace !important;
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem !important;
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