<template>
  <div class="settings-layout">
    <!-- Sidebar -->
    <aside class="settings-sidebar">
      <!-- Back to app link -->
      <router-link to="/" class="sidebar-back-link">
        <v-icon size="14">mdi-chevron-left</v-icon>
        Back to app
      </router-link>

      <v-list nav density="compact" class="bg-transparent pa-0">
        <!-- My Settings Section -->
        <div class="sidebar-section-header">My Settings</div>
        <v-list-item
          v-for="item in mySettingsItems"
          :key="item.route"
          :to="item.route"
          :prepend-icon="item.icon"
          :title="item.title"
        />

        <!-- My Stuff Section -->
        <div class="sidebar-section-header">My Stuff</div>
        <v-list-item
          v-for="item in myStuffItems"
          :key="item.route"
          :to="item.route"
          :prepend-icon="item.icon"
          :title="item.title"
        />

        <!-- My Organization Section (only if user has an org) -->
        <template v-if="hasOrganization">
          <div class="sidebar-section-header">My Organization</div>
          <v-list-item
            v-for="item in filteredOrgItems"
            :key="item.route"
            :to="item.route"
            :prepend-icon="item.icon"
            :title="item.title"
          />
        </template>

        <!-- Administration Section (site curators and admins) -->
        <template v-if="hasSiteWideAccess">
          <div class="sidebar-section-header">Site Admin</div>
          <v-list-item
            v-for="item in adminItems"
            :key="item.route"
            :to="item.route"
            :prepend-icon="item.icon"
            :title="item.title"
          />
        </template>
      </v-list>
    </aside>

    <!-- Main content area -->
    <main class="settings-content">
      <div class="settings-content-inner">
        <router-view />
      </div>
    </main>

    <!-- Purchase success dialog -->
    <v-dialog v-model="showPurchaseDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-8">
          <div class="d-flex align-center mb-2">
            <v-icon size="28" color="success" class="mr-3">mdi-check-circle</v-icon>
            <div class="text-h6 font-weight-bold">Purchase successful</div>
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Your purchase was successful! Your balance will update within a few minutes.
          </div>
        </v-card-text>
        <v-card-actions class="px-8 pb-6">
          <v-btn
            variant="flat"
            color="primary"
            @click="dismissPurchaseDialog"
          >
            Got it
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'SettingsBase' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// Purchase success handling
const showPurchaseDialog = ref(false);

onMounted(() => {
  if (route.query.purchase === 'success') {
    showPurchaseDialog.value = true;
  }
});

function dismissPurchaseDialog() {
  showPurchaseDialog.value = false;
  // Clean query params from URL
  const query = { ...route.query };
  delete query.purchase;
  router.replace({ ...route, query });
}

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const hasOrganization = computed(() => !!organizationId.value);
const isOrgOwner = computed(() => organizationRole.value === 'owner');
const isCuratorOrOwner = computed(() => ['owner', 'curator'].includes(organizationRole.value));
const hasSiteWideAccess = computed(() => store.getters['user/hasSiteWideAccess']);

const mySettingsItems = [
  { title: 'General', route: '/settings/profile', icon: 'mdi-account-outline' },
  { title: 'Usage', route: '/settings/usage', icon: 'mdi-chart-bar' },
];

const myStuffItems = [
  { title: 'API key', route: '/settings/api-key', icon: 'mdi-key-outline' },
  { title: 'Saved searches', route: '/settings/searches', icon: 'mdi-folder-outline' },
  { title: 'Exports', route: '/settings/exports', icon: 'mdi-download-outline' },
];

const orgItems = [
  { title: 'Org profile', route: '/settings/org-profile', icon: 'mdi-domain', filter: 'all' },
  { title: 'Org usage', route: '/settings/org-usage', icon: 'mdi-chart-bar', filter: 'ownerOnly' },
  { title: 'Org affiliations', route: '/settings/affiliations', icon: 'mdi-link-variant', filter: 'curatorOrOwner' },
  { title: 'Org curations', route: '/settings/curations', icon: 'mdi-link-plus', filter: 'all' },
  { title: 'Org plan & billing', route: '/settings/org-plan', icon: 'mdi-card-account-details-outline', filter: 'ownerOnly' },
  { title: 'Org API key', route: '/settings/org-api', icon: 'mdi-key-outline', filter: 'ownerOnly' },
  { title: 'Org members', route: '/settings/org-members', icon: 'mdi-account-group-outline', filter: 'ownerOnly' },
];

const adminItems = [
  { title: 'Affiliations', route: '/settings/site-affiliations', icon: 'mdi-link-variant' },
  { title: 'Curations', route: '/settings/site-curations', icon: 'mdi-link-plus' },
];

const filteredOrgItems = computed(() => {
  return orgItems.filter(item => {
    if (item.filter === 'ownerOnly' && !isOrgOwner.value) return false;
    if (item.filter === 'curatorOrOwner' && !isCuratorOrOwner.value) return false;
    return true;
  });
});
</script>

<style lang="scss" scoped>
.settings-layout {
  display: flex;
  min-height: calc(100vh - var(--app-bar-height));
  background-color: #FAFAFA;
}

.settings-sidebar {
  width: 240px;
  min-width: 240px;
  padding: 16px 12px;
  border-right: 1px solid #E5E5E5;
  background: #FFFFFF;
  position: sticky;
  top: var(--app-bar-height);
  height: calc(100vh - var(--app-bar-height));
  overflow-y: auto;
}

.sidebar-back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #6B6B6B;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    background-color: #F5F5F5;
    color: #1A1A1A;
    text-decoration: none;
  }
}

.sidebar-section-header {
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 20px 12px 8px;

  &:first-of-type {
    padding-top: 8px;
  }
}

.settings-content {
  flex: 1;
  padding: 48px;
  overflow-y: auto;
}

.settings-content-inner {
  max-width: 680px;
}

@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    min-width: 100%;
    height: auto;
    position: relative;
    top: 0;
    border-right: none;
    border-bottom: 1px solid #E5E5E5;
    padding: 12px;
  }

  .settings-content {
    padding: 24px 16px;
  }
}
</style>
