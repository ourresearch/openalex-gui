<template>
  <!-- Mobile hamburger toggle -->
  <v-btn
    v-if="mobile && !drawerOpen"
    icon
    variant="text"
    class="mobile-hamburger"
    @click="drawerOpen = true"
  >
    <v-icon>mdi-menu</v-icon>
  </v-btn>

  <v-navigation-drawer
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    width="56"
    color="white"
    class="app-sidebar"
  >
    <div class="sidebar-content">
      <!-- Top section: logo + new search -->
      <div class="sidebar-top">
        <v-tooltip location="right" text="OpenAlex">
          <template #activator="{ props }">
            <router-link :to="homeRoute" class="sidebar-icon-link" v-bind="props">
              <img
                src="@/assets/tricon.png"
                class="sidebar-logo"
                alt="OpenAlex"
              />
            </router-link>
          </template>
        </v-tooltip>

        <v-tooltip location="right" text="New search">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              class="sidebar-btn"
              v-bind="props"
              @click="newSearch"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Bottom section: credits + avatar/login -->
      <div class="sidebar-bottom">
        <CreditIndicator
          v-if="userId && rateLimitData"
          :used-usd="rateLimitData.daily_used_usd"
          :budget-usd="dailyBudgetUsd"
          tooltip-location="right"
        />

        <AppSidebarUserMenu v-if="userId" />

        <v-tooltip v-else location="right" text="Log in">
          <template #activator="{ props }">
            <router-link to="/login" class="sidebar-icon-link" v-bind="props">
              <v-icon class="sidebar-login-icon">mdi-login</v-icon>
            </router-link>
          </template>
        </v-tooltip>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import CreditIndicator from '@/components/Credits/CreditIndicator.vue';
import AppSidebarUserMenu from '@/components/AppSidebarUserMenu.vue';

defineOptions({ name: 'AppSidebar' });

const store = useStore();
const router = useRouter();
const { mobile } = useDisplay();

const drawerOpen = ref(true);

const userId = computed(() => store.getters['user/userId']);
const rateLimitData = computed(() => store.state.rateLimitData);

const dailyBudgetUsd = computed(() => {
  if (rateLimitData.value?.daily_budget_usd != null) {
    return rateLimitData.value.daily_budget_usd;
  }
  return store.getters.defaultDailyBudgetUsd;
});

const homeRoute = computed(() => {
  const route = { name: 'Home' };
  if (store.state.useV2) {
    route.query = { 'data-version': '2' };
  }
  return route;
});

function newSearch() {
  router.push({ name: 'Serp', params: { entityType: 'works' } });
}
</script>

<style scoped>
.app-sidebar {
  z-index: 1006;
  border-right: 1px solid #E5E5E5 !important;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  padding: 12px 0;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sidebar-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sidebar-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background-color 0.15s;
  text-decoration: none !important;
}

.sidebar-icon-link:hover {
  background-color: #F0F0F0;
  text-decoration: none !important;
}

.sidebar-logo {
  width: 24px;
  height: 24px;
}

.sidebar-btn {
  color: #555 !important;
}

.sidebar-btn:hover {
  background-color: #F0F0F0 !important;
}

.sidebar-login-icon {
  color: #555 !important;
}

.mobile-hamburger {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 1005;
}
</style>
