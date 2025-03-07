<template >
  <v-container fluid>
  <v-row class="box">
    <div class="loading-wrapper">
      <div class="message-container">
        <div class="msg">Searching...</div>
        <div v-if="currentMessage" class="submsg">{{ currentMessage }}</div>
      </div>
      <v-progress-linear
        :key="elapsedTime === 0 ? 'reset' : 'progress'"
        :value="progressValue"
        height="8"
        rounded
        color="primary"
        style="width: 100%"
        :active="true"
      />
    </div>
  </v-row>
  </v-container>
</template>

<script>
import {mapGetters} from "vuex";

export default {
  name: "ResultsSearching",
  data() {
    return {
      elapsedTime: 0, // in milliseconds
      timer: null,
      progressValue: 0,
      messages: {
        0: "We're crunching the numbers in real time for you.",
        4: "Each query involves calculations on hundreds of millions of papers.",
        10: "We do the math and aggregations so you don't have to.",
        16: "The processing we're doing right now is not something you want to do yourself.",
        22: "Have you tried opening a hundred million rows in Excel lately?",
        30: "This is taking longer than usual, but we're still searching.",
        40: "We're still searching. Your query has been reported to our developers for improvement."
      }
    }
  },
  computed: {
    ...mapGetters("search", ["query"]),
    currentMessage() {
      const seconds = Math.floor(this.elapsedTime / 1000);
      const timePoints = Object.keys(this.messages)
        .map(Number)
        .sort((a, b) => b - a);
      
      for (const time of timePoints) {
        if (seconds >= time) {
          return this.messages[time];
        }
      }
      return null;
    }
  },
  mounted() {
    this.startTimer();
  },
  beforeDestroy() {
    this.stopTimer();
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        this.elapsedTime += 50;
        this.progressValue = (1 - 1 / Math.pow(2, this.elapsedTime / 10000)) * 90;
      }, 50);
    },
    resetTimer() {
      this.elapsedTime = 0;
      this.progressValue = 0;
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  },
  watch: {
    $route(to, from) {
      if (to.params.id !== from.params.id) {
        this.resetTimer();
      }
    }
  }
}

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