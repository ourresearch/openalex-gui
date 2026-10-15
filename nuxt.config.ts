// oxjob #1689 Nuxt trial: Nuxt 4 hosting the existing Vue 3 app in src/.
// Step 1: pure SPA (ssr: false). Step 2 flips on SSR for record routes only.
import { fileURLToPath } from 'node:url'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',
  devtools: { enabled: false },
  // Same dev port as Vue CLI had: cypress expects 8080, and apiConfig.js switches API
  // hosts on 8081-8085 (`npm run dev -- --port 8081`).
  devServer: { port: 8080 },
  telemetry: false,
  // Browser source maps stay public, as under Vue CLI: Sentry fetches each file's
  // sourceMappingURL to symbolicate (nothing is uploaded). Server maps stay off: they
  // are what pushed the Nitro bundling step past a 1.8 GB heap in the trial (#1689 build-qa).
  sourcemap: { server: false, client: true },
  // Pre-compress /_nuxt/ and public/ files (gzip + brotli) at build time; Nitro serves
  // them by Accept-Encoding. Replaces the old server.js compression() for static files.
  nitro: { compressPublicAssets: true },
  // Default inlines every eagerly imported component's CSS (~104 KB) into each HTML
  // response, SPA shells included; link the CSS files instead (cacheable).
  features: { inlineStyles: false },
  // Step 2: SSR on, but only record routes render on the server; everything else
  // gets Nuxt's SPA shell (nuxt.com/docs/4.x/guide/concepts/rendering#route-rules).
  ssr: true,
  routeRules: {
    '/**': { ssr: false },
    '/works/**': { ssr: true },
    '/authors/**': { ssr: true },
    // `/x/**` also matches `/x` itself (the search page), which stays client-rendered.
    '/works': { ssr: false },
    '/authors': { ssr: false },
    // server.js ports (#1558 aboutness viewer; caching as #860: HTML no-cache).
    '/aboutness/viewer': { proxy: '/aboutness-viewer.html' },
  },
  // Lets useNuxtApp() find the current request's app after an await, so the old
  // module-level store/router imports can resolve per request (server only).
  experimental: { asyncContext: true },
  // Nuxt's own files live in app/; the existing app stays in src/ and keeps its "@" alias.
  alias: { '@': srcPath },
  // Don't let Nuxt auto-scan/auto-import anything from the old app.
  components: false,
  imports: { autoImport: false },
  // Enable Nuxt's vue-router integration; routes come from app/router.options.ts.
  pages: true,
  css: [
    '@mdi/font/css/materialdesignicons.css',
    'vuetify/styles',
    '@/styles/tokens.css',
  ],
  build: { transpile: ['vuetify'] },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error plugins exists
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],
  vite: {
    build: { minify: process.env.TRIAL_NOMINIFY ? false : undefined },
    vue: { template: { transformAssetUrls } },
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
    },
    // jobs-redline.yaml was imported raw via a webpack asset/source rule.
    assetsInclude: [],
  },
  app: {
    rootId: 'app',
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'OpenAlex',
      meta: [
        { charset: 'utf-8' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1.0' },
        { name: 'format-detection', content: 'email=no' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://user.openalex.org', crossorigin: '' },
        { rel: 'preconnect', href: 'https://api.openalex.org', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://user.openalex.org' },
        { rel: 'dns-prefetch', href: 'https://api.openalex.org' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'icon', href: '/tricon-outlined.png', type: 'image/png' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@200..800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap' },
      ],
      script: [
        { innerHTML: "(function(){var o=console.error;console.error=function(){var a=arguments;if(typeof a[0]==='string'&&a[0].indexOf('ResizeObserver loop')>-1)return;o.apply(console,a)};window.addEventListener('error',function(e){if(e.message&&e.message.indexOf('ResizeObserver loop')>-1){e.stopImmediatePropagation();e.preventDefault();return false}},true)})();" },
        { defer: true, 'data-domain': 'openalex.org', src: 'https://plausible.io/js/script.file-downloads.outbound-links.pageview-props.tagged-events.js' },
        { innerHTML: 'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }' },
        { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true },
        { id: 'ze-snippet', src: 'https://static.zdassets.com/ekr/snippet.js?key=f448c93c-e2e1-4d7c-b344-683a586e69f7', tagPosition: 'bodyClose' },
      ],
      noscript: [
        { innerHTML: '<p><strong>OpenAlex needs JavaScript to run in your browser.</strong></p><p>OpenAlex is a free and open catalog of the world\'s research. To get the data without a browser, use the OpenAlex API: <a href="https://help.openalex.org/">help.openalex.org</a> explains how, and <a href="https://help.openalex.org/llms.txt">help.openalex.org/llms.txt</a> lists every docs page.</p>', tagPosition: 'bodyOpen' },
      ],
    },
  },
})
