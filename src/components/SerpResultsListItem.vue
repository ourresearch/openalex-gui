<template>
  <v-list-item
      :to="filters.entityZoomLink(result.id)"
      color="primary"
      exact
  >
      <v-list-item-title style="white-space: normal; line-height: 1.5;">
        <div class="text-subtitle-1" v-html="filters.prettyTitle(result.display_name)"></div>
      </v-list-item-title>
      <v-list-item-subtitle style="white-space: normal; line-height: 1.5;">
        <div class="result-details-line" v-if="myEntityType === 'works'">
          <span v-if="result.publication_year">{{ result.publication_year }}</span>
          <span v-if="result.publication_year && result.type"> · </span>
          <work-authors-string v-if="result.authorships?.length" :authorships="result.authorships"/>
          <span v-if="result.primary_location?.source?.display_name"> · </span>
          <span v-if="result.primary_location?.source?.display_name" class="font-italic">
            {{ result.primary_location?.source?.display_name }}
          </span>
        </div>
        <div v-else>
          {{ unworkSubheader }}
        </div>
      </v-list-item-subtitle>
      <div>
        <v-btn
            v-if="result.works_count"
            variant="text"
            size="small"
            class="px-1"
            @click.stop.prevent="viewWorks"
        >
          {{ filters.toPrecision(result.works_count) }} works
        </v-btn>
        <v-btn
            v-if="myEntityType === 'works'"
            variant="text"
            size="small"
            class="px-1"
            @click.stop.prevent="viewCitingPapers"
        >
          Cited by {{ filters.toPrecision(result.cited_by_count) }}
        </v-btn>

        <span @click.stop>
              <v-btn
                v-if="result?.best_oa_location?.pdf_url"
                :href="result?.best_oa_location?.pdf_url"
                target="_blank"
                variant="text"
                size="small"
                class="ml-2"
              >
                PDF
              </v-btn>
        </span>
      </div>
    
  </v-list-item>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

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

const unworkSubheader = computed(() => {
  const r = props.result;

  const factsToShow = {
    works: undefined,
    authors: [
      r.last_known_institutions?.map(i => i.display_name)?.join(', '),
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