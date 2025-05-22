const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'v2z8o5',
  e2e: {
    baseUrl: 'http://localhost:8080',
    experimentalStudio: true,
    viewportWidth: 1400,
    viewportHeight: 1000,
    excludeSpecPattern: ['**/examples/**'],
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
