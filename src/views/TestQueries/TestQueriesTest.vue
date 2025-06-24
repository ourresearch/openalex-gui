<template>
  <v-container>
    <template v-if="myTest">
        <test-query-oql
          v-if="myTestType === 'oql'"
          :input="myTest.input"
          :expected-response="myTest.expectedResponse"
          :test-suite-id="$route.params.testSuiteId"
          :query-id="Number($route.params.queryId)"
          :test-id="$route.params.testId"
        />
    </template>
    <template v-else>
      loading....
    </template>
  </v-container>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { getTestQuery } from '@/components/TestQuery/tests';

import TestQueryOql from '@/components/TestQuery/TestQueryOql.vue';

defineOptions({
  name: 'TestQueriesTest',
});

const route = useRoute();

// State
const myQuery = ref(null);

// Test type
const myTestType = computed(() => route.params.testType);

// Test definition
const myTest = computed(() => {
  if (!myQuery.value && myTestType.value && route.params.testId) {
    return null;
  }

  const testId = route.params.testId;

  if (myTestType.value === 'oql') {
    const oqlTestsDict = {
      'from-query': {
        input: myQuery.value.query,
        expectedResponse: myQuery.value.oql,
      },
      'to-query': {
        input: myQuery.value.oql,
        expectedResponse: myQuery.value.query,
      },
    };
    return oqlTestsDict[testId];
  } else if (myTestType.value === 'natlang') {
    return {
      input: myQuery.value.natLang[testId],
      expectedResponse: myQuery.value.query,
    };
  } else {
    throw new Error(`Unknown test type: ${myTestType.value}`);
  }
});

// Lifecycle: fetch query data
onMounted(async () => {
  myQuery.value = await getTestQuery(
    route.params.testSuiteId,
    route.params.queryId
  );
});
</script>