<template>
  <div v-if="data && isDisplayed && isRawValueValid">
    
    <span class="font-weight-bold">
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
        :key="entityObj.id + i"
        :to="filters.entityZoomLink(entityObj.id)"
        class="mr-1 pr-0"
      >
        {{ entityObj.display_name }}{{ i + 1 < valueEntityLinks.length ? ", " : "" }}
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

    <span v-else-if="valueExternalLink">
      <a :href="valueExternalLink" target="_blank">
        Yes
        <v-icon size="small" style="vertical-align: 0px;" color="primary">mdi-open-in-new</v-icon>
      </a>
    </span>

    <span v-else-if="valueString">
      <span>{{ valueString }}{{ isValueTruncated ? "..." : "" }}</span>
    </span>

    <span v-else-if="valueWorksCount">
      <router-link :to="filters.entityZoomLink(data.id)">
        {{ filters.toPrecision(valueWorksCount) }}
      </router-link>
    </span>

    <span v-else-if="valueUnlinkedCount">
      <span>{{ isValueUsd ? "$"  : ""}}{{ filters.toPrecision(valueUnlinkedCount) }}</span>
    </span>

    <span v-else-if="valueLinkedCount">
      <router-link :to="url.makeFilterRoute(entityType, filterKeyForMakingLinks, props.data.id)">
        {{ filters.toPrecision(valueLinkedCount) }}
      </router-link>
    </span>

    <span v-else-if="valueBoolean">
      {{ valueBoolean }}
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

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';
import { url } from '@/url';
import { getFacetConfig } from '@/facetConfigs';

defineOptions({ name: 'EntityDatumRow' });

const props = defineProps({
  filterKey: String,
  type: String,
  data: Object
});

console.log("EntityDatumRow props")
console.log(props)

const store = useStore();
const entityType = computed(() => store.getters['entityType']);

const isTruncateSet = ref(true);
const maxLen = ref({ string: 200, array: 5 });

const filterConfig = computed(() => getFacetConfig(props.type, props.filterKey));
const rawValue = computed(() => filterConfig.value.extractFn(props.data));
const myValueType = computed(() => Array.isArray(rawValue.value) ? 'array' : typeof rawValue.value);
const isValueAnArray = computed(() => Array.isArray(rawValue.value));
const valueLength = computed(() => rawValue.value?.length);

const isRawValueValid = computed(() => {
  if (myValueType.value === 'array' && !rawValue.value.every(o => o !== undefined)) {
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
  if (isValueAnArray.value) return !!rawValue.value.length;
  return rawValue.value !== null && rawValue.value !== undefined;
});

const valueEntityLinks = computed(() => {
  console.log("valueEntityLinks rawValue.value", rawValue.value);
  if (rawValue.value?.id) return [rawValue.value];
  if (isValueAnArray.value && rawValue.value.every(o => !!o.id)) {
    return isValueTruncated.value ? rawValue.value.slice(0, maxLen.value.array) : rawValue.value;
  }
  return null;
});

const valueListOfStrings = computed(() => {
  console.log("valueListOfStrings rawValue.value", rawValue.value);
  if (isValueAnArray.value && !rawValue.value.every(o => !!o.id)) {
    return isValueTruncated.value ? rawValue.value.slice(0, maxLen.value.array) : rawValue.value;
  }
  return null;
});

const valueString = computed(() => {
  if (props.filterKey === 'publication_year') return rawValue.value;
  if (typeof rawValue.value === 'string') {
    return isValueTruncated.value
      ? rawValue.value.substring(0, maxLen.value.string)
      : rawValue.value;
  }
  return null;
});

const valueWorksCount = computed(() => (props.filterKey === 'works_count' ? rawValue.value : null));
const valueUnlinkedCount = computed(() => (typeof rawValue.value === 'number' && filterConfig.value.type !== 'select' ? rawValue.value : null));
const valueLinkedCount = computed(() => (typeof rawValue.value === 'number' && filterConfig.value.type === 'select' ? rawValue.value : null));
const isValueUsd = computed(() => props.filterKey === 'apc_paid.value_usd');
const valueExternalLink = computed(() => typeof rawValue.value === 'string' && rawValue.value.startsWith('http') ? rawValue.value : null);
const valueBoolean = computed(() => typeof rawValue.value === 'boolean' ? (rawValue.value ? 'Yes' : 'No') : null);

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


<style scoped lang="scss">
a {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

</style>