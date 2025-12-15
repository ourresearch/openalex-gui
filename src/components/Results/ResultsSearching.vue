<template>
  <div class="w-full">
    <div class="box flex justify-center mt-20 min-h-[200px]">
      <div v-if="!isSearchCanceled" class="loading-wrapper w-[550px] max-w-[95%]">
        <div class="message-container my-2">
          <div class="msg text-lg font-bold italic text-muted-foreground">Searching...</div>
          <div v-if="currentMessage" class="submsg text-sm text-muted-foreground mt-0.5 opacity-90">{{ currentMessage }}</div>
        </div>
        <Progress
          :key="elapsedTime === 0 ? 'reset' : 'progress'"
          :model-value="progressValue"
          class="h-2 w-full"
        />
        <Button variant="outline" size="sm" class="mt-2" @click="cancelSearch">Cancel</Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import _ from 'lodash';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

defineOptions({ name: 'ResultsSearching' });

const store = useStore();

const elapsedTime = ref(0); // in milliseconds
const timer = ref(null);
const progressValue = ref(0);

const messages = {
  0: "We're crunching the numbers in real time for you.",
  4: "Each query involves calculations on hundreds of millions of papers.",
  10: "We do the math and aggregations so you don't have to.",
  16: "The processing we're doing right now is not something you want to do yourself.",
  22: "Have you tried opening a hundred million rows in Excel lately?",
  30: "This is taking longer than usual, but we're still searching.",
  40: "We're still searching. Your query has been reported to our developers for improvement."
};

// Computed properties
const isSearchCanceled = computed(() => store.getters['search/isSearchCanceled']);
const query = computed(() => store.getters['search/query']);

const currentMessage = computed(() => {
  const seconds = Math.floor(elapsedTime.value / 1000);
  const timePoints = Object.keys(messages)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const time of timePoints) {
    if (seconds >= time) {
      return messages[time];
    }
  }
  return null;
});

// Methods
const setIsSearchCanceled = (value) => store.commit('search/setIsSearchCanceled', value);

const cancelSearch = () => {
  setIsSearchCanceled(true);
  clearTimer();
  resetTimer();
};

const startTimer = () => {
  timer.value = setInterval(() => {
    elapsedTime.value += 50;
    progressValue.value = (1 - 1 / Math.pow(2, elapsedTime.value / 10000)) * 90;
  }, 50);
};

const resetTimer = () => {
  elapsedTime.value = 0;
  progressValue.value = 0;
};

const clearTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

const restartTimer = () => {
  clearTimer();
  resetTimer();
  startTimer();
};

// Lifecycle hooks
onMounted(() => {
  console.log("Mounted, starting timer");
  startTimer();
});

onBeforeUnmount(() => {
  clearTimer();
});

// Watchers
watch(query, (to, from) => {
  if (!_.isEqual(to.value, from.value)) {
    restartTimer();
  }
});

watch(isSearchCanceled, (to, from) => {
  if (from === true && to === false) {
    restartTimer();
  }
});
</script>


<style scoped lang="scss">
* {
  color: #666;
}
.box {
  margin-top: 80px;
  margin-left: 0px;
  min-height: 200px;
  justify-content: center;
}
.loading-wrapper {
  width: 550px;
  max-width: 95%;
}
.message-container {
  margin-top: 8px;
  margin-bottom: 8px;
}
.msg {
  font-size: 17px;
  font-weight: bold;
  font-style: italic;
}
.submsg {
  opacity: 0.9;
  margin-top: 2px;
  font-size: 14px;
}
</style>