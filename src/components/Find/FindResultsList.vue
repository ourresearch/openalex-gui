<template>
  <div class="find-results-list">
    <!-- Results header (smaller, closer to results like Google Scholar) -->
    <div class="results-header mb-2">
      <span class="results-count">{{ resultCountText }}</span>
      <v-tooltip v-if="apiUrl" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :href="apiUrl"
            target="_blank"
            icon
            variant="text"
            size="small"
            color="grey-darken-1"
          >
            <v-icon size="small">mdi-api</v-icon>
          </v-btn>
        </template>
        View API
      </v-tooltip>
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <v-skeleton-loader
        v-for="i in 5"
        :key="i"
        type="list-item-three-line"
        class="mb-2"
      />
    </div>

    <!-- Results -->
    <div v-else-if="results?.length" class="results-list">
      <find-results-item
        v-for="(result, index) in results"
        :key="result.work?.id || index"
        :result="result"
      />
    </div>

    <!-- No Results -->
    <div v-else class="pa-6 text-center text-grey">
      <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-file-search-outline</v-icon>
      <div>No results found for this search.</div>
      <div class="text-caption mt-1">Try a different query or adjust your filters.</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import FindResultsItem from './FindResultsItem.vue';

defineOptions({ name: 'FindResultsList' });

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  apiUrl: {
    type: String,
    default: '',
  },
});

const resultCountText = computed(() => {
  if (props.loading) return '';
  const count = props.results?.length || 0;
  return `${count} result${count !== 1 ? 's' : ''}`;
});
</script>

<style lang="scss" scoped>
.find-results-list {
  width: 100%;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-count {
  font-size: 13px;
  color: #6B7280;
}

.results-list {
  // No extra padding - items handle their own spacing
}
</style>
