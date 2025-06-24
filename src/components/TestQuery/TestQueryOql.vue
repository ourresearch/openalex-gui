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
            :to="`/tests/${testSuiteId}/${queryId}/oql/${testId}`"
        >
          <v-icon>mdi-code-parentheses-box</v-icon>
        </v-btn>
      </template>
      <div>
        <div class="">{{ testId }}</div>
      </div>
    </v-tooltip>
    <v-container v-else>
      <v-alert
          text
          rounded
          :color="testColor"
      >
        <v-icon v-if="isTestPassing" start color="success">mdi-check-circle</v-icon>
        <v-icon v-else start color="error">mdi-close-circle</v-icon>
        {{ isTestPassing ? 'Passing' : 'Failing' }}
      </v-alert>


      <template v-if="testId === 'to-query'">
        <v-row dense>
          <v-col cols="12">
            <v-card flat rounded>
              <v-card-title>Input</v-card-title>
              <v-card-text class="monospace">
                {{ input }}
              </v-card-text>
            </v-card>
          </v-col>
          <v-col>
            <v-card flat rounded>
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
      </template>

      <template v-else>
        <v-row dense>
          <v-col>
            <v-card flat rounded>
              <v-card-title>Input</v-card-title>
              <v-card-text class="monospace">
                <pre>{{ input }}</pre>

              </v-card-text>
            </v-card>
          </v-col>
          <v-col>
            <v-card flat rounded>
              <v-card-title>Output</v-card-title>
              <v-card-text class="monospace">
                {{ actualResponse }}
              </v-card-text>
            </v-card>
            <v-card flat rounded class="mt-3">
              <v-card-title>Expected</v-card-title>
              <v-card-text class="monospace">
                {{ expectedResponse }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>

    </v-container>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import _ from 'lodash';
import { oqlToQuery, queryToOQL } from '@/oqlParse/oqlParse';

defineOptions({
  name: 'TestQueryOql',
});

const props = defineProps({
  input: [String, Object],
  expectedResponse: [Object, String],
  queryId: Number,
  testId: String,
  testSuiteId: String,
  icon: Boolean,
  runTest: Number,
});

const emit = defineEmits(['pass', 'fail']);

// Computed: transform input to actual response
const actualResponse = computed(() => {
  try {
    if (props.testId === 'from-query') {
      return queryToOQL(props.input);
    } else if (props.testId === 'to-query') {
      return oqlToQuery(props.input);
    } else {
      throw new Error(`Unknown OQL testId: ${props.testId}`);
    }
  } catch (e) {
    console.log(e.stack);
    return `test threw error: "${e.message}"`;
  }
});

// Equality check (trimming trailing semicolons if strings)
const isTestPassing = computed(() => {
  const expected = typeof props.expectedResponse === 'string'
    ? props.expectedResponse.trim().replace(/;$/, '')
    : props.expectedResponse;

  const actual = typeof actualResponse.value === 'string'
    ? actualResponse.value.trim().replace(/;$/, '')
    : actualResponse.value;

  return _.isEqual(actual, expected);
});

const testColor = computed(() => (isTestPassing.value ? 'green' : 'red'));

// Emit result when requested
function runEvaluation() {
  emit(isTestPassing.value ? 'pass' : 'fail');
}

// Watch runTest trigger
watch(
  () => props.runTest,
  (newVal) => {
    if (newVal) runEvaluation();
  },
  { immediate: true }
);
</script>