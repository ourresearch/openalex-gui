<template>
  <!-- Boolean chip: dropdown to choose the positive or negated state (#353 B3).
       Was a one-click toggle that could only ever set `true`; now it can create
       a negated boolean (`!true`) and shows "NOT <label>" when negated. -->
  <v-menu v-if="chipConfig.chipType === 'boolean'" location="bottom start" offset="4">
    <template v-slot:activator="{ props: menuProps }">
      <v-chip
        v-bind="menuProps"
        :model-value="true"
        :variant="isActive ? 'flat' : 'outlined'"
        :color="isActive ? 'primary' : undefined"
        :append-icon="isActive ? undefined : 'mdi-chevron-down'"
        size="default"
        label
        class="novice-chip"
      >
        <span class="chip-label">{{ booleanLabel }}</span>
        <template v-if="isActive" #append>
          <v-icon size="x-small" class="ml-1" @click.stop="clearFilter">mdi-close</v-icon>
        </template>
      </v-chip>
    </template>
    <v-card min-width="180" class="py-1">
      <v-list density="compact">
        <v-list-item @click="setBoolean(false)">
          <template #prepend>
            <v-icon size="18" class="mr-2">{{ isActive && !isNegatedBool ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
          </template>
          <v-list-item-title>{{ chipConfig.label }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="setBoolean(true)">
          <template #prepend>
            <v-icon size="18" class="mr-2">{{ isActive && isNegatedBool ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
          </template>
          <v-list-item-title>NOT {{ chipConfig.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>

  <!-- All other chips: dropdown via v-menu -->
  <v-menu
    v-else
    v-model="menuOpen"
    :close-on-content-click="chipConfig.chipType === 'year' && !showCustomRange"
    location="bottom start"
    offset="4"
  >
    <template v-slot:activator="{ props: menuProps }">
      <v-tooltip location="bottom" :disabled="!isActive || menuOpen" :open-delay="400">
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
        <!-- Card tooltip (#353 B4): filter type small on top, then the full
             selected value(s) below — so truncated chips still reveal both. -->
        <div class="novice-chip-tooltip">
          <div class="text-caption" style="opacity: 0.75;">{{ chipConfig.label }}</div>
          <div v-for="(v, i) in tooltipValues" :key="i" class="text-body-2">{{ v }}</div>
        </div>
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
    <!-- Entity value picker: shared with the advanced filter row. Inline
         collections + collections-only toggle + checkbox selection live here
         (oxjob #273 redesign). Keyed on menuOpen so it remounts fresh on open. -->
    <entity-value-picker
      v-else-if="chipConfig.chipType === 'entity'"
      :key="menuOpen ? 'open' : 'closed'"
      :filter-key="chipConfig.key"
      :load-entities="loadEntities"
      max-height="460px"
      style="min-width: 360px;"
      @close="menuOpen = false"
    />
  </v-menu>
</template>

<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import axios from 'axios';

import { url } from '@/url';
import { api } from '@/api';
import { isCollectionId } from '@/openalexId';
import { urlBase, axiosConfig } from '@/apiConfig.js';
import {
  filtersFromUrlStr,
  createSimpleFilter,
  optionsFromString,
  addOptionToFilterValue,
  deleteOptionFromFilterValue,
} from '@/filterConfigs';
import EntityValuePicker from '@/components/Filter/EntityValuePicker.vue';

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
    if (parts.length === 1) return parts[0];        // single year, e.g. "2020"
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

// Values shown in the hover tooltip (#353 B4): the resolved value(s), one per
// line. Entity → resolved names; type → formatted names; year/range → the
// formatted label. Boolean chips render in a separate branch with no tooltip.
const tooltipValues = computed(() => {
  if (!isActive.value) return [];
  const opts = activeOptions.value;
  if (props.chipConfig.chipType === 'entity') {
    return opts.map(o => resolvedNames.value[o] || o);
  }
  if (props.chipConfig.chipType === 'type') {
    return opts.map(o => formatTypeName(o));
  }
  return [chipLabel.value];
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

// --- Boolean (#353 B3) ---
// Negated when the URL value is `!true` (isNegated) OR the legacy `false` form —
// both mean "not <label>" in the API, so both render with the NOT prefix.
const isNegatedBool = computed(() => {
  const f = activeFilters.value[0];
  return !!f && (f.isNegated || String(f.value) === 'false');
});

const booleanLabel = computed(() => {
  if (!isActive.value) return props.chipConfig.label;
  return isNegatedBool.value ? `NOT ${props.chipConfig.label}` : props.chipConfig.label;
});

// Write the positive (`:true`) or negated (`:false`) boolean, replacing any
// existing value for this key. The API rejects `!true` for boolean fields
// ("must be true, false, null, or !null") — "not <X>" is expressed as `false`.
function setBoolean(negated) {
  const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const withoutMe = allFilters.filter(f => f.key !== props.chipConfig.key);
  const newFilter = createSimpleFilter(entityType.value, props.chipConfig.key, negated ? false : true);
  url.pushNewFilters([...withoutMe, newFilter], entityType.value);
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
  // Multi-select: keep the menu open so several work types can be ticked in one
  // pass (the chip shows "N selected"). The user closes it by clicking away.
  toggleMultiSelectOption(t);
}

// --- Entity value picker (shared with the advanced filter row, oxjob #273
// redesign) ---
// The picker owns the list UI, inline collections, the collections-only toggle,
// selection, and the URL write on Apply. The novice surface only supplies the
// entity loader: contextual top-N when the box is empty, autocomplete when
// typing. Collections are merged in by EntityValuePicker itself.
const loadEntities = async (searchString) => {
  if (props.chipConfig.key === 'collection') return [];
  if (isSemanticSearch.value) return [];
  if (!searchString) {
    const allFilters = filtersFromUrlStr(entityType.value, route.query.filter);
    const filtersWithoutMe = allFilters.filter(f => f.key !== props.chipConfig.key);
    return await api.getGroups(entityType.value, props.chipConfig.key, {
      filters: filtersWithoutMe,
      hideUnknown: true,
      perPage: 10,
    });
  }
  return await api.getAutocompleteResponses(entityType.value, props.chipConfig.key, searchString);
};

// The chip's current value is a collection ref (col_xxx under a regular key).
const collectionValue = computed(() => {
  const f = activeFilters.value[0];
  return f && isCollectionId(f.value) ? f.value : null;
});

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
.novice-chip-tooltip {
  max-width: 280px;
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
