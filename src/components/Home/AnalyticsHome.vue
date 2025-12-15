<template>
  <div class="bg-secondary pt-12 min-h-screen">
    <div class="container mx-auto px-4">
      <div class="w-full">
        <Card class="rounded-lg">
          <CardHeader>
            <CardTitle class="text-2xl">OpenAlex Analytics alpha is paused.</CardTitle>
            <CardDescription>Here's a copy of the email we sent alpha testers on 18 September 2025:</CardDescription>
          </CardHeader>
          <CardContent class="p-8">
                <p>Hi all,</p>
                <p>Thanks for helping us alpha test the new OpenAlex Analytics UI. We’re pausing the alpha, effective now; you’ll no longer be able to use or query the Analytics.</p>
                <p>We’re doing this for two reasons:</p>
                <ul class="ml-8">
                  <li>We’ve learned how expensive it is to answer these complex ad-hoc queries. Our current numbers suggest we’d need to charge you and other users about $50k/yr, and our research indicates there’s no market at this price point (that said, if we’re wrong and you’ve got $50k/yr for this, let us know…our minds can be changed 😁). I think we need to figure out a way to do Analytics more cheaply to make it viable—either use a cheaper technology or support less flexibility. We’ve got some ideas on both counts, but we need time to look into it. Which brings us to…</li>
                  <li>We need to focus on the new OpenAlex rewrite launch over the next few months. This is the biggest project we’ve ever done and we need to really zone in or it’s not going to work. So we’re saying “no” to everything we possibly can in Q4, so that we can say a great big “yes” to making OpenAlex faster, more accurate, and more comprehensive (we’re passing 400M works!).</li>
                </ul>
                <p>We’ll return to Analytics in 2026 with a new approach, probably one integrated more tightly with the existing UI and definitely one taking advantage of our turbocharged new backend architecture.</p>
                <p>In the meantime, if you’ve got tightly-scoped specific needs we can help solve, please let us know. The Analytics alpha is too complex for us right now, but we’re still very interested in taking on funded, scoped work like building dashboards, creating reports, and adding or curating data sources.</p>
                <p>As always, please feel free to get in touch with any questions or feedback. And thanks again for your support!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>


    
    <!-- <v-container class="analytics-home">
      <v-row class="mx-0 d-flex align-center">
        <div class="text-h3">
          Analytics
        </div>
        <new-query-button button-text="Start a Query" :goTo="true" color="primary" size="medium" class="ml-4"/>
        <v-spacer />
        <v-btn size="small" color="white" variant="flat" :href="'https://www.youtube.com/watch?v=tZB_BaRlkRU'" target="_blank">
          <v-icon start >mdi-video-outline</v-icon>
          Watch a Tutorial
        </v-btn>
        <v-btn size="small" color="white" variant="flat" :to="{name: 'AnalyticsDocs'}" class="ml-1">
          <v-icon start >mdi-book-open-outline</v-icon>
          Read the Docs
        </v-btn>
      </v-row>

      <v-row class="mx-0 mt-2">
        <div class="tagline text-h6">
          Query, aggregate, and download across our entire dataset.
        </div>
      </v-row>
      
      <v-row class="examples-header d-flex align-center mt-12 mb-4 mx-1">
        <v-text-field
          v-model="searchQuery"
          label="Search example questions..."
          placeholder=""
          variant="solo"
          flat
          clearable
          rounded
          prepend-inner-icon="mdi-magnify"
          class="search-field flex-grow-1"
          hide-details
          bg-color="white"
        ></v-text-field>
        <v-select
          v-model="selectedFilter"
          :items="filterOptions"
          variant="solo"
          flat
          hide-details
          rounded
          class="ml-4 filter-select"
          bg-color="white"
        ></v-select>
      </v-row>

      <v-row class="example-questions">
        <v-col cols="12" md="6" lg="4" v-for="query in showQueries" :key="query.question">
          <example-query
            :question="query.question"
            :type="query.type"
            :category="query.category"
            :error="query.error"
            :url="query.url"
            :query="query.query"
            @set-filter="(filter) => selectedFilter = filters.titleCase(filter)"
          />
        </v-col>
      </v-row>
    </v-container> -->
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import filters from '@/filters';
import NewQueryButton from '@/components/Misc/NewQueryButton.vue';
import ExampleQuery from '@/components/Home/ExampleQuery.vue';
import { exampleQueries as importedExampleQueries } from './exampleQueriesList';

defineOptions({ name: 'AnalyticsHome' });

const store = useStore();

const exampleQueries = ref(importedExampleQueries);
const searchQuery = ref('');
const selectedFilter = ref('All Questions');
const typeFilter = ref(null);
const categoryFilter = ref(null);
const uiVariant = computed(() => store.state.uiVariant);

const typeTags = computed(() => [...new Set(exampleQueries.value.map(q => q.type))]);
const categoryTags = computed(() => [...new Set(exampleQueries.value.map(q => q.category))]);

const filterOptions = computed(() => {
  const types = typeTags.value.map(tag => ({ title: filters.titleCase(tag), value: { type: tag } }));
  const categories = categoryTags.value.map(tag => ({ title: filters.titleCase(tag), value: { category: tag } }));
  return [{ title: 'All Questions', value: 'All Questions' }, ...types, ...categories];
});

const showQueries = computed(() => {
  let examples = [...exampleQueries.value];

  if (uiVariant.value === 'errors') {
    return examples.filter(q => q.broken);
  }

  examples = examples.filter(q => !q.broken);

  if (searchQuery.value) {
    const searchWords = searchQuery.value.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    examples = examples.filter(q => {
      const searchableText = `${q.question.toLowerCase()} ${q.type.toLowerCase()} ${q.category.toLowerCase()}`;
      return searchWords.every(word => searchableText.includes(word));
    });
  }

  if (selectedFilter.value && selectedFilter.value !== 'All Questions') {
    if (selectedFilter.value.type) {
      examples = examples.filter(q => q.type === selectedFilter.value.type);
    } else if (selectedFilter.value.category) {
      examples = examples.filter(q => q.category === selectedFilter.value.category);
    }
  }

  if (!searchQuery.value && selectedFilter.value === 'All Questions') {
    // Shuffle the examples array using Fisher-Yates algorithm
    for (let i = examples.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [examples[i], examples[j]] = [examples[j], examples[i]];
    }
  }

  return examples;
});

watch(typeFilter, (newValue) => {
  if (newValue && categoryFilter.value) {
    categoryFilter.value = null;
  }
});

watch(categoryFilter, (newValue) => {
  if (newValue && typeFilter.value) {
    typeFilter.value = null;
  }
});
</script>


<style scoped>
p, ul, li {
  margin-bottom: 16px;
}
</style>