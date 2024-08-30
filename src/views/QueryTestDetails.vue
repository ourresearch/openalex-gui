<template>
  <v-container>
    <v-card flat class="h-100 d-flex flex-column" v-if="selectedTest">
      <v-card-title class="headline d-flex justify-space-between align-center">
        Test Details
        <v-btn
          text
          color="primary"
          :to="'/tests'"
          class="text-none"
        >
          <v-icon left>mdi-format-list-bulleted</v-icon>
          All Tests
        </v-btn>
      </v-card-title>

      <v-divider class="mb-4"></v-divider>

      <v-card-text class="flex-grow-1 d-flex flex-column">
        <v-btn
            color="primary"
            class="mb-4"
            @click="runSingleTest"
            :loading="isRunningTest"
        >
          Run All Test Cases
        </v-btn>

        <div class="mb-2 d-flex align-center">
          <strong class="mr-2">View URL:</strong>
          <a
              :href="`/tests/${objectMD5ShortUUID(selectedTest)}`"
              class="material-link text-decoration-none"
          >
            /tests/{{ objectMD5ShortUUID(selectedTest) }}
          </a>
          <v-btn
              icon
              small
              class="ml-2"
              @click="copyToClipboard(`/tests/${objectMD5ShortUUID(selectedTest)}`, true)"
          >
            <v-icon small>mdi-content-copy</v-icon>
          </v-btn>
        </div>

        <div class="mb-4 d-flex align-center">
          <strong class="mr-2">Run URL:</strong>
          <a
              :href="`/tests/${objectMD5ShortUUID(selectedTest)}/run`"
              class="material-link text-decoration-none"
          >
            /tests/{{ objectMD5ShortUUID(selectedTest) }}/run
          </a>
          <v-btn
              icon
              small
              class="ml-2"
              @click="copyToClipboard(`/tests/${objectMD5ShortUUID(selectedTest)}/run`, true)"
          >
            <v-icon small>mdi-content-copy</v-icon>
          </v-btn>
        </div>

        <div class="mb-4">
          <strong>OQL:</strong>
          <pre class="mt-1 pa-2 grey lighten-4 rounded wrapped-pre">{{
              selectedTest.oql || 'N/A'
            }}</pre>
        </div>

        <div class="mb-4">
          <strong>Tags:</strong>
          <div class="mt-1">
            <v-chip
                v-for="tag in selectedTest.tags || []"
                :key="tag"
                small
                class="mr-1 mb-1"
            >
              {{ tag }}
            </v-chip>
          </div>
        </div>

    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>OQO</v-expansion-panel-header>
        <v-expansion-panel-content>
          <div class="scrollable-content-horizontal full-height-content">
            <pre class="query-text">{{ JSON.stringify(selectedTest.query, null, 2) }}</pre>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-header>Full Test</v-expansion-panel-header>
        <v-expansion-panel-content>
          <div class="scrollable-content-horizontal full-height-content">
            <pre class="full-test-text">{{ JSON.stringify(selectedTest, null, 2) }}</pre>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

        <h3 class="mt-4 mb-2">Results</h3>

        <v-card outlined class="mb-2">
          <v-card-title>natLangToJson</v-card-title>
          <v-card-text>
            <div v-if="currentTestResults && currentTestResults.natLangToJson"
                 class="scrollable-content">
              <v-card
                  v-for="(subTest, index) in currentTestResults.natLangToJson"
                  :key="index"
                  :color="subTest.isPassing ? 'green lighten-4' : 'red lighten-4'"
                  class="mb-2"
              >
                <v-card-text>
                  <div class="font-weight-bold">{{ subTest.prompt }}</div>
                  <div v-if="!subTest.isPassing" class="mt-2">
                    <pre class="error-details">{{
                        JSON.stringify(subTest.details, null, 2)
                      }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </div>
            <span v-else>No results yet</span>
          </v-card-text>
        </v-card>

        <div class="scrollable-content">
          <v-card
              outlined
              class="mb-2"
              :color="resultCardColor('oqlToJson')"
          >
            <v-card-title>oqlToJson</v-card-title>
            <v-card-text>
              <div v-if="currentTestResults && currentTestResults.oqlToJson">
                <div v-if="!currentTestResults.oqlToJson.isPassing">
                  <pre class="error-details">{{
                      JSON.stringify(currentTestResults.oqlToJson.details, null, 2)
                    }}</pre>
                </div>
                <div v-else class="success-message">Test passed successfully
                </div>
              </div>
              <span v-else>No results yet</span>
            </v-card-text>
          </v-card>
        </div>

        <div class="scrollable-content">
          <v-card
              outlined
              class="mb-2"
              :color="resultCardColor('jsonToOql')"
          >
            <v-card-title>jsonToOql</v-card-title>
            <v-card-text>
              <div v-if="currentTestResults && currentTestResults.jsonToOql">
                <div v-if="!currentTestResults.jsonToOql.isPassing">
                  <pre class="error-details">{{
                      JSON.stringify(currentTestResults.jsonToOql.details, null, 2)
                    }}</pre>
                </div>
                <div v-else class="success-message">Test passed successfully
                </div>
              </div>
              <span v-else>No results yet</span>
            </v-card-text>
          </v-card>
        </div>

        <div class="scrollable-content">
          <v-card
              outlined
              class="mb-2"
              :color="resultCardColor('jsonToSearch')"
          >
            <v-card-title>jsonToSearch</v-card-title>
            <v-card-text>
              <div v-if="currentTestResults && currentTestResults.jsonToSearch">
                <div v-if="!currentTestResults.jsonToSearch.isPassing">
                  <pre class="error-details">{{
                      JSON.stringify(currentTestResults.jsonToSearch.details, null, 2)
                    }}</pre>
                </div>
                <div v-else class="success-message">Test passed successfully
                </div>
                <div
                    v-if="currentTestResults.jsonToSearch.details && currentTestResults.jsonToSearch.details.searchId"
                    class="mt-2">
                  <a
                      :href="`https://staging.openalex.org/s/${currentTestResults.jsonToSearch.details.searchId}`"
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                    View Search
                  </a>
                </div>
              </div>
              <span v-else>No results yet</span>
            </v-card-text>
          </v-card>
        </div>

      </v-card-text>
    </v-card>
    <v-card flat v-else>
      <v-card-text>
        Error loading test details. Please try again.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import {getTests, OQOTestRunner} from '@/oqlParse/test';
import {objectMD5ShortUUID} from '@/oqlParse/util';

export default {
  name: "OQOTestDetails",
  props: {
    testId: {
      type: String,
      required: true
    },
    autoRun: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedTest: null,
      testResultsMap: {},
      isRunningTest: false,
      testCasesMap: {
        'natLangToJson': 'natLang',
        'oqlToJson': 'oqlToQuery',
        'jsonToOql': 'queryToOql',
        'jsonToSearch': 'queryToSearch'
      },
    }
  },
  computed: {
    currentTestResults() {
      return this.testResultsMap[this.testId] || null;
    },
  },
  methods: {
    objectMD5ShortUUID,
    resultCardColor(testType) {
      if (this.currentTestResults && this.currentTestResults[testType]) {
        return this.currentTestResults[testType].isPassing ? 'green lighten-4' : 'red lighten-4';
      }
      return ''; // default color
    },
    copyToClipboard(text, prependOrigin = false) {
      if (prependOrigin) text = `${window.location.origin}${text}`;
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    },
    async loadTest() {
      try {
        const tests = await getTests();
        this.selectedTest = tests.find(test => objectMD5ShortUUID(test) === this.testId);

        if (this.selectedTest && this.autoRun) {
          await this.runSingleTest();
        }
      } catch (error) {
        console.error('Error loading test:', error);
      }
    },
    async runSingleTest() {
      if (!this.selectedTest) {
        console.error('No test selected to run');
        return;
      }

      this.isRunningTest = true;
      try {
        const runner = new OQOTestRunner([this.selectedTest], this.updateTestResult);
        await runner.runTests(['natLang', 'oqlToQuery', 'queryToOql', 'queryToSearch']);
      } catch (error) {
        console.error('Error running single test:', error);
      } finally {
        this.isRunningTest = false;
      }
    },
    updateTestResult(testResult) {
      const testId = testResult.id;
      let results = this.testResultsMap[testId] || {
        natLangToJson: null,
        oqlToJson: null,
        jsonToOql: null,
        jsonToSearch: null
      };

      if (testResult.case === 'natLang') {
        results.natLangToJson = testResult.subTests;
      } else {
        const resultKey = Object.keys(this.testCasesMap).find(key => this.testCasesMap[key] === testResult.case);
        if (resultKey) {
          results[resultKey] = {
            isPassing: testResult.isPassing,
            details: testResult.details
          };
        }
      }

      this.$set(this.testResultsMap, testId, results);
    },
  },
  created() {
    this.loadTest();
  },
}
</script>

<style scoped>
.scrollable-content-horizontal {
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  padding-bottom: 8px;
}

.full-height-content {
  max-height: none !important;
  height: auto !important;
}

.wrapped-pre, .query-text, .full-test-text, .error-details {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* Remove max-height for query-text and full-test-text */
.query-text, .full-test-text {
  max-height: none !important;
  height: auto !important;
  overflow-y: visible !important;
}

.error-details {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.success-message {
  color: #1b5e20;
  font-weight: bold;
}

/* Add some padding to the expansion panel content */
.v-expansion-panel-content__wrap {
  padding: 12px;
}
</style>