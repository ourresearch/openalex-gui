<template>
  <v-container>
    <v-card flat>
      <v-card-title class="text-h4 justify-center">
        OQO Tests
      </v-card-title>

      <v-card-text>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
                v-model="selectedTests"
                :items="availableTests"
                label="Select cases to run"
                multiple
                chips
                persistent-hint
                hint="Choose one or more cases"
                :disabled="isLoading"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
                v-model="selectedTags"
                :items="availableTags"
                label="Select tags to run"
                multiple
                chips
                persistent-hint
                hint="Choose one or more tags"
                :disabled="isLoading"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-row no-gutters class="mb-4">
              <v-col cols="12" class="text-center">
                <div class="text-h6">
                  % Passing: {{ passingPercentage }}
                </div>
              </v-col>
            </v-row>
            <v-row no-gutters class="mt-2">
              <v-col cols="6" class="pr-1">
                <v-btn
                    color="primary"
                    block
                    @click="runTests"
                    :disabled="(!selectedTests.length && !selectedTags.length) || isLoading"
                    :loading="isLoading"
                >
                  Run Tests
                </v-btn>
              </v-col>
              <v-col cols="6" class="pl-1">
                <v-btn
                    color="secondary"
                    block
                    @click="clearResults"
                >
                  Clear
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-data-table
            v-model="selected"
            :headers="headers"
            :items="filteredTableItems"
            item-key="id"
            show-select
            class="elevation-1 mt-4"
            :disable-pagination="false"
            :hide-default-footer="false"
            :items-per-page="-1"
        >
          <template v-slot:item.test="{ item }">
        <span
            class="primary--text text-decoration-underline"
            style="cursor: pointer;"
            @click="showInfoPane(item.id)"
        >
          {{ item.test.oql }}
        </span>
          </template>
          <template v-slot:item.tags="{ item }">
            <v-chip
                v-for="(tag, index) in item.test.tags"
                :key="index"
                small
                class="mr-1 mb-1"
            >
              {{ tag }}
            </v-chip>
          </template>
          <template v-slot:item.natLangToJson="{ item }">
            <nat-lang-to-json-cell
                :value="item.natLangToJson"
                :testObject="item.test"
                @show-details="showTestDetails"
                :loading="isLoadingCell(item.id, 'natLang')"
            />
          </template>
          <template v-slot:item.oqlToJson="{ item }">
            <test-result-cell
                :value="item.oqlToJson.isPassing"
                :loading="isLoadingCell(item.id, 'oqlToQuery')"
                :testObject="item.test"
                :details="item.oqlToJson.details"
                @show-details="showTestDetails"
            />
          </template>
          <template v-slot:item.jsonToOql="{ item }">
            <test-result-cell
                :value="item.jsonToOql.isPassing"
                :loading="isLoadingCell(item.id, 'queryToOql')"
                :testObject="item.test"
                :details="item.jsonToOql.details"
                @show-details="showTestDetails"
            />
          </template>
          <template v-slot:item.jsonToSearch="{ item }">
            <test-result-cell
                :value="item.jsonToSearch.isPassing"
                :loading="isLoadingCell(item.id, 'queryToSearch')"
                :testObject="item.test"
                :details="item.jsonToSearch.details"
                :isJsonToSearch="true"
                @show-details="showTestDetails"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showJsonDialog" max-width="800px">
      <v-card>
        <v-card-title>
          Full Test JSON
          <v-spacer></v-spacer>
          <v-btn icon @click="showJsonDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container style="max-height: 600px; overflow-y: auto;">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">{{
                JSON.stringify(selectedTestJson, null, 2)
              }}</pre>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDetailsDialog" max-width="90%">
      <v-card>
        <v-card-title class="headline">
          Test Details
          <v-spacer></v-spacer>
          <v-btn icon @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <h3>Test Details</h3>
              <v-card outlined height="500px" class="overflow-y-auto">
                <v-card-text>
                  <pre>{{ JSON.stringify(selectedTestDetails, null, 2) }}</pre>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6">
              <h3>Full Test Object</h3>
              <v-card outlined height="500px" class="overflow-y-auto">
                <v-card-text>
                  <pre>{{
                      JSON.stringify(selectedFullTestObject, null, 2)
                    }}</pre>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
        v-model="showInfoDrawer"
        fixed
        right
        temporary
        width="600"
    >
      <v-card flat class="h-100 d-flex flex-column" v-if="selectedTest">
        <v-card-title class="headline d-flex justify-space-between">
          Test Details
          <v-btn icon @click="showInfoDrawer = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
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
                <div class="scrollable-content">
                  <pre class="query-text">{{
                      JSON.stringify(selectedTest.query, null, 2)
                    }}</pre>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header>Full Test</v-expansion-panel-header>
              <v-expansion-panel-content>
                <div class="scrollable-content">
                  <pre class="full-test-text">{{
                      JSON.stringify(selectedTest, null, 2)
                    }}</pre>
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

          <!-- oqlToJson card -->
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

          <!-- jsonToOql card -->
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

          <!-- jsonToSearch card -->
          <div class="scrollable-content">
            <v-card
                outlined
                class="mb-2"
                :color="resultCardColor('jsonToSearch')"
            >
              <v-card-title>jsonToSearch</v-card-title>
              <v-card-text>
                <div
                    v-if="currentTestResults && currentTestResults.jsonToSearch">
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
    </v-navigation-drawer>

  </v-container>
</template>

<script>
import {getTests, OQOTestRunner} from '@/oqlParse/test';
import {OQOTestRunnerStable} from '@/oqlParse/test_stable';
import {invertMap, objectMD5ShortUUID} from '@/oqlParse/util';
import {VProgressCircular} from 'vuetify/lib';

export default {
  name: "OQOTests",
  props: {
    initialTestId: {
      type: String,
      default: null
    },
    initialTag: {
      type: String,
      default: null
    },
    autoRun: {
      type: Boolean,
      default: false
    }
  },
  components: {
    TestResultCell: {
      props: ['value', 'loading', 'details', 'testObject', 'isJsonToSearch'],
      render(h) {
        const cellStyle = {
          backgroundColor: this.value === true ? '#C8E6C9' : // light green
              this.value === false ? '#FFCDD2' : // light red
                  'transparent', // default
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: '48px', // Ensure a minimum height for the cell
          padding: '4px',
        };

        const contentStyle = {
          color: this.value === true || this.value === false ? 'rgba(0, 0, 0, 0.87)' : 'grey',
          fontWeight: 'bold',
          textDecoration: this.value === false ? 'underline' : 'none',
          textAlign: 'center',
          cursor: this.value === false ? 'pointer' : 'default'
        };

        const displayText = this.value === true ? 'PASS' :
            this.value === false ? 'FAIL' : '−';

        if (this.loading) {
          return h('div', {style: cellStyle}, [
            h(VProgressCircular, {
              props: {
                indeterminate: true,
                size: 20,
                width: 2
              }
            })
          ]);
        } else {
          const elements = [h('span', {style: contentStyle}, displayText)];

          if (this.isJsonToSearch && this.details && this.details.searchId) {
            elements.push(
                h('a', {
                  attrs: {
                    href: `https://staging.openalex.org/s/${this.details.searchId}`,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                  },
                  style: {
                    fontSize: '0.8em',
                    marginTop: '4px'
                  }
                }, 'View Search')
            );
          }

          return h('div', {
            style: cellStyle,
            on: {
              click: () => {
                if (this.value === false && this.details) {
                  this.$emit('show-details', {
                    details: this.details,
                    testObject: this.testObject
                  });
                }
              }
            }
          }, elements);
        }
      }
    },
    NatLangToJsonCell: {
      props: ['value', 'loading'],
      render(h) {
        const containerStyle = {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '48px', // Ensure a minimum height for the cell
        };

        if (this.loading) {
          return h('div', {style: containerStyle}, [
            h(VProgressCircular, {
              props: {
                indeterminate: true,
                size: 20,
                width: 2
              }
            })
          ]);
        } else if (this.value && this.value.length > 0) {
          return h('div', {style: containerStyle},
              this.value.map((subTest, index) => {
                const subTestStyle = {
                  backgroundColor: subTest.isPassing ? '#C8E6C9' : '#FFCDD2',
                  color: 'rgba(0, 0, 0, 0.87)',
                  fontWeight: 'bold',
                  padding: '4px',
                  margin: '2px 0',
                  borderRadius: '2px',
                  textAlign: 'center',
                };

                return h('div', {
                  key: index,
                  style: subTestStyle
                }, subTest.isPassing ? 'PASS' : 'FAIL');
              })
          );
        } else {
          return h('div', {style: containerStyle}, '−');
        }
      }
    }
  },
  data() {
    return {
      passingPercentage: '-',
      showDetailsDialog: false,
      selectedTestDetails: null,
      selectedFullTestObject: null,
      showJsonDialog: false,
      selectedTestJson: null,
      testResultsMap: {},
      tests: [],
      selected: [],
      selectedTags: [],
      availableTags: [],
      selectedTests: [],
      availableTests: [
        {text: 'natLangToJson', value: 'natLangToJson'},
        {text: 'oqlToJson', value: 'oqlToJson'},
        {text: 'jsonToOql', value: 'jsonToOql'},
        {text: 'jsonToSearch', value: 'jsonToSearch'},
      ],
      headers: [
        {text: 'Test (OQL)', value: 'test', width: '25%'},
        {text: 'Tags', value: 'tags', width: '25%'},
        {text: 'natLangToJson', value: 'natLangToJson'},
        {text: 'oqlToJson', value: 'oqlToJson'},
        {text: 'jsonToOql', value: 'jsonToOql'},
        {text: 'jsonToSearch', value: 'jsonToSearch'},
      ],
      showInfoDrawer: false,
      selectedTest: null,
      isRunningTest: false,
      tableItems: [],
      testCasesMap: {
        'natLangToJson': 'natLang',
        'oqlToJson': 'oqlToQuery',
        'jsonToOql': 'queryToOql',
        'jsonToSearch': 'queryToSearch'
      },
      isLoading: false,
      loadingCells: [],
      showPopover: false,
      popoverContent: '',
    }
  },
  computed: {
    currentTestResults() {
      if (!this.selectedTest) return null;
      const results = this.testResultsMap[objectMD5ShortUUID(this.selectedTest)];
      return results;
    },
    filteredTableItems() {
      if (!this.tableItems) return []; // Add this check
      if (this.initialTag) {
        return this.tableItems.filter(item =>
            item && item.test && Array.isArray(item.test.tags) && item.test.tags.includes(this.initialTag)
        );
      } else if (this.selectedTags.length > 0) {
        return this.tableItems.filter(item =>
            item && item.test && Array.isArray(item.test.tags) &&
            item.test.tags.some(tag => this.selectedTags.includes(tag))
        );
      }
      return this.tableItems;
    }
  },
  created() {
    this.loadTests();
    this.$root.$on('show-popover', this.openPopover);
  },
  beforeDestroy() {
    this.$root.$off('show-popover', this.openPopover);
  },
  methods: {
    objectMD5ShortUUID,
    invertMap,
    resultCardColor(testType) {
      if (this.currentTestResults && this.currentTestResults[testType]) {
        return this.currentTestResults[testType].isPassing ? 'green lighten-4' : 'red lighten-4';
      }
      return ''; // default color
    },
    getTestResults(testId) {
      if (!this.testResultsMap[testId]) {
        this.$set(this.testResultsMap, testId, {
          natLangToJson: null,
          oqlToJson: null,
          jsonToOql: null,
          jsonToSearch: null
        });
      }
      return this.testResultsMap[testId];
    },
    copyToClipboard(text, prependOrigin = false) {
      if (prependOrigin) text = `${window.location.origin}${text}`
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    },
    async loadTests() {
      getTests().then(tests => {
        this.tests = tests;
        this.availableTags = this.getUniqueTags(tests);
        this.tableItems = this.tests.map(test => ({
          id: objectMD5ShortUUID(test),
          test: test,
          natLangToJson: [],
          oqlToJson: {isPassing: null, details: null},
          jsonToOql: {isPassing: null, details: null},
          jsonToSearch: {isPassing: null, details: null},
        }));
        if (this.initialTag) {
          this.selectedTags = [this.initialTag];
        }
        if (this.autoRun) {
          this.runTests();
        }
      });
    },
    showTestDetails(payload) {
      this.selectedTestDetails = payload.details;
      this.selectedFullTestObject = payload.testObject;
      this.showDetailsDialog = true;
    },
    openInitialTest() {
      const testItem = this.tableItems.find(item => item.id === this.initialTestId);
      if (testItem) {
        this.showInfoPane(testItem.id);
        if (this.autoRun) {
          this.runSingleTest(testItem.test);
        }
      } else {
        console.error(`Test with id ${this.initialTestId} not found`);
        // Optionally, show an error message to the user
      }
    },
    showInfoPane(id) {
      const item = this.tableItems.find(item => item.id === id);
      if (item && item.test) {
        this.selectedTest = {...item.test};  // Create a new object to trigger reactivity
        this.$nextTick(() => {
          this.showInfoDrawer = true;
        });
      }
    },
    calculatePassingPercentage() {
      let totalTests = 0;
      let passingTests = 0;
      this.tableItems.forEach(item => {
        ['natLangToJson', 'oqlToJson', 'jsonToOql', 'jsonToSearch'].forEach(key => {
          if (key === 'natLangToJson') {
            if (Array.isArray(item[key]) && item[key].length > 0) {
              totalTests += item[key].length;
              passingTests += item[key].filter(subTest => subTest.isPassing).length;
            }
          } else {
            if (item[key].isPassing !== null) {
              totalTests++;
              if (item[key].isPassing) passingTests++;
            }
          }
        });
      });
      this.passingPercentage = totalTests === 0 ? '-' :
          (passingTests / totalTests * 100).toFixed(2) + '%';
    },
    getUniqueTags(tests) {
      const tagSet = new Set();
      tests.forEach(test => {
        if (Array.isArray(test.tags)) {
          test.tags.forEach(tag => tagSet.add(tag));
        }
      });
      return Array.from(tagSet);
    },
    filterTestsByTags(tests, selectedTags) {
      if (selectedTags.length === 0) return tests;
      return tests.filter(test =>
          Array.isArray(test.tags) &&
          test.tags.some(tag => selectedTags.includes(tag))
      );
    },
    async runTests() {
      this.isLoading = true;
      let testsToRun;
      if (this.selected.length > 0) {
        testsToRun = this.selected.map(item => item.test);
      } else if (this.initialTag) {
        testsToRun = this.tests.filter(test =>
            Array.isArray(test.tags) && test.tags.includes(this.initialTag)
        );
      } else {
        testsToRun = this.filterTestsByTags(this.tests, this.selectedTags);
      }
      let runner = new OQOTestRunner(testsToRun, this.updateTestResult);
      if (this.$route.path.endsWith('old')) runner = new OQOTestRunnerStable(testsToRun, this.updateTestResult);
      let cases;
      if (this.selectedTests.length > 0) {
        cases = this.selectedTests.map(test => this.testCasesMap[test] || test);
      } else {
        cases = Object.values(this.testCasesMap);
      }

      try {
        this.loadingCells = runner.expectedResults(testsToRun, cases);
        await runner.runTests(cases);
        this.calculatePassingPercentage();
      } catch (error) {
        console.error('Error running tests:', error);
        // You might want to show an error message to the user here
      } finally {
        this.isLoading = false;
        this.loadingCells = [];
      }
    },
    async runSingleTest(event) {
      let testToRun;

      if (event instanceof Event) {
        // If called from a click event, use the selectedTest
        testToRun = this.selectedTest;
      } else {
        // If called with a test object, use that
        testToRun = event;
      }

      if (!testToRun) {
        console.error('No test selected to run');
        return;
      }


      this.isRunningTest = true;
      try {
        const runner = new OQOTestRunner([testToRun], this.updateTestResult);
        await runner.runTests(['natLang', 'oqlToQuery', 'queryToOql', 'queryToSearch']);
      } catch (error) {
        console.error('Error running single test:', error);

      } finally {
        this.isRunningTest = false;
      }
    },

    updateTestResult(testResult) {
      const testId = testResult.id;
      const results = this.getTestResults(testId);

      if (testResult.case === 'natLang') {
        this.$set(results, 'natLangToJson', testResult.subTests);
      } else {
        const resultKey = this.invertMap(this.testCasesMap)[testResult.case];
        if (resultKey) {
          this.$set(results, resultKey, {
            isPassing: testResult.isPassing,
            details: testResult.details
          });
        }
      }

      // Force update to ensure reactivity
      this.$set(this.testResultsMap, testId, {...results});

      // Update tableItems as before
      const rowIndex = this.tableItems.findIndex(item => item.id === testId);
      if (rowIndex !== -1) {
        const tableKey = invertMap(this.testCasesMap)[testResult.case];
        if (tableKey === 'natLangToJson') {
          this.$set(this.tableItems[rowIndex], tableKey, testResult.subTests);
        } else {
          this.$set(this.tableItems[rowIndex], tableKey, {
            isPassing: testResult.isPassing,
            details: testResult.details
          });
        }
      }

      // Remove the completed test from loadingCells
      this.loadingCells = this.loadingCells.filter(cell =>
          !(cell.id === testId && cell.case === testResult.case)
      );
      if (this.selectedTest && this.selectedTest.id === testId) {
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      }
    },
    clearResults() {
      this.tableItems.forEach(item => {
        item.natLangToJson = [];
        item.oqlToJson = {isPassing: null, details: null};
        item.jsonToOql = {isPassing: null, details: null};
        item.jsonToSearch = {isPassing: null, details: null};
      });
      this.passingPercentage = '-';
      this.selected = [];
    },
    isLoadingCell(id, testCase) {
      return this.loadingCells.some(cell => cell.id === id && cell.case === testCase);
    },
    openPopover(content) {
      this.popoverContent = content;
      this.showPopover = true;
    },
    mounted() {
      this.loadTests();
    },
    watch: {
      initialTestId(newId) {
        if (newId && this.tableItems.length > 0) {
          this.openInitialTest();
        }
      },
      initialTag(newTag) {
        if (newTag) {
          this.selectedTags = [newTag];
        }
      }
    }
  },
}
</script>

<style>
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  white-space: normal !important;

}

.query-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
}

</style>

<style scoped>

.wrapped-pre {
  white-space: pre-wrap; /* CSS 3 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
  word-break: break-all;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9em;
  line-height: 1.4;
  max-height: 200px; /* Limit the height and add scrolling if needed */
}

v-btn.text-body-2 {
  text-transform: none;
  letter-spacing: normal;
}

v-btn.text-body-2::before {
  background-color: transparent;
}

v-btn.text-body-2:hover {
  background-color: rgba(25, 118, 210, 0.04); /* Light blue background on hover */
}

.scrollable-content {
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  padding-bottom: 8px; /* Add some padding to ensure scrollbar doesn't cover content */
}

.query-text, .full-test-text, .error-details {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 12px;
}

.error-details {
  color: #d32f2f; /* high contrast red color */
  background-color: #ffebee; /* light red background */
  padding: 8px;
  border-radius: 4px;
}

.success-message {
  color: #1b5e20; /* dark green color */
  font-weight: bold;
}
</style>