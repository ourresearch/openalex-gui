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

<script>

import _ from "lodash";
import axios from "axios";
import {api} from "@/api";

export default {
  name: "TestQueryNatLang",
  components: {},
  props: {
    input: String,
    expectedResponse: Object,
    queryId: Number,
    testId: Number,
    icon: Boolean,
  },
  data() {
    return {
      foo: 42,
      actualResponse: null,
    }
  },
  computed: {
    isTestComplete() {
      return this.isTestPassing !== null
    },
    testColor() {
      if (this.isTestPassing === null) {
        return "grey"
      }
      return this.isTestPassing ? "green" : "red"
    },
    isTestPassing() {
      if (this.actualResponse === null) {
        return null
      }
      return _.isEqual(this.actualResponse, this.expectedResponse)
    },
    testStatus() {
      if (this.isTestPassing === null) {
        return "running"
      }
      return this.isTestPassing ? "passing" : "failing"
    },
    loadingColor() {
      return this.testStatus === "running" ? "grey" : undefined
    },
  },
  methods: {
    async run() {
      console.log("run natlang test", this.input);
      const url = `${api.apiBaseUrl()}}/text/oql?natural_language=${this.input}&mailto=team@ourresearch.org`;

      // const randomTimeToSleep = Math.random() * 10000
      // await sleep(randomTimeToSleep)

      try {
        const resp = await axios.get(url);
        this.actualResponse = resp.data
      } catch (e) {
        // console.error("got error back from natlang test", e)
        this.actualResponse = "error: " + e
      }
    },


  },
  created() {
  },
  mounted() {
    this.run()
  },
  watch: {
    isTestPassing(newVal){
      this.$emit(newVal ? "pass" : "fail")
    }
  }
}
</script>

<style scoped lang="scss">

</style>