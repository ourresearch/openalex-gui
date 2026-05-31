<template>
  <!-- Boolean chip: no dropdown, just toggle -->
  <v-chip
    v-if="chipConfig.chipType === 'boolean'"
    :variant="isActive ? 'flat' : 'outlined'"
    :color="isActive ? 'primary' : undefined"
    @click="toggleBoolean"
    size="default"
    label
    class="novice-chip"
  >
    {{ chipConfig.label }}
    <template v-if="isActive" #append>
      <v-icon size="x-small" class="ml-1" @click.stop="clearFilter">mdi-close</v-icon>
    </template>
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
      <v-tooltip :text="chipConfig.label" location="bottom" :disabled="!isActive || menuOpen" :open-delay="400" :aria-label="chipConfig.label">
        <template v-slot:activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps" style="display: inline-flex;">
            <v-chip
              v-bind="menuProps"
              :model-value="true"
              :variant="isActive || chipConfig.isPending ? 'flat' : 'outlined'"
              :color="isActive || chipConfig.isPending ? 'primary' : undefined"
              :append-icon="isActive ? undefined : 'mdi-chevron-down'"
              size="default"
              label
              class="novice-chip"
            >
              <v-icon v-if="collectionValue" size="x-small" start>mdi-folder-outline</v-icon>
              <span class="chip-label">{{ chipLabel }}</span>
              <template v-if="isActive" #append>
                <v-icon size="x-small" class="ml-1" @click.stop="clearFilter">mdi-close</v-icon>
              </template>
            </v-chip>
          </span>
        </template>
      </v-tooltip>
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

    <!-- Range dropdown (generic numeric range) -->
    <v-card v-else-if="chipConfig.chipType === 'range'" min-width="240" class="pa-4">
      <div class="d-flex ga-3 align-center">
        <v-text-field
          ref="rangeMinRef"
          v-model="rangeFrom"
          label="Min"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 100px;"
        />
        <span class="text-medium-emphasis">to</span>
        <v-text-field
          v-model="rangeTo"
          label="Max"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 100px;"
        />
      </div>
      <div class="d-flex justify-end mt-3">
        <v-btn size="small" color="primary" @click="applyRange">Apply</v-btn>
      </div>
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
    <v-card v-else-if="chipConfig.chipType === 'entity'" min-width="300" max-height="460" class="py-1">
      <!-- Collections tab (cross-type filter, oxjob #273): only when this
           field's type has >=1 of the user's collections. -->
      <template v-if="showCollectionsTab">
        <v-tabs v-model="activeTab" color="primary" density="compact" grow>
          <v-tab value="default">{{ chipConfig.label }}</v-tab>
          <v-tab value="collections">
            <v-icon size="small" start>mdi-folder-outline</v-icon>
            Collections
          </v-tab>
        </v-tabs>
        <v-divider />
      </template>

      <div class="px-3 pt-2 pb-1">
        <v-text-field
          ref="entitySearchRef"
          v-model="entitySearch"
          :placeholder="(showCollectionsTab && activeTab === 'collections') ? 'Search collections...' : `Search ${chipConfig.label.toLowerCase()}...`"
          variant="plain"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          @update:model-value="onEntitySearchInput"
          @keydown="onEntitySearchKeydown"
        />
      </div>
      <div
        v-if="chipConfig.key === 'collection'"
        class="px-3 pb-2 text-caption text-medium-emphasis"
      >
        You can only apply one collection at a time.
      </div>
      <v-divider />

      <!-- Collections tab: single-select list of this field's collections -->
      <v-list v-if="showCollectionsTab && activeTab === 'collections'" density="compact" class="overflow-y-auto" style="max-height: 320px;">
        <v-list-item
          v-for="col in filteredCollections"
          :key="col.value"
          :active="isCollectionValueSelected(col.value)"
          @click="selectCollectionAsValue(col.value, col.displayValue)"
        >
          <template #prepend>
            <v-icon size="18" class="mr-2">mdi-folder-outline</v-icon>
          </template>
          <v-list-item-title>{{ col.displayValue }}</v-list-item-title>
          <template #append>
            <v-icon v-if="isCollectionValueSelected(col.value)" size="18" color="primary" class="mr-1">mdi-check</v-icon>
            <span class="text-caption text-medium-emphasis">{{ filters.toPrecision(col.entityCount) }}</span>
          </template>
        </v-list-item>
        <v-list-item v-if="filteredCollections.length === 0" class="text-medium-emphasis text-center">
          No collections found
        </v-list-item>
      </v-list>

      <!-- Default tab: the field's own multi-select entity list -->
      <v-list v-else density="compact" class="overflow-y-auto" style="max-height: 320px;">
        <v-list-item v-if="entityItemsLoading" class="text-center">
          <v-progress-circular indeterminate size="20" width="2" />
        </v-list-item>
        <template v-else>
          <v-list-item
            v-for="(item, index) in entityItems"
            :key="item.value"
            @click="toggleEntityOption(item)"
            :class="{ 'entity-item-highlighted': index === highlightedIndex }"
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
            {{ entitySearch ? 'No results' : 'Type to search' }}
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import axios from 'axios';
import _ from 'lodash';

import { url } from '@/url';
import { api } from '@/api';
import { isCollectionId } from '@/openalexId';
import { urlBase, axiosConfig } from '@/apiConfig.js';
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

const emit = defineEmits(['pending-dismissed']);

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);

// --- Auto-open via provide/inject ---
const autoOpenKey = inject('noviceAutoOpenKey', ref(null));

watch(autoOpenKey, (key) => {
  if (key && key === props.chipConfig.key) {
    nextTick(() => {
      menuOpen.value = true;
      autoOpenKey.value = null;
    });
  }
}, { immediate: true });

// --- Shared state ---
const menuOpen = ref(false);
const rangeMinRef = ref(null);
const entitySearchRef = ref(null);

// --- Computed: active filters for this chip's key ---
const activeFilters = computed(() => {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  return allFilters.filter(f => f.key === props.chipConfig.key);
});

const activeOptions = computed(() => {
  return activeFilters.value.flatMap(f => optionsFromString(f.value));
});

const isActive = computed(() => activeOptions.value.length > 0);

// --- Chip collection ---
const resolvedNames = ref({});

const chipLabel = computed(() => {
  if (!isActive.value) return props.chipConfig.isPending ? 'Select...' : props.chipConfig.label;

  const opts = activeOptions.value;

  // Year: show readable range
  if (props.chipConfig.chipType === 'year') {
    const val = activeFilters.value[0]?.value || '';
    const parts = val.split('-');
    if (parts[1] === '') return `Since ${parts[0]}`;
    if (parts[0] === '') return `Before ${parts[1]}`;
    return `${parts[0]}–${parts[1]}`;
  }

  // Range: show readable range with collection
  if (props.chipConfig.chipType === 'range') {
    const val = activeFilters.value[0]?.value || '';
    const parts = val.split('-');
    if (parts.length === 2) {
      if (parts[1] === '') return `${props.chipConfig.label} \u2265 ${parts[0]}`;
      if (parts[0] === '') return `${props.chipConfig.label} \u2264 ${parts[1]}`;
      return `${props.chipConfig.label}: ${parts[0]}–${parts[1]}`;
    }
    return `${props.chipConfig.label}: ${val}`;
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
    const rawVal = activeFilters.value[0]?.value;
    // Resolve as a collection when this is the dedicated collection chip OR the
    // value is a col_ ref under a regular entity-ID field (cross-type, #273).
    const isCollectionChip = props.chipConfig.key === 'collection' || isCollectionId(rawVal);
    for (const optId of newOpts) {
      if (!resolvedNames.value[optId]) {
        resolvedNames.value[optId] = '...';
        try {
          if (isCollectionChip) {
            // optionsFromString lowercases everything; collection IDs are
            // case-sensitive in users-api. Resolve against the raw URL
            // filter value (case-preserved) and cache under the
            // lowercased option key the chipLabel reads from.
            const rawValue = activeFilters.value[0]?.value || optId;
            // Collections are private (v1.1): /collections/:id requires auth. Sending
            // the JWT lets the owner / admin resolve the chip's display name;
            // anon callers will 401 and we'll fall through to showing the
            // raw id (better than crashing).
            const resp = await axios.get(
              `${urlBase.userApi}/collections/${encodeURIComponent(rawValue)}`,
              axiosConfig({ userAuth: true })
            );
            resolvedNames.value[optId] = resp.data?.display_name || optId;
          } else {
            // getFilterValueDisplayName handles non-OpenAlex IDs (language
            // codes, country codes, SDG numbers, work types) before falling
            // back to /{entity}/{id}?select=display_name.
            const displayName = await api.getFilterValueDisplayName(props.chipConfig.key, optId, entityType.value);
            resolvedNames.value[optId] = displayName || optId;
          }
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

  // Handle pending chip dismissal: menu closed with no value
  if (!open && !isActive.value && props.chipConfig.isPending) {
    emit('pending-dismissed');
  }

  // Initialize range inputs when opening a range chip
  if (open && props.chipConfig.chipType === 'range') {
    const val = activeFilters.value[0]?.value || '';
    const parts = val.split('-');
    rangeFrom.value = parts[0] || '';
    rangeTo.value = parts[1] || '';
    setTimeout(() => rangeMinRef.value?.$el?.querySelector('input')?.focus(), 50);
  }

  // Auto-focus entity search when opening
  if (open && props.chipConfig.chipType === 'entity') {
    setTimeout(() => entitySearchRef.value?.$el?.querySelector('input')?.focus(), 50);
  }
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

// --- Range (generic numeric) ---
const rangeFrom = ref('');
const rangeTo = ref('');

function applyRange() {
  const from = rangeFrom.value || '';
  const to = rangeTo.value || '';
  if (!from && !to) return;
  replaceFilterValue(`${from}-${to}`);
  menuOpen.value = false;
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
  menuOpen.value = false;
}

// --- Entity ---
const entitySearch = ref('');
const entityItems = ref([]);
const entityItemsLoading = ref(false);
const highlightedIndex = ref(-1);

// --- Cross-type collection filter (oxjob #273) ---
// An entity chip (source/author/institution/…) whose type the user owns a
// collection of gets a second "Collections" tab inside the same dropdown.
// Single-select; picking one replaces the chip's value (no mixing). The
// dedicated `collection` chip keeps its own existing single-collection path.
const activeTab = ref('default');
const matchingCollections = ref([]); // search-independent full list (drives tab visibility)

const showCollectionsTab = computed(() =>
  props.chipConfig.chipType === 'entity' &&
  props.chipConfig.key !== 'collection' &&
  matchingCollections.value.length > 0
);

const filteredCollections = computed(() => {
  const term = (entitySearch.value || '').trim().toLowerCase();
  if (!term) return matchingCollections.value;
  return matchingCollections.value.filter(c => (c.displayValue || '').toLowerCase().includes(term));
});

// The chip's current value is a collection ref (col_xxx under a regular key).
const collectionValue = computed(() => {
  const f = activeFilters.value[0];
  return f && isCollectionId(f.value) ? f.value : null;
});

function isCollectionValueSelected(colId) {
  // Compare against the raw (case-preserved) URL value — col ids are case-sensitive.
  const all = filtersFromUrlStr(entityType.value, route.query.filter);
  return all.some(f => f.key === props.chipConfig.key && f.value === colId);
}

// Pick a collection as this field's value: replaces any existing value for the
// key (mirrors the API's no-mix rule — a col ref can't coexist with literal IDs).
function selectCollectionAsValue(colId, displayValue) {
  resolvedNames.value[colId] = displayValue;
  const all = filtersFromUrlStr(entityType.value, route.query.filter)
    .filter(f => f.key !== props.chipConfig.key);
  all.push(createSimpleFilter(entityType.value, props.chipConfig.key, colId));
  url.pushNewFilters(all, entityType.value);
  menuOpen.value = false;
}

watch(entityItems, () => {
  highlightedIndex.value = -1;
});

function onEntitySearchKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (highlightedIndex.value < entityItems.value.length - 1) {
      highlightedIndex.value++;
    }
    scrollHighlightedIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (highlightedIndex.value > 0) {
      highlightedIndex.value--;
    }
    scrollHighlightedIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex.value >= 0 && highlightedIndex.value < entityItems.value.length) {
      toggleEntityOption(entityItems.value[highlightedIndex.value]);
    }
  }
}

function scrollHighlightedIntoView() {
  nextTick(() => {
    const el = document.querySelector('.entity-item-highlighted');
    if (el) el.scrollIntoView({ block: 'nearest' });
  });
}

// Fetch contextual top-20 on menu open
watch(menuOpen, async (open) => {
  if (!open || props.chipConfig.chipType !== 'entity') return;
  entitySearch.value = '';
  // Load this field's matching collections (cross-type, oxjob #273) so the
  // Collections tab can appear. Skip for the dedicated `collection` chip.
  // Land on the Collections tab if the chip's current value is a collection.
  if (props.chipConfig.key !== 'collection') {
    matchingCollections.value = await api.getCollectionSuggestionsForField(
      entityType.value, props.chipConfig.key, ''
    );
    activeTab.value = collectionValue.value ? 'collections' : 'default';
  } else {
    matchingCollections.value = [];
    activeTab.value = 'default';
  }
  await fetchContextualItems();
});

async function fetchCollectionItems(searchString = '') {
  // Pull from the collections.store (one /me/collections fetch covers it — cap 100).
  // Filter to the current entity_type so a `works` SERP only sees works collections.
  entityItemsLoading.value = true;
  try {
    if (!store.state.collections?.loaded && !store.state.collections?.loading) {
      await store.dispatch('collections/fetchAll');
    }
    const term = (searchString || '').trim().toLowerCase();
    const all = store.state.collections?.collections || [];
    const items = all
      .filter(l => l.entity_type === entityType.value)
      .filter(l => {
        if (!term) return true;
        const name = (l.display_name || '').toLowerCase();
        const desc = (l.description || '').toLowerCase();
        return name.includes(term) || desc.includes(term);
      })
      .sort((a, b) =>
        (a.display_name || '').localeCompare(b.display_name || '', undefined, { sensitivity: 'base' })
      )
      .map(l => ({ value: l.id, displayValue: l.display_name }));
    entityItems.value = items;
  } finally {
    entityItemsLoading.value = false;
  }
}

async function fetchContextualItems() {
  if (props.chipConfig.key === 'collection') {
    await fetchCollectionItems('');
    return;
  }

  // Semantic search doesn't support group-by; skip and let user type to search
  if (isSemanticSearch.value) {
    entityItems.value = [];
    return;
  }

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
  if (props.chipConfig.key === 'collection') {
    await fetchCollectionItems(searchString);
    return;
  }
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
  if (props.chipConfig.key === 'collection') {
    // Collection IDs are case-sensitive shortuuids; optionsFromString lowercases.
    // Compare against the raw (case-preserved) value on each collection: filter.
    const all = filtersFromUrlStr(entityType.value, route.query.filter);
    return all.some(f => f.key === 'collection' && f.value === value);
  }
  return activeOptions.value.includes(value);
}

function toggleEntityOption(item) {
  // Cache display name
  resolvedNames.value[item.value] = item.displayValue;
  if (props.chipConfig.key === 'collection') {
    toggleCollectionOption(item.value);
  } else {
    toggleMultiSelectOption(item.value);
  }
  menuOpen.value = false;
}

// Collections are single-only (oxjob #228): one `collection:` filter per query. Clicking
// the active collection toggles it off; clicking any other collection replaces the
// current selection. Bypasses the generic
// `addOptionToFilterValue`/`deleteOptionFromFilterValue` path so case
// survives.
function toggleCollectionOption(collectionId) {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const isSel = allFilters.some(f => f.key === 'collection' && f.value === collectionId);
  let newFilters;
  if (isSel) {
    newFilters = allFilters.filter(f => !(f.key === 'collection' && f.value === collectionId));
  } else {
    newFilters = allFilters.filter(f => f.key !== 'collection');
    newFilters.push(createSimpleFilter(entityType.value, 'collection', collectionId));
  }
  url.pushNewFilters(newFilters, entityType.value);
}

// --- Shared multi-select toggle ---
function toggleMultiSelectOption(optionValue) {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const idx = allFilters.findIndex(f => f.key === props.chipConfig.key);

  // No mixing in one clause (oxjob #273): if the current value is a collection
  // ref, ticking an individual entity REPLACES it (a col_xxx can't coexist with
  // literal IDs — API #266 returns 400).
  if (idx >= 0 && isCollectionId(allFilters[idx].value)) {
    allFilters[idx] = createSimpleFilter(entityType.value, props.chipConfig.key, optionValue);
    url.pushNewFilters(allFilters, entityType.value);
    return;
  }

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
  border-color: rgba(0, 0, 0, 0.25);
  color: rgba(0, 0, 0, 0.87);
}
.entity-item-highlighted {
  background-color: rgba(0, 0, 0, 0.08) !important;
}
</style>
