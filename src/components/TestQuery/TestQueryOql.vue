<template>
  <div>
    <v-tooltip
        v-if="icon"
        bottom
        :color="testColor"
        max-width="300"
    >
      <template v-slot:activator="{ on }">
        <v-btn
            small
            icon
            v-on="on"
            :color="testColor"
            :to="`/test-queries/${queryId}/oql/${testId}`"
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
          <v-icon v-if="isTestPassing" left color="success">mdi-check-circle</v-icon>
          <v-icon v-else left color="error">mdi-close-circle</v-icon>
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

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {sleep} from "@/util";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";

export default {
  name: "Template",
  components: {},
  props: {
    input: [String, Object],
    expectedResponse: [Object, String],

    queryId: Number,
    testId: String,

    icon: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
    isTestComplete() {
      return this.isTestPassing !== null
    },
    testColor() {
      return this.isTestPassing ? "green" : "red"
    },
    actualResponse() {
      if (this.testId === 'from-query') {
        return queryToOQL(this.input)
      } else if (this.testId === 'to-query') {
        return oqlToQuery(this.input)
      } else {
        throw new Error(`Unknown OQL testId: ${this.testId}`)
      }
    },
    isTestPassing() {
      return _.isEqual(this.actualResponse, this.expectedResponse)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>