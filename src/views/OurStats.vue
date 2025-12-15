<template>
  <div class="container mx-auto px-4 py-8">
    <div class="ml-4 mb-6">
      <h1 class="text-2xl font-bold">
        Data Stats
      </h1>
      <div class="text-muted-foreground">
        Last updated {{ new Date().toDateString() }}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <Card
        v-for="cardData in cards"
        :key="cardData.name"
        class="h-full"
        :class="getCardBgClass(cardData.color)"
      >
        <CardContent class="p-4">
          <div class="flex items-baseline gap-2 mb-2">
            <component :is="getIcon(cardData.icon)" class="h-6 w-6" :class="getTextColorClass(cardData.color)" />
            <OurStatsEntry
              :entity-type="cardData.name"
              class="text-2xl font-bold"
            />
            <span class="capitalize">
              {{ cardData.name }}
            </span>
            <div class="flex-1"></div>
            <a
              v-if="cardData.hasDocs"
              :href="`https://docs.openalex.org/api-entities/${cardData.name}`"
              target="_blank"
              class="p-1 hover:bg-accent rounded"
            >
              <Info class="h-4 w-4 text-muted-foreground" />
            </a>
          </div>

          <Separator v-if="cardData.highlightFilters" class="my-2" />
          
          <div v-if="cardData.highlightFilters" class="space-y-1">
            <div
              v-for="highlightFilter in cardData.highlightFilters"
              :key="highlightFilter.key"
              class="py-1"
            >
              <OurStatsEntry
                :entity-type="cardData.name"
                :loading-spinner-size="12"
                :filter-key="highlightFilter.key"
                :filter-value="highlightFilter.value"
                class="font-bold"
              />
              <span class="ml-1">
                {{ highlightFilter.displayName }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>


<script setup>
import _ from 'lodash';
import { useHead } from '@unhead/vue';
import { computed } from 'vue';

import { Info, FileText, Users, Building2, BookOpen, Tag, Bookmark, Briefcase, DollarSign, Lightbulb } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'indigo'];

  return Object.values(copy).map((e, i) => {
    if (entitiesWithDocs.includes(e.name)) { e.hasDocs = true; }
    if (!e.color) { e.color = colors[i % colors.length]; }
    return e;
  });
});

function getCardBgClass(color) {
  const colorMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    pink: 'bg-pink-50',
    teal: 'bg-teal-50',
    indigo: 'bg-indigo-50',
  };
  return colorMap[color] || 'bg-gray-50';
}

function getTextColorClass(color) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    teal: 'text-teal-600',
    indigo: 'text-indigo-600',
  };
  return colorMap[color] || 'text-gray-600';
}

function getIcon(iconName) {
  const iconMap = {
    'mdi-file-document-outline': FileText,
    'mdi-account-outline': Users,
    'mdi-domain': Building2,
    'mdi-book-open-outline': BookOpen,
    'mdi-tag-outline': Tag,
    'mdi-bookmark-outline': Bookmark,
    'mdi-briefcase-outline': Briefcase,
    'mdi-currency-usd': DollarSign,
    'mdi-lightbulb-outline': Lightbulb,
  };
  return iconMap[iconName] || FileText;
}
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>