<template>
  <Card class="rounded-xl h-full flex flex-col py-3 px-4">
    <div class="text-base font-medium mb-4 cursor-pointer hover:text-primary" @click="handleQueryClick(query)">
      {{ question }}
    </div>
    <div v-if="error" class="mx-5 mb-2">
      <b>Error:</b> {{ error }}
    </div>
    <div class="flex-1"></div>
    <div class="flex gap-1.5">
      <Badge 
        v-for="(label, index) in [['type', type], ['category', category]]"
        :key="index"
        variant="secondary"
        class="cursor-pointer"
        @click="emit('set-filter', { [label[0]]: label[1] })" 
      >
        <b>{{label[1]}}</b>
      </Badge>
    </div>
  </Card>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

defineOptions({ name: 'ExampleQuery' });

defineProps({
  question: String,
  type: String,
  category: String,
  error: String,
  query: Object
});

const emit = defineEmits(['set-filter']);

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const createSearchFromQuery = (query) => store.dispatch('search/createSearchFromQuery', query);

const chipColor = (category) => {
  const colors = {
    works: 'catBlueDark',
    authors: 'catGreenDark',
    sources: 'catTealDark',
    institutions: 'catPurpleDark',
    topics: 'catTealDark',
    sdgs: 'catRedDark',
    funders: 'catBlueDark',
    keywords: 'catGreenDark',
    fields: 'catOrangeDark',
    countries: 'catPurpleDark',
    discovery: 'catRedDark',
    metrics: 'catRedDark',
    compliance: 'catBlueDark',
    'trend detection': 'catTealDark',
    'expert discovery': 'catPurpleDark',
    'open access': 'catPurpleDark',
    recommenders: 'catTealDark',
    rankings: 'catRedDark',
    collaboration: 'catBlueDark'
  };

  return colors[category] || 'primary';
};

const handleQueryClick = (query) => {
  if (!userId.value) {
    router.push({
      name: 'Login',
      query: { redirect: '/analytics' }
    });
    return;
  }
  createSearchFromQuery(query);
};
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>