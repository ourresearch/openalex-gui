<template>
  <div class="d-inline-flex">
    <v-menu location="bottom end" v-model="isMenuOpen">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon variant="text" size="small">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list density="compact">
        <!-- Save search -->
        <v-list-item @click="handleSaveToggle">
          <template #prepend>
            <v-icon v-if="activeSearchObj">mdi-star</v-icon>
            <v-icon v-else>mdi-star-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj ? 'Search is saved' : 'Save search' }}
          </v-list-item-title>
        </v-list-item>

        <!-- Create/remove alert -->
        <v-list-item @click="handleAlertToggle">
          <template #prepend>
            <v-icon v-if="activeSearchObj?.has_alert">mdi-bell</v-icon>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj?.has_alert ? 'Alert is active' : 'Create alert' }}
          </v-list-item-title>
        </v-list-item>

        <v-divider class="my-1" />

        <!-- Download -->
        <v-list-item @click="handleDownload">
          <template #prepend>
            <v-icon>mdi-tray-arrow-down</v-icon>
          </template>
          <v-list-item-title>Download results</v-list-item-title>
        </v-list-item>

        <!-- Copy API query -->
        <v-list-item @click="copyApiQuery">
          <template #prepend>
            <v-icon>mdi-api</v-icon>
          </template>
          <v-list-item-title>Copy API query</v-list-item-title>
        </v-list-item>

        <!-- QR code -->
        <v-list-item @click="isDialogOpen.qrCode = true; isMenuOpen = false">
          <template #prepend>
            <v-icon>mdi-qrcode</v-icon>
          </template>
          <v-list-item-title>Copy QR code</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Unsave confirmation -->
    <v-dialog v-model="isDialogOpen.unsaveConfirm" max-width="400">
      <v-card rounded>
        <v-card-title>Unsave this search?</v-card-title>
        <v-card-text>
          This will remove the saved search{{ activeSearchObj?.has_alert ? ' and its alert' : '' }}.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isDialogOpen.unsaveConfirm = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="confirmUnsave">Unsave</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove alert confirmation -->
    <v-dialog v-model="isDialogOpen.removeAlertConfirm" max-width="400">
      <v-card rounded>
        <v-card-title>Remove this alert?</v-card-title>
        <v-card-text>
          You'll stop receiving alerts for this search. The saved search will not be deleted.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isDialogOpen.removeAlertConfirm = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="confirmRemoveAlert">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Login required -->
    <v-dialog v-model="isDialogOpen.loginRequired" max-width="500">
      <v-card rounded>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          To save searches and create alerts, please log in or sign up.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Too many results dialog -->
    <v-dialog v-model="isDialogOpen.tooManyResults" max-width="400">
      <v-card rounded>
        <v-card-title>Too many results</v-card-title>
        <v-card-text>
          Downloads are limited to 100,000 results. Try adding filters to narrow your search.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="flat" rounded color="primary" @click="isDialogOpen.tooManyResults = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- QR code dialog -->
    <v-dialog :width="360" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-card-text v-if="urlToShare.length > 3000">
          <v-alert type="warning" text>
            Your current URL is too long to create a QR code.
          </v-alert>
        </v-card-text>
        <div v-else style="padding: 30px;">
          <qrcode-vue :value="urlToShare" :size="300" />
        </div>
      </v-card>
    </v-dialog>

    <!-- Hidden export button (provides its own dialogs) -->
    <serp-results-export-button ref="exportButton" v-show="false" />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import QrcodeVue from 'qrcode.vue';
import { url } from '@/url';
import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';

defineOptions({ name: 'NoviceToolbarMenu' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const isMenuOpen = ref(false);
const exportButton = ref(null);

const isDialogOpen = reactive({
  unsaveConfirm: false,
  removeAlertConfirm: false,
  loginRequired: false,
  tooManyResults: false,
  qrCode: false,
});

const userId = computed(() => store.getters['user/userId']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);
const resultsCount = computed(() => store.state?.resultsObject?.meta?.count ?? 0);

const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const snackbar = (msg) => store.commit('snackbar', msg);

// --- Save search ---
function generateAutoName() {
  if (route.query.search) return route.query.search;
  const filterParam = route.query.filter;
  if (filterParam) {
    const filterKeys = filterParam.split(',').map(f => {
      const key = f.split(':')[0];
      return key.replace(/_/g, ' ').replace(/\./g, ' › ');
    });
    return filterKeys.slice(0, 3).join(', ');
  }
  return 'Untitled search';
}

async function handleSaveToggle() {
  isMenuOpen.value = false;
  if (!userId.value) {
    isDialogOpen.loginRequired = true;
    return;
  }
  if (activeSearchObj.value) {
    isDialogOpen.unsaveConfirm = true;
  } else {
    await store.dispatch('user/createSearch', {
      search_url: 'https://openalex.org' + route.fullPath,
      name: generateAutoName(),
    });
  }
}

async function confirmUnsave() {
  isDialogOpen.unsaveConfirm = false;
  if (activeSearchObj.value) {
    await store.dispatch('user/unsaveCurrentSearch', activeSearchObj.value.id);
  }
}

// --- Alert ---
async function handleAlertToggle() {
  isMenuOpen.value = false;
  if (!userId.value) {
    isDialogOpen.loginRequired = true;
    return;
  }
  if (activeSearchObj.value?.has_alert) {
    isDialogOpen.removeAlertConfirm = true;
  } else if (activeSearchObj.value) {
    await store.dispatch('user/updateSearchAlert', {
      id: activeSearchObj.value.id,
      has_alert: true,
    });
  } else {
    await store.dispatch('user/createSearch', {
      search_url: 'https://openalex.org' + route.fullPath,
      name: generateAutoName(),
      has_alert: true,
    });
  }
}

async function confirmRemoveAlert() {
  isDialogOpen.removeAlertConfirm = false;
  if (activeSearchObj.value) {
    await store.dispatch('user/updateSearchAlert', {
      id: activeSearchObj.value.id,
      has_alert: false,
    });
  }
}

// --- Download ---
function handleDownload() {
  isMenuOpen.value = false;
  if (resultsCount.value > 100000) {
    isDialogOpen.tooManyResults = true;
  } else {
    exportButton.value?.openExportDialog();
  }
}

// --- Copy API query ---
async function copyApiQuery() {
  isMenuOpen.value = false;
  const apiUrl = url.makeApiUrl(route);
  await navigator.clipboard.writeText(apiUrl);
  snackbar('API query copied to clipboard.');
}

// --- Auth redirects ---
function clickLogin() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}
</script>
