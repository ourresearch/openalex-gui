<template>
  <div class="d-flex justify-end align-center">
    <!-- Widgets (hidden during semantic search — group_by not supported) -->
    <action-menu v-if="isWorks && !isSemanticSearch" action="group_by">
      <template #activator="{ props: menuProps }">
        <v-tooltip text="Widgets" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon variant="text" v-bind="{ ...menuProps, ...tooltipProps }">
              <v-icon color="grey-darken-1">mdi-widgets</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>
    </action-menu>

    <!-- Download -->
    <v-menu location="bottom">
      <template #activator="{ props: menuProps }">
        <v-tooltip text="Download" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon variant="text" v-bind="{ ...menuProps, ...tooltipProps }">
              <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>
      <v-list>
        <v-list-item @click="exportButtonRef?.openExportDialog()">
          <template #prepend>
            <v-icon>mdi-file-download-outline</v-icon>
          </template>
          <v-list-item-title>
            Download {{ formattedResultsCount }} {{ filters.pluralize(entityType, 2) }}
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isWorks && groupByCount > 0 && !isSemanticSearch" :href="csvUrl">
          <template #prepend>
            <v-icon>mdi-chart-box-outline</v-icon>
          </template>
          <v-list-item-title>
            Download {{ groupByCount }} facets
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Three-dots menu -->
    <v-menu location="bottom" v-model="isDotsMenuOpen">
      <template #activator="{ props }">
        <v-btn icon variant="text" v-bind="props">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-if="isWorks" @click="handleSaveToggle">
          <template #prepend>
            <v-icon>{{ activeSearchObj ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
          </template>
          <v-list-item-title>{{ activeSearchObj ? 'Search is saved' : 'Save search' }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isWorks" @click="handleAlertToggle">
          <template #prepend>
            <v-icon>{{ activeSearchObj?.has_alert ? 'mdi-bell' : 'mdi-bell-outline' }}</v-icon>
          </template>
          <v-list-item-title>{{ activeSearchObj?.has_alert ? 'Alert is active' : 'Create alert' }}</v-list-item-title>
        </v-list-item>
        <v-divider v-if="isWorks" />
        <v-list-item @click="copyApiCall">
          <template #prepend>
            <v-icon>mdi-api</v-icon>
          </template>
          <v-list-item-title>Copy API call</v-list-item-title>
        </v-list-item>
        <v-list-item @click="openQrCode">
          <template #prepend>
            <v-icon>mdi-qrcode</v-icon>
          </template>
          <v-list-item-title>Get QR code</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Hidden export button (dialogs are teleported, so they still work) -->
    <serp-results-export-button ref="exportButtonRef" class="d-none" />

    <!-- Unsave confirmation dialog -->
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

    <!-- Remove alert confirmation dialog -->
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

    <!-- Login required dialog -->
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

    <!-- QR Code dialog -->
    <v-dialog :width="qrCodeSize" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-toolbar flat>
          <v-toolbar-title>QR code for this page:</v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text v-if="isUrlTooBigForQR">
          <v-alert type="warning" text>
            Your current URL is too long to create a QR code.
          </v-alert>
        </v-card-text>
        <qrcode-vue v-else :value="urlToShare" :size="qrCodeSize" />
        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script setup>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import QrcodeVue from 'qrcode.vue';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr } from '@/filterConfigs';

import ActionMenu from '@/components/Action/ActionMenu.vue';
import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';

defineOptions({ name: 'SerpRightToolbar' });

const props = defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const exportButtonRef = ref(null);
const isDotsMenuOpen = ref(false);
const isDialogOpen = reactive({
  unsaveConfirm: false,
  removeAlertConfirm: false,
  loginRequired: false,
  qrCode: false,
});

// Store getters
const entityType = computed(() => store.getters.entityType);
const isWorks = computed(() => entityType.value === 'works');
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);
const userId = computed(() => store.getters['user/userId']);

// Results count
const formattedResultsCount = computed(() => {
  const count = props.resultsObject?.meta?.count;
  return count ? filters.toPrecision(count) : '0';
});

// Group-by / facets
const groupByKeys = computed(() => {
  const keys = url.getGroupBy(route);
  keys.sort((a) => ['apc_sum', 'cited_by_count_sum'].includes(a) ? -1 : 1);
  return keys;
});

const groupByCount = computed(() => groupByKeys.value.length);

const csvUrl = computed(() => {
  const myFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  return url.makeGroupByUrl(
    entityType.value,
    groupByKeys.value.join(','),
    { filters: myFilters, isMultipleGroups: true, formatCsv: true }
  );
});

// QR code
const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const isUrlTooBigForQR = computed(() => urlToShare.value.length > 3000);
const qrCodeSize = computed(() => mdAndUp.value ? 400 : 300);

// API URL for copy
const apiCallUrl = computed(() => {
  const params = new URLSearchParams();
  if (route.query.filter) params.set('filter', route.query.filter);
  if (route.query.search) params.set('search', route.query.search);
  if (route.query['search.exact']) params.set('search.exact', route.query['search.exact']);
  if (route.query['search.semantic']) params.set('search.semantic', route.query['search.semantic']);
  if (route.query['search.title']) params.set('search.title', route.query['search.title']);
  if (route.query['search.title.exact']) params.set('search.title.exact', route.query['search.title.exact']);
  if (route.query['search.title_and_abstract']) params.set('search.title_and_abstract', route.query['search.title_and_abstract']);
  if (route.query['search.title_and_abstract.exact']) params.set('search.title_and_abstract.exact', route.query['search.title_and_abstract.exact']);
  if (route.query.sort) params.set('sort', route.query.sort);
  const qs = params.toString();
  return `https://api.openalex.org/${entityType.value}${qs ? '?' + qs : ''}`;
});

const snackbar = (val) => store.commit('snackbar', val);

// Save/alert auto-name
function generateAutoName() {
  const searchQuery = route.query.search
    || route.query['search.exact']
    || route.query['search.semantic']
    || route.query['search.title']
    || route.query['search.title.exact']
    || route.query['search.title_and_abstract']
    || route.query['search.title_and_abstract.exact'];
  if (searchQuery) return searchQuery;
  const filterParam = route.query.filter;
  if (filterParam) {
    const filterKeys = filterParam.split(',').map(f => {
      const key = f.split(':')[0];
      return key.replace(/_/g, ' ').replace(/\./g, ' > ');
    });
    return filterKeys.slice(0, 3).join(', ');
  }
  return 'Untitled search';
}

// Save toggle
async function handleSaveToggle() {
  isDotsMenuOpen.value = false;
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

// Alert toggle
async function handleAlertToggle() {
  isDotsMenuOpen.value = false;
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

async function confirmUnsave() {
  isDialogOpen.unsaveConfirm = false;
  if (activeSearchObj.value) {
    await store.dispatch('user/unsaveCurrentSearch', activeSearchObj.value.id);
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

async function copyApiCall() {
  isDotsMenuOpen.value = false;
  await navigator.clipboard.writeText(apiCallUrl.value);
  snackbar('API URL copied to clipboard.');
}

function openQrCode() {
  isDotsMenuOpen.value = false;
  isDialogOpen.qrCode = true;
}

function clickLogin() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}
</script>
