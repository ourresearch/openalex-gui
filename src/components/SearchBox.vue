<template>
  <div class="search-box" :class="{ 'search-box--focused': isFocused }">
    <!-- Row 1: Input + clear -->
    <div class="search-row-1 d-flex align-center">
      <input
        ref="inputRef"
        v-model="searchString"
        class="search-input flex-grow-1"
        :placeholder="placeholder"
        :autofocus="autofocus"
        @keyup.enter="submitSearch"
        @focus="isFocused = true"
        @blur="isFocused = false"
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

    <!-- Divider -->
    <div class="search-divider"></div>

    <!-- Row 2: Fields (left) | spacer | Mode (right) | settings (far right) -->
    <div class="search-row-2 d-flex align-center">
      <!-- Fields selector -->
      <v-menu v-model="fieldMenuOpen" location="bottom start">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="control-btn text-none"
            size="small"
            :disabled="searchMode === 'semantic'"
          >
            <span class="control-label">{{ currentFieldOption.label }}</span>
            <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="opt in fieldOptions"
            :key="opt.value"
            @click="setField(opt.value)"
          >
            <v-list-item-title>{{ opt.label }}</v-list-item-title>
            <template #append>
              <v-icon v-if="searchField === opt.value">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer />

      <!-- Mode selector -->
      <v-menu v-model="modeMenuOpen" location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="control-btn text-none"
            size="small"
          >
            <span class="control-label">{{ searchMode === 'semantic' ? 'Semantic' : 'Boolean' }}</span>
            <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="setMode('term')">
            <v-list-item-title>Boolean</v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">Traditional keyword-based search with operators</v-list-item-subtitle>
            <template #append>
              <v-icon v-if="searchMode === 'term'">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="setMode('semantic')">
            <v-list-item-title class="d-flex align-center">
              Semantic
              <v-chip size="x-small" class="ml-2" color="grey-darken-1" variant="tonal">beta</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">AI-powered meaning search</v-list-item-subtitle>
            <template #append>
              <v-icon v-if="searchMode === 'semantic'">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Stemming: chip (when disabled) + ellipsis menu (always visible) -->
      <v-chip
        v-if="stemmingDisabled && searchMode === 'term'"
        closable
        size="x-small"
        class="ml-1"
        @click:close="disableStemming(false)"
      >
        no stemming
      </v-chip>
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            size="small"
            class="ml-1"
            :disabled="searchMode === 'semantic'"
          >
            <v-icon size="16">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="disableStemming(!stemmingDisabled)">
            <v-list-item-title>Disable stemming</v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">Disable automatic stemming (eg "looking" ≠ "look")</v-list-item-subtitle>
            <template #append>
              <v-icon v-if="stemmingDisabled">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SearchBox' });

import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import { getEntityConfig, getEntityConfigs } from '@/entityConfigs';
import { url } from '@/url';

const props = defineProps({
  autofocus: Boolean,
  showExamples: Boolean,
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();

const inputRef = ref(null);
const searchString = ref('');
const searchMode = ref('term'); // 'term' or 'semantic'
const searchField = ref('title_and_abstract'); // 'all' | 'title' | 'title_and_abstract'
const stemmingDisabled = ref(false);
const isFocused = ref(false);
const fieldMenuOpen = ref(false);
const modeMenuOpen = ref(false);

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

// Field options
const fieldOptions = [
  { value: 'all', label: 'Title, abstract, & full text' },
  { value: 'title_and_abstract', label: 'Title & abstract' },
  { value: 'title', label: 'Title only' },
];

const currentFieldOption = computed(() => {
  return fieldOptions.find(o => o.value === searchField.value) || fieldOptions[0];
});

// Map searchMode + searchField + stemmingDisabled → URL search param type
const resolvedSearchType = computed(() => {
  if (searchMode.value === 'semantic') return 'search.semantic';

  const fieldMap = {
    all: stemmingDisabled.value ? 'search.exact' : 'search',
    title: stemmingDisabled.value ? 'search.title.exact' : 'search.title',
    title_and_abstract: stemmingDisabled.value ? 'search.title_and_abstract.exact' : 'search.title_and_abstract',
  };
  return fieldMap[searchField.value] || 'search';
});

const placeholder = computed(() => {
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

// Populate from URL on mount and route changes
function syncFromRoute() {
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
watch(() => route.fullPath, syncFromRoute);

function submitSearch() {
  if (!searchString.value && !props.showExamples) return;

  if (!searchString.value) {
    url.pushToRoute(router, { name: 'Serp', params: { entityType: entityType.value } });
    return;
  }

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
</style>
