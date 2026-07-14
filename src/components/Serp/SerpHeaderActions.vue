<template>
  <div class="d-inline-flex align-center">
    <!-- Page-top search-level actions (#440 r5 → #611). Was one ⋮ kebab holding
         save/alert/copy-API/QR; #611 splits it into two purposeful icon menus and
         retires the QR code entirely:
           - STAR: Save search / Create alert (works only, like the old kebab).
           - SHARE: the "Copy query as…" picker (OQL / API URL / OQO).
         Share sits at the FAR RIGHT of the header row (r3, Jason). -->
    <!-- Star: save/alert. Works-only, matching the old kebab's gate (saved searches
         and alerts are a works feature). Filled amber star = this search is saved. -->
    <v-menu v-if="isWorks" location="bottom end" v-model="isStarMenuOpen">
      <template #activator="{ props }">
        <v-btn icon variant="text" size="small" v-bind="props" aria-label="Save search or create alert">
          <v-icon :color="activeSearchObj ? 'amber-darken-2' : 'grey-darken-1'">
            {{ activeSearchObj ? 'mdi-star' : 'mdi-star-outline' }}
          </v-icon>
          <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">
            {{ activeSearchObj ? 'Saved' : 'Save' }}
          </v-tooltip>
        </v-btn>
      </template>
      <v-list min-width="240">
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
      </v-list>
    </v-menu>
    <!-- r2 (Jason): arrow-style share icon; menu is a "Copy query as…" picker — bare
         format names (no "Copy" verb) ordered OQL → API URL → OQO, each with a
         plain-words subtitle saying what the format is for. -->
    <v-menu location="bottom end" v-model="isShareMenuOpen">
      <template #activator="{ props }">
        <v-btn icon variant="text" size="small" v-bind="props" aria-label="Share search">
          <v-icon color="grey-darken-1">mdi-share-outline</v-icon>
          <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">
            Share
          </v-tooltip>
        </v-btn>
      </template>
      <v-list min-width="270">
        <v-list-subheader>Copy query as…</v-list-subheader>
        <v-list-item :disabled="!canonicalOql" @click="copyOql">
          <template #prepend>
            <v-icon>mdi-code-parentheses</v-icon>
          </template>
          <v-list-item-title>OQL</v-list-item-title>
          <v-list-item-subtitle>structured sentence (for humans)</v-list-item-subtitle>
        </v-list-item>
        <v-list-item @click="copyApiUrl">
          <template #prepend>
            <v-icon>mdi-api</v-icon>
          </template>
          <v-list-item-title>API URL</v-list-item-title>
          <v-list-item-subtitle>REST syntax (legacy)</v-list-item-subtitle>
        </v-list-item>
        <v-list-item :disabled="!canonicalOqo" @click="copyOqo">
          <template #prepend>
            <v-icon>mdi-code-json</v-icon>
          </template>
          <v-list-item-title>OQO</v-list-item-title>
          <v-list-item-subtitle>JSON object (for agents)</v-list-item-subtitle>
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
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { oqlForUrl } from '@/oqlSerialize';

defineOptions({ name: 'SerpHeaderActions' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const isShareMenuOpen = ref(false);
const isStarMenuOpen = ref(false);
const isDialogOpen = reactive({
  unsaveConfirm: false,
  removeAlertConfirm: false,
  loginRequired: false,
});

const entityType = computed(() => store.getters.entityType);
const isWorks = computed(() => entityType.value === 'works');
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);
const userId = computed(() => store.getters['user/userId']);

// ---- share targets (#611) ---------------------------------------------------
// The server-canonical query triple {oql, oqo, url} rides on every executed
// response as meta.x_query (see api.js executeOql/executeOqo). It's the source of
// truth for all three copy targets; the route params are only a fallback for the
// legacy GET path, whose responses don't carry x_query.
const xQuery = computed(() => store.state.resultsObject?.meta?.x_query);
const canonicalOql = computed(() => xQuery.value?.oql || route.query.oql || null);
const canonicalOqo = computed(() => xQuery.value?.oqo || null);

// The API URL to copy: the flat oxurl format when the query can be expressed that
// way (x_query.url is exactly that rendering, e.g. "/works?filter=…&sort=…"), else
// — too complicated for oxurl — the OQL form of the same call on the API root
// (GET /?oql=…, the execute surface). Legacy fallback: build from route params,
// verbatim from the old kebab. Always the public host — a copied URL is for
// sharing, never the dev-port base.
const apiUrl = computed(() => {
  const xq = xQuery.value;
  if (xq?.url) return `https://api.openalex.org${xq.url}`;
  if (canonicalOql.value) {
    return `https://api.openalex.org/?${new URLSearchParams({ oql: oqlForUrl(canonicalOql.value) })}`;
  }
  return legacyApiUrl.value;
});
const legacyApiUrl = computed(() => {
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

async function copyApiUrl() {
  isShareMenuOpen.value = false;
  await navigator.clipboard.writeText(apiUrl.value);
  snackbar('API URL copied to clipboard.');
}

async function copyOql() {
  isShareMenuOpen.value = false;
  if (!canonicalOql.value) return;
  await navigator.clipboard.writeText(canonicalOql.value);
  snackbar('OQL copied to clipboard.');
}

async function copyOqo() {
  isShareMenuOpen.value = false;
  if (!canonicalOqo.value) return;
  await navigator.clipboard.writeText(JSON.stringify(canonicalOqo.value, null, 2));
  snackbar('OQO copied to clipboard.');
}

// ---- save / alert (unchanged from the kebab) ---------------------------------
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
  isStarMenuOpen.value = false;
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
  isStarMenuOpen.value = false;
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

function clickLogin() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isDialogOpen.loginRequired = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}
</script>
