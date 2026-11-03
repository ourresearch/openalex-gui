<template>
  <!-- The in-app API viewer (oxjob #1246), one for the whole app (App.vue); any "View in API"
       opens it with store.commit('openApiDialog', url). It fetches with the user's own key in
       the Authorization header, so no key ever sits in a URL the browser shows or keeps. -->
  <v-dialog
    v-model="open"
    max-width="960"
    :height="xs ? undefined : 'min(85vh, 900px)'"
    :fullscreen="xs"
    :z-index="10002"
  >
    <v-card class="api-viewer-card">
      <div class="d-flex align-center px-4 pt-3 pb-1">
        <v-icon size="small" class="mr-2">mdi-code-json</v-icon>
        <div class="text-subtitle-1 font-weight-medium">API response</div>
        <v-spacer />
        <v-btn icon variant="text" size="small" aria-label="Close" @click="open = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- The request, with the key masked. Selectable text never carries the key. -->
      <div class="px-4">
        <div class="api-viewer-url">
          <span class="api-viewer-method">GET</span>
          <span>{{ url }}</span><template v-if="apiKey"><span>{{ keyParamJoiner(url) }}api_key=</span><span
            class="api-viewer-mask"
            title="Your API key is hidden here. Copy URL includes it."
          >••••••••</span></template>
        </div>
        <div class="d-flex align-center flex-wrap ga-2 mt-2 mb-1">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-content-copy" @click="copyUrl">
            {{ apiKey ? 'Copy URL with your key' : 'Copy URL' }}
          </v-btn>
          <v-btn size="small" variant="text" prepend-icon="mdi-code-braces" :disabled="!data" @click="copyJson">
            Copy JSON
          </v-btn>
          <v-btn size="small" variant="text" prepend-icon="mdi-open-in-new" :href="url" target="_blank" rel="noopener">
            Open raw
            <v-tooltip activator="parent" location="bottom">
              Opens this URL in a new tab, without your API key
            </v-tooltip>
          </v-btn>
        </div>
        <div v-if="apiKey" class="text-caption text-medium-emphasis mb-2">
          This request uses your API key. A copied URL includes it, so keep it private.
        </div>
      </div>

      <v-divider />

      <!-- The one scroll region: the header above stays put. -->
      <div class="api-viewer-body">
        <div v-if="loading" class="d-flex justify-center align-center fill-height pa-8">
          <v-progress-circular indeterminate size="28" />
        </div>
        <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="ma-4">
          <div class="font-weight-medium">
            {{ error.status ? `The API answered ${error.status}.` : 'The request failed.' }}
          </div>
          <div v-if="error.message" class="api-viewer-error-text">{{ error.message }}</div>
        </v-alert>
        <vue-json-pretty
          v-else-if="data"
          :data="data"
          :deep="2"
          :collapsed-node-length="60"
          :show-length="true"
          :show-icon="true"
          :show-line="false"
          class="api-viewer-json pa-4"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, shallowRef, watch } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import axios from 'axios';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { axiosConfig } from '@/apiConfig';
import { waitForApiKey } from '@/keyWait';
import { keyedApiUrl, keyParamJoiner, apiErrorSummary } from '@/apiViewer';

defineOptions({ name: 'ApiViewerDialog' });

const open = defineModel({ type: Boolean, default: false });
const props = defineProps({
  // The keyless API URL to show and fetch (e.g. https://api.openalex.org/works/W123).
  url: { type: String, default: '' },
});

const store = useStore();
const { xs } = useDisplay();

// Replaced whole, never edited: shallow, so a big record isn't made deeply reactive.
const data = shallowRef(null);
const error = shallowRef(null);
const loading = shallowRef(false);
const apiKey = computed(() => store.state.user?.apiKey || null);

let controller = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  data.value = null;
  error.value = null;
  loading.value = true;
  try {
    // Signed in but the key hasn't arrived yet (a page's first moments): wait for it, so the
    // request is never sent keyless on the network's shared budget.
    let hasToken = false;
    try { hasToken = !!localStorage.getItem('token'); } catch (e) { /* no storage */ }
    if (hasToken) await waitForApiKey(store);
    if (signal.aborted) return;
    const resp = await axios.get(props.url, { ...axiosConfig(), signal });
    data.value = resp.data;
  } catch (e) {
    if (!signal.aborted) error.value = apiErrorSummary(e);
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}

watch(
  () => [open.value, props.url],
  () => {
    if (open.value && props.url) load();
    else controller?.abort();
  },
  { immediate: true },
);

async function writeClipboard(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    store.commit('snackbar', msg);
  } catch (e) {
    store.commit('snackbar', { msg: "Couldn't copy to the clipboard.", color: 'error' });
  }
}

function copyUrl() {
  if (apiKey.value) {
    writeClipboard(keyedApiUrl(props.url, apiKey.value), 'URL copied, with your API key. Keep it private.');
  } else {
    writeClipboard(props.url, 'URL copied.');
  }
}

function copyJson() {
  if (data.value) writeClipboard(JSON.stringify(data.value, null, 2), 'JSON copied.');
}
</script>

<style scoped lang="scss">
// The dialog's height is fixed (its height prop), so it doesn't jump as the JSON loads or
// folds: the card fills it and only the body scrolls.
.api-viewer-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.api-viewer-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  word-break: break-all;
}
.api-viewer-method {
  font-weight: 600;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.6);
}
.api-viewer-mask {
  letter-spacing: 1px;
  color: rgba(0, 0, 0, 0.55);
  cursor: help;
  user-select: none;
}
.api-viewer-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.api-viewer-json {
  font-size: 0.82rem;
}
.api-viewer-error-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
