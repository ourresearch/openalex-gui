<template>
  <div class="py-2">
    <div class="container mx-auto px-4">
      <Card class="mb-4">
        <CardContent class="pt-6">
          <h2 class="text-xl font-semibold mb-2">{{ route.params.testSuiteId }}</h2>
          <div class="flex items-center gap-4 mb-4">
            <div>{{queries.length}} queries</div>
            <div v-if="passCount > 0" class="text-green-600">
              {{ passCount }} passing
            </div>
            <div v-if="failCount > 0" class="text-red-600">
              {{ failCount }} failing
            </div>
            <div v-if="loadingCount > 0">
              {{ loadingCount }} loading
            </div>
            <div class="flex-1"></div>
            <Button @click="runSearchSuite">Run Queries</Button>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <test-query
          v-for="(query, index) in queries"
          :key="index"
          :config="query"
          :run-search="runSearch"
          @pass="passCount += 1"
          @fail="failCount += 1"
        />
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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