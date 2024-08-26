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
            ></v-select>
          </v-col>
          <v-col cols="12" sm="3" md="2">
            <v-btn
              color="primary"
              block
              @click="runTests"
              :disabled="!selectedTests.length"
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
        <a href="#" @click.prevent="showTestObject(item.id)">{{ item.id }}</a>
      </template>
      <template v-slot:item.natLangToJson="{ item }">
        <v-icon :color="item.natlangToJson === true ? 'green' : item.natlangToJson === false ? 'red' : 'grey'">
          {{ item.natlangToJson === true ? 'mdi-check' : item.natlangToJson === false ? 'mdi-close' : 'mdi-minus' }}
        </v-icon>
      </template>
      <template v-slot:item.oqlToJson="{ item }">
        <v-icon :color="item.oqlToJson === true ? 'green' : item.oqlToJson === false ? 'red' : 'grey'">
          {{ item.oqlToJson === true ? 'mdi-check' : item.oqlToJson === false ? 'mdi-close' : 'mdi-minus' }}
        </v-icon>
      </template>
      <template v-slot:item.jsonToOql="{ item }">
        <v-icon :color="item.jsonToOql === true ? 'green' : item.jsonToOql === false ? 'red' : 'grey'">
          {{ item.jsonToOql === true ? 'mdi-check' : item.jsonToOql === false ? 'mdi-close' : 'mdi-minus' }}
        </v-icon>
      </template>
      <template v-slot:item.jsonToSearch="{ item }">
        <v-icon :color="item.jsonToSearch === true ? 'green' : item.jsonToSearch === false ? 'red' : 'grey'">
          {{ item.jsonToSearch === true ? 'mdi-check' : item.jsonToSearch === false ? 'mdi-close' : 'mdi-minus' }}
        </v-icon>
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

  </v-container>
</template>

<script>
import { OQOTestRunner, getTests } from '@/oqlParse/test';
import { objectMD5, invertMap } from '@/oqlParse/util';

export default {
  name: "OQOTests",
  data() {
    return {
      tests: [],
      selectedTests: [],
      availableTests: [
        { text: 'natLangToJson', value: 'natLangToJson' },
        { text: 'oqlToJson', value: 'oqlToJson' },
        { text: 'jsonToOql', value: 'jsonToOql' },
        { text: 'jsonToSearch', value: 'jsonToSearch' },
      ],
      headers: [
        { text: 'Test', value: 'test' },
        { text: 'natLangToJson', value: 'natLangToJson' },
        { text: 'oqlToJson', value: 'oqlToJson' },
        { text: 'jsonToOql', value: 'jsonToOql' },
        { text: 'jsonToSearch', value: 'jsonToSearch' },
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
          natLangToJson: '',
          oqlToJson: '',
          jsonToOql: '',
          jsonToSearch: '',
        }));
      });
    },
    async runTests() {
      const runner = new OQOTestRunner(this.tests, this.updateTestResult);
      await runner.runTests(this.selectedTests.map(test => this.testCasesMap[test] || test));
    },
    updateTestResult(testResult) {
      const rowIndex = this.tableItems.findIndex(item => item.id === testResult.id);
      if (rowIndex !== -1) {
        const tableKey = invertMap(this.testCasesMap)[testResult.case];
        this.tableItems[rowIndex][tableKey] = testResult.isPassing;
      } else {
        console.error('No matching row found for test result:', testResult);
      }
    },
    showTestObject(id) {
      const item = this.tableItems.find(item => item.id === id);
      if (item) {
        this.selectedTestObject = item.test;
        this.dialog = true;
      }
    }
  },
}
</script>