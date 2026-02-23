<template>
  <div class="search-box" :class="{ 'search-box--focused': isFocused }" ref="searchBoxRef">
    <!-- Row 1: Input + clear -->
    <div class="search-row-1 d-flex align-center">
      <input
        ref="inputRef"
        v-model="searchString"
        class="search-input flex-grow-1"
        :placeholder="placeholder"
        :autofocus="autofocus"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.escape="onEscape"
        @input="isUserTyping = true"
        @focus="onFocus"
        @blur="onBlur"
        autocomplete="off"
      />
      <v-btn
        v-if="searchString"
        icon
        variant="text"
        size="small"
        class="mr-2"
        @click="clearSearch"
      >
        <v-icon size="16">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Autocomplete dropdown -->
    <div v-if="showDropdown" class="autocomplete-dropdown">
      <div class="autocomplete-list">
        <div
          v-for="(item, index) in suggestions"
          :key="item.id + '-' + item._acType"
          class="autocomplete-item d-flex align-center"
          :class="{ 'autocomplete-item--highlighted': index === highlightedIndex }"
          @mousedown.prevent="selectSuggestion(item)"
          @mouseenter="highlightedIndex = index"
        >
          <v-icon size="16" class="autocomplete-item-icon">{{ item._icon }}</v-icon>
          <div class="autocomplete-item-name">{{ item.display_name }}</div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div v-if="showRow2" class="search-divider"></div>

    <!-- Row 2: Entity selector (left) | spacer | Combined menu (right) | Xpac toggle (far right) -->
    <div v-if="showRow2" class="search-row-2 d-flex align-center">
      <entity-selector-button />

      <v-spacer />

      <template v-if="isWorksEntity">
        <!-- Search options menu (fields + stemming) — hidden when semantic -->
        <v-menu v-if="searchMode !== 'semantic'" v-model="optionsMenuOpen" location="bottom end" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              size="small"
              class="control-btn"
            >
              <v-icon size="18">mdi-tune-variant</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="280">
            <v-list-subheader>Search fields</v-list-subheader>

            <v-list-item @click="setField('title'); optionsMenuOpen = false">
              <v-list-item-title>Title</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="setField('title_and_abstract'); optionsMenuOpen = false">
              <v-list-item-title>Title & abstract</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title_and_abstract'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="setField('all'); optionsMenuOpen = false">
              <v-list-item-title>Title, abstract, & fulltext</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'all'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-divider class="my-1" />

            <v-list-subheader>Stemming</v-list-subheader>

            <v-list-item @click="disableStemming(false)">
              <v-list-item-title>Enable stemming</v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">looking = look, looker, etc</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="!stemmingDisabled" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="disableStemming(true)">
              <v-list-item-title>Disable stemming</v-list-item-title>
              <template #append>
                <v-icon v-if="stemmingDisabled" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Search strategy menu (only when noviceMode enables semantic search) -->
        <v-menu v-if="noviceMode" v-model="strategyMenuOpen" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              class="control-btn text-none ml-1"
              size="small"
            >
              <span class="control-label">{{ searchMode === 'semantic' ? 'semantic' : 'boolean' }}</span>
              <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="setMode('term')">
              <v-list-item-title>Boolean</v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">Keyword search with operators</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="searchMode === 'term'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="setMode('semantic')">
              <v-list-item-title class="d-flex align-center">
                Semantic
                <v-chip size="x-small" class="ml-2" color="grey-darken-1" variant="tonal">beta</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">AI-powered meaning search</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="searchMode === 'semantic'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Xpac toggle -->
        <v-tooltip location="bottom" max-width="300">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :variant="isXpacEnabled ? 'flat' : 'text'"
              :color="isXpacEnabled ? '#374151' : undefined"
              class="text-none ml-1"
              :class="{ 'control-btn': !isXpacEnabled }"
              size="small"
              rounded
              @click="toggleXpac"
            >
              <span class="control-label" :style="isXpacEnabled ? 'color: white' : ''">xpac</span>
            </v-btn>
          </template>
          <span>Include 'expansion pack' works. Better coverage (192M new works from DataCite and repositories), but data quality is lower.</span>
        </v-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SearchBox' });

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import { debounce } from 'lodash';
import { getEntityConfig, getEntityConfigs } from '@/entityConfigs';
import { api } from '@/api';
import { createSimpleFilter, filtersFromUrlStr } from '@/filterConfigs';
import { url } from '@/url';
import EntitySelectorButton from '@/components/EntitySelectorButton.vue';

const props = defineProps({
  autofocus: Boolean,
  showExamples: Boolean,
});

// --- Identifier extraction helpers ---

function extractDoi(str) {
  if (!str) return null;
  const trimmed = str.trim();

  // URL form: https://doi.org/10.xxx or https://dx.doi.org/10.xxx (http too)
  const urlMatch = trimmed.match(/^https?:\/\/(?:dx\.)?doi\.org\/(10\..+)$/i);
  if (urlMatch) return `https://doi.org/${urlMatch[1]}`;

  // Labeled form: "DOI: 10.xxx" or "doi:10.xxx"
  const labelMatch = trimmed.match(/^doi:\s*(10\..+)$/i);
  if (labelMatch) return `https://doi.org/${labelMatch[1]}`;

  // Bare DOI: starts with 10. and contains a slash
  if (/^10\.\d{4,}/.test(trimmed) && trimmed.includes('/')) {
    return `https://doi.org/${trimmed}`;
  }

  return null;
}

function extractOrcid(str) {
  if (!str) return null;
  const trimmed = str.trim();
  const orcidDigits = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i;

  // URL form: https://orcid.org/0000-...
  const urlMatch = trimmed.match(/^https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (urlMatch) return `https://orcid.org/${urlMatch[1].toUpperCase()}`;

  // Labeled form: "ORCID: 0000-..." or "orcid:0000-..."
  const labelMatch = trimmed.match(/^orcid:\s*(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (labelMatch) return `https://orcid.org/${labelMatch[1].toUpperCase()}`;

  // Bare ORCID: exactly the 4-4-4-4 pattern
  const bareMatch = trimmed.match(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (bareMatch) return `https://orcid.org/${bareMatch[1].toUpperCase()}`;

  return null;
}

async function tryIdentifierLookup() {
  const input = searchString.value;

  const doi = extractDoi(input);
  if (doi) {
    try {
      const resp = await api.get('/works', { filter: `doi:${doi}`, per_page: 1, select: 'id' });
      if (resp.results && resp.results.length > 0) {
        const entityId = resp.results[0].id?.replace('https://openalex.org/', '') || resp.results[0].id;
        searchString.value = '';
        dismissDropdown();
        router.push({ name: 'EntityPage', params: { entityType: 'works', entityId } });
        return true;
      }
    } catch (e) {
      // DOI not found or API error — fall through to regular search
    }
    return false;
  }

  const orcid = extractOrcid(input);
  if (orcid) {
    try {
      const resp = await api.get('/authors', { filter: `orcid:${orcid}`, per_page: 1, select: 'id' });
      if (resp.results && resp.results.length > 0) {
        searchString.value = '';
        dismissDropdown();
        const currentFilters = filtersFromUrlStr('works', route.query.filter);
        const newFilter = createSimpleFilter('works', 'authorships.author.id', resp.results[0].id);
        url.pushNewFilters([...currentFilters, newFilter], 'works');
        return true;
      }
    } catch (e) {
      // ORCID not found or API error — fall through to regular search
    }
    return false;
  }

  return false;
}

const store = useStore();
const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();

const inputRef = ref(null);
const searchBoxRef = ref(null);
const searchString = ref('');
const searchMode = ref('term'); // 'term' or 'semantic'
const searchField = ref('title_and_abstract'); // 'all' | 'title' | 'title_and_abstract'
const stemmingDisabled = ref(false);
const isFocused = ref(false);
const strategyMenuOpen = ref(false);
const optionsMenuOpen = ref(false);

// Autocomplete state
const suggestions = ref([]);
const highlightedIndex = ref(-1);
const dropdownOpen = ref(false);
const isUserTyping = ref(false);
const showDropdown = computed(() => dropdownOpen.value && suggestions.value.length > 0);
const noviceMode = computed(() => store.getters.featureFlags.noviceMode);
const aliceFeatures = computed(() => store.getters.featureFlags.aliceFeatures);
const showRow2 = computed(() => aliceFeatures.value || noviceMode.value);
const isWorksEntity = computed(() => entityType.value === 'works');

// Entity type: read from route on Serp, store elsewhere
const entityType = computed({
  get() {
    if (route.name === 'Serp' && route.params.entityType) {
      return route.params.entityType;
    }
    return store.state.entityType;
  },
  set(to) {
    url.pushToRoute(router, {
      name: 'Serp',
      params: { entityType: to },
    });
  },
});

// Xpac toggle (route query driven)
const isXpacEnabled = computed(() => route.query.include_xpac === 'true');

function toggleXpac() {
  const newQuery = { ...route.query };
  if (isXpacEnabled.value) {
    delete newQuery.include_xpac;
  } else {
    newQuery.include_xpac = 'true';
  }
  url.pushToRoute(router, {
    name: route.name,
    params: route.params,
    query: newQuery,
  });
}

// Map searchMode + searchField + stemmingDisabled → URL search param type
const resolvedSearchType = computed(() => {
  if (!isWorksEntity.value) return 'search';
  if (searchMode.value === 'semantic') return 'search.semantic';

  const fieldMap = {
    all: stemmingDisabled.value ? 'search.exact' : 'search',
    title: stemmingDisabled.value ? 'search.title.exact' : 'search.title',
    title_and_abstract: stemmingDisabled.value ? 'search.title_and_abstract.exact' : 'search.title_and_abstract',
  };
  return fieldMap[searchField.value] || 'search';
});

const placeholder = computed(() => {
  if (!isWorksEntity.value) {
    const config = getEntityConfig(entityType.value);
    return config?.placeholder || `Search ${entityType.value}`;
  }
  return 'Search 480M scholarly works';
});

// When switching to semantic, force field and stemming
watch(searchMode, (val) => {
  if (val === 'semantic') {
    searchField.value = 'title_and_abstract';
    stemmingDisabled.value = false;
  }
});

// Menu actions that auto-submit when there's a search term
function setField(value) {
  searchField.value = value;
  submitIfHasSearch();
}

function setMode(value) {
  searchMode.value = value;
  nextTick(() => submitIfHasSearch());
}

function disableStemming(value) {
  stemmingDisabled.value = value;
  nextTick(() => submitIfHasSearch());
}

function submitIfHasSearch() {
  if (searchString.value) {
    nextTick(() => submitSearch());
  }
}

// Autocomplete
let fetchId = 0;

function entityIcon(type) {
  return getEntityConfig(type)?.icon || 'mdi-tag-outline';
}

function countCompleteWords(str) {
  // A "complete word" is a word followed by whitespace or another word.
  // "machine learning" = 1 complete word, "machine learning " = 2, "machine learning m" = 2
  const trimmed = str.trimStart();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/);
  // If string ends with whitespace, all words are complete
  if (/\s$/.test(str)) return words.length;
  // Otherwise the last word is incomplete, so complete = total - 1
  return Math.max(0, words.length - 1);
}

function latinize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function authorNameMatchesQuery(displayName, query) {
  // At least one query word must appear fully in the display_name (latinized, lowercased)
  const nameNorm = latinize(displayName || '').toLowerCase();
  const queryWords = latinize(query).toLowerCase().split(/\s+/).filter(Boolean);
  return queryWords.some(word => nameNorm.includes(word));
}

function dedupeByName(items) {
  const map = new Map();
  for (const item of items) {
    const key = (item.display_name || '').toLowerCase();
    const existing = map.get(key);
    if (!existing || (item.works_count || 0) > (existing.works_count || 0)) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

function topByWorksCount(items, n) {
  return [...items].sort((a, b) => (b.works_count || 0) - (a.works_count || 0)).slice(0, n);
}

async function searchEntities(entityType, query) {
  // Use the search endpoint for full-text matching (not just prefix).
  // Fetch extra results so we can filter/re-rank client-side by works_count.
  const resp = await api.get(`/${entityType}`, {
    search: query,
    per_page: 10,
    select: 'id,display_name,works_count',
  });
  return resp.results || [];
}

async function fetchSuggestions(query) {
  if (!query || query.length === 0) {
    suggestions.value = [];
    dropdownOpen.value = false;
    return;
  }
  const id = ++fetchId;
  const currentEntity = entityType.value;
  const config = getEntityConfig(currentEntity);

  const tag = (items, type) =>
    dedupeByName(items || []).map(item => ({
      ...item,
      _acType: type,
      _icon: entityIcon(type),
    }));

  if (currentEntity === 'works') {
    // Works SERP: suggest authors, institutions, keywords (as filters) + work titles
    const calls = [
      searchEntities('authors', query),
      searchEntities('institutions', query),
      api.getAutocomplete('keywords', { q: query }),
    ];
    const includeWorks = countCompleteWords(query) >= 3;
    if (includeWorks) {
      calls.push(api.getAutocomplete('works', { q: query }));
    }

    const settled = await Promise.allSettled(calls);
    if (id !== fetchId) return;

    let authors = settled[0].status === 'fulfilled' ? tag(settled[0].value, 'authors') : [];
    authors = authors.filter(a => authorNameMatchesQuery(a.display_name, query));
    let institutions = settled[1].status === 'fulfilled' ? tag(settled[1].value, 'institutions') : [];
    let keywords = settled[2].status === 'fulfilled' ? tag(settled[2].value, 'keywords') : [];
    let works = includeWorks && settled[3].status === 'fulfilled' ? tag(settled[3].value, 'works') : [];

    suggestions.value = topByWorksCount([...authors, ...institutions, ...keywords, ...works], 5);
  } else if (!config?.hasAutocomplete) {
    // No autocomplete for this entity type
    suggestions.value = [];
    dropdownOpen.value = false;
    return;
  } else if (config?.isNative) {
    // Native entities (authors, institutions, sources, publishers, funders, etc.)
    const results = await searchEntities(currentEntity, query);
    if (id !== fetchId) return;
    let items = tag(results, currentEntity);
    if (currentEntity === 'authors') {
      items = items.filter(a => authorNameMatchesQuery(a.display_name, query));
    }
    suggestions.value = topByWorksCount(items, 5);
  } else {
    // Non-native entities with autocomplete (keywords, topics, subfields, etc.)
    const results = await api.getAutocomplete(currentEntity, { q: query });
    if (id !== fetchId) return;
    suggestions.value = tag(results || [], currentEntity).slice(0, 5);
  }

  highlightedIndex.value = -1;
  dropdownOpen.value = suggestions.value.length > 0;
}

const debouncedFetch = debounce(fetchSuggestions, 200);

watch(searchString, (val) => {
  if (!isUserTyping.value) return;
  if (val) {
    debouncedFetch(val);
  } else {
    debouncedFetch.cancel();
    suggestions.value = [];
    dropdownOpen.value = false;
  }
});

function dismissDropdown() {
  dropdownOpen.value = false;
  highlightedIndex.value = -1;
}

function selectSuggestion(item) {
  isUserTyping.value = false;
  dismissDropdown();
  searchString.value = '';

  if (entityType.value === 'works' && item._acType !== 'works') {
    // Works SERP: author/institution/keyword click → add as filter
    const filterKey = getEntityConfig(item._acType)?.filterKey;
    const currentFilters = filtersFromUrlStr('works', route.query.filter);
    const newFilter = createSimpleFilter('works', filterKey, item.id);
    url.pushNewFilters([...currentFilters, newFilter], 'works');
  } else {
    // Navigate to entity page (work titles on works SERP, or any entity on its own SERP)
    const entityId = item.id?.replace('https://openalex.org/', '') || item.id;
    router.push({ name: 'EntityPage', params: { entityType: item._acType, entityId } });
  }
}

function onEnter() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    selectSuggestion(suggestions.value[highlightedIndex.value]);
  } else {
    dismissDropdown();
    submitSearch();
  }
}

function onArrowDown() {
  if (!showDropdown.value) return;
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1);
}

function onArrowUp() {
  if (!showDropdown.value) return;
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
}

function onEscape() {
  if (showDropdown.value) {
    dismissDropdown();
  }
}

function onFocus() {
  isFocused.value = true;
  if (suggestions.value.length > 0 && searchString.value) {
    dropdownOpen.value = true;
  }
}

function onBlur() {
  isFocused.value = false;
  dismissDropdown();
}

onBeforeUnmount(() => {
  debouncedFetch.cancel();
});

// Populate from URL on mount and route changes
function syncFromRoute() {
  isUserTyping.value = false;
  const searchFromRoute = url.getSearchFromRoute(route);
  if (searchFromRoute) {
    searchString.value = searchFromRoute.value;
    const type = searchFromRoute.type;

    if (type === 'search.semantic') {
      searchMode.value = 'semantic';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = false;
    } else if (type === 'search.title.exact') {
      searchMode.value = 'term';
      searchField.value = 'title';
      stemmingDisabled.value = true;
    } else if (type === 'search.title') {
      searchMode.value = 'term';
      searchField.value = 'title';
      stemmingDisabled.value = false;
    } else if (type === 'search.title_and_abstract.exact') {
      searchMode.value = 'term';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = true;
    } else if (type === 'search.title_and_abstract') {
      searchMode.value = 'term';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = false;
    } else if (type === 'search.exact') {
      searchMode.value = 'term';
      searchField.value = 'all';
      stemmingDisabled.value = true;
    } else {
      // 'search' (default)
      searchMode.value = 'term';
      searchField.value = 'all';
      stemmingDisabled.value = false;
    }
  } else {
    searchString.value = '';
  }
}

onMounted(syncFromRoute);
watch(() => route.fullPath, () => {
  dismissDropdown();
  syncFromRoute();
});

async function submitSearch() {
  if (!searchString.value && !props.showExamples) return;

  if (!searchString.value) {
    url.pushToRoute(router, { name: 'Serp', params: { entityType: entityType.value } });
    return;
  }

  // Intercept DOI/ORCID before regular search
  const handled = await tryIdentifierLookup();
  if (handled) return;

  url.setNewSearch(entityType.value, resolvedSearchType.value, searchString.value);
}

function clearSearch() {
  searchString.value = '';
  url.clearNewSearch();
  inputRef.value?.focus();
}
</script>

<style lang="scss" scoped>
.search-box {
  position: relative;
  border: 1px solid #E0E0E0;
  border-radius: 16px;
  background: white;
  transition: border-color 0.15s ease;

  &--focused {
    border-color: #000;
  }
}

.search-row-1 {
  min-height: 52px;
}

.search-divider {
  height: 1px;
  background-color: #F0F0F0;
  margin: 0 16px;
}

.search-row-2 {
  min-height: 40px;
  padding: 4px 8px;
}

.search-input {
  border: none;
  outline: none;
  font-size: 16px;
  padding: 14px 18px;
  background: transparent;
  font-family: Inter, sans-serif;
  min-width: 0;

  &::placeholder {
    color: #9CA3AF;
  }
}

.control-btn {
  color: #6B7280 !important;

  &:hover {
    color: #374151 !important;
  }
}

.control-label {
  font-size: 13px;
  font-weight: 500;
}

.menu-subtitle {
  font-size: 12px !important;
  color: #4B5563 !important;
}

.check-icon {
  color: #1a1a1a !important;
  font-weight: 900;
}

.autocomplete-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
}

.autocomplete-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 0;
}

.autocomplete-item {
  padding: 8px 18px;
  cursor: pointer;
  transition: background-color 0.1s ease;

  &--highlighted {
    background-color: #F3F4F6;
  }
}

.autocomplete-item-icon {
  color: #9CA3AF;
  flex-shrink: 0;
  margin-right: 10px;
}

.autocomplete-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
}

</style>
