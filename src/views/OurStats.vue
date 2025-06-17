<template>
  <v-container class="page">

    <v-row>
      <v-col cols="12">
        <div class="text-h4">
          Data Stats
        </div>
        <div class="text-grey mb-2">
          Last updated {{ new Date().toDateString() }}
        </div>
      </v-col>
    </v-row>

    <v-row>
    <v-card rounded flat class="d-flex flex-wrap pa-4">
      <v-col
        cols="12"
        lg="4"
        v-for="cardData in cards"
        :key="cardData.name"
      >
        <v-hover>
          <v-card
            rounded
            flat
            class="fill-height d-flex flex-column pb-3"
            :color="`${cardData.color}-lighten-4`"
          >
            <div class="flex-grow-1 " :class="`${cardData.color}--text`">
              <div class="d-flex align-baseline pa-4 pb-2">
                <v-icon start size="large" :color="cardData.color">{{ cardData.icon }}</v-icon>
                <our-stats-entry
                  :entity-type="cardData.name"
                  class="text-h4 font-weight-bold"
                />
                <span class="ml-2 text-capitalize">
                  {{ cardData.name }}
                </span>
                <v-spacer />
                  <v-btn
                    v-if="cardData.hasDocs"
                    size="small"
                    variant="plain"
                    icon
                    :href="`https://docs.openalex.org/api-entities/${cardData.name}`"
                    target="_blank"
                  >
                    <v-icon size="small">mdi-information-outline</v-icon>
                  </v-btn>
              </div>

              <v-divider v-if="cardData.highlightFilters" />
              
              <v-list class="pa-0 highlight-filters" v-if="cardData.highlightFilters">
                <v-list-item
                  v-for="highlightFilter in cardData.highlightFilters"
                  :key="highlightFilter.key"
                >
                  <v-list-item-title>
                    <our-stats-entry
                      :entity-type="cardData.name"
                      :loading-spinner-size="12"
                      :filter-key="highlightFilter.key"
                      :filter-value="highlightFilter.value"
                      class="font-weight-bold"
                    />
                    <span class="ml-1">
                      {{ highlightFilter.displayName }}
                    </span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-card>
        </v-hover>
      </v-col>
    </v-card>
    </v-row>
  </v-container>
</template>


<script setup>
import _ from 'lodash';
import { useHead } from '@unhead/vue';
import { computed } from 'vue';

import { entityConfigs } from '../entityConfigs';
import OurStatsEntry from '../components/OurStats/OurStatsEntry.vue';


defineOptions({ name: 'OurStats' });

useHead({ title: 'Data Stats' });

const entitiesWithDocs = [
  'works', 'authors', 'sources', 'institutions',
  'topics', 'keywords', 'publishers', 'funders', 'concepts'
];

const cards = computed(() => {
  const copy = _.cloneDeep(entityConfigs);
  const colors = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'indigo'];

  return Object.values(copy).map((e, i) => {
    if (entitiesWithDocs.includes(e.name)) e.hasDocs = true;
    if (!e.color) e.color = colors[i % colors.length];
    return e;
  });
});
</script>


<style scoped lang="scss">
.highlight-filters {
  background-color: transparent !important;
}
</style>