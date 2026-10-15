import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // .vue imports in tests (#1689: src/__tests__/recordDataForRoute.test.js)
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    // Vuetify components import their CSS; let Vite load them (#1689: server/__tests__/agent-notice.test.ts).
    server: { deps: { inline: ['vuetify'] } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
