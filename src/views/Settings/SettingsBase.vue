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
      </v-list>
    </aside>

    <!-- Main content area -->
    <main class="settings-content">
      <div class="settings-content-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'SettingsBase' });

const store = useStore();

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const hasOrganization = computed(() => !!organizationId.value);
const isOrgOwner = computed(() => organizationRole.value === 'owner');
const isAdmin = computed(() => store.getters['user/isAdmin']);

const mySettingsItems = [
  { title: 'Profile', route: '/settings/profile', icon: 'mdi-account-outline' },
  { title: 'Plan', route: '/settings/plan', icon: 'mdi-card-account-details-outline' },
  { title: 'API', route: '/settings/api', icon: 'mdi-code-braces' },
];

const myStuffItems = [
  { title: 'Saved searches', route: '/settings/searches', icon: 'mdi-folder-outline' },
  { title: 'Exports', route: '/settings/exports', icon: 'mdi-download-outline' },
  { title: 'Edits', route: '/settings/edits', icon: 'mdi-pencil-outline' },
  { title: 'Tags', route: '/settings/tags', icon: 'mdi-tag-outline' },
];

const orgItems = [
  { title: 'Org profile', route: '/settings/org-profile', icon: 'mdi-domain', ownerOnly: false },
  { title: 'Org plan', route: '/settings/org-plan', icon: 'mdi-card-account-details-outline', ownerOnly: false },
  { title: 'Org API', route: '/settings/org-api', icon: 'mdi-code-braces', ownerOnly: true },
  { title: 'Members', route: '/settings/org-members', icon: 'mdi-account-group-outline', ownerOnly: true },
  { title: 'Affiliations', route: '/settings/affiliations', icon: 'mdi-link-variant', ownerOnly: true, adminOnly: true },
];

const filteredOrgItems = computed(() => {
  return orgItems.filter(item => {
    if (item.adminOnly && !isAdmin.value) return false;
    if (item.ownerOnly && !isOrgOwner.value) return false;
    return true;
  });
});
</script>

<style lang="scss" scoped>
.settings-layout {
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #FAFAFA;
}

.settings-sidebar {
  width: 240px;
  min-width: 240px;
  padding: 16px 12px;
  border-right: 1px solid #E5E5E5;
  background: #FFFFFF;
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
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
