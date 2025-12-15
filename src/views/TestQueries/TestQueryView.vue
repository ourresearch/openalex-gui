<template>
  <div class="py-2">
    <div class="container mx-auto px-4">
      <div class="mb-4">
        <Button @click="runSearch += 1">Run Query</Button>
      </div>
      <test-query
        v-if="myQueryConfig"
        :config="myQueryConfig"
        :run-search="runSearch"
      />
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { Button } from '@/components/ui/button';

import TestQuery from '@/components/TestQuery/TestQuery.vue';
import { getTestQuery } from '@/components/TestQuery/tests.js';

defineOptions({
  name: 'TestQueryView',
});

const route = useRoute();

// State
const runSearch = ref(0);
const myQueryConfig = ref(null);

// Fetch test query config
onMounted(async () => {
  const result = await getTestQuery(
    route.params.testSuiteId,
    route.params.queryId
  );
  myQueryConfig.value = result;
});
</script>