<template>
  <div class="py-12">
    <v-container>
      <div class="text-h5">Test query suites</div>
      <v-list>
        <v-list-item
          v-for="test in tests"
          :key="test.id"
          :to="`/tests/${test.id}`"
        >
          <v-list-item-title>
            {{ test.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-container>
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