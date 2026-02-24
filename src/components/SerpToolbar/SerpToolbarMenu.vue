<template>
  <div class="d-flex align-center pr-3">

    <!--
      Query Format Selector (Filters/OQL/OQO/Natural Language toggle)

      Commented out for Alice release — this is out of scope and the UI will
      likely change significantly before we revisit it. Keeping the code here
      for reference but hiding it via comments only (no ad-hoc feature flags).

      TODO: Redesign this when we pick up the filters work post-Alice.
    -->
    <!--
    <v-menu v-if="showOqlToggle" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="outlined"
          size="small"
          class="query-format-btn mr-3"
          append-icon="mdi-chevron-down"
        >
          {{ viewModeLabel }}
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="mode in viewModes"
          :key="mode.value"
          :active="viewMode === mode.value"
          @click="viewMode = mode.value"
        >
          <v-list-item-title>{{ mode.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    -->

    <xpac-chip v-if="!aliceFeatures" />

    <v-menu location="bottom">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-share-variant-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="isDialogOpen.qrCode = true">
          <template #prepend>
            <v-icon>mdi-qrcode</v-icon>
          </template>
          <v-list-item-title>
            Get QR code to share
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="copyUrlToClipboard">
          <template #prepend>
            <v-icon>mdi-link-variant</v-icon>
          </template>
          <v-list-item-title>
            Copy link to share
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu location="bottom" v-model="isMenuOpen">
      <template v-slot:activator="{props}">
        <v-btn icon v-bind="props">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <!-- Alice: Save/Unsave search toggle -->
        <v-list-item
          v-if="aliceFeatures && entityType === 'works'"
          @click="handleSaveToggle"
        >
          <template #prepend>
            <v-icon v-if="activeSearchObj">mdi-star</v-icon>
            <v-icon v-else>mdi-star-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj ? 'Search is saved' : 'Save search' }}
          </v-list-item-title>
        </v-list-item>

        <!-- Alice: Create/Remove alert toggle -->
        <v-list-item
          v-if="aliceFeatures && entityType === 'works'"
          @click="handleAlertToggle"
        >
          <template #prepend>
            <v-icon v-if="activeSearchObj?.has_alert">mdi-bell</v-icon>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj?.has_alert ? 'Alert is active' : 'Create alert' }}
          </v-list-item-title>
        </v-list-item>

        <v-divider v-if="aliceFeatures && entityType === 'works'" />

        <!-- Legacy: alert toggle (non-Alice) -->
        <v-list-item
          v-if="!aliceFeatures && entityType === 'works'"
          @click="$emit('toggle-alert'); isMenuOpen = false"
        >
          <template #prepend>
            <v-icon v-if="activeSearchObj?.has_alert">mdi-bell-check</v-icon>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </template>
          <v-list-item-title>
            {{ activeSearchObj?.has_alert ? 'Remove alert' : 'Create alert' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="handleToggleApiView">
          <template #prepend>
            <v-icon>mdi-api</v-icon>
          </template>
          <v-list-item-title>
            Show API query
          </v-list-item-title>
          <template #append>
            <v-icon v-if="url.isViewSet($route, 'api')" class="pt-2">mdi-check</v-icon>
          </template>
        </v-list-item>

      </v-list>
    </v-menu>

    <v-spacer/>

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

    <v-dialog :width="qrCodeSize" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            QR code for this page:
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text v-if="isUrlTooBigForQR">Add commentMore actions
          <v-alert  type="warning" text>
            Your current URL is too long to create a QR code.
          </v-alert>
        </v-card-text>
        <qrcode-vue v-else :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
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
import { useDisplay } from 'vuetify'
import QrcodeVue from 'qrcode.vue';

import { url } from '@/url';
import XpacChip from '@/components/SerpToolbar/XpacChip.vue';

defineOptions({ name: 'SerpToolbarMenu' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const viewMode = computed({
  get: () => store.getters.oqlViewMode,
  set: (val) => store.commit('setOqlViewMode', val),
});

const viewModes = [
  { value: 'filters', label: 'Filters' },
  { value: 'oql', label: 'OQL' },
  { value: 'oqo', label: 'OQO' },
  { value: 'natural-language', label: 'Natural Language' },
];

const viewModeLabel = computed(() => {
  const mode = viewModes.find(m => m.value === viewMode.value);
  return mode?.label || 'Filters';
});

// Query format selector removed for Alice — see commented-out template above.

const { mdAndUp } = useDisplay();

const isMenuOpen = ref(false);
const isDialogOpen = reactive({
  qrCode: false,
  unsaveConfirm: false,
  removeAlertConfirm: false,
  loginRequired: false,
});

// Vuex getters
const entityType = computed(() => store.getters['entityType']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);
const aliceFeatures = computed(() => store.getters.featureFlags.aliceFeatures);
const userId = computed(() => store.getters['user/userId']);

// Computed props
const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const isUrlTooBigForQR = computed(() => urlToShare.value.length > 3000);
const qrCodeSize = computed(() => {
  return mdAndUp.value ? 400 : 300;
});

const snackbar = (val) => store.commit('snackbar', val);

async function copyUrlToClipboard() {
  await navigator.clipboard.writeText(urlToShare.value);
  snackbar('URL copied to clipboard.');
}

function handleToggleApiView() {
  isMenuOpen.value = false;
  url.toggleView('api');
}

// Auto-name generation for one-click save
function generateAutoName() {
  // Try search query text first
  if (route.query.search) return route.query.search;
  // Try filter keys
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

// Alice: Save toggle handler
async function handleSaveToggle() {
  isMenuOpen.value = false;
  if (!userId.value) {
    isDialogOpen.loginRequired = true;
    return;
  }
  if (activeSearchObj.value) {
    // Already saved → confirm unsave
    isDialogOpen.unsaveConfirm = true;
  } else {
    // Not saved → auto-save
    await store.dispatch('user/createSearch', {
      search_url: 'https://openalex.org' + route.fullPath,
      name: generateAutoName(),
    });
  }
}

// Alice: Alert toggle handler
async function handleAlertToggle() {
  isMenuOpen.value = false;
  if (!userId.value) {
    isDialogOpen.loginRequired = true;
    return;
  }
  if (activeSearchObj.value?.has_alert) {
    // Has alert → confirm remove
    isDialogOpen.removeAlertConfirm = true;
  } else if (activeSearchObj.value) {
    // Saved but no alert → add alert
    await store.dispatch('user/updateSearchAlert', {
      id: activeSearchObj.value.id,
      has_alert: true,
    });
  } else {
    // Not saved → auto-save with alert
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

function clickLogin() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

</script>

<style lang="scss" scoped>
.query-format-btn {
  text-transform: none;
  font-weight: 500;
  min-width: 80px;
}
</style>