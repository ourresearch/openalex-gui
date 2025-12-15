<template>
  <div class="settings-layout">
    <!-- Sidebar -->
    <aside class="settings-sidebar">
      <!-- Back to app link -->
      <router-link to="/" class="sidebar-back-link">
        <ChevronLeft class="h-3.5 w-3.5" />
        Back to app
      </router-link>

      <nav class="space-y-1">
        <!-- My Settings Section -->
        <div class="sidebar-section-header">My Settings</div>
        <router-link
          v-for="item in mySettingsItems"
          :key="item.route"
          :to="item.route"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.title }}
        </router-link>

        <!-- My Stuff Section -->
        <div class="sidebar-section-header">My Stuff</div>
        <router-link
          v-for="item in myStuffItems"
          :key="item.route"
          :to="item.route"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.title }}
        </router-link>

        <!-- My Organization Section (only if user has an org) -->
        <template v-if="hasOrganization">
          <div class="sidebar-section-header">My Organization</div>
          <router-link
            v-for="item in filteredOrgItems"
            :key="item.route"
            :to="item.route"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.title }}
          </router-link>
        </template>
      </nav>
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
import { useRoute } from 'vue-router';

import { ChevronLeft, User, CreditCard, Code, Folder, Download, Pencil, Tag, Building2, Users } from 'lucide-vue-next';

defineOptions({ name: 'SettingsBase' });

const store = useStore();
const $route = useRoute();

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const hasOrganization = computed(() => !!organizationId.value);
const isOrgOwner = computed(() => organizationRole.value === 'owner');

const mySettingsItems = [
  { title: 'Profile', route: '/settings/profile', icon: User },
  { title: 'Plan', route: '/settings/plan', icon: CreditCard },
  { title: 'API', route: '/settings/api', icon: Code },
];

const myStuffItems = [
  { title: 'Saved searches', route: '/settings/searches', icon: Folder },
  { title: 'Exports', route: '/settings/exports', icon: Download },
  { title: 'Edits', route: '/settings/edits', icon: Pencil },
  { title: 'Tags', route: '/settings/tags', icon: Tag },
];

const orgItems = [
  { title: 'Org profile', route: '/settings/org-profile', icon: Building2, ownerOnly: false },
  { title: 'Org plan', route: '/settings/org-plan', icon: CreditCard, ownerOnly: false },
  { title: 'Org API', route: '/settings/org-api', icon: Code, ownerOnly: true },
  { title: 'Members', route: '/settings/org-members', icon: Users, ownerOnly: true },
];

const filteredOrgItems = computed(() => {
  return orgItems.filter(item => !item.ownerOnly || isOrgOwner.value);
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
