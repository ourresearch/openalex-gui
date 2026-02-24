<template>
  <div class="result-item">
    <!-- Row 1: title + right column -->
    <div class="result-row-1">
      <router-link
        :to="filters.entityZoomLink(result.id)"
        class="result-title text-body-1 font-weight-medium text-decoration-none"
        v-html="filters.prettyTitle(displayTitle)"
      />
      <!-- Works: right column is PDF button -->
      <span v-if="isWorks && !smAndDown" class="pdf-slot">
        <v-tooltip v-if="result.best_oa_location?.pdf_url" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :href="result.best_oa_location.pdf_url"
              target="_blank"
              rel="noopener"
              variant="outlined"
              size="x-small"
              color="primary"
              class="pdf-btn"
              @click.stop
            >
              PDF
            </v-btn>
          </template>
          {{ pdfHostname }}
        </v-tooltip>
      </span>
      <!-- Non-works: right column is works count -->
      <div v-if="!isWorks && countValue && !smAndDown" class="result-stats">
        <v-icon size="14" class="count-icon">mdi-file-document-outline</v-icon>
        <span class="text-body-2">{{ countValue.toLocaleString() }}</span>
      </div>
    </div>

    <!-- Row 2: entity-specific metadata -->
    <div class="result-meta mt-1" v-if="hasMetadata">
      <template v-if="isWorks">
        <span v-if="result.publication_year">{{ result.publication_year }}</span>
        <template v-if="result.authorships?.length">
          <span> · </span>
          <work-authors-string :authorships="result.authorships" />
        </template>
        <template v-if="result.primary_location?.source?.display_name">
          <span> · </span>
          <span class="font-italic">{{ result.primary_location.source.display_name }}</span>
        </template>
        <template v-if="result.cited_by_count">
          <span> · </span>
          <v-tooltip location="top">
            <template v-slot:activator="{ props: citeTipProps }">
              <span v-bind="citeTipProps" class="cited-by" @click.stop="viewCitingPapers">
                <v-icon size="14" class="count-icon">mdi-format-quote-close</v-icon>
                {{ result.cited_by_count.toLocaleString() }}
              </span>
            </template>
            cited by {{ result.cited_by_count.toLocaleString() }} works
          </v-tooltip>
        </template>
      </template>
      <template v-else>
        {{ unworkSubheader }}
      </template>
    </div>

    <!-- Row 3 (mobile only): PDF or works count -->
    <div v-if="isWorks && smAndDown && result.best_oa_location?.pdf_url" class="result-stats result-stats--mobile mt-1">
      <v-tooltip location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :href="result.best_oa_location.pdf_url"
            target="_blank"
            rel="noopener"
            variant="outlined"
            size="x-small"
            color="primary"
            class="pdf-btn"
            @click.stop
          >
            PDF
          </v-btn>
        </template>
        {{ pdfHostname }}
      </v-tooltip>
    </div>
    <div v-if="!isWorks && countValue && smAndDown" class="result-stats result-stats--mobile mt-1">
      <v-icon size="14" class="count-icon">mdi-file-document-outline</v-icon>
      <span class="text-body-2">{{ countValue.toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';

import { useRouter } from 'vue-router';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter, filtersAsUrlStr } from '@/filterConfigs';
import * as openalexId from '@/openalexId';
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
const router = useRouter();
const { smAndDown } = useDisplay();

const entityType = computed(() => store.getters['entityType']);
const myEntityType = computed(() => openalexId.getEntityType(props.result.id));
const isWorks = computed(() => myEntityType.value === 'works');
const countValue = computed(() => props.result.works_count);

const pdfHostname = computed(() => {
  try {
    return new URL(props.result.best_oa_location?.pdf_url).hostname;
  } catch {
    return '';
  }
});

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
    funders: [
      r.country_code,
      r.description,
    ],
  };

  return (factsToShow[myEntityType.value] || [])
    .filter(f => !!f)
    .join(' · ');
});

const hasMetadata = computed(() => {
  if (isWorks.value) {
    return props.result.publication_year || props.result.authorships?.length || props.result.primary_location?.source?.display_name;
  }
  return !!unworkSubheader.value;
});

// Methods
function viewCitingPapers() {
  const citesFilter = createSimpleFilter('works', 'cites', props.result.id);
  router.push({
    name: 'Serp',
    params: { entityType: 'works' },
    query: { filter: filtersAsUrlStr([citesFilter]) },
  });
}

function viewWorks() {
  const filterKey = getEntityConfig(myEntityType.value).filterKey;
  const worksFilter = createSimpleFilter('works', filterKey, props.result.id);
  url.pushNewFilters([worksFilter], 'works');
}
</script>


<style scoped>
.result-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.result-item:last-child {
  border-bottom: none;
}

.result-row-1 {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.result-title {
  flex: 1 1 0;
  min-width: 0;
  display: block;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

.result-title:hover {
  text-decoration: underline;
}

.result-stats {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  white-space: nowrap;
}

.result-stats--mobile {
  flex-shrink: initial;
}

.result-meta {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
}

.count-icon {
  opacity: 0.35;
}

.cited-by {
  white-space: nowrap;
  cursor: pointer;
}

.cited-by:hover {
  text-decoration: underline;
}

.pdf-slot {
  flex-shrink: 0;
  width: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pdf-btn {
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
}
</style>
