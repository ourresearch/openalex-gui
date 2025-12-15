<template>
  <router-link
    :to="filters.entityZoomLink(result.id)"
    class="block p-3 hover:bg-muted rounded-lg transition-colors"
  >
    <div class="leading-relaxed">
      <div class="text-base font-medium" v-html="filters.prettyTitle(displayTitle)"></div>
    </div>
    <div class="text-sm text-muted-foreground leading-relaxed">
      <div class="result-details-line" v-if="myEntityType === 'works'">
        <span v-if="result.publication_year">{{ result.publication_year }}</span>
        <span v-if="result.publication_year && result.type"> · </span>
        <work-authors-string v-if="result.authorships?.length" :authorships="result.authorships"/>
        <span v-if="result.primary_location?.source?.display_name"> · </span>
        <span v-if="result.primary_location?.source?.display_name" class="italic">
          {{ result.primary_location?.source?.display_name }}
        </span>
      </div>
      <div v-else class="result-details-line">
        {{ unworkSubheader }}
      </div>
    </div>
    <div class="mt-1">
      <Button
        v-if="result.works_count"
        variant="ghost"
        size="sm"
        class="px-1 h-7"
        @click.stop.prevent="viewWorks"
      >
        {{ filters.toPrecision(result.works_count) }} works
      </Button>
      <Button
        v-if="myEntityType === 'works'"
        variant="ghost"
        size="sm"
        class="px-1 h-7"
        @click.stop.prevent="viewCitingPapers"
      >
        Cited by {{ filters.toPrecision(result.cited_by_count || 0) }}
      </Button>

      <span @click.stop>
        <Button
          v-if="result?.best_oa_location?.pdf_url"
          as="a"
          :href="result?.best_oa_location?.pdf_url"
          target="_blank"
          variant="ghost"
          size="sm"
          class="ml-2 h-7"
        >
          PDF
        </Button>
      </span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { Button } from '@/components/ui/button';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { entityTypeFromId } from '@/util';
import { getEntityConfig, getLocationString } from '@/entityConfigs';

import WorkAuthorsString from '@/components/WorkAuthorsString.vue';

defineOptions({
  name: 'SerpResultsListItem',
});

const props = defineProps({
  result: Object,
  showIcon: Boolean,
});

const store = useStore();

const entityType = computed(() => store.getters['entityType']);
const myEntityType = computed(() => entityTypeFromId(props.result.id));

// Display title - use award-specific fallback for awards, otherwise use display_name
const displayTitle = computed(() => {
  if (myEntityType.value === 'awards') {
    return filters.getAwardDisplayTitle(props.result);
  }
  return props.result.display_name || 'Untitled';
});

const formatAwardAmount = (amount, currency) => {
  if (!amount) return null;
  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', JPY: '¥', CNY: '¥' };
  const symbol = currencySymbols[currency] || (currency ? `${currency} ` : '$');
  // 2 sig figs: show decimal only for single-digit leading numbers (e.g., 2.5B, 11M, 345k)
  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'k' },
  ];
  for (const unit of units) {
    if (amount >= unit.value) {
      const scaled = amount / unit.value;
      const formatted = scaled < 10 ? scaled.toFixed(1).replace(/\.0$/, '') : Math.round(scaled);
      return `${symbol}${formatted}${unit.suffix}`;
    }
  }
  return `${symbol}${Math.round(amount)}`;
};

const formatAwardYears = (startYear, endYear) => {
  if (!startYear) return null;
  if (!endYear || startYear === endYear) return String(startYear);
  return `${startYear}-${endYear}`;
};

const unworkSubheader = computed(() => {
  const r = props.result;

  const factsToShow = {
    works: undefined,
    authors: [
      r.last_known_institutions?.map(i => i?.display_name || 'Unknown')?.join(', '),
    ],
    sources: [
      r.type,
      r.host_organization_name,
      r.is_oa ? 'open access' : 'toll-access',
    ],
    institutions: [
      getLocationString(r),
      r.type,
    ],
    awards: [
      formatAwardAmount(r.amount, r.currency),
      r.funder?.display_name,
      formatAwardYears(r.start_year, r.end_year),
    ],
  };

  return (factsToShow[myEntityType.value] || [])
    .filter(f => !!f)
    .join(' · ');
});

// Methods
function viewCitingPapers() {
  const citesFilter = createSimpleFilter(entityType.value, 'cites', props.result.id);
  url.pushNewFilters([citesFilter], 'works');
}

function viewWorks() {
  const filterKey = getEntityConfig(myEntityType.value).filterKey;
  const worksFilter = createSimpleFilter('works', filterKey, props.result.id);
  url.pushNewFilters([worksFilter], 'works');
}
</script>


<style scoped lang="scss">
.result-details-line {
  font-size: 14px;
}
</style>