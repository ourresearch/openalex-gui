<template>
  <div v-if="data && isDisplayed && isRawValueValid">
    
    <span class="font-semibold">
      <template v-if="isValueAnArray">
          {{ filters.pluralize(filters.capitalize(filterConfig.displayName), pluralizeCount) }}:
      </template>
      <template v-else>
        {{ filters.capitalize(filterConfig.displayName) }}:
      </template>
    </span>

    <span v-if="valueEntityLinks">
      <router-link
        v-for="(entityObj, i) in valueEntityLinks"
        :key="(entityObj?.id || 'unknown-' + i) + i"
        :to="entityObj?.id ? filters.entityZoomLink(entityObj.id) : '#'"
        class="mr-1 pr-0 text-primary hover:underline"
        @click="!entityObj?.id && $event.preventDefault()"
      >
        {{ entityObj?.raw_author_name || entityObj?.display_name || 'Unknown' }}{{ i + 1 < valueEntityLinks.length ? ", " : "" }}
      </router-link>
    </span>

    <span v-if="valueListOfStrings">
      <span
        v-for="(str, i) in valueListOfStrings"
        :key="str + i"
        class="mr-1 pr-0"
      >
        {{ str }}{{ i + 1 < valueListOfStrings.length ? ", " : "" }}
      </span>
    </span>

    <span v-else-if="valueLocationUrl">
      <a :href="rawValue" target="_blank" class="text-primary hover:underline">
        {{ valueLocationUrl }}
        <ExternalLink class="h-3 w-3 ml-1 inline" />
      </a>
    </span>

    <span v-else-if="valueExternalLink">
      <a :href="valueExternalLink" target="_blank" class="text-primary hover:underline">
        Yes
        <ExternalLink class="h-3 w-3 ml-1 inline text-primary" />
      </a>
    </span>

    <span v-else-if="valueString">
      <span>{{ valueString }}{{ isValueTruncated ? "..." : "" }}</span>
    </span>

    <span v-else-if="valueWorksCount !== null">
      <router-link v-if="valueWorksCount > 0" :to="filters.entityWorksLink(data.id)">
        {{ filters.toPrecision(valueWorksCount) }}
      </router-link>
      <span v-else>0</span>
    </span>

    <span v-else-if="valueUnlinkedCount">
      <span>{{ isValueUsd ? "$" : awardCurrencySymbol }}{{ filters.toPrecision(valueUnlinkedCount) }}</span>
    </span>

    <span v-else-if="valueLinkedCount">
      <router-link :to="url.makeFilterRoute(entityType, filterKeyForMakingLinks, props.data.id)">
        {{ filters.toPrecision(valueLinkedCount) }}
      </router-link>
    </span>

    <span v-else-if="valueBoolean">
      {{ valueBoolean }}
    </span>

    <span v-else-if="showMissing" class="text-grey">
      none
    </span>

    <a
      v-if="isValueTruncated"
      @click="isTruncateSet = false"
      class="font-weight-bold text-primary"
    >
      <template v-if="isValueAnArray">
        +{{ filters.toPrecision(valueLength - maxLen.array) }} more
      </template>
      <template v-else>
        more
      </template>
    </a>
    <a
      v-if="isValueSubjectToTruncation && !isValueTruncated"
      @click="isTruncateSet = true"
      class="font-weight-bold"
    >
      (less)
    </a>

    <curation-edit-button
      v-if="shouldShowCurationButton"
      :entity="props.data"
      :entity-type="entityType"
      :property="props.filterKey"
      :facet-config="filterConfig"
      :size="entityType === 'locations' ? 'x-small' : 'small'"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { ExternalLink } from 'lucide-vue-next';

import ISO6391 from 'iso-639-1';

import filters from '@/filters';
import { url } from '@/url';
import { getFacetConfig } from '@/facetConfigs';
import { entityTypeFromId } from '@/util';
import CurationEditButton from '@/components/Curation/CurationEditButton.vue';

defineOptions({ name: 'EntityDatumRow' });

const props = defineProps({
  filterKey: String,
  type: String,
  data: Object,
  showMissing: {
    type: Boolean,
    default: false
  }
});

const store = useStore();
// Get entity type from props.type or fallback to guessing from ID
const entityType = computed(() => props.type || entityTypeFromId(props.data?.id));

const shouldShowCurationButton = computed(() => {
  // Show curation button for curate-able properties
  if (entityType.value === 'works' && ['type', 'language'].includes(props.filterKey)) {
    return true;
  }
  if (entityType.value === 'sources' && ['type', 'is_oa'].includes(props.filterKey)) {
    return true;
  }
  if (entityType.value === 'locations' && ['is_oa'].includes(props.filterKey)) {
    return true;
  }
  return false;
});

const isTruncateSet = ref(true);
const maxLen = ref({ string: 200, array: 5 });

const filterConfig = computed(() => getFacetConfig(props.type, props.filterKey));
const rawValue = computed(() => {
  if (!filterConfig.value || !props.data) return null;
  try {
    return filterConfig.value.extractFn(props.data);
  } catch (e) {
    console.error('Error extracting value:', e, 'filterKey:', props.filterKey, 'entityType:', props.type);
    return null;
  }
});
const myValueType = computed(() => Array.isArray(rawValue.value) ? 'array' : typeof rawValue.value);
const isValueAnArray = computed(() => Array.isArray(rawValue.value));
const valueLength = computed(() => rawValue.value?.length);

const isRawValueValid = computed(() => {
  if (myValueType.value === 'array' && !rawValue.value.every(o => o !== undefined && o !== null)) {
    return false;
  }
  return true;
});

const isValueSubjectToTruncation = computed(() => {
  const type = myValueType.value;
  return ['string', 'array'].includes(type) && rawValue.value.length > maxLen.value[type];
});
const isValueTruncated = computed(() => isValueSubjectToTruncation.value && isTruncateSet.value);

const isDisplayed = computed(() => {
  // If showMissing is true, always display the row
  if (props.showMissing) {
    return true;
  }
  if (isValueAnArray.value) return !!rawValue.value.length;
  return rawValue.value !== null && rawValue.value !== undefined;
});

const valueEntityLinks = computed(() => {
  if (rawValue.value?.id) return [rawValue.value];
  if (isValueAnArray.value) {
    // Filter out null/undefined first
    const validItems = rawValue.value.filter(o => o);
    // Check if all valid items have IDs
    if (validItems.length > 0 && validItems.every(o => o.id)) {
      return isValueTruncated.value ? validItems.slice(0, maxLen.value.array) : validItems;
    }
  }
  return null;
});

const valueListOfStrings = computed(() => {
  if (isValueAnArray.value && !rawValue.value.every(o => o && o.id)) {
    const filteredValues = rawValue.value
      .filter(v => v !== null && v !== undefined)
      .map(v => {
        // If it's an object with display_name, extract it (regardless of id)
        if (typeof v === 'object' && v.display_name) {
          return v.display_name;
        }
        // If it's already a string, use it as is
        if (typeof v === 'string') {
          return v;
        }
        // Otherwise convert to string
        return String(v);
      });
    return isValueTruncated.value ? filteredValues.slice(0, maxLen.value.array) : filteredValues;
  }
  return null;
});

const valueString = computed(() => {
  if (props.filterKey === 'publication_year') return rawValue.value;
  if (typeof rawValue.value === 'string') {
    let displayValue = rawValue.value;
    
    // Convert language ISO code to full name
    if (props.filterKey === 'language') {
      const languageName = ISO6391.getName(rawValue.value);
      displayValue = languageName || rawValue.value; // Fallback to code if not found
    }
    
    return isValueTruncated.value
      ? displayValue.substring(0, maxLen.value.string)
      : displayValue;
  }
  return null;
});

const valueWorksCount = computed(() => {
  if (['works_count', 'funded_outputs_count'].includes(props.filterKey)) {
    return rawValue.value ?? null;  // Return the value (including 0), or null if undefined
  }
  return null;
});
const valueUnlinkedCount = computed(() => (typeof rawValue.value === 'number' && filterConfig.value.type !== 'select' ? rawValue.value : null));
const valueLinkedCount = computed(() => (typeof rawValue.value === 'number' && filterConfig.value.type === 'select' ? rawValue.value : null));
const isValueUsd = computed(() => props.filterKey === 'apc_paid.value_usd');
const isAwardAmount = computed(() => props.filterKey === 'amount' && entityType.value === 'awards');
const awardCurrencySymbol = computed(() => {
  if (!isAwardAmount.value) return '';
  const currency = props.data?.currency;
  const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', JPY: '¥', CNY: '¥' };
  return symbols[currency] || (currency ? `${currency} ` : '$');
});
// For locations and awards, show the actual URL for landing_page_url and pdf_url instead of "Yes"
const valueLocationUrl = computed(() => {
  if ((entityType.value === 'locations' || entityType.value === 'awards') && ['landing_page_url', 'pdf_url'].includes(props.filterKey)) {
    if (typeof rawValue.value === 'string' && rawValue.value.startsWith('http')) {
      // Strip https:// for cleaner display
      return rawValue.value.replace(/^https?:\/\//, '');
    }
  }
  return null;
});

const valueExternalLink = computed(() => {
  // Don't show "Yes" for location URLs - we handle those separately
  if (valueLocationUrl.value) return null;
  return typeof rawValue.value === 'string' && rawValue.value.startsWith('http') ? rawValue.value : null;
});

const valueBoolean = computed(() => {
  if (typeof rawValue.value === 'boolean') {
    return rawValue.value ? 'Yes' : 'No';
  }
  // If showMissing is true and the field type is boolean, show Yes/No based on truthiness
  if (props.showMissing && filterConfig.value?.type === 'boolean') {
    return rawValue.value ? 'Yes' : 'No';
  }
  return null;
});

const pluralizeCount = computed(() => {
  if (props.filterKey === 'cites') return 2;
  if (filterConfig.value.displayName.endsWith(')')) return 1;
  return isValueAnArray.value && rawValue.value?.length > 1 ? 2 : 1;
});

const filterKeyForMakingLinks = computed(() => {
  if (props.filterKey === 'cites') return 'cited_by';
  else if (props.filterKey === 'cited_by') return 'cites';
  else return props.filterKey;
});
</script>


<style scoped>
/* Links styled via Tailwind classes */
</style>