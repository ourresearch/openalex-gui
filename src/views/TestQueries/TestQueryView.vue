<template>
  <div class="py-2">
    <v-container>
    <div>
      <v-btn color="primary" class="ma-4" @click="runSearch += 1">Run Query</v-btn>
    </div>
    <test-query
      v-if="myQueryConfig"
      :config="myQueryConfig"
      :run-search="runSearch"
    />
    </v-container>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

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