<template>
  <div>
    <div class="container mx-auto px-4 mt-6">
      <nav v-if="breadcrumbItems.length > 1" class="flex items-center gap-1 text-sm mb-2">
        <template v-for="(item, index) in breadcrumbItems" :key="index">
          <router-link
            v-if="index < breadcrumbItems.length - 1"
            :to="item.to"
            class="text-muted-foreground hover:text-foreground"
          >
            {{ item.title }}
          </router-link>
          <span v-else class="text-foreground">{{ item.title }}</span>
          <ChevronRight v-if="index < breadcrumbItems.length - 1" class="h-4 w-4 text-muted-foreground" />
        </template>
      </nav>
      <h1 class="text-2xl font-bold mb-5 mt-3">{{ pageTitle }}</h1>
    </div>
    <router-view />
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { ChevronRight } from 'lucide-vue-next';

defineOptions({ name: 'TestQueriesBase' });

const route = useRoute();

const breadcrumbItems = computed(() => {
  const items = [
    { title: 'Tests', to: '/tests', exact: true },
  ];

  const { testSuiteId, queryId, testType, testId } = route.params;

  if (testSuiteId) {
    items.push({
      title: `Suite: ${testSuiteId}`,
      exact: true,
      to: `/tests/${testSuiteId}`,
    });
  }

  if (queryId) {
    items.push({
      title: `Query: ${queryId}`,
      exact: true,
      to: `/tests/${testSuiteId}/${queryId}`,
    });
  }

  if (testType) {
    items.push({
      title: `${testType}`,
      exact: true,
      to: `/tests/${testSuiteId}/${queryId}/${testType}`,
    });
  }

  if (testId) {
    items.push({
      title: `${testId}`,
      exact: true,
      to: `/tests/${testSuiteId}/${queryId}/${testType}/${testId}`,
    });
  }

  return items;
});

const pageTitle = computed(() => {
  return breadcrumbItems.value[breadcrumbItems.value.length - 1]?.title || '';
});
</script>