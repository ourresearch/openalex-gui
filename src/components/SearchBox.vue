<template>
  <div class="search-box d-flex align-center" :class="{ 'search-box--focused': isFocused }">
    <!-- Entity selector -->
    <v-menu v-model="entityMenuOpen" location="bottom start">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="entity-btn text-none rounded-0"
          size="small"
        >
          <v-icon size="14" class="mr-1">{{ currentEntityConfig.icon }}</v-icon>
          <span v-if="!smAndDown" class="text-capitalize">{{ currentEntityConfig.displayName }}</span>
          <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="opt in entityOptions"
          :key="opt.name"
          @click="entityType = opt.name"
        >
          <template #prepend>
            <v-icon>{{ opt.icon }}</v-icon>
          </template>
          <v-list-item-title class="text-capitalize">{{ opt.displayName }}</v-list-item-title>
          <v-list-item-subtitle>{{ opt.descr }}</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="entityType === opt.name">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>

    <div class="search-type-divider"></div>

    <!-- Search input -->
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

    <!-- Clear button -->
    <v-btn
      v-if="searchString"
      icon
      variant="text"
      size="x-small"
      class="mr-1"
      @click="clearSearch"
    >
      <v-icon size="14">mdi-close</v-icon>
    </v-btn>

    <!-- Search mode toggle (works only) -->
    <v-menu v-if="entityType === 'works'" v-model="modeMenuOpen" location="bottom end">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="mode-btn text-none rounded-0"
          size="x-small"
        >
          <span class="mode-label">{{ searchMode === 'semantic' ? 'Semantic' : 'Keyword' }}</span>
          <v-icon size="10" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item @click="searchMode = 'keyword'">
          <v-list-item-title>Keyword</v-list-item-title>
          <v-list-item-subtitle>Search by relevance</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="searchMode === 'keyword'">mdi-check</v-icon>
          </template>
        </v-list-item>
        <v-list-item @click="searchMode = 'semantic'">
          <v-list-item-title>Semantic</v-list-item-title>
          <v-list-item-subtitle>AI-powered meaning search</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="searchMode === 'semantic'">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Settings button (keyword mode only, works only) -->
    <v-menu v-if="entityType === 'works' && searchMode === 'keyword'" location="bottom end">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="x-small"
          class="mr-1"
        >
          <v-icon size="14">mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item @click="stemmingDisabled = !stemmingDisabled">
          <v-list-item-title>Disable stemming</v-list-item-title>
          <v-list-item-subtitle>Match exact word forms</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="stemmingDisabled">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Search button -->
    <v-btn
      icon
      variant="text"
      size="x-small"
      class="mr-1"
      @click="submitSearch"
    >
      <v-icon size="14" :color="isFocused ? 'primary' : 'grey'">mdi-magnify</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
defineOptions({ name: 'SearchBox' });

import { ref, computed, watch, onMounted } from 'vue';
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
const searchMode = ref('keyword'); // 'keyword' or 'semantic'
const stemmingDisabled = ref(false);
const isFocused = ref(false);
const entityMenuOpen = ref(false);
const modeMenuOpen = ref(false);

// Entity type: read from route on Serp, store elsewhere; setter navigates to Serp
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

const entityOptions = computed(() => {
  return getEntityConfigs().filter(c => c.hasSerp);
});

const currentEntityConfig = computed(() => {
  return getEntityConfig(entityType.value) || getEntityConfig('works');
});

// Map searchMode + stemmingDisabled → URL search param type
const resolvedSearchType = computed(() => {
  if (searchMode.value === 'semantic') return 'search.semantic';
  if (stemmingDisabled.value) return 'search.exact';
  return 'search';
});

const placeholder = computed(() => {
  if (searchMode.value === 'semantic') return 'Describe what you\'re looking for...';
  return currentEntityConfig.value.placeholder || 'Search OpenAlex';
});

// Force keyword mode when entity is not works
watch(entityType, (val) => {
  if (val !== 'works') {
    searchMode.value = 'keyword';
  }
});

// Populate from URL on mount and route changes
function syncFromRoute() {
  const searchFromRoute = url.getSearchFromRoute(route);
  if (searchFromRoute) {
    searchString.value = searchFromRoute.value;
    // Map URL param type back to searchMode + stemmingDisabled
    if (searchFromRoute.type === 'search.semantic') {
      searchMode.value = 'semantic';
      stemmingDisabled.value = false;
    } else if (searchFromRoute.type === 'search.exact') {
      searchMode.value = 'keyword';
      stemmingDisabled.value = true;
    } else {
      searchMode.value = 'keyword';
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
  display: flex !important;
  align-items: center !important;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  background: white;
  transition: border-color 0.15s ease;
  min-height: 40px;
  max-height: 40px;

  &--focused {
    border-color: #000;
  }
}

.entity-btn {
  border-radius: 8px 0 0 8px !important;
  color: #1A1A1A !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  padding: 0 12px !important;
  height: 38px !important;
  min-width: auto !important;
  white-space: nowrap;

  &:hover {
    background-color: #F5F5F5 !important;
  }
}

.search-type-divider {
  width: 1px;
  height: 20px;
  background-color: #E0E0E0;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  font-size: 14px;
  padding: 8px 12px;
  background: transparent;
  font-family: Inter, sans-serif;
  min-width: 0;

  &::placeholder {
    color: #9CA3AF;
  }
}

.mode-btn {
  color: #9CA3AF !important;
  padding: 0 6px !important;
  height: 24px !important;
  min-width: auto !important;
  white-space: nowrap;
  border-radius: 12px !important;

  &:hover {
    color: #6B6B6B !important;
    background-color: #F5F5F5 !important;
  }
}

.mode-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
