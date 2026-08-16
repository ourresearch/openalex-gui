<template>
  <!-- Spacer keeps page content out from under the fixed bar (same 56px the
       bar occupied when it was in-flow, so page geometry is unchanged). -->
  <div class="site-top-bar-spacer" aria-hidden="true" />
  <header class="site-top-bar" :style="{ top: topOffset }">
    <div class="site-top-bar-inner">
      <router-link to="/" class="top-bar-logo-link" aria-label="OpenAlex home">
        <img
          src="/brand-assets/openalex-lockup.png"
          class="top-bar-logo"
          alt="OpenAlex"
        />
      </router-link>

      <!-- Round 3 (oxjob #778): Product · Pricing · Help · About. No top-level
           API link — API lives inside BOTH dropdowns (intentional un-ship of
           the r1 link; don't "restore" it). -->
      <nav class="top-bar-nav" aria-label="Site">
        <site-top-bar-dropdown
          label="Product"
          :open="openDropdown === 'product'"
          @open="openDropdown = 'product'"
          @close="closeDropdown('product')"
        >
          <div class="mega-grid-product">
            <component
              :is="item.to ? 'router-link' : 'a'"
              v-for="item in siteNavProduct"
              :key="item.name"
              class="mega-item mega-link"
              v-bind="item.to ? { to: item.to } : { href: item.href, target: '_blank', rel: 'noopener' }"
            >
              <span class="mega-item-icon">
                <v-icon>{{ item.icon }}</v-icon>
              </span>
              <span class="mega-item-text">
                <span class="mega-item-name">{{ item.name }}</span>
                <span class="mega-item-desc">{{ item.desc }}</span>
              </span>
            </component>
          </div>
        </site-top-bar-dropdown>

        <router-link to="/pricing" class="top-bar-link">Pricing</router-link>

        <site-top-bar-dropdown
          label="Help"
          :open="openDropdown === 'help'"
          @open="openDropdown = 'help'"
          @close="closeDropdown('help')"
        >
          <!-- Same icon-tile + description layout as the Product panel above
               (oxjob #778 follow-up): flat 2×3 column-major grid, so the Learn
               items land in column 1 and Reference in column 2. -->
          <div class="mega-grid-help">
            <a
              v-for="item in siteNavHelp"
              :key="item.name"
              class="mega-item mega-link"
              :href="item.href"
              target="_blank"
              rel="noopener"
            >
              <span class="mega-item-icon">
                <v-icon>{{ item.icon }}</v-icon>
              </span>
              <span class="mega-item-text">
                <span class="mega-item-name">{{ item.name }}</span>
                <span class="mega-item-desc">{{ item.desc }}</span>
              </span>
            </a>
          </div>
        </site-top-bar-dropdown>

        <router-link to="/about" class="top-bar-link">About</router-link>
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

        <v-menu v-model="mobileMenuOpen" location="bottom end" :close-on-content-click="false">
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
          <!-- opened is controlled: without it Vuetify auto-opens any group
               containing the active route (Product holds "/" so it would
               start expanded on the landing page). -->
          <v-list v-model:opened="mobileOpenGroups" class="mobile-site-menu" density="compact">
            <v-list-group value="product">
              <template #activator="{ props }">
                <v-list-item v-bind="props"><v-list-item-title>Product</v-list-item-title></v-list-item>
              </template>
              <!-- Internal links use plain href here (full page load): a
                   router-link child that matches the active route makes
                   Vuetify auto-open the group at mount, defeating the
                   compact-menu default. -->
              <v-list-item
                v-for="item in siteNavProduct"
                :key="item.name"
                v-bind="item.to ? { href: item.to } : { href: item.href, target: '_blank', rel: 'noopener' }"
                @click="mobileMenuOpen = false"
              >
                <template #prepend><v-icon class="mobile-item-icon">{{ item.icon }}</v-icon></template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list-group>
            <v-list-item to="/pricing" @click="mobileMenuOpen = false">
              <v-list-item-title>Pricing</v-list-item-title>
            </v-list-item>
            <v-list-group value="help">
              <template #activator="{ props }">
                <v-list-item v-bind="props"><v-list-item-title>Help</v-list-item-title></v-list-item>
              </template>
              <v-list-item
                v-for="item in siteNavHelp"
                :key="item.name"
                :href="item.href"
                target="_blank"
                rel="noopener"
                @click="mobileMenuOpen = false"
              >
                <template #prepend><v-icon class="mobile-item-icon">{{ item.icon }}</v-icon></template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list-group>
            <v-list-item to="/about" @click="mobileMenuOpen = false">
              <v-list-item-title>About</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item v-if="showLoggedIn" :to="{name: 'Serp', params: {entityType: 'works'}}" @click="mobileMenuOpen = false">
              <v-list-item-title>Open app</v-list-item-title>
            </v-list-item>
            <v-list-item v-else to="/login" @click="mobileMenuOpen = false">
              <v-list-item-title>Log in</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import AppSidebarUserMenu from '@/components/AppSidebarUserMenu.vue';
import SiteTopBarDropdown from '@/components/SiteTopBarDropdown.vue';
import { siteNavProduct, siteNavHelp } from '@/navConfigs';

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
const route = useRoute();

const userId = computed(() => store.getters['user/userId']);

// The token in localStorage is the logged-in marker: it exists before the user
// object has been fetched, and user/logout removes it. Depending on userId in
// the same computed keeps this reactive across login/logout transitions.
const showLoggedIn = computed(() => !!userId.value || !!localStorage.getItem('token'));

// 'product' | 'help' | null — parent-owned so only one panel is open and
// hovering between triggers switches instantly.
const openDropdown = ref(null);
const mobileMenuOpen = ref(false);
const mobileOpenGroups = ref([]);

function closeDropdown(which) {
  if (openDropdown.value === which) openDropdown.value = null;
}

watch(() => route.fullPath, () => {
  openDropdown.value = null;
  mobileMenuOpen.value = false;
});

// Fresh compact menu each time it closes (accordions collapsed on reopen).
watch(mobileMenuOpen, (open) => {
  if (!open) mobileOpenGroups.value = [];
});
</script>

<style scoped lang="scss">
.site-top-bar {
  /* Fixed, not sticky — sticky silently never pinned inside the Vuetify
     layout (Jason review r2, 2026-08-15; comps pin theirs too). */
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1004;
  background-color: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.site-top-bar-spacer {
  height: 56px;
  flex-shrink: 0;
}

.site-top-bar-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  /* Match the landing hero container EXACTLY (HomeV2 .hero: 1280px + 40px
     padding) so the logo's left edge lines up with the headline's left edge
     and the avatar/CTA right edge with the content's right edge (review r2). */
  max-width: 1280px;
  margin: 0 auto;
  height: 56px;
  padding: 0 40px;
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
  align-self: stretch;
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

/* ---- Mega-dropdown panel contents (slotted into SiteTopBarDropdown; slot
        content compiles in this component's scope) ---- */

.mega-grid-product {
  display: grid;
  /* Column-major 2×4 so the table reads down each column, comps-style. */
  grid-template-rows: repeat(4, auto);
  grid-auto-flow: column;
  grid-auto-columns: 300px;
  gap: 2px;
}

.mega-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--ox-radius-md);
  transition: background-color var(--ox-duration-fast) var(--ox-ease-default);

  &:hover {
    background-color: var(--ox-bg-muted);
  }
}

.mega-item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-top: 1px;
  border-radius: var(--ox-radius-md);
  background-color: var(--ox-bg-muted);
  border: 1px solid var(--ox-border-subtle);
  transition: background-color var(--ox-duration-fast) var(--ox-ease-default);

  .v-icon {
    color: var(--ox-text-secondary);
  }
}

.mega-item:hover .mega-item-icon {
  background-color: var(--ox-bg-base);
}

.mega-item-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.mega-item-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--ox-text-primary);
}

.mega-item-desc {
  font-size: 13px;
  font-weight: 400;
  line-height: 17px;
  color: var(--ox-text-tertiary);
}

/* Help panel reuses the Product panel's .mega-item cards; column-major 2×3 so
   the Learn items fill column 1 and Reference column 2 (oxjob #778 follow-up). */
.mega-grid-help {
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  grid-auto-columns: 300px;
  gap: 2px;
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

.mobile-item-icon {
  margin-inline-end: 12px;
  color: var(--ox-text-tertiary);
}

@media (max-width: 1000px) {
  /* Narrow viewports (>700px, so no hamburger yet): single-column panels so
     they can't overflow the right edge of the viewport. */
  .mega-grid-product {
    grid-template-rows: repeat(8, auto);
    grid-auto-columns: 300px;
  }
  .mega-grid-help {
    grid-template-rows: repeat(6, auto);
    grid-auto-columns: 300px;
  }
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

/* Same b=7 recipe for every anchor inside the mega panels: strips the global
   blue-anchor rule + underline. Both panels' items now carry their own
   name/desc span colors, so this anchor color is effectively inert — it just
   defeats the house blue and the underline. */
.v-application .site-top-bar a.mega-link.mega-link.mega-link.mega-link.mega-link {
  color: var(--ox-text-secondary) !important;
  text-decoration: none !important;

  &:hover {
    color: var(--ox-text-primary) !important;
  }
}
</style>
