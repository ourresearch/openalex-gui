const { defineConfig } = require("cypress");
const notifier = require('node-notifier');

module.exports = defineConfig({
  projectId: 'v2z8o5',
  e2e: {
    baseUrl: 'http://localhost:8080',
    experimentalStudio: true,
    viewportWidth: 1400,
    viewportHeight: 1000,
    excludeSpecPattern: ['**/examples/**'],
    setupNodeEvents(on, config) {
      on("task", {
        notifyOnFail({ title, message }) {
          notifier.notify({
            title,
            message,
            sound: true,
          });
          return null;
        },
      });
    },
  },
});
