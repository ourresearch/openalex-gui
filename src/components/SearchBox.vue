<template>
  <div class="search-box d-flex align-center" :class="{ 'search-box--focused': isFocused }">
    <!-- Search type dropdown -->
    <v-menu v-model="menuOpen" location="bottom start">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="search-type-btn text-none rounded-0"
          size="small"
        >
          <v-icon size="14" class="mr-1">{{ searchTypeIcon }}</v-icon>
          {{ searchTypeLabel }}
          <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="opt in searchTypes"
          :key="opt.value"
          @click="searchType = opt.value"
        >
          <template #prepend>
            <v-icon>{{ opt.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ opt.label }}</v-list-item-title>
          <v-list-item-subtitle>{{ opt.description }}</v-list-item-subtitle>
          <template #append>
            <v-icon v-if="searchType === opt.value">mdi-check</v-icon>
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
import { url } from '@/url';

const props = defineProps({
  autofocus: Boolean,
  showExamples: Boolean,
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const inputRef = ref(null);
const searchString = ref('');
const searchType = ref('search');
const isFocused = ref(false);
const menuOpen = ref(false);

const searchTypes = [
  { value: 'search', label: 'Keyword', icon: 'mdi-magnify', description: 'Search by relevance' },
  { value: 'search.exact', label: 'Exact', icon: 'mdi-format-quote-close', description: 'Exact phrase match' },
  { value: 'search.semantic', label: 'Semantic', icon: 'mdi-brain', description: 'AI-powered meaning search' },
];

const entityType = computed(() => store.getters.entityType);

const searchTypeLabel = computed(() =>
  searchTypes.find(t => t.value === searchType.value)?.label ?? 'Keyword'
);

const searchTypeIcon = computed(() =>
  searchTypes.find(t => t.value === searchType.value)?.icon ?? 'mdi-magnify'
);

const placeholder = computed(() => {
  if (searchType.value === 'search.semantic') return 'Describe what you\'re looking for...';
  if (searchType.value === 'search.exact') return 'Enter exact phrase...';
  return 'Search OpenAlex';
});

// Populate from URL on mount and route changes
function syncFromRoute() {
  const searchFromRoute = url.getSearchFromRoute(route);
  if (searchFromRoute) {
    searchType.value = searchFromRoute.type;
    searchString.value = searchFromRoute.value;
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

  url.setNewSearch(entityType.value, searchType.value, searchString.value);
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
  min-height: 36px;
  max-height: 36px;

  &--focused {
    border-color: #000;
  }
}

.search-type-btn {
  border-radius: 8px 0 0 8px !important;
  color: #6B6B6B !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 0 10px !important;
  height: 34px !important;
  min-width: auto !important;
  white-space: nowrap;

  &:hover {
    color: #1A1A1A !important;
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
  padding: 6px 12px;
  background: transparent;
  font-family: Inter, sans-serif;
  min-width: 0;

  &::placeholder {
    color: #9CA3AF;
  }
}
</style>
