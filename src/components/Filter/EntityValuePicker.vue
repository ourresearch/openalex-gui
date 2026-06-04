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
        @keydown="onSearchKeydown"
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
          v-for="(row, i) in displayedEntities"
          :key="'e-' + row.value"
          :display-value="row.displayValue"
          :count="row.count ?? null"
          :hint="row.hint"
          :selected="selectedEntityIds.includes(row.value)"
          :disabled="entitiesDisabled"
          :highlighted="highlightedIndex === i"
          @toggle="toggleEntity(row.value, row)"
        />
        <!-- Collections blocked: explain why instead of showing them greyed-out
             (#353 F2) — a disabled row with no reason is just confusing. Only
             where collections would otherwise appear (collections view / search),
             not in the default entity list. -->
        <v-list-item v-if="showCollectionsNote" class="py-3">
          <div class="d-flex ga-2 text-medium-emphasis text-body-2" style="white-space: normal;">
            <v-icon size="18" class="flex-shrink-0">mdi-information-outline</v-icon>
            <span>{{ collectionsBlockedText }}</span>
          </div>
        </v-list-item>
        <!-- Collections at the bottom. They come from the local store, so they
             render independent of the async entity loader (which, in
             collections-only mode, never even runs). -->
        <template v-else>
          <entity-value-row
            v-for="(row, j) in displayedCollections"
            :key="'c-' + row.value"
            :display-value="row.displayValue"
            :count="row.entityCount ?? null"
            is-collection
            :entity-label="entityNamePlural"
            :selected="selectedCollectionId === row.value"
            :disabled="collectionsDisabled"
            :highlighted="highlightedIndex === displayedEntities.length + j"
            @toggle="toggleCollection(row.value)"
          />
        </template>
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
    <div class="d-flex justify-space-between align-center pa-2 ga-2">
      <!-- Selected-count, bottom-left: stays accurate even when the selected
           values are scrolled off / filtered out of the visible list (#353 B6). -->
      <span class="text-caption text-medium-emphasis pl-1" style="min-width: 0;">
        {{ selectedCount ? `${selectedCount} selected` : '' }}
      </span>
      <div class="d-flex align-center ga-2">
        <v-btn variant="text" size="small" @click="emit('close')">Cancel</v-btn>
        <v-btn variant="flat" color="primary" size="small" @click="applySelections">Apply</v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
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
  const rows = entityRows.value;
  const selectedSet = new Set(selectedEntityIds.value);
  // While searching, just float any matching selected rows to the top of the
  // results (don't inject non-matching ones — that would be confusing).
  if (searchString.value.trim()) {
    return [
      ...rows.filter(r => selectedSet.has(r.value)),
      ...rows.filter(r => !selectedSet.has(r.value)),
    ];
  }
  // No search: show ALL selected values at the top (#353 B2), in selection
  // order, injecting a resolved row (name + count, #353 F3) for any that aren't
  // in the default top-N list so they stay visible on reopen. Then the rest.
  const byValue = new Map(rows.map(r => [r.value, r]));
  const selectedRows = selectedEntityIds.value.map(id => {
    const loaded = byValue.get(id);
    if (loaded) return loaded;
    const r = resolvedSelected.value[id];
    return { value: id, displayValue: r?.displayValue || id, count: r?.count ?? null };
  });
  return [...selectedRows, ...rows.filter(r => !selectedSet.has(r.value))];
});

// Resolve display name AND contextual count for selected IDs not in the loaded
// rows, so the injected "selected at top" rows (#353 B2) read as names and show
// a count (#353 F3) like every other row. id -> { displayValue, count }.
const resolvedSelected = ref({});
watch(selectedEntityIds, async (ids) => {
  for (const id of ids) {
    if (resolvedSelected.value[id]) continue;
    // Prefer a loaded row (already has name + count).
    const inRows = entityRows.value.find(r => r.value === id);
    if (inRows?.displayValue) {
      resolvedSelected.value[id] = { displayValue: inRows.displayValue, count: inRows.count ?? null };
      continue;
    }
    resolvedSelected.value[id] = { displayValue: id, count: null }; // optimistic
    try {
      // One group_by restricted to this value yields its display name + the
      // count under the current (other) filters.
      const others = filtersFromUrlStr(entityType.value, route.query.filter)
        .filter(f => f.key !== props.filterKey);
      const me = createSimpleFilter(entityType.value, props.filterKey, id);
      const groupRows = await api.getGroups(entityType.value, props.filterKey, {
        filters: [...others, me], hideUnknown: true, perPage: 10,
      });
      const match = groupRows.find(r => String(r.value).toLowerCase() === String(id).toLowerCase())
        || groupRows[0];
      if (match) {
        resolvedSelected.value[id] = { displayValue: match.displayValue || id, count: match.count ?? null };
      }
    } catch { /* keep optimistic fallback */ }
  }
}, { immediate: true, deep: true });

const showCollectionsToggle = computed(() =>
  !isCollectionField.value && allCollections.value.length > 0
);

// No-mix rule made visible: a chosen collection disables the entity rows, and
// any chosen entity disables the collection rows (the API 400s on a col_xxx
// mixed with literal IDs in one clause).
const entitiesDisabled = computed(() => !!selectedCollectionId.value);
const collectionsDisabled = computed(() => selectedEntityIds.value.length > 0);

// Total selected across both kinds (a collection is a single selection). Drives
// the bottom-left "N selected" count (#353 B6).
const selectedCount = computed(() =>
  selectedEntityIds.value.length + (selectedCollectionId.value ? 1 : 0)
);

// The FILTER's entity (e.g. "institution"/"institutions"), not the page entity
// (store.getters.entityType is "works" on a /works SERP). A collection used as a
// value here is a collection OF the filter's entity, so its labels read off this.
const entityNameSingular = computed(() => config.value?.displayName || 'value');
const entityNamePlural = computed(() =>
  filters.pluralize(entityNameSingular.value, 2)
);
// Placeholders rely on the magnifying-glass icon to signal "search" (no "Search"
// prefix): entity mode → "Institutions"; collections-only → "Institution Collections".
const searchPlaceholder = computed(() => {
  if (isCollectionField.value) return 'Collections';
  return collectionsOnly.value
    ? `${filters.capitalize(entityNameSingular.value)} Collections`
    : filters.capitalize(entityNamePlural.value);
});
const toggleTooltip = computed(() =>
  collectionsOnly.value ? 'Viewing only collections' : 'View collections'
);
// Shown when collections are disabled because individual values are already
// picked (#353 F2) — plain-language reason, not a greyed-out mystery.
const collectionsBlockedText = computed(() => {
  const plural = entityNamePlural.value.toLowerCase();
  return `You can't combine a collection with individual ${plural}. Clear your selected ${plural} to filter by a collection instead.`;
});
// Show the explainer only where collections would otherwise render (collections
// view or while searching), not in the default entity list.
const showCollectionsNote = computed(() =>
  collectionsDisabled.value && (collectionsOnly.value || !!searchString.value.trim())
);
const emptyText = computed(() =>
  collectionsOnly.value
    ? 'No collections found'
    : (searchString.value ? 'No results found' : 'No values')
);

// --- keyboard navigation (#353 B5) ---
// Arrow keys move a highlight through the visible rows (entities then
// collections); Enter toggles the highlighted row. The list is click-only
// otherwise.
const highlightedIndex = ref(-1);
const navItems = computed(() => [
  ...displayedEntities.value.map(r => ({ kind: 'entity', value: r.value, row: r })),
  // Collections are replaced by an explainer note when disabled (#353 F2), so
  // they're not keyboard-navigable then.
  ...(collectionsDisabled.value ? [] : displayedCollections.value.map(r => ({ kind: 'collection', value: r.value }))),
]);

// Results changed (typing, selecting) → drop the highlight so the next ArrowDown
// starts from the top.
watch(navItems, () => { highlightedIndex.value = -1; });

function scrollHighlightedIntoView() {
  nextTick(() => {
    document
      .querySelector('.entity-value-picker .entity-row-highlighted')
      ?.scrollIntoView({ block: 'nearest' });
  });
}

function onSearchKeydown(e) {
  // Cmd/Ctrl+Enter applies, same as the Apply button (#353 F1).
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    applySelections();
    return;
  }
  const n = navItems.value.length;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!n) return;
    highlightedIndex.value = (highlightedIndex.value + 1) % n;
    scrollHighlightedIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!n) return;
    highlightedIndex.value = (highlightedIndex.value - 1 + n) % n;
    scrollHighlightedIntoView();
  } else if (e.key === 'Enter') {
    const item = navItems.value[highlightedIndex.value];
    if (!item) return;
    e.preventDefault();
    if (item.kind === 'entity') {
      if (!entitiesDisabled.value) toggleEntity(item.value, item.row);
    } else if (!collectionsDisabled.value) {
      toggleCollection(item.value);
    }
  }
}

// --- selection ---
function toggleCollection(colId) {
  mixNote.value = '';
  selectedCollectionId.value = (selectedCollectionId.value === colId) ? null : colId;
}
function toggleEntity(value, row = null) {
  mixNote.value = '';
  // Cache the clicked row's name + count so it keeps its count when it floats
  // to the top / is injected after the search is cleared (#353 F3).
  if (row && !resolvedSelected.value[value]) {
    resolvedSelected.value[value] = { displayValue: row.displayValue, count: row.count ?? null };
  }
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
