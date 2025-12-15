<template>
  <div class="py-12">
    <div class="container mx-auto px-4">
      <h2 class="text-xl font-semibold mb-4">Test query suites</h2>
      <div class="space-y-1">
        <router-link
          v-for="test in tests"
          :key="test.id"
          :to="`/tests/${test.id}`"
          class="block px-4 py-3 rounded-md hover:bg-accent transition-colors"
        >
          {{ test.title }}
        </router-link>
      </div>
    </div>
  </div>
</template>


<script setup>
defineOptions({ name: 'TestQueriesSuitesList' });

const tests = [
  {title: 'Main', id: 'main'},
  {title: 'Landing Page', id: 'landing_page'},
  {title: 'All Columns', id: 'all_columns'},
  {title: 'Disjunctions', id: 'disjunctions'},
  {title: 'Labels', id: 'labels'},
]
</script>