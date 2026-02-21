<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <!-- Back to app link -->
      <router-link to="/" class="sidebar-back-link">
        <v-icon size="14">mdi-chevron-left</v-icon>
        Back to app
      </router-link>

      <v-list nav density="compact" class="bg-transparent pa-0">
        <template v-for="section in navSections" :key="section.label">
          <div class="sidebar-section-header">{{ section.label }}</div>
          <v-list-item
            v-for="item in section.items"
            :key="item.route"
            :to="item.route"
            :prepend-icon="item.icon"
            :title="item.title"
          />
        </template>
      </v-list>
    </aside>

    <!-- Main content area -->
    <main class="admin-content">
      <div class="admin-content-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminBase' });

const navSections = [
  {
    label: 'Accounts',
    items: [
      { title: 'Users', route: '/admin/users', icon: 'mdi-account-group-outline' },
      { title: 'Organizations', route: '/admin/organizations', icon: 'mdi-domain' },
    ],
  },
  {
    label: 'Data Quality',
    items: [
      { title: 'Affiliations', route: '/admin/affiliations', icon: 'mdi-link-variant' },
      { title: 'Curations', route: '/admin/curations', icon: 'mdi-check-decagram-outline' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { title: 'Plans', route: '/admin/plans', icon: 'mdi-card-account-details-outline' },
      { title: 'Feature Flags', route: '/admin/feature-flags', icon: 'mdi-flag-outline' },
    ],
  },
];
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - var(--app-bar-height));
  background-color: #FAFAFA;
}

.admin-sidebar {
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
  padding: 8px 12px 4px;
  margin-top: 12px;

  &:first-child {
    margin-top: 0;
  }
}

.admin-content {
  flex: 1;
  padding: 48px;
  overflow-y: auto;
}

.admin-content-inner {
  max-width: 1200px;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    min-width: 100%;
    height: auto;
    position: relative;
    top: 0;
    border-right: none;
    border-bottom: 1px solid #E5E5E5;
    padding: 12px;
  }

  .admin-content {
    padding: 24px 16px;
  }
}
</style>
