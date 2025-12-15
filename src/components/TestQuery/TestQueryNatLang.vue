<template>
  <div>
    <Tooltip v-if="icon">
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          :class="testColor === 'green' ? 'text-green-600' : testColor === 'red' ? 'text-red-600' : 'text-muted-foreground'"
          as="router-link"
          :to="`/test-queries/${queryId}/natlang/${testId}`"
        >
          <Timer v-if="testStatus === 'running'" class="h-4 w-4" />
          <MessageSquareText v-else class="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent class="max-w-[300px]">
        <span>{{ input }}</span>
      </TooltipContent>
    </Tooltip>

    <div v-else class="container mx-auto p-4">
      <Alert :class="testColor === 'green' ? 'border-green-500' : testColor === 'red' ? 'border-red-500' : ''">
        <Loader2 v-if="testStatus === 'running'" class="h-4 w-4 animate-spin" />
        <CheckCircle v-else-if="testStatus === 'passing'" class="h-4 w-4 text-green-600" />
        <XCircle v-else-if="testStatus === 'failing'" class="h-4 w-4 text-red-600" />
        <AlertDescription>{{ testStatus }}</AlertDescription>
      </Alert>

      <div class="mt-4">
        <Card>
          <CardHeader><CardTitle>Input</CardTitle></CardHeader>
          <CardContent class="font-mono">{{ input }}</CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader><CardTitle>Output</CardTitle></CardHeader>
          <CardContent>
            <Loader2 v-if="testStatus === 'running'" class="h-4 w-4 animate-spin" />
            <pre v-else class="text-sm">{{ actualResponse }}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expected</CardTitle></CardHeader>
          <CardContent><pre class="text-sm">{{ expectedResponse }}</pre></CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import _ from 'lodash';
import axios from 'axios';

import { Timer, MessageSquareText, Loader2, CheckCircle, XCircle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
  const url = `${api.apiBaseUrl()}/text/oql?natural_language=${props.input}&mailto=ui@openalex.org`;

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