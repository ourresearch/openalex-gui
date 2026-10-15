// oxjob #1689 SSR spike: Vite is used ONLY to compile the existing SFCs for a
// server render (and a dev hydration test). Production still builds with Vue CLI.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from './tools/node_modules/@vitejs/plugin-vue/dist/index.mjs';
import vuetify from './tools/node_modules/vite-plugin-vuetify/dist/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

export default {
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    // Vue CLI lets .yaml be imported as raw text; mirror that.
    { name: 'yaml-raw', transform(code, id) { if (/\.ya?ml$/.test(id)) return `export default ${JSON.stringify(code)}`; } },
  ],
  resolve: {
    alias: { '@': path.join(root, 'src') },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.json', '.vue'],
  },
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
  },
  ssr: {
    // Vuetify imports its own .css files; it must go through Vite's transform.
    noExternal: ['vuetify'],
  },
  css: { preprocessorOptions: { scss: { silenceDeprecations: ['legacy-js-api', 'import'] } } },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
};
