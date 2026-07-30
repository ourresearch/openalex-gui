<template>
  <static-page title="Data stats" :sections="sections">
    <template #intro>
      Live counts of everything in OpenAlex, straight from the API. Last updated
      {{ new Date().toDateString() }}.
    </template>

    <section id="entities" class="section">
      <v-row>
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
              :color="`${cardData.color}-lighten-5`"
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
                      :href="`https://developers.openalex.org/api-reference/${cardData.name}`"
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
      </v-row>
    </section>
  </static-page>
</template>


<script setup>
import _ from 'lodash';
import { useHead } from '@unhead/vue';
import { computed } from 'vue';

import { entityConfigs } from '../entityConfigs';
import OurStatsEntry from '../components/OurStats/OurStatsEntry.vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'OurStats' });

useHead({ title: 'Data Stats' });

const sections = [
  { id: 'entities', label: 'By entity' },
];

const entitiesWithDocs = [
  'works', 'authors', 'sources', 'institutions',
  'topics', 'keywords', 'publishers', 'funders', 'concepts'
];

const cards = computed(() => {
  const copy = _.cloneDeep(entityConfigs);
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'indigo'];

  return Object.values(copy).map((e, i) => {
    if (entitiesWithDocs.includes(e.name)) { e.hasDocs = true; }
    if (!e.color) { e.color = colors[i % colors.length]; }
    return e;
  });
});
</script>


<style scoped lang="scss">
.highlight-filters {
  background-color: transparent !important;
}
</style>
