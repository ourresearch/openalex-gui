<template>
  <v-container>
    <v-card flat>
      <v-card-title class="text-h4 justify-center">
        OQO Tests
      </v-card-title>

      <v-card-text>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="6">
            <v-select
              v-model="selectedTests"
              :items="availableTests"
              label="Select tests to run"
              multiple
              chips
              persistent-hint
              hint="Choose one or more tests"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" md="2">
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
          v-if="showResults"
          :headers="headers"
          :items="testResults"
          class="elevation-1 mt-4"
        ></v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: "OQOTests",
  data() {
    return {
      selectedTests: [],
      availableTests: [
        { text: 'natlangToJson', value: 'natlangToJson' },
        { text: 'oqlToJson', value: 'oqlToJson' },
        { text: 'jsonToOql', value: 'jsonToOql' },
        { text: 'jsonToSearch', value: 'jsonToSearch' },
      ],
      showResults: false,
      headers: [
        { text: 'natlangToJson', value: 'natlangToJson' },
        { text: 'oqlToJson', value: 'oqlToJson' },
        { text: 'jsonToOql', value: 'jsonToOql' },
        { text: 'jsonToSearch', value: 'jsonToSearch' },
      ],
      testResults: [],
    }
  },
  methods: {
    runTests() {
      this.testResults = [
        {
          natlangToJson: this.selectedTests.includes('natlangToJson') ? 'Result 1' : '',
          oqlToJson: this.selectedTests.includes('oqlToJson') ? 'Result 2' : '',
          jsonToOql: this.selectedTests.includes('jsonToOql') ? 'Result 3' : '',
          jsonToSearch: this.selectedTests.includes('jsonToSearch') ? 'Result 4' : '',
        },
      ];
      this.showResults = true;
    },
  },
}
</script>