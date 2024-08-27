<template>
  <v-container>
    <v-card flat>
      <v-card-title class="text-h4 justify-center">
        OQO Tests
      </v-card-title>

      <v-card-text>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="6" md="5">
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
          <v-col cols="12" sm="3" md="2">
            <v-btn
                color="primary"
                block
                @click="runTests"
                :disabled="!selectedTests.length || isLoading"
                :loading="isLoading"
            >
              Run Tests
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
            :headers="headers"
            :items="tableItems"
            class="elevation-1 mt-4"
        >
          <template v-slot:item.test="{ item }">
            <json-viewer :value="item.test" />
          </template>
          <template v-slot:item.natLangToJson="{ item }">
            <nat-lang-to-json-cell :value="item.natLangToJson" :loading="isLoadingCell(item.id, 'natLang')"/>
          </template>
          <template v-slot:item.oqlToJson="{ item }">
            <test-result-cell :value="item.oqlToJson" :loading="isLoadingCell(item.id, 'oqlToQuery')"/>
          </template>
          <template v-slot:item.jsonToOql="{ item }">
            <test-result-cell :value="item.jsonToOql" :loading="isLoadingCell(item.id, 'queryToOql')"/>
          </template>
          <template v-slot:item.jsonToSearch="{ item }">
            <test-result-cell :value="item.jsonToSearch" :loading="isLoadingCell(item.id, 'queryToSearch')"/>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { OQOTestRunner, getTests } from '@/oqlParse/test';
import { objectMD5, invertMap } from '@/oqlParse/util';
import { VProgressCircular } from 'vuetify/lib';

export default {
  name: "OQOTests",
  components: {
    TestResultCell: {
      components: { VProgressCircular },
      props: ['value', 'loading'],
      computed: {
        color() {
          return this.value === true ? 'green' : this.value === false ? 'red' : 'grey';
        },
        icon() {
          return this.value === true ? '✓' : this.value === false ? '✗' : '−';
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
            fontWeight: 'bold'
          }
        }, [this.icon]);
      }
    },
    NatLangToJsonCell: {
      components: { VProgressCircular },
      props: ['value', 'loading'],
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
                marginRight: '5px'
              }
            }, [subTest.isPassing ? '✓' : '✗']),
            h('span', subTest.prompt)
          ])
        ));
      }
    },
    JsonViewer: {
      props: ['value'],
      render(h) {
        return h('div', {
          style: {
            maxHeight: '200px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px'
          }
        }, [
          h('code', JSON.stringify(this.value, null, 2))
        ]);
      }
    }
  },
  data() {
    return {
      tests: [],
      selectedTests: [],
      availableTests: [
        {text: 'natLangToJson', value: 'natLangToJson'},
        {text: 'oqlToJson', value: 'oqlToJson'},
        {text: 'jsonToOql', value: 'jsonToOql'},
        {text: 'jsonToSearch', value: 'jsonToSearch'},
      ],
      headers: [
        {text: 'Test', value: 'test', width: '30%'},
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
    }
  },
  created() {
    this.loadTests();
  },
  methods: {
    loadTests() {
      getTests().then(tests => {
        this.tests = tests;
        this.tableItems = this.tests.map(test => ({
          id: objectMD5(test),
          test: test,
          natLangToJson: [],
          oqlToJson: '',
          jsonToOql: '',
          jsonToSearch: '',
        }));
      });
    },
    async runTests() {
      this.isLoading = true;
      const runner = new OQOTestRunner(this.tests, this.updateTestResult);
      const cases = this.selectedTests.map(test => this.testCasesMap[test] || test);
      try {
        const expectedResults = runner.expectedResults(this.tests, cases);
        this.loadingCells = expectedResults;
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
          this.$set(this.tableItems[rowIndex], tableKey, testResult.isPassing);
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
  },
}
</script>

<style>
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  white-space: normal !important;
}
</style>