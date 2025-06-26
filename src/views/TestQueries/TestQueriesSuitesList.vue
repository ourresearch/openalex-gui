<template>
  <div class="color-2 py-12">
    <v-container>
      <v-row>
        <v-col cols="12" md="6" lg="4" v-for="test in tests" :key="test.id">
          <v-card 
            class="clickable rounded-o" 
            rounded 
            flat
            :to="`/tests/${test.id}`">
            <v-card-title>
              {{ test.title }}  
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
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