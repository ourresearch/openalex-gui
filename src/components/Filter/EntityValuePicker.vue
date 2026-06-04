<template>
  <!-- Shared value picker for entity-ID filter fields, used by BOTH the novice
       chip (NoviceFilterChip) and the advanced filter row (FilterSelect). It
       merges the user's matching collections inline with the field's entities
       (cross-type collection filter, oxjob #273 redesign): collections show a
       folder icon + "Collection" subtitle, a folder toggle narrows to
       collections-only, every row has a checkbox, and the API's no-mix rule
       (a col_xxx value can't coexist with literal IDs) is shown by symmetric
       disabling. Selection is deferred — nothing is written until Apply. -->
  <v-card class="bg-white d-flex flex-column entity-value-picker" :style="{ maxHeight }">
    <!-- Search + collections-only toggle -->
    <div class="d-flex align-center pl-2 pr-1 pt-1">
      <v-text-field
        v-model="searchString"
        variant="plain"
        density="compact"
        hide-details
        :autofocus="autofocus"
        :placeholder="searchPlaceholder"
        prepend-inner-icon="mdi-magnify"
        class="flex-grow-1"
      />
      <v-tooltip v-if="showCollectionsToggle" location="bottom" :text="toggleTooltip">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :variant="collectionsOnly ? 'flat' : 'text'"
            :color="collectionsOnly ? 'primary' : 'default'"
            :aria-label="toggleTooltip"
            icon
            size="small"
            class="ml-1 flex-shrink-0"
            @click="collectionsOnly = !collectionsOnly"
          >
            <v-icon size="20">{{ collectionsOnly ? 'mdi-folder' : 'mdi-folder-outline' }}</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>
    <v-divider />

    <!-- Merged list: entities first, then collections at the BOTTOM. Collections
         are hidden on open (no search, toggle off) so the user sees the field's
         own values first; they surface only when searched for or via the toggle
         (see displayedCollections). -->
    <div class="overflow-y-auto flex-grow-1" style="min-height: 120px;">
      <v-list density="compact" class="py-0">
        <v-list-item
          v-if="entitiesLoading && !displayedEntities.length && !isCollectionField && !collectionsOnly"
          class="text-center py-3"
        >
          <v-progress-circular indeterminate size="20" width="2" color="grey" />
        </v-list-item>
        <entity-value-row
          v-for="row in displayedEntities"
          :key="'e-' + row.value"
          :display-value="row.displayValue"
          :count="row.count ?? null"
          :hint="row.hint"
          :selected="selectedEntityIds.includes(row.value)"
          :disabled="entitiesDisabled"
          @toggle="toggleEntity(row.value)"
        />
        <!-- Collections at the bottom. They come from the local store, so they
             render independent of the async entity loader (which, in
             collections-only mode, never even runs). -->
        <entity-value-row
          v-for="row in displayedCollections"
          :key="'c-' + row.value"
          :display-value="row.displayValue"
          :count="row.entityCount ?? null"
          is-collection
          :selected="selectedCollectionId === row.value"
          :disabled="collectionsDisabled"
          @toggle="toggleCollection(row.value)"
        />
        <v-list-item
          v-if="!entitiesLoading && !displayedCollections.length && !displayedEntities.length"
          class="text-medium-emphasis text-center py-3"
        >
          {{ emptyText }}
        </v-list-item>
      </v-list>
    </div>

    <v-alert
      v-if="mixNote"
      type="info"
      variant="tonal"
      density="compact"
      class="ma-2 text-body-2"
    >{{ mixNote }}</v-alert>

    <v-divider />
    <div class="d-flex justify-end align-center pa-2 ga-2">
      <v-btn variant="text" size="small" @click="emit('close')">Cancel</v-btn>
      <v-btn variant="flat" color="primary" size="small" @click="applySelections">Apply</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import _ from 'lodash';

import { api } from '@/api';
import { url } from '@/url';
import filters from '@/filters';
import * as openalexId from '@/openalexId';
import { getFacetConfig } from '@/facetConfigUtils';
import { filtersFromUrlStr, createSimpleFilter } from '@/filterConfigs';

import EntityValueRow from '@/components/Filter/EntityValueRow.vue';

defineOptions({ name: 'EntityValuePicker' });

const props = defineProps({
  filterKey: { type: String, required: true },
  // Per-surface entity loader: (searchString) => Promise<row[]>, where each row
  // is { value, displayValue, count?, hint? }. Advanced passes api.getSuggestions;
  // novice passes getGroups (empty) / autocomplete (typing). Not called for the
  // dedicated `collection` field (its list IS collections, loaded below).
  loadEntities: { type: Function, required: true },
  autofocus: { type: Boolean, default: true },
  maxHeight: { type: String, default: '70vh' },
});
const emit = defineEmits(['close']);

const route = useRoute();
const store = useStore();
const entityType = computed(() => store.getters.entityType);
const config = computed(() => getFacetConfig(entityType.value, props.filterKey));

// The dedicated `collection:` field's value list IS collections (single-select),
// so it skips the entity loader and the collections-only toggle.
const isCollectionField = computed(() => props.filterKey === 'collection');

const searchString = ref('');
const entityRows = ref([]);
const entitiesLoading = ref(false);
const allCollections = ref([]);          // search-independent; drives toggle visibility
const collectionsOnly = ref(false);
const selectedEntityIds = ref([]);
const selectedCollectionId = ref(null);  // single-select (radio)
const mixNote = ref('');

const displayedCollections = computed(() => {
  const term = searchString.value.trim().toLowerCase();
  // The dedicated `collection:` field always lists collections (that IS its
  // value set), filtered by the search term.
  if (isCollectionField.value) {
    return term
      ? allCollections.value.filter(c => (c.displayValue || '').toLowerCase().includes(term))
      : allCollections.value;
  }
  // For a regular entity field, hide collections on open: only surface them once
  // the user searches (≥1 char) or flips the collections-only toggle. They're a
  // power-user affordance, so we don't push them in front of the field's own
  // values by default.
  if (collectionsOnly.value) {
    return term
      ? allCollections.value.filter(c => (c.displayValue || '').toLowerCase().includes(term))
      : allCollections.value;
  }
  if (!term) return [];
  return allCollections.value.filter(c => (c.displayValue || '').toLowerCase().includes(term));
});

const displayedEntities = computed(() => {
  if (isCollectionField.value || collectionsOnly.value) return [];
  return entityRows.value;
});

const showCollectionsToggle = computed(() =>
  !isCollectionField.value && allCollections.value.length > 0
);

// No-mix rule made visible: a chosen collection disables the entity rows, and
// any chosen entity disables the collection rows (the API 400s on a col_xxx
// mixed with literal IDs in one clause).
const entitiesDisabled = computed(() => !!selectedCollectionId.value);
const collectionsDisabled = computed(() => selectedEntityIds.value.length > 0);

const entityNamePlural = computed(() =>
  filters.pluralize(config.value?.displayName || 'value', 2)
);
const searchPlaceholder = computed(() =>
  (collectionsOnly.value || isCollectionField.value)
    ? 'Search collections'
    : `Search ${entityNamePlural.value}`
);
const toggleTooltip = computed(() =>
  collectionsOnly.value ? 'Viewing only collections' : 'View collections'
);
const emptyText = computed(() =>
  collectionsOnly.value
    ? 'No collections found'
    : (searchString.value ? 'No results found' : 'No values')
);

// --- selection ---
function toggleCollection(colId) {
  mixNote.value = '';
  selectedCollectionId.value = (selectedCollectionId.value === colId) ? null : colId;
}
function toggleEntity(value) {
  mixNote.value = '';
  const i = selectedEntityIds.value.indexOf(value);
  if (i === -1) selectedEntityIds.value.push(value);
  else selectedEntityIds.value.splice(i, 1);
}

// --- data loading ---
const loadEntitiesDebounced = _.debounce(async () => {
  if (isCollectionField.value) return;
  entitiesLoading.value = true;
  try {
    entityRows.value = await props.loadEntities(searchString.value) || [];
  } catch (e) {
    console.error('EntityValuePicker: loadEntities failed', e);
    entityRows.value = [];
  } finally {
    entitiesLoading.value = false;
  }
}, 250, { leading: true });

watch(searchString, () => { loadEntitiesDebounced(); });

async function loadCollections() {
  try {
    // collectionMatchType handles both the dedicated `collection` field (→ SERP
    // type) and any other selectEntity field (→ its entityToSelect), so this is
    // the single source of truth for which collections a field offers.
    allCollections.value = await api.getCollectionSuggestionsForField(
      entityType.value, props.filterKey, ''
    );
  } catch (e) {
    console.error('EntityValuePicker: loadCollections failed', e);
    allCollections.value = [];
  }
}

function initSelection() {
  selectedEntityIds.value = [];
  selectedCollectionId.value = null;
  const f = filtersFromUrlStr(entityType.value, route.query.filter)
    .find(x => x.key === props.filterKey);
  if (!f || f.value == null) return;
  const vals = String(f.value).split('|').filter(Boolean);
  const col = vals.find(v => openalexId.isCollectionId(v));
  if (col) {
    selectedCollectionId.value = col;
    // Land showing collections so the picked one is visible on reopen.
    if (!isCollectionField.value) collectionsOnly.value = true;
  } else if (isCollectionField.value) {
    selectedCollectionId.value = vals[0] || null;
  } else {
    selectedEntityIds.value = vals;
  }
}

function applySelections() {
  const others = filtersFromUrlStr(entityType.value, route.query.filter)
    .filter(x => x.key !== props.filterKey);
  if (selectedCollectionId.value) {
    // Single col_xxx ref replaces the key (case preserved by createSimpleFilter).
    others.push(createSimpleFilter(entityType.value, props.filterKey, selectedCollectionId.value));
  } else if (selectedEntityIds.value.length) {
    // Pipe-OR within one filter entry (existing behavior).
    others.push(createSimpleFilter(entityType.value, props.filterKey, selectedEntityIds.value.join('|')));
  }
  // If nothing is selected, the field is simply dropped (a valid "clear").
  url.pushNewFilters(others, entityType.value);
  emit('close');
}

onMounted(() => {
  initSelection();
  loadCollections();
  loadEntitiesDebounced();
});
</script>

<style scoped lang="scss">
.entity-value-picker {
  overflow: hidden;
}
</style>
