<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon variant="text" size="small">
        <v-icon color="grey-darken-1">mdi-sort-ascending</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-subheader>Sort by:</v-list-subheader>
      <v-divider />
      <v-list-item
        v-for="option in sortOptions"
        :key="option.key"
        @click="url.setSort(option.key)"
      >
        <v-list-item-title>{{ option.displayName }}</v-list-item-title>
        <template #append>
          <v-icon v-if="selectedSort === option.key">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { url } from '@/url';

defineOptions({ name: 'NoviceSortButton' });

const route = useRoute();

const selectedSort = computed(() => url.getSort(route));

const sortOptions = computed(() => {
  const opts = [];
  if (url.isSearchFilterApplied(route)) {
    opts.push({ key: 'relevance_score', displayName: 'Relevance' });
  }
  opts.push({ key: 'cited_by_count', displayName: 'Citation count' });
  opts.push({ key: 'publication_year', displayName: 'Date' });
  return opts;
});
</script>
