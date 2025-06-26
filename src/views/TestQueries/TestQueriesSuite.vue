<template>
  <div class="color-2 py-2">
    <v-container v-if="queries.length">
      <div class="d-flex align-center pa-3">
        <div>
          <div>
            {{queries.length}} queries
          </div>
          <div v-if="passCount > 0" class="text-success">
            {{ passCount }} passing
          </div>
          <div v-if="failCount > 0" class="text-error">
            {{ failCount }} failing
          </div>
          <div v-if="loadingCount > 0" class="">
            {{ loadingCount }} loading
          </div>
        </div>
        <v-spacer/>
        <v-btn color="primary" @click="runSearchSuite">Run Queries</v-btn>
      </div>
      <v-row dense>
        <v-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          v-for="(query, index) in queries"
          :key="index"
        >
          <test-query
            :config="query"
            :run-search="runSearch"
            @pass="passCount += 1"
            @fail="failCount += 1"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import TestQuery from '@/components/TestQuery/TestQuery.vue';
import { getTestSuite } from '@/components/TestQuery/tests';

defineOptions({ name: 'TestQueriesSuite' });

const route = useRoute();

const runSearch = ref(0);
const passCount = ref(0);
const failCount = ref(0);
const queries = ref([]);

const completeCount = computed(() => passCount.value + failCount.value);
const testsCount = computed(() => queries.value.length);
const loadingCount = computed(() =>
  runSearch.value ? testsCount.value - completeCount.value : 0
);

// Methods
function runSearchSuite() {
  passCount.value = 0;
  failCount.value = 0;
  runSearch.value += 1;
}

// Fetch test suite queries on mount
onMounted(async () => {
  const result = await getTestSuite(route.params.testSuiteId);
  queries.value = result;
});
</script>