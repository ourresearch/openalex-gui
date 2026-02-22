<template>
  <!-- Boolean chip: no dropdown, just toggle -->
  <v-chip
    v-if="chipConfig.chipType === 'boolean'"
    :model-value="true"
    :variant="isActive ? 'flat' : 'outlined'"
    :color="isActive ? 'primary' : undefined"
    @click="toggleBoolean"
    :closable="isActive"
    close-icon="mdi-close"
    @click:close="clearFilter"
    size="default"
    label
    class="novice-chip"
  >
    {{ chipConfig.label }}
  </v-chip>

  <!-- All other chips: dropdown via v-menu -->
  <v-menu
    v-else
    v-model="menuOpen"
    :close-on-content-click="chipConfig.chipType === 'year' && !showCustomRange"
    location="bottom start"
    offset="4"
  >
    <template v-slot:activator="{ props: menuProps }">
      <v-chip
        v-bind="menuProps"
        :model-value="true"
        :variant="isActive ? 'flat' : 'outlined'"
        :color="isActive ? 'primary' : undefined"
        :closable="isActive"
        close-icon="mdi-close"
        @click:close.stop="clearFilter"
        :append-icon="isActive ? undefined : 'mdi-chevron-down'"
        size="default"
        label
        class="novice-chip"
      >
        <span class="chip-label">{{ chipLabel }}</span>
      </v-chip>
    </template>

    <!-- Year dropdown -->
    <v-card v-if="chipConfig.chipType === 'year'" min-width="220" class="py-1">
      <template v-if="!showCustomRange">
        <v-list density="compact">
          <v-list-item @click="selectYearPreset('2025-')">
            Since 2025
          </v-list-item>
          <v-list-item @click="selectYearPreset('2020-')">
            Since 2020
          </v-list-item>
          <v-list-item @click="showCustomRange = true">
            Custom range...
          </v-list-item>
        </v-list>
      </template>
      <template v-else>
        <div class="pa-4">
          <div class="d-flex ga-3 align-center">
            <v-text-field
              v-model="yearFrom"
              label="From"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 100px;"
            />
            <span class="text-medium-emphasis">to</span>
            <v-text-field
              v-model="yearTo"
              label="To"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 100px;"
            />
          </div>
          <div class="d-flex justify-end mt-3 ga-2">
            <v-btn size="small" variant="text" @click="showCustomRange = false">Back</v-btn>
            <v-btn size="small" color="primary" @click="applyCustomYear">Apply</v-btn>
          </div>
        </div>
      </template>
    </v-card>

    <!-- Type dropdown -->
    <v-card v-else-if="chipConfig.chipType === 'type'" min-width="220" max-height="400" class="overflow-y-auto py-1">
      <v-list density="compact">
        <v-list-item
          v-for="wt in workTypes"
          :key="wt"
          @click="toggleTypeOption(wt)"
        >
          <template #prepend>
            <v-icon size="18" class="mr-2">
              {{ isTypeSelected(wt) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
            </v-icon>
          </template>
          <v-list-item-title>{{ formatTypeName(wt) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Entity dropdown -->
    <v-card v-else-if="chipConfig.chipType === 'entity'" min-width="300" max-height="420" class="py-1">
      <div class="px-3 pt-2 pb-1">
        <v-text-field
          v-model="entitySearch"
          placeholder="Search..."
          variant="plain"
          density="compact"
          hide-details
          autofocus
          prepend-inner-icon="mdi-magnify"
          @update:model-value="onEntitySearchInput"
        />
      </div>
      <v-divider />
      <v-list density="compact" class="overflow-y-auto" style="max-height: 320px;">
        <v-list-item v-if="entityItemsLoading" class="text-center">
          <v-progress-circular indeterminate size="20" width="2" />
        </v-list-item>
        <template v-else>
          <v-list-item
            v-for="item in entityItems"
            :key="item.value"
            @click="toggleEntityOption(item)"
          >
            <template #prepend>
              <v-icon size="18" class="mr-2">
                {{ isEntitySelected(item.value) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
              </v-icon>
            </template>
            <v-list-item-title>{{ item.displayValue }}</v-list-item-title>
            <template #append v-if="item.count">
              <span class="text-caption text-medium-emphasis">{{ filters.toPrecision(item.count) }}</span>
            </template>
          </v-list-item>
          <v-list-item v-if="entityItems.length === 0" class="text-medium-emphasis text-center">
            No results
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import _ from 'lodash';

import { url } from '@/url';
import { api } from '@/api';
import filters from '@/filters';
import {
  filtersFromUrlStr,
  createSimpleFilter,
  optionsFromString,
  addOptionToFilterValue,
  deleteOptionFromFilterValue,
} from '@/filterConfigs';

defineOptions({ name: 'NoviceFilterChip' });

const props = defineProps({
  chipConfig: Object,
});

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);

// --- Shared state ---
const menuOpen = ref(false);

// --- Computed: active filters for this chip's key ---
const activeFilters = computed(() => {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  return allFilters.filter(f => f.key === props.chipConfig.key);
});

const activeOptions = computed(() => {
  return activeFilters.value.flatMap(f => optionsFromString(f.value));
});

const isActive = computed(() => activeOptions.value.length > 0);

// --- Chip label ---
const resolvedNames = ref({});

const chipLabel = computed(() => {
  if (!isActive.value) return props.chipConfig.label;

  const opts = activeOptions.value;

  // Year: show readable range
  if (props.chipConfig.chipType === 'year') {
    const val = activeFilters.value[0]?.value || '';
    const parts = val.split('-');
    if (parts[1] === '') return `Since ${parts[0]}`;
    if (parts[0] === '') return `Before ${parts[1]}`;
    return `${parts[0]}–${parts[1]}`;
  }

  // Type: show count or single name
  if (props.chipConfig.chipType === 'type') {
    if (opts.length === 1) return formatTypeName(opts[0]);
    return `${opts.length} selected`;
  }

  // Boolean
  if (props.chipConfig.chipType === 'boolean') {
    return props.chipConfig.label;
  }

  // Entity: resolve display names
  if (opts.length === 1) {
    return resolvedNames.value[opts[0]] || props.chipConfig.label;
  }
  return `${opts.length} selected`;
});

// Resolve display names for entity chips loaded from URL
watch(
  activeOptions,
  async (newOpts) => {
    if (props.chipConfig.chipType !== 'entity') return;
    for (const optId of newOpts) {
      if (!resolvedNames.value[optId]) {
        resolvedNames.value[optId] = '...';
        try {
          const entity = await api.getEntity(optId);
          resolvedNames.value[optId] = entity.display_name || optId;
        } catch {
          resolvedNames.value[optId] = optId;
        }
      }
    }
  },
  { immediate: true }
);

// --- Clear filter ---
function clearFilter() {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const newFilters = allFilters.filter(f => f.key !== props.chipConfig.key);
  url.pushNewFilters(newFilters, entityType.value);
}

// --- Boolean ---
function toggleBoolean() {
  if (isActive.value) {
    clearFilter();
  } else {
    url.createFilter(entityType.value, props.chipConfig.key, true);
  }
}

// --- Year ---
const showCustomRange = ref(false);
const yearFrom = ref('');
const yearTo = ref('');

watch(menuOpen, (open) => {
  if (!open) showCustomRange.value = false;
});

function selectYearPreset(rangeStr) {
  replaceFilterValue(rangeStr);
}

function applyCustomYear() {
  const from = yearFrom.value || '';
  const to = yearTo.value || '';
  if (!from && !to) return;
  replaceFilterValue(`${from}-${to}`);
  menuOpen.value = false;
}

function replaceFilterValue(value) {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const withoutMe = allFilters.filter(f => f.key !== props.chipConfig.key);
  const newFilter = createSimpleFilter(entityType.value, props.chipConfig.key, value);
  url.pushNewFilters([...withoutMe, newFilter], entityType.value);
}

// --- Type ---
const workTypes = [
  'article', 'book', 'book-chapter', 'dataset', 'dissertation',
  'editorial', 'erratum', 'letter', 'monograph', 'paratext',
  'peer-review', 'preprint', 'reference-entry', 'report', 'review',
  'standard', 'supplementary-materials',
];

function formatTypeName(t) {
  return t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isTypeSelected(t) {
  return activeOptions.value.includes(t);
}

function toggleTypeOption(t) {
  toggleMultiSelectOption(t);
}

// --- Entity ---
const entitySearch = ref('');
const entityItems = ref([]);
const entityItemsLoading = ref(false);

// Fetch contextual top-20 on menu open
watch(menuOpen, async (open) => {
  if (!open || props.chipConfig.chipType !== 'entity') return;
  entitySearch.value = '';
  await fetchContextualItems();
});

async function fetchContextualItems() {
  entityItemsLoading.value = true;
  try {
    // Get current filters, excluding this chip's own key
    const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
    const filtersWithoutMe = allFilters.filter(f => f.key !== props.chipConfig.key);

    const items = await api.getGroups(entityType.value, props.chipConfig.key, {
      filters: filtersWithoutMe,
      hideUnknown: true,
      perPage: 10,
    });
    entityItems.value = items;
  } catch (e) {
    console.error('Failed to fetch contextual items:', e);
    entityItems.value = [];
  } finally {
    entityItemsLoading.value = false;
  }
}

const onEntitySearchInput = _.debounce(async (searchString) => {
  if (!searchString) {
    await fetchContextualItems();
    return;
  }
  entityItemsLoading.value = true;
  try {
    const items = await api.getAutocompleteResponses(
      entityType.value,
      props.chipConfig.key,
      searchString,
    );
    entityItems.value = items;
  } catch (e) {
    console.error('Failed to fetch autocomplete:', e);
    entityItems.value = [];
  } finally {
    entityItemsLoading.value = false;
  }
}, 200);

function isEntitySelected(value) {
  return activeOptions.value.includes(value);
}

function toggleEntityOption(item) {
  // Cache display name
  resolvedNames.value[item.value] = item.displayValue;
  toggleMultiSelectOption(item.value);
}

// --- Shared multi-select toggle ---
function toggleMultiSelectOption(optionValue) {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const idx = allFilters.findIndex(f => f.key === props.chipConfig.key);

  if (isOptionSelected(optionValue)) {
    // Remove this option
    if (idx === -1) return;
    const newValue = deleteOptionFromFilterValue(allFilters[idx].value, optionValue);
    if (newValue) {
      allFilters[idx] = createSimpleFilter(entityType.value, props.chipConfig.key, newValue);
    } else {
      allFilters.splice(idx, 1);
    }
  } else {
    // Add this option
    if (idx >= 0) {
      allFilters[idx] = createSimpleFilter(
        entityType.value,
        props.chipConfig.key,
        addOptionToFilterValue(allFilters[idx].value, optionValue),
      );
    } else {
      allFilters.push(createSimpleFilter(entityType.value, props.chipConfig.key, optionValue));
    }
  }

  url.pushNewFilters(allFilters, entityType.value);
}

function isOptionSelected(optionValue) {
  return activeOptions.value.includes(optionValue);
}
</script>

<style scoped>
.novice-chip .chip-label {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style>
.novice-chip.v-chip--variant-outlined {
  border-color: rgba(0, 0, 0, 0.12);
}
</style>
