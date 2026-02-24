<template>
  <div>
    <TransitionGroup name="chip-list" tag="div" class="d-flex flex-wrap ga-2">
      <novice-filter-chip
        v-for="config in sortedChipConfigs"
        :key="config.key"
        :chip-config="config"
        @pending-dismissed="pendingCustomKey = null"
      />
      <v-chip
        key="__more-filters__"
        variant="text"
        label
        size="default"
        class="font-weight-regular"
        @click="showDialog = true"
      >
        more
      </v-chip>
    </TransitionGroup>

    <novice-filter-dialog
      v-model="showDialog"
      @select="onFilterSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, provide, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import NoviceFilterChip from '@/components/NoviceFilterChip.vue';
import NoviceFilterDialog from '@/components/NoviceFilterDialog.vue';
import { url } from '@/url';
import { filtersFromUrlStr } from '@/filterConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { facetConfigs } from '@/facetConfigs';

defineOptions({ name: 'NoviceFilterChips' });

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);

// --- Default chip configs per entity type ---
const defaultChipsByEntity = {
  works: [
    { key: 'publication_year', label: 'Year', chipType: 'year' },
    { key: 'type', label: 'Type', chipType: 'type' },
    { key: 'open_access.is_oa', label: 'Open Access', chipType: 'boolean' },
    { key: 'primary_topic.field.id', label: 'Field', chipType: 'entity', entityToSelect: 'fields' },
    { key: 'authorships.author.id', label: 'Author', chipType: 'entity', entityToSelect: 'authors' },
    { key: 'authorships.institutions.lineage', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
  ],
  authors: [
    { key: 'last_known_institutions.id', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
    { key: 'last_known_institutions.country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
  sources: [
    { key: 'type', label: 'Type', chipType: 'type' },
    { key: 'is_oa', label: 'Open Access', chipType: 'boolean' },
    { key: 'host_organization', label: 'Publisher', chipType: 'entity', entityToSelect: 'publishers' },
  ],
  institutions: [
    { key: 'type', label: 'Type', chipType: 'type' },
    { key: 'country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
  funders: [
    { key: 'country_code', label: 'Country', chipType: 'entity', entityToSelect: 'countries' },
  ],
};

const semanticDefaultChipConfigs = [
  { key: 'publication_year', label: 'Year', chipType: 'year' },
  { key: 'type', label: 'Type', chipType: 'type' },
  { key: 'open_access.is_oa', label: 'Open Access', chipType: 'boolean' },
  { key: 'authorships.author.id', label: 'Author', chipType: 'entity', entityToSelect: 'authors' },
  { key: 'authorships.institutions.lineage', label: 'Institution', chipType: 'entity', entityToSelect: 'institutions' },
  { key: 'language', label: 'Language', chipType: 'entity', entityToSelect: 'languages' },
];

const defaultChipConfigs = computed(() => {
  if (isSemanticSearch.value) return semanticDefaultChipConfigs;
  return defaultChipsByEntity[entityType.value] || [];
});

const DEFAULT_KEYS = computed(() => new Set(defaultChipConfigs.value.map(c => c.key)));

// --- Strip incompatible filters when switching to semantic search ---
const semanticAllowedKeys = computed(() => {
  return new Set(
    facetConfigs('works')
      .filter(c => c.semanticSearchAllowed && c.entityToFilter === 'works')
      .map(c => c.key)
  );
});

watch(isSemanticSearch, (isSemantic) => {
  if (!isSemantic) return;
  const currentFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  const incompatible = currentFilters.filter(f => !semanticAllowedKeys.value.has(f.key));
  if (incompatible.length > 0) {
    const compatible = currentFilters.filter(f => semanticAllowedKeys.value.has(f.key));
    url.pushNewFilters(compatible, entityType.value);
  }
});

// --- URL-derived filter state ---
const allUrlFilters = computed(() => {
  return filtersFromUrlStr(entityType.value, route.query.filter);
});

const activeKeys = computed(() => {
  return new Set(allUrlFilters.value.map(f => f.key));
});

// --- Auto-open behavior (provide to child chips) ---
const autoOpenKey = ref(null);
provide('noviceAutoOpenKey', autoOpenKey);

// --- Pending chip (from dialog selection, before value is set) ---
const pendingCustomKey = ref(null);

// Clear pending when it gets a real URL value
watch(activeKeys, (keys) => {
  if (pendingCustomKey.value && keys.has(pendingCustomKey.value)) {
    pendingCustomKey.value = null;
  }
});

// --- Dialog state ---
const showDialog = ref(false);

// --- Build custom chip config from a facetConfig ---
function chipConfigFromFacetConfig(facetConfig, isPending = false) {
  if (!facetConfig) return null;
  const chipType = facetTypeToChipType(facetConfig);
  if (!chipType) return null;
  return {
    key: facetConfig.key,
    label: titleCase(facetConfig.displayName),
    chipType,
    entityToSelect: facetConfig.entityToSelect,
    icon: facetConfig.icon,
    isCustom: true,
    isPending,
  };
}

function facetTypeToChipType(facetConfig) {
  if (facetConfig.type === 'selectEntity') return 'entity';
  if (facetConfig.type === 'boolean') return 'boolean';
  if (facetConfig.type === 'range' && facetConfig.key === 'publication_year') return 'year';
  if (facetConfig.type === 'range') return 'range';
  return null;
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// --- Custom active chips (from URL, not in defaults) ---
const customActiveChipConfigs = computed(() => {
  const seen = new Set();
  return allUrlFilters.value
    .filter(f => !DEFAULT_KEYS.value.has(f.key))
    .filter(f => {
      if (seen.has(f.key)) return false;
      seen.add(f.key);
      return true;
    })
    .reverse() // most recently added first
    .map(f => chipConfigFromFacetConfig(getFacetConfig(entityType.value, f.key)))
    .filter(Boolean);
});

// --- Default chips split by active/inactive ---
const activeDefaultChips = computed(() =>
  defaultChipConfigs.value.filter(c => activeKeys.value.has(c.key))
);
const inactiveDefaultChips = computed(() =>
  defaultChipConfigs.value.filter(c => !activeKeys.value.has(c.key))
);

// --- Sorted chip list ---
const sortedChipConfigs = computed(() => {
  const configs = [
    ...customActiveChipConfigs.value,
    ...activeDefaultChips.value,
    ...inactiveDefaultChips.value,
  ];

  // Add pending custom chip at the front if not already in the list
  if (pendingCustomKey.value && !configs.some(c => c.key === pendingCustomKey.value)) {
    const fc = getFacetConfig(entityType.value, pendingCustomKey.value);
    const pending = chipConfigFromFacetConfig(fc, true);
    if (pending) configs.unshift(pending);
  }

  return configs;
});

// --- Handle filter selection from dialog ---
function onFilterSelected(key) {
  showDialog.value = false;

  const facetConfig = getFacetConfig(entityType.value, key);
  if (!facetConfig) return;

  if (facetConfig.type === 'boolean') {
    // Immediately apply boolean=true, no menu needed
    url.createFilter(entityType.value, key, true);
  } else if (DEFAULT_KEYS.value.has(key)) {
    // Default chip already on bar — just auto-open its menu
    setTimeout(() => {
      autoOpenKey.value = key;
    }, 300);
  } else {
    // Show pending chip after dialog closes, then auto-open its menu
    // Small delay to let v-dialog close transition complete
    setTimeout(() => {
      pendingCustomKey.value = key;
      autoOpenKey.value = key;
    }, 300);
  }
}
</script>

<style scoped>
.chip-list-move {
  transition: transform 0.3s ease;
}
.chip-list-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.chip-list-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
}
.chip-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.chip-list-leave-to {
  opacity: 0;
}
</style>
