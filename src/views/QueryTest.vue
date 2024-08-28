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
          <v-col cols="12" sm="3" md="2">
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
            <span>{{ item.test.oql }}</span>
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
                                   :loading="isLoadingCell(item.id, 'natLang')"/>
          </template>
          <template v-slot:item.oqlToJson="{ item }">
            <test-result-cell
                :value="item.oqlToJson.isPassing"
                :loading="isLoadingCell(item.id, 'oqlToQuery')"
                :details="item.oqlToJson.details"
            />
          </template>
          <template v-slot:item.jsonToOql="{ item }">
            <test-result-cell
                :value="item.jsonToOql.isPassing"
                :loading="isLoadingCell(item.id, 'queryToOql')"
                :details="item.jsonToOql.details"
            />
          </template>
          <template v-slot:item.jsonToSearch="{ item }">
            <test-result-cell
                :value="item.jsonToSearch.isPassing"
                :loading="isLoadingCell(item.id, 'queryToSearch')"
                :details="item.jsonToSearch.details"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

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

    <v-menu v-model="showPopover" :close-on-content-click="false"
            :nudge-width="200" offset-y>
      <template v-slot:activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on" style="display: none;"></span>
      </template>
      <v-card>
        <v-card-text>
          <pre>{{ popoverContent }}</pre>
        </v-card-text>
      </v-card>
    </v-menu>

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
      components: {VProgressCircular},
      props: ['value', 'loading', 'details'],
      data() {
        return {
          showPopover: false
        };
      },
      computed: {
        color() {
          return this.value === true ? 'green' : this.value === false ? 'red' : 'grey';
        },
        icon() {
          return this.value === true ? '✓' : this.value === false ? '✗' : '−';
        }
      },
      methods: {
        showDetails() {
          if (this.value === false && this.details) {
            this.$root.$emit('show-popover', JSON.stringify(this.details, null, 2));
          }
        }
      },
      render(h) {
        if (this.loading) {
          return h(VProgressCircular, {
            props: {
              indeterminate: true,
              size: 20,
              width: 2
            }
          });
        }
        return h('span', {
          style: {
            color: this.color,
            fontWeight: 'bold',
            cursor: this.value === false ? 'pointer' : 'default',
            textDecoration: this.value === false ? 'underline' : 'none'
          },
          on: {
            click: this.showDetails
          }
        }, [this.icon]);
      }
    },
    NatLangToJsonCell: {
      components: {VProgressCircular},
      props: ['value', 'loading'],
      data() {
        return {
          showPopover: false
        };
      },
      methods: {
        showDetails(subTest) {
          if (!subTest.isPassing && subTest.details) {
            this.$root.$emit('show-popover', JSON.stringify(subTest.details, null, 2));
          }
        }
      },
      render(h) {
        if (this.loading) {
          return h(VProgressCircular, {
            props: {
              indeterminate: true,
              size: 20,
              width: 2
            }
          });
        }
        if (!this.value || this.value.length === 0) {
          return h('span', {
            style: {
              color: 'grey',
              fontWeight: 'bold'
            }
          }, '−');
        }
        return h('div', this.value.map((subTest, index) =>
            h('div', {
              key: index,
              style: {
                display: 'flex',
                alignItems: 'center',
                marginTop: '5px'
              }
            }, [
              h('span', {
                style: {
                  color: subTest.isPassing ? 'green' : 'red',
                  marginRight: '5px',
                  cursor: !subTest.isPassing ? 'pointer' : 'default',
                  textDecoration: !subTest.isPassing ? 'underline' : 'none'
                },
                on: {
                  click: () => this.showDetails(subTest)
                }
              }, [subTest.isPassing ? '✓' : '✗']),
              h('span', subTest.prompt)
            ])
        ));
      }
    },
  },
  data() {
    return {
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