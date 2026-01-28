<template>
  <div class="discover-results-list">
    <!-- Results header (smaller, closer to results like Google Scholar) -->
    <div class="results-header mb-2">
      <span class="results-count">{{ resultCountText }}</span>
      <div class="results-actions">
        <v-tooltip v-if="apiUrl" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :href="apiUrl"
              target="_blank"
              icon
              variant="text"
              color="grey-darken-1"
            >
              <v-icon>mdi-api</v-icon>
            </v-btn>
          </template>
          View API
        </v-tooltip>
        <v-tooltip v-if="results?.length" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="grey-darken-1"
              @click="downloadCsv"
            >
              <v-icon>mdi-tray-arrow-down</v-icon>
            </v-btn>
          </template>
          Download CSV
        </v-tooltip>
      </div>
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
      <discover-results-item
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

import DiscoverResultsItem from './DiscoverResultsItem.vue';

defineOptions({ name: 'DiscoverResultsList' });

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
  return `${count} best match${count !== 1 ? 'es' : ''}`;
});

function downloadCsv() {
  if (!props.results?.length) return;

  const headers = [
    'id',
    'doi',
    'display_name',
    'publication_year',
    'publication_date',
    'cited_by_count',
    'score',
    'source_display_name',
  ];

  const rows = props.results.map(result => {
    const work = result.work || result;
    const score = result.score ?? '';
    return [
      work.id || '',
      work.doi || '',
      `"${(work.display_name || work.title || '').replace(/"/g, '""')}"`,
      work.publication_year || '',
      work.publication_date || '',
      work.cited_by_count || '',
      score,
      `"${(work.primary_location?.source?.display_name || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `openalex-discover-results-${timestamp}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<style lang="scss" scoped>
.discover-results-list {
  width: 100%;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.results-count {
  font-size: 13px;
  color: #6B7280;
}

.results-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.results-list {
  // No extra padding - items handle their own spacing
}
</style>
