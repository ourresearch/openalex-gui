<template>
  <div class="d-inline-flex align-center">
    <!-- Page-top ⋮ (next to the dice, #440 r5): search-level actions — save
         search, create alert, copy API call, QR code. Moved up from the
         results-header kebab (SerpResultsKebab), which now holds only
         results-level display options (page size). Logic ported verbatim. -->
    <v-menu location="bottom end" v-model="isMenuOpen">
      <template #activator="{ props }">
        <v-btn icon variant="text" size="small" v-bind="props" aria-label="Search options">
          <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list min-width="240">
        <template v-if="isWorks">
          <v-list-item @click="handleSaveToggle">
            <template #prepend>
              <v-icon>{{ activeSearchObj ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
            </template>
            <v-list-item-title>{{ activeSearchObj ? 'Search is saved' : 'Save search' }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleAlertToggle">
            <template #prepend>
              <v-icon>{{ activeSearchObj?.has_alert ? 'mdi-bell' : 'mdi-bell-outline' }}</v-icon>
            </template>
            <v-list-item-title>{{ activeSearchObj?.has_alert ? 'Alert is active' : 'Create alert' }}</v-list-item-title>
          </v-list-item>
          <v-divider />
        </template>

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

defineOptions({ name: 'SerpHeaderKebab' });

const store = useStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const isMenuOpen = ref(false);
const isDialogOpen = reactive({
  unsaveConfirm: false,
  removeAlertConfirm: false,
  loginRequired: false,
  qrCode: false,
});

const entityType = computed(() => store.getters.entityType);
const isWorks = computed(() => entityType.value === 'works');
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);
const userId = computed(() => store.getters['user/userId']);

const urlToShare = computed(() => `https://openalex.org${route.fullPath}`);
const isUrlTooBigForQR = computed(() => urlToShare.value.length > 3000);
const qrCodeSize = computed(() => mdAndUp.value ? 400 : 300);

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
  isMenuOpen.value = false;
  await navigator.clipboard.writeText(apiCallUrl.value);
  snackbar('API URL copied to clipboard.');
}

function openQrCode() {
  isMenuOpen.value = false;
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
