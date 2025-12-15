<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <!-- Back to app link -->
      <router-link to="/" class="sidebar-back-link">
        <ChevronLeft class="h-3.5 w-3.5" />
        Back to app
      </router-link>

      <nav class="space-y-1">
        <!-- Admin Section -->
        <div class="sidebar-section-header">Admin</div>
        <router-link
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          :class="{ 
            'bg-primary/10 text-primary': $route.path === item.route,
            'opacity-50 pointer-events-none': item.disabled 
          }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.title }}
        </router-link>
      </nav>
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
import { useRoute } from 'vue-router';

import { ChevronLeft, Users, Building2, CreditCard, FileCode, Download, Pencil } from 'lucide-vue-next';

defineOptions({ name: 'AdminBase' });

const $route = useRoute();

const navItems = [
  { title: 'Users', route: '/admin/users', icon: Users },
  { title: 'Organizations', route: '/admin/organizations', icon: Building2 },
  { title: 'Plans', route: '/admin/plans', icon: CreditCard },
  { title: 'Scripts', route: '/admin/scripts', icon: FileCode },
  { title: 'Exports', route: '/admin/exports', icon: Download, disabled: true },
  { title: 'Edits', route: '/admin/edits', icon: Pencil, disabled: true },
];
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #FAFAFA;
}

.admin-sidebar {
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
  padding: 8px 12px 8px;
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
