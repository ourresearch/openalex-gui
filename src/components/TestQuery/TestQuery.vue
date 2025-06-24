<template>
  <div class="">
   <v-card
      rounded
      flat
      border
      class="fill-height d-flex flex-column"
      style="max-width: 500px"
      :loading="status === 'loading' ? 'grey lighten-2' : undefined"
    >

    <div v-if="config.title" class="pa-3" style="margin-bottom: -20px">
      {{config.title}}
    </div>

    <div class=" monospace text-body-2 pa-3">
      <span v-if="status === 'pass'" class="text-success">
        {{ config.oql }}
      </span>
      <span v-else-if="status === 'fail'" class="text-error">
        {{ config.oql }}
      </span>
      <span v-else class="text-grey">{{ config.oql }}</span>
    </div>

    <div class=" monospace text-body-2 pa-3">
      <span v-if="isSearchPassing === true" class="text-success">{{ returnData.meta.count }} results</span>
      <span v-else-if="returnData?.meta.count === 0" class="text-error">{{ returnData.meta.count }} results</span>
      <span v-else-if="searchError" class="text-error">{{ searchError }}</span>
    </div>

    <div class=" monospace text-body-2 pa-3" v-if="returnData?.timestamps?.duration">
      <span class="text-success">{{ filters.toPrecision(returnData.timestamps.duration, 3) }} seconds</span>
    </div>

    <div v-if="config.error" class="monospace text-body-2 pa-3">
      <span class="text-error"><b>Note:</b> {{ config.error }}</span>
    </div>

    <div class="fill-height"></div>

    <div class="px-3 pt-1  d-flex">
      <template v-if="config.oql">
        <test-query-oql
            v-for="test in oqlTests"
            :key="test.id"
            :input="test.input"
            :expected-response="test.expectedResponse"
            :test-suite-id="$route.params.testSuiteId"
            :query-id="config.id"
            :test-id="test.id"
            icon
            :runTest="runSearch+1"
            @pass="passCount += 1"
            @fail="failCount += 1"
        />
      </template>

      <v-tooltip
          location="bottom"
          :color="searchTestColor"
          max-width="300"
          v-if="runSearch"
      >
        <template v-slot:activator="{ props }">
          <v-btn
              size="small"
              icon
              v-bind="props"
              :color="searchTestColor"
              :disabled="!isSearchTestComplete"
              :href="'/s/' + searchId"
              target="_blank"
          >
            <v-icon v-if="isSearchPassing === null">mdi-timer-sand</v-icon>
            <v-icon v-else>mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>
          <span v-if="isSearchPassing">
            <span class="font-weight-bold">Search passed</span>
            (click to view)
          </span>
          <span v-else-if="searchError">
              <span class="font-weight-bold">Search Error:</span>
              {{ searchError }}
          </span>
          <span v-else>
            <span class="font-weight-bold">Search failed:</span> no results.
          </span>
        </span>
      </v-tooltip>
      <v-spacer/>
      <v-btn icon :to="`/tests/${$route.params.testSuiteId}/${config.id}`">
        <v-icon>mdi-link</v-icon>
      </v-btn>

    </div>
  </v-card>
</div>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import { api } from '@/api';
import filters from '@/filters';
import TestQueryOql from '@/components/TestQuery/TestQueryOql.vue';

defineOptions({
  name: 'TestQuery',
});

const props = defineProps({
  config: Object,
  runSearch: Number,
});

const emit = defineEmits(['pass', 'fail']);

// State
const failCount = ref(0);
const passCount = ref(0);
const searchId = ref(null);
const isSearchPassing = ref(null);
const searchError = ref(null);
const returnData = ref(null);


// Computed
const status = computed(() => {
  return loadingCount.value
    ? 'loading'
    : failCount.value
      ? 'fail'
      : 'pass';
});

const testsCount = computed(() => {
  const oqlCount = props.config.oql ? 2 : 0;
  const searchCount = props.runSearch ? 1 : 0;
  return oqlCount + searchCount;
});

const completeCount = computed(() => failCount.value + passCount.value);

const loadingCount = computed(() => {
  return Math.max(testsCount.value - completeCount.value, 0);
});

const oqlTests = computed(() => [
  {
    id: 'from-query',
    input: props.config.query,
    expectedResponse: props.config.oql,
  },
  {
    id: 'to-query',
    input: props.config.oql,
    expectedResponse: props.config.query,
  },
]);

const isSearchTestComplete = computed(() => isSearchPassing.value !== null);

const searchTestColor = computed(() => {
  if (!isSearchTestComplete.value) return 'grey';
  return isSearchPassing.value ? 'success' : 'error';
});

// Methods
async function createSearch() {
  try {
    const resp = await api.createSearch(props.config.query, {
      bypass_cache: true,
      is_test: true,
    });
    searchId.value = resp.data.id;
  } catch (e) {
    isSearchPassing.value = false;
    searchError.value = 'Could not create search: ' + e;
    searchId.value = null;
  }
}

async function getSearch() {
  console.log('getSearch: ' + searchId.value);
  const resp = await api.getSearch(searchId.value, { is_test: true });

  if (resp.is_completed) {
    returnData.value = resp;

    if (resp.backend_error) {
      isSearchPassing.value = false;
      searchError.value = resp.backend_error;
    } else if (props.config.expectsZeroResults && resp.results.length === 0) {
      isSearchPassing.value = true;
    } else if (resp.results.length === 0) {
      isSearchPassing.value = false;
    } else {
      isSearchPassing.value = true;
    }
  }
}

async function pollSearch() {
  if (!searchId.value) {
    isSearchPassing.value = false;
    return;
  }
  await getSearch();
  if (isSearchPassing.value === null) {
    setTimeout(() => {
      pollSearch();
    }, 500);
  }
}

function run() {
  passCount.value = 0;
  failCount.value = 0;
  searchId.value = null;
  isSearchPassing.value = null;
  searchError.value = null;
  returnData.value = null;

  if (props.runSearch) {
    runSearchMethod();
  }
}

async function runSearchMethod() {
  await createSearch();
  pollSearch();
}

// Lifecycle
onBeforeMount(() => {
  if (!props.config) throw new Error('config prop is required');
  run();
});

watch(
  () => props.runSearch,
  (newVal) => {
    if (newVal) {
      run();
    }
  },
  { immediate: true }
);

watch(isSearchPassing, (newVal) => {
  if (newVal === true) {
    passCount.value += 1;
  } else if (newVal === false) {
    failCount.value += 1;
  }
});

watch(loadingCount, (newVal) => {
  if (newVal === 0) {
    emit(failCount.value === 0 ? 'pass' : 'fail');
  }
});
</script>

<style scoped lang="scss">

</style>