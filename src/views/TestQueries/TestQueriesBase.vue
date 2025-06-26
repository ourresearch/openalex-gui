<template>
  <div>
    <v-container class="mt-6" >
      <div>
        <v-breadcrumbs
          v-if="breadcrumbItems.length > 1"
          class="ma-0 pa-0"
          :items="breadcrumbItems"
          size="large"
        >
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </div>
      <div class="text-h4 mb-5 mt-3">{{ pageTitle }}</div>
    </v-container>
    <router-view />
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

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