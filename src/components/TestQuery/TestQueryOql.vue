<template>
  <div>
    <Tooltip v-if="icon">
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          :class="testColor === 'green' ? 'text-green-600' : 'text-red-600'"
          as="router-link"
          :to="`/tests/${testSuiteId}/${queryId}/oql/${testId}`"
        >
          <Braces class="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent class="max-w-[300px]">
        <div>{{ testId }}</div>
      </TooltipContent>
    </Tooltip>

    <div v-else class="container mx-auto p-4">
      <Alert :class="testColor === 'green' ? 'border-green-500' : 'border-red-500'">
        <CheckCircle v-if="isTestPassing" class="h-4 w-4 text-green-600" />
        <XCircle v-else class="h-4 w-4 text-red-600" />
        <AlertDescription>{{ isTestPassing ? 'Passing' : 'Failing' }}</AlertDescription>
      </Alert>

      <template v-if="testId === 'to-query'">
        <div class="grid gap-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent class="font-mono">{{ input }}</CardContent>
          </Card>
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Output</CardTitle></CardHeader>
              <CardContent><pre class="text-sm">{{ actualResponse }}</pre></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Expected</CardTitle></CardHeader>
              <CardContent><pre class="text-sm">{{ expectedResponse }}</pre></CardContent>
            </Card>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent class="font-mono"><pre class="text-sm">{{ input }}</pre></CardContent>
          </Card>
          <div class="space-y-4">
            <Card>
              <CardHeader><CardTitle>Output</CardTitle></CardHeader>
              <CardContent class="font-mono">{{ actualResponse }}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Expected</CardTitle></CardHeader>
              <CardContent class="font-mono">{{ expectedResponse }}</CardContent>
            </Card>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import _ from 'lodash';

import { Braces, CheckCircle, XCircle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    if (newVal) { runEvaluation(); }
  },
  { immediate: true }
);
</script>