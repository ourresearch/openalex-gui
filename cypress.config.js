const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    experimentalStudio: true,
    viewportWidth: 1400,
    viewportHeight: 1000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
