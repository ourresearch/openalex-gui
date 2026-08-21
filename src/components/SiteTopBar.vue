<template>
  <header ref="barEl" class="site-top-bar">
    <!-- Stripe-style page dim behind an open mega-panel; starts just under the
         bar so the bar itself stays crisp. The bar now scrolls with the page,
         so we measure its live bottom edge on open (the panel closes on scroll,
         so this stays accurate while open). Click closes. -->
    <transition name="scrim">
      <div
        v-if="openDropdown"
        class="mega-scrim"
        :style="{ top: scrimTop }"
        aria-hidden="true"
        @click="openDropdown = null"
      />
    </transition>

    <div class="site-top-bar-inner">
      <router-link to="/" class="top-bar-logo-link" aria-label="OpenAlex home">
        <img
          src="/brand-assets/openalex-lockup.png"
          class="top-bar-logo"
          alt="OpenAlex"
        />
      </router-link>

      <!-- Round 3 (oxjob #778): the two dropdowns (Product, Help) sit next to
           each other so a single shared panel can MORPH between them (Stripe
           pattern) — it slides + resizes + cross-fades instead of unmount/mount.
           Order: Product · Help · Pricing · About · Jobs. No top-level API link — API
           lives inside BOTH dropdowns (don't "restore" it).
           Jobs (oxjob #812, hiring launch): an applicant who signs up mid-application
           lands on / after the email verification link, with no way back to the posting.
           A durable fix is #855 (carry a return-to through signup); this is the floor
           under it, so don't remove the link when #855 ships. -->
      <nav class="top-bar-nav" aria-label="Site">
        <div
          ref="zoneEl"
          class="mega-zone"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
          @focusout="onZoneFocusOut"
        >
          <button
            ref="productTriggerEl"
            type="button"
            class="mega-trigger"
            :class="{ 'is-open': openDropdown === 'product' }"
            aria-haspopup="true"
            :aria-expanded="openDropdown === 'product' ? 'true' : 'false'"
            @mouseenter="onTriggerEnter('product')"
            @click="onTriggerClick('product')"
          >
            <span>Product</span>
            <v-icon class="mega-caret" :class="{ 'is-flipped': openDropdown === 'product' }">mdi-chevron-down</v-icon>
          </button>

          <button
            ref="helpTriggerEl"
            type="button"
            class="mega-trigger"
            :class="{ 'is-open': openDropdown === 'help' }"
            aria-haspopup="true"
            :aria-expanded="openDropdown === 'help' ? 'true' : 'false'"
            @mouseenter="onTriggerEnter('help')"
            @click="onTriggerClick('help')"
          >
            <span>Help</span>
            <v-icon class="mega-caret" :class="{ 'is-flipped': openDropdown === 'help' }">mdi-chevron-down</v-icon>
          </button>

          <!-- One shared panel for both triggers. It's absolutely positioned
               against .site-top-bar-inner; `left` animates (slide between
               triggers), the clip's `height` animates (grow/shrink), and the
               keyed content cross-fades. -->
          <transition name="mega" @after-leave="onSurfaceAfterLeave">
            <div
              v-if="openDropdown"
              class="mega-surface-wrap"
              :style="{ left: panelLeft }"
              @mouseenter="cancelClose"
            >
              <div class="mega-surface">
                <div class="mega-surface-clip" :style="{ height: panelHeight }">
                  <transition name="mega-swap" @enter="onSwapEnter">
                    <div :key="openDropdown" class="mega-swap-content">
                      <div v-if="openDropdown === 'product'" class="mega-grid-product">
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

                      <!-- Help mirrors Product: flat 2×3 column-major grid, so
                           the Learn items land in column 1, Reference in col 2. -->
                      <div v-else class="mega-grid-help">
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
                    </div>
                  </transition>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <router-link to="/pricing" class="top-bar-link">Pricing</router-link>
        <router-link to="/about" class="top-bar-link">About</router-link>
        <router-link to="/jobs" class="top-bar-link">Jobs</router-link>
      </nav>

      <div class="top-bar-right">
        <!-- Both auth states decided synchronously from the localStorage token
             marker (readable before first paint), so there's no wrong-state
             flash while the user fetch is in flight (Decision 1). -->
        <template v-if="showLoggedIn">
          <v-btn v-if="!isAppChrome" variant="outlined" :to="{name: 'Serp', params: {entityType: 'works'}}" class="open-app-btn">
            Open app
          </v-btn>
          <!-- Credit battery: right cluster, immediately left of the avatar
               (oxjob #853 — same order as the old vertical rail, rotated). -->
          <credit-indicator
            v-if="userId && rateLimitData"
            :used-usd="rateLimitData.daily_used_usd"
            :budget-usd="dailyBudgetUsd"
            tooltip-location="bottom"
          />
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
            <v-list-item to="/pricing" @click="mobileMenuOpen = false">
              <v-list-item-title>Pricing</v-list-item-title>
            </v-list-item>
            <v-list-item to="/about" @click="mobileMenuOpen = false">
              <v-list-item-title>About</v-list-item-title>
            </v-list-item>
            <v-list-item to="/jobs" @click="mobileMenuOpen = false">
              <v-list-item-title>Jobs</v-list-item-title>
            </v-list-item>
            <v-divider v-if="!showLoggedIn || !isAppChrome" class="my-1" />
            <v-list-item v-if="showLoggedIn && !isAppChrome" :to="{name: 'Serp', params: {entityType: 'works'}}" @click="mobileMenuOpen = false">
              <v-list-item-title>Open app</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!showLoggedIn" to="/login" @click="mobileMenuOpen = false">
              <v-list-item-title>Log in</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import AppSidebarUserMenu from '@/components/AppSidebarUserMenu.vue';
import CreditIndicator from '@/components/Credits/CreditIndicator.vue';
import { siteNavProduct, siteNavHelp } from '@/navConfigs';

defineOptions({ name: 'SiteTopBar' });

const store = useStore();
const route = useRoute();

const userId = computed(() => store.getters['user/userId']);

// The token in localStorage is the logged-in marker: it exists before the user
// object has been fetched, and user/logout removes it. Depending on userId in
// the same computed keeps this reactive across login/logout transitions.
const showLoggedIn = computed(() => !!userId.value || !!localStorage.getItem('token'));

// 'app'-chrome pages ARE the app, so the "Open app" button is redundant there
// (oxjob #853). Everything else (site pages) still offers it.
const isAppChrome = computed(() => (route.meta.chrome ?? 'app') === 'app');

// Credit battery data (moved here from the old app rail, oxjob #853).
const rateLimitData = computed(() => store.state.rateLimitData);
const dailyBudgetUsd = computed(() =>
  rateLimitData.value?.daily_budget_usd != null
    ? rateLimitData.value.daily_budget_usd
    : store.getters.defaultDailyBudgetUsd
);

// Live bottom edge of the (now-scrolling) bar, so the scrim starts just under it
// without ever dimming the bar. Set on open; the panel closes on scroll so it
// can't drift out of date.
const scrimTop = ref('56px');

// 'product' | 'help' | null. One shared panel; switching triggers morphs it.
const openDropdown = ref(null);
const mobileMenuOpen = ref(false);
const mobileOpenGroups = ref([]);

const barEl = ref(null);
const zoneEl = ref(null);
const productTriggerEl = ref(null);
const helpTriggerEl = ref(null);

// Panel geometry (px strings for style binding). left animates on switch via a
// CSS transition; height animates on the clip.
const panelLeft = ref('0px');
const panelHeight = ref(null);

function triggerFor(which) {
  return which === 'product' ? productTriggerEl.value : helpTriggerEl.value;
}

// Position the panel's left edge just left of the active trigger, measured
// against .site-top-bar-inner (its positioned ancestor).
function measurePosition(which) {
  const trigger = triggerFor(which);
  const inner = trigger?.closest('.site-top-bar-inner');
  if (!trigger || !inner) return;
  const left = trigger.getBoundingClientRect().left - inner.getBoundingClientRect().left;
  panelLeft.value = `${Math.max(left - 12, 0)}px`;
}

function setOpen(which) {
  measurePosition(which);
  // Anchor the scrim to the bar's current bottom edge (the bar scrolls, so this
  // isn't a constant). The panel closes on scroll, keeping this fresh.
  if (barEl.value) scrimTop.value = `${barEl.value.getBoundingClientRect().bottom}px`;
  openDropdown.value = which;
}

// Hover intent: skimming the bar shouldn't pop a panel (short open delay), and
// leaving briefly shouldn't lose it (longer close grace). When a panel is
// already open, moving to the other trigger switches instantly (Stripe feel).
let openTimer = null;
let closeTimer = null;

function onTriggerEnter(which) {
  clearTimeout(closeTimer);
  closeTimer = null;
  if (openDropdown.value === which) return;
  if (openDropdown.value) {
    setOpen(which); // already open → morph immediately
  } else {
    clearTimeout(openTimer);
    openTimer = setTimeout(() => setOpen(which), 60);
  }
}
function onTriggerClick(which) {
  clearTimeout(openTimer);
  if (openDropdown.value === which) openDropdown.value = null;
  else setOpen(which);
}
function scheduleClose() {
  clearTimeout(openTimer);
  openTimer = null;
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { openDropdown.value = null; }, 150);
}
function cancelClose() {
  clearTimeout(closeTimer);
  closeTimer = null;
}

// Measure the freshly-entered content and drive the clip height to it. First
// open: panelHeight was null (auto) → no transition, just renders at size.
// Switch: previous px value → the height animates from old to new.
function onSwapEnter(el) {
  panelHeight.value = `${el.offsetHeight}px`;
}
function onSurfaceAfterLeave() {
  panelHeight.value = null; // reset so the next open re-measures cleanly
}

// Close when keyboard focus tabs out of the trigger+panel zone entirely.
function onZoneFocusOut(e) {
  if (zoneEl.value && !zoneEl.value.contains(e.relatedTarget)) openDropdown.value = null;
}

function onDocMousedown(e) {
  if (zoneEl.value && !zoneEl.value.contains(e.target)) openDropdown.value = null;
}
// Esc must work wherever focus is (hover-open leaves focus on <body>) — listen
// at the document while open.
function onDocKeydown(e) {
  if (e.key === 'Escape') {
    const active = triggerFor(openDropdown.value);
    openDropdown.value = null;
    active?.focus();
  }
}
function onWindowResize() {
  if (openDropdown.value) measurePosition(openDropdown.value);
}
// The bar scrolls with the page now, so an open panel would drift up the
// viewport with it. Close on scroll rather than chase it (oxjob #853).
function onWindowScroll() {
  openDropdown.value = null;
}

watch(openDropdown, (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onDocMousedown);
    document.addEventListener('keydown', onDocKeydown);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', onWindowScroll, { passive: true });
  } else {
    document.removeEventListener('mousedown', onDocMousedown);
    document.removeEventListener('keydown', onDocKeydown);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('scroll', onWindowScroll);
  }
});

watch(() => route.fullPath, () => {
  openDropdown.value = null;
  mobileMenuOpen.value = false;
});

// Fresh compact menu each time it closes (accordions collapsed on reopen).
watch(mobileMenuOpen, (open) => {
  if (!open) mobileOpenGroups.value = [];
});

onBeforeUnmount(() => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  document.removeEventListener('mousedown', onDocMousedown);
  document.removeEventListener('keydown', onDocKeydown);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('scroll', onWindowScroll);
});
</script>

<style scoped lang="scss">
.site-top-bar {
  /* In-flow and scrolls away with the page — one behavior site-wide, since the
     bar carries no mid-scroll control worth pinning (oxjob #853, see EXPLORE).
     `relative` + z-index keeps it above the fixed mega-scrim and lets the
     absolutely-positioned mega-panel anchor to it. */
  position: relative;
  z-index: 1004;
  background-color: #fff;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}

.mega-scrim {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(17, 17, 17, 0.06);
  z-index: -1; /* below the bar's own content, above the page */
}

.site-top-bar-inner {
  position: relative; /* positioning context for the shared mega-panel */
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

.mega-zone {
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

/* ---- Trigger buttons ---- */

.mega-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 6px 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover,
  &.is-open {
    background-color: var(--ox-bg-muted);
    color: #1a1a1a;
  }
}

/* App.vue forces every .v-icon to 18px !important; win with higher
   specificity (see AGENTS.md "global CSS overrides"). */
.mega-trigger .mega-caret {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  color: var(--ox-text-muted);
  transition: transform var(--ox-duration-base) var(--ox-ease-default);

  &.is-flipped {
    transform: rotate(180deg);
  }
}

/* ---- Shared morphing panel ---- */

.mega-surface-wrap {
  position: absolute;
  top: 100%;
  padding-top: 4px; /* small gap that's still a hoverable bridge to the panel */
  transform-origin: top left;
  /* `left` slides the panel between triggers when switching (the open/close
     transition below overrides `transition` while entering/leaving). */
  transition: left var(--ox-duration-emph) var(--ox-ease-out);
}

.mega-surface {
  background: var(--ox-bg-base);
  border: 1px solid var(--ox-border-default);
  border-radius: var(--ox-radius-lg);
  box-shadow: var(--ox-elev-overlay);
}

.mega-surface-clip {
  overflow: hidden;
  transition: height var(--ox-duration-emph) var(--ox-ease-out);
}

.mega-swap-content {
  padding: var(--ox-space-2);
}

/* ---- Panel grids + items ---- */

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
  transition: background-color var(--ox-duration-fast) var(--ox-ease-default),
    border-color var(--ox-duration-fast) var(--ox-ease-default);

  .v-icon {
    color: var(--ox-text-secondary);
    transition: color var(--ox-duration-fast) var(--ox-ease-default);
  }
}

/* On row hover the icon tile darkens WITH the row — a subtle darker gray, not
   an inversion to white (confusing) and not black (too dramatic, stole focus).
   One step darker than the row's own hover bg, firmer border, darker glyph, so
   it stays a legible tile. (Jason, 2026-08-16.) */
.mega-item:hover .mega-item-icon {
  background-color: var(--ox-bg-emphasis);
  border-color: var(--ox-border-strong);

  .v-icon {
    color: var(--ox-text-primary);
  }
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
   the Learn items fill column 1 and Reference column 2. */
.mega-grid-help {
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  grid-auto-columns: 300px;
  gap: 2px;
}

/* ---- Transitions ---- */

/* Open / close of the whole panel: soft rise + fade + a touch of scale. */
.mega-enter-active {
  transition: opacity var(--ox-duration-slow) var(--ox-ease-out),
    transform var(--ox-duration-slow) var(--ox-ease-out);
}
.mega-leave-active {
  transition: opacity var(--ox-duration-base) var(--ox-ease-in),
    transform var(--ox-duration-base) var(--ox-ease-in);
}
.mega-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.985);
}
.mega-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Content cross-fade when morphing between Product and Help: the leaving panel
   overlays (absolute) so the entering one alone drives the clip height. */
.mega-swap-enter-active,
.mega-swap-leave-active {
  transition: opacity var(--ox-duration-base) var(--ox-ease-default);
}
.mega-swap-leave-active {
  position: absolute;
  top: var(--ox-space-2);
  left: var(--ox-space-2);
  right: var(--ox-space-2);
}
.mega-swap-enter-from,
.mega-swap-leave-to {
  opacity: 0;
}

.scrim-enter-active,
.scrim-leave-active {
  transition: opacity var(--ox-duration-base) var(--ox-ease-default);
}
.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
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
