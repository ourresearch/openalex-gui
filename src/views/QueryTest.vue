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
      @click="showTestObject(item.id)"
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
            <nat-lang-to-json-cell :value="item.natLangToJson"
                                   :testObject="item.test"
                                   @show-details="showTestDetails"
                                   :loading="isLoadingCell(item.id, 'natLang')"/>
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

    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          Test Object
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <pre>{{ JSON.stringify(selectedTestObject, null, 2) }}</pre>
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

  </v-container>
</template>

<script>
import {getTests, OQOTestRunner} from '@/oqlParse/test';
import {invertMap, objectMD5} from '@/oqlParse/util';
import {VProgressCircular} from 'vuetify/lib';

export default {
  name: "OQOTests",
  components: {
    TestResultCell: {
      props: ['value', 'loading', 'details'],
      render(h) {
        if (this.loading) {
          return h('div', {
            style: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }
          }, [
            h(VProgressCircular, {
              props: {
                indeterminate: true,
                size: 20,
                width: 2
              }
            })
          ]);
        }

        const cellStyle = {
          backgroundColor: this.value === true ? '#4CAF50' : // Success color
              this.value === false ? '#F44336' : // Error color
                  'transparent', // Default
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        };

        const contentStyle = {
          color: this.value === true || this.value === false ? 'white' : 'grey',
          fontWeight: 'bold',
          textDecoration: this.value === false ? 'underline' : 'none',
          cursor: this.value === false ? 'pointer' : 'default'
        };

        return h('div', {
          style: cellStyle,
          on: {
            click: () => {
              if (this.value === false && this.details) {
                this.$emit('show-details', {
                  details: Object.fromEntries(
                      Object.entries(this.details).filter(([key]) => key !== "test")),
                  testObject: this.details.test
                });
              }
            }
          }
        }, [
          h('span', {style: contentStyle},
              this.value === true ? 'PASS' :
                  this.value === false ? 'FAIL' : '−'
          )
        ]);
      }
    },
    NatLangToJsonCell: {
      props: ['value', 'loading'],
      render(h) {
        if (this.loading) {
          return h('div', {
            style: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }
          }, [
            h(VProgressCircular, {
              props: {
                indeterminate: true,
                size: 20,
                width: 2
              }
            })
          ]);
        }

        if (!this.value || this.value.length === 0) {
          return h('div', {
            style: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'grey',
              fontWeight: 'bold'
            }
          }, '−');
        }

        return h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }
        }, this.value.map((subTest, index) => {
          const cellStyle = {
            backgroundColor: subTest.isPassing ? '#4CAF50' : '#F44336',
            cursor: !subTest.isPassing ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
          };

          const contentStyle = {
            color: 'white',
            fontWeight: 'bold',
            marginRight: '8px',
            textDecoration: !subTest.isPassing ? 'underline' : 'none',
          };

          return h('div', {
            key: index,
            style: cellStyle,
            on: {
              click: () => {
                if (!subTest.isPassing && subTest.details) {
                  this.$emit('show-details', {
                    details: Object.fromEntries(
                        Object.entries(subTest.details).filter(([key]) => key !== "test")),
                    testObject: subTest.details.test
                  });
                }
              }
            }
          }, [
            h('span', {style: contentStyle}, subTest.isPassing ? 'PASS' : 'FAIL'),
            h('span', {style: {color: 'white'}}, subTest.prompt)
          ]);
        }));
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
      tableItems: [],
      dialog: false,
      selectedTestObject: null,
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
    filteredTableItems() {
      if (this.selectedTags.length === 0) {
        return this.tableItems;
      }
      return this.tableItems.filter(item =>
          Array.isArray(item.test.tags) &&
          item.test.tags.some(tag => this.selectedTags.includes(tag))
      );
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
    loadTests() {
      getTests().then(tests => {
        this.tests = tests;
        this.availableTags = this.getUniqueTags(tests);
        this.tableItems = this.tests.map(test => ({
          id: objectMD5(test),
          test: test,
          natLangToJson: [],
          oqlToJson: {isPassing: null, details: null},
          jsonToOql: {isPassing: null, details: null},
          jsonToSearch: {isPassing: null, details: null},
        }));
      });
    },
    showTestDetails(payload) {
      this.selectedTestDetails = payload.details;
      this.selectedFullTestObject = payload.testObject;
      this.showDetailsDialog = true;
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
      } else {
        testsToRun = this.filterTestsByTags(this.tests, this.selectedTags);
      }
      const runner = new OQOTestRunner(testsToRun, this.updateTestResult);
      const cases = this.selectedTests.map(test => this.testCasesMap[test] || test);
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
    updateTestResult(testResult) {
      const rowIndex = this.tableItems.findIndex(item => item.id === testResult.id);
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
      } else {
        console.error('No matching row found for test result:', testResult);
      }
      // Remove the completed test from loadingCells
      this.loadingCells = this.loadingCells.filter(cell =>
          !(cell.id === testResult.id && cell.case === testResult.case)
      );
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
    showTestObject(id) {
      const item = this.tableItems.find(item => item.id === id);
      if (item) {
        this.selectedTestObject = item.test;
        this.dialog = true;
      }
    },
    isLoadingCell(id, testCase) {
      return this.loadingCells.some(cell => cell.id === id && cell.case === testCase);
    },
    openPopover(content) {
      this.popoverContent = content;
      this.showPopover = true;
    },
  },
}
</script>

<style>
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  white-space: normal !important;

}
</style>
<style scoped>
.v-btn.pa-0 {
  min-width: 0;
  width: 100%;
  justify-content: flex-start;
}
</style>