<template >
  <v-container fluid>
  <v-row class="box">
    <div class="loading-wrapper">
      <v-progress-circular indeterminate size="45" style="flex-shrink: 0;"/>
      <div class="message-container">
        <div class="msg">Searching...</div>
        <div v-if="currentMessage" class="submsg">{{ currentMessage }}</div>
      </div>
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
      elapsedTime: 0,
      timer: null,
      messages: {
        2: "We're crunching the numbers in real time for you.",
        6: "Each query involves calculations on hundreds of millions of papers.",
        12: "We do the math and aggregations so you don't have to.",
        17: "Believe us, the processing we're doing right now is not something you want to do yourself.",
        22: "Have you tried opening a hundred million rows in Excel lately?",
        30: "This is taking longer than usual, but we're still searching.",
        40: "We're still searching. Your query has been reported to our developers for improvement."
      }
    }
  },
  computed: {
    ...mapGetters("search", ["query"]),
    currentMessage() {
      const timePoints = Object.keys(this.messages)
        .map(Number)
        .sort((a, b) => b - a);
      
      for (const time of timePoints) {
        if (this.elapsedTime >= time) {
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
        this.elapsedTime++;
      }, 1000);
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
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
  position: relative;
  display: flex;
  justify-content: left;
  width: 450px;
}
.message-container {
  margin-left: 16px;
  margin-top: 8px;
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