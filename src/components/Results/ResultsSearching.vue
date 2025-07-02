<template >
  <v-container fluid>
    <v-row class="box">
      <div v-if="!isSearchCanceled" class="loading-wrapper">
        <div class="message-container">
          <div class="msg">Searching...</div>
          <div v-if="currentMessage" class="submsg">{{ currentMessage }}</div>
        </div>
        <v-progress-linear
          :key="elapsedTime === 0 ? 'reset' : 'progress'"
          :model-value="progressValue"
          height="8"
          rounded
          color="primary"
          style="width: 100%"
          :active="true"
        />
        <v-btn class="mt-2" size="small" variant="tonal" @click="cancelSearch">Cancel</v-btn>
      </div>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import _ from 'lodash';

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