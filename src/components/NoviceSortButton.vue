<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <!-- Flag-on variant (#440 r5/r12): icon-only (the header is all icon
           buttons now); the icon carries the direction and the tooltip names the
           sort. Default below is the flag-off / builder rendering, unchanged. -->
      <v-btn
        v-if="showLabel"
        v-bind="props"
        icon
        variant="text"
        size="small"
        :aria-label="`Sort: ${currentSortLabel}`"
      >
        <v-icon size="20" color="grey-darken-1">{{ directionIcon }}</v-icon>
        <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">
          Sort: {{ currentSortLabel }} ({{ (primarySort?.dir ?? 'desc') === 'asc' ? 'ascending' : 'descending' }})
        </v-tooltip>
      </v-btn>
      <v-btn v-else v-bind="props" icon variant="text" size="small">
        <v-icon color="grey-darken-1">mdi-sort-ascending</v-icon>
      </v-btn>
    </template>
    <!-- Linear-style popover (labeled mode, #440 r11): every active sort shows
         its direction arrow (and its order number when multi-sorted); clicking
         the PRIMARY field again flips its direction, clicking any other field
         switches to it. Multi-dimensional sorts (from OQL) are displayed in
         order; picking from this menu collapses to a single sort. -->
    <v-list v-if="showLabel" density="compact" min-width="220">
      <v-list-subheader>Sort by</v-list-subheader>
      <v-divider />
      <v-list-item
        v-for="option in menuOptions"
        :key="option.key"
        @click="clickOption(option.key)"
      >
        <v-list-item-title>{{ option.displayName }}</v-list-item-title>
        <template #append>
          <span
            v-if="activeSorts.length > 1 && sortIndexOf(option.key) >= 0"
            class="text-caption text-medium-emphasis mr-1"
          >{{ sortIndexOf(option.key) + 1 }}</span>
          <v-icon v-if="sortIndexOf(option.key) >= 0" size="18">
            {{ dirOf(option.key) === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
          </v-icon>
        </template>
      </v-list-item>
    </v-list>
    <!-- Flag-off / builder menu: unchanged. -->
    <v-list v-else density="compact">
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

// ---- Labeled (Linear-style) mode, #440 r5/r11 -------------------------------

// Every active sort, in order. An explicit ?sort= may be a comma list (OQL
// multi-sort: "publication_year:asc,cited_by_count:desc"); a bare URL falls
// back to the route's default sort.
const activeSorts = computed(() => {
  const raw = route.query.sort;
  if (raw) {
    return String(raw)
      .split(',')
      .filter(Boolean)
      .map((s) => {
        const [field, dir] = s.split(':');
        return { field, dir: dir === 'asc' ? 'asc' : 'desc' };
      });
  }
  const field = url.getSortField(route);
  return field ? [{ field, dir: url.getSortDirection(route) }] : [];
});
const primarySort = computed(() => activeSorts.value[0] || null);

function displayNameFor(field) {
  if (field === 'relevance_score') return 'Relevance';
  const opt = sortOptions.value.find((o) => o.key === field);
  if (opt) return opt.displayName;
  const conf = facetConfigs(entityType.value).find((c) => c.key === field);
  return conf ? titleCase(conf.displayName) : titleCase(String(field).replace(/_/g, ' '));
}

// Trigger label: primary field name, "+n" when more dimensions ride along.
const currentSortLabel = computed(() => {
  if (!primarySort.value) return 'Sort';
  const extra = activeSorts.value.length - 1;
  return displayNameFor(primarySort.value.field) + (extra > 0 ? ` +${extra}` : '');
});
const directionIcon = computed(() =>
  (primarySort.value?.dir ?? 'desc') === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'
);

// Menu = the usual sort options PLUS any active fields they don't cover (an OQL
// multi-sort can order by fields outside the popular set).
const menuOptions = computed(() => {
  const opts = [...sortOptions.value];
  for (const s of activeSorts.value) {
    if (!opts.some((o) => o.key === s.field)) {
      opts.push({ key: s.field, displayName: displayNameFor(s.field) });
    }
  }
  return opts;
});

function sortIndexOf(field) {
  return activeSorts.value.findIndex((s) => s.field === field);
}
function dirOf(field) {
  return activeSorts.value.find((s) => s.field === field)?.dir ?? 'desc';
}
// Linear semantics: re-click the primary field → flip its direction; click any
// other field → sort by it (desc default via setSort).
function clickOption(field) {
  if (primarySort.value && field === primarySort.value.field) {
    url.setSortDirection(field, primarySort.value.dir === 'asc' ? 'desc' : 'asc');
  } else {
    url.setSort(field);
  }
}
</script>

<style scoped>
.sort-label-btn {
  letter-spacing: 0;
}
</style>
