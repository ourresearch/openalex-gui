<template>
  <header class="site-top-bar" :style="{ top: topOffset }">
    <div class="site-top-bar-inner">
      <router-link to="/" class="top-bar-logo-link" aria-label="OpenAlex home">
        <img
          src="/brand-assets/openalex-lockup.png"
          class="top-bar-logo"
          alt="OpenAlex"
        />
      </router-link>

      <nav class="top-bar-nav" aria-label="Site">
        <router-link to="/about" class="top-bar-link">About</router-link>
        <router-link to="/pricing" class="top-bar-link">Pricing</router-link>
        <a href="https://help.openalex.org" target="_blank" rel="noopener" class="top-bar-link">Help</a>
        <a href="https://help.openalex.org/api/" target="_blank" rel="noopener" class="top-bar-link">API</a>
      </nav>

      <div class="top-bar-right">
        <!-- Both auth states decided synchronously from the localStorage token
             marker (readable before first paint), so there's no wrong-state
             flash while the user fetch is in flight (Decision 1). -->
        <template v-if="showLoggedIn">
          <v-btn variant="outlined" :to="{name: 'Serp', params: {entityType: 'works'}}" class="open-app-btn">
            Open app
          </v-btn>
          <app-sidebar-user-menu v-if="userId" location="bottom" />
          <v-avatar v-else size="32" color="#E5E5E5" class="avatar-placeholder" />
        </template>
        <template v-else>
          <v-btn variant="text" to="/login" class="login-btn">Log in</v-btn>
          <v-btn color="primary" variant="flat" to="/signup">Get started</v-btn>
        </template>

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              class="top-bar-hamburger"
              v-bind="props"
              aria-label="Site menu"
            >
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/about"><v-list-item-title>About</v-list-item-title></v-list-item>
            <v-list-item to="/pricing"><v-list-item-title>Pricing</v-list-item-title></v-list-item>
            <v-list-item href="https://help.openalex.org" target="_blank" rel="noopener">
              <v-list-item-title>Help</v-list-item-title>
            </v-list-item>
            <v-list-item href="https://help.openalex.org/api/" target="_blank" rel="noopener">
              <v-list-item-title>API</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item v-if="showLoggedIn" :to="{name: 'Serp', params: {entityType: 'works'}}">
              <v-list-item-title>Open app</v-list-item-title>
            </v-list-item>
            <v-list-item v-else to="/login"><v-list-item-title>Log in</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import AppSidebarUserMenu from '@/components/AppSidebarUserMenu.vue';

defineOptions({ name: 'SiteTopBar' });

const props = defineProps({
  // Height of the fixed banner stack above us (e.g. '28px'), so the sticky bar
  // doesn't slide under the throttle/impersonation/verify-email banners.
  topOffset: {
    type: String,
    default: '0',
  },
});

const store = useStore();

const userId = computed(() => store.getters['user/userId']);

// The token in localStorage is the logged-in marker: it exists before the user
// object has been fetched, and user/logout removes it. Depending on userId in
// the same computed keeps this reactive across login/logout transitions.
const showLoggedIn = computed(() => !!userId.value || !!localStorage.getItem('token'));
</script>

<style scoped lang="scss">
.site-top-bar {
  position: sticky;
  z-index: 1004;
  background-color: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.site-top-bar-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  height: 56px;
  padding: 0 24px;
}

.top-bar-logo-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.top-bar-logo {
  height: 26px;
  display: block;
}

.top-bar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar-link {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--ox-bg-muted);
  }
}

.top-bar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar-hamburger {
  display: none !important;
}

.avatar-placeholder {
  cursor: default;
}

@media (max-width: 700px) {
  .site-top-bar-inner {
    gap: 12px;
    padding: 0 16px;
  }
  .top-bar-nav,
  .login-btn,
  .open-app-btn {
    display: none !important;
  }
  .top-bar-hamburger {
    display: inline-flex !important;
  }
}
</style>

<style lang="scss">
/* The global house rule in App.vue (`.v-application a:not(…)×5`, b=6) forces all
   anchors blue with !important; win with a same-shape HIGHER-specificity selector
   (b=7 — a tie loses on source order, App.vue's styles inject after ours).
   See AGENTS.md "global CSS overrides". */
.v-application .site-top-bar a.top-bar-link.top-bar-link.top-bar-link.top-bar-link.top-bar-link {
  color: #374151 !important;
  text-decoration: none !important;

  &:hover {
    color: #1a1a1a !important;
  }
}
</style>
