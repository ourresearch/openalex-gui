<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <!-- Labeled variant (flag-on results header, #440 r5): shows WHAT we're
           sorting by; the icon carries the direction. Default (icon-only) is the
           flag-off / builder rendering, unchanged. -->
      <v-btn
        v-if="showLabel"
        v-bind="props"
        variant="text"
        size="small"
        class="text-none sort-label-btn"
      >
        <v-icon start size="18" color="grey-darken-1">{{ directionIcon }}</v-icon>
        <span class="text-body-2 text-medium-emphasis">{{ currentSortLabel }}</span>
      </v-btn>
      <v-btn v-else v-bind="props" icon variant="text" size="small">
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

defineProps({
  // Render as a labeled button (sort-field name + direction icon) instead of the
  // bare icon. Used by the flag-on results header (#440 r5); defaults false so
  // the flag-off SERP + the OQL builder are unchanged.
  showLabel: Boolean,
});

const route = useRoute();
const store = useStore();

const entityType = computed(() => store.getters.entityType);
const selectedSort = computed(() => url.getSort(route));

// Entity-specific sort options. If an entry is present here, it overrides
// the facetConfigs-driven defaults so we can control collection + set for a page.
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

// Labeled variant (#440 r5): name the active sort field; the icon shows the
// direction (asc/desc) so no direction text is needed.
const currentSortLabel = computed(() => {
  const field = url.getSortField(route);
  if (field === 'relevance_score') return 'Relevance';
  const opt = sortOptions.value.find((o) => o.key === field);
  if (opt) return opt.displayName;
  const conf = facetConfigs(entityType.value).find((c) => c.key === field);
  return conf ? titleCase(conf.displayName) : titleCase(field.replace(/_/g, ' '));
});
const directionIcon = computed(() =>
  url.getSortDirection(route) === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'
);
</script>

<style scoped>
.sort-label-btn {
  letter-spacing: 0;
}
</style>
