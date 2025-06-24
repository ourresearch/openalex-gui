<template>
  <div>
    <v-tooltip
        v-if="icon"
        location="bottom"
        :color="testColor"
        max-width="300"
    >
      <template v-slot:activator="{ props }">
        <v-btn
            size="small"
            icon
            v-bind="props"
            :color="testColor"
            :to="`/test-queries/${queryId}/natlang/${testId}`"

        >
          <v-icon v-if="testStatus === 'running'">mdi-timer-sand</v-icon>
          <v-icon v-else>mdi-message-text</v-icon>
        </v-btn>
      </template>
      <span>
          <span>{{ input }}</span>
        </span>
    </v-tooltip>
    <v-container v-else>
      <div>
        <v-alert
            text
            rounded
            :color="testColor"
        >
          <v-progress-circular indeterminate size="20" v-if="testStatus === 'running'" class="mr-2" />
          <v-icon v-else-if="testStatus==='passing'" start color="success">mdi-check-circle</v-icon>
          <v-icon v-else-if="testStatus==='failing'" start color="error">mdi-close-circle</v-icon>
          {{ testStatus }}
        </v-alert>
      </div>
      <v-row dense>
        <v-col>
          <v-card flat rounded>
            <v-card-title>Input</v-card-title>
            <v-card-text class="monospace">
              {{ input }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-card flat rounded :loading="loadingColor">
            <v-card-title>Output</v-card-title>
            <v-card-text>
              <pre>{{ actualResponse }}</pre>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col>
          <v-card flat rounded>
            <v-card-title>Expected</v-card-title>
            <v-card-text>
              <pre>{{ expectedResponse }}</pre>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import _ from 'lodash';
import axios from 'axios';
import { api } from '@/api';

defineOptions({
  name: 'TestQueryNatLang',
});

const props = defineProps({
  input: String,
  expectedResponse: Object,
  queryId: Number,
  testId: Number,
  icon: Boolean,
});

const emit = defineEmits(['pass', 'fail']);

// State
const actualResponse = ref(null);

// Computed
const isTestPassing = computed(() => {
  if (actualResponse.value === null) return null;
  return _.isEqual(actualResponse.value, props.expectedResponse);
});

const testColor = computed(() => {
  if (isTestPassing.value === null) return 'grey';
  return isTestPassing.value ? 'green' : 'red';
});

const testStatus = computed(() => {
  if (isTestPassing.value === null) return 'running';
  return isTestPassing.value ? 'passing' : 'failing';
});

const loadingColor = computed(() => testStatus.value === 'running' ? 'grey' : undefined);

// Methods
async function run() {
  console.log('run natlang test', props.input);
  const url = `${api.apiBaseUrl()}/text/oql?natural_language=${props.input}&mailto=team@ourresearch.org`;

  try {
    const resp = await axios.get(url);
    actualResponse.value = resp.data;
  } catch (e) {
    actualResponse.value = 'error: ' + e;
  }
}

// Lifecycle
onMounted(() => {
  run();
});

// Watchers
watch(isTestPassing, (newVal) => {
  if (newVal === true) emit('pass');
  else if (newVal === false) emit('fail');
});
</script>