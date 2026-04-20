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
import { useStore } from 'vuex';
import { url } from '@/url';
import { facetConfigs } from '@/facetConfigs';

defineOptions({ name: 'NoviceSortButton' });

const route = useRoute();
const store = useStore();

const entityType = computed(() => store.getters.entityType);
const selectedSort = computed(() => url.getSort(route));

// Entity-specific sort options. If an entry is present here, it overrides
// the facetConfigs-driven defaults so we can control label + set for a page.
const entitySortOverrides = {
  awards: [
    { key: 'start_year', displayName: 'Start year' },
    { key: 'funded_outputs_count', displayName: 'Funded outputs' },
    { key: 'amount', displayName: 'Amount' },
  ],
};

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

const sortOptions = computed(() => {
  const opts = [];
  if (url.isSearchFilterApplied(route)) {
    opts.push({ key: 'relevance_score', displayName: 'Relevance' });
  }

  const override = entitySortOverrides[entityType.value];
  if (override) {
    opts.push(...override);
    return opts;
  }

  // Default: pull sort-popular options from facetConfigs for this entity
  const fromConfigs = facetConfigs(entityType.value)
    .filter(c => c.actionsPopular?.includes('sort'))
    .map(c => ({ key: c.key, displayName: titleCase(c.displayName) }));

  if (fromConfigs.length) {
    opts.push(...fromConfigs);
  } else {
    // Fallback for works (and anything that didn't yield configs)
    opts.push({ key: 'cited_by_count', displayName: 'Citation count' });
    opts.push({ key: 'publication_year', displayName: 'Date' });
  }

  return opts;
});
</script>
