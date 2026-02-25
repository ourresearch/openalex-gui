<template>
  <v-app class="alice-mode">
    <impersonation-banner />
    <!-- Expert mode banner removed for Alice release -->
    <v-progress-linear
      indeterminate
      color="primary"
      :style="{ position: 'fixed', top: hasBanner ? '28px' : '0', left: 0, width: '100%', zIndex: 9999 }"
      v-if="globalIsLoading"
    />
    <!-- Alice: sidebar instead of app bar -->
    <app-sidebar />

    <v-main class="ma-0 pb-0">
      <router-view></router-view>
      <site-footer/>
    </v-main>

    <entity-drawer />

    <v-snackbar
      location="bottom"
      v-model="$store.state.snackbarIsOpen"
      :color="$store.state.snackbarColor"
    >
      <v-icon start v-if="$store.state.snackbarIcon">{{ $store.state.snackbarIcon }}</v-icon>
      {{ $store.state.snackbarMsg }}

      <template v-slot:actions="{ attrs }">
        <v-btn
            icon
            v-bind="attrs"
            @click="$store.commit('closeSnackbar')"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <saved-search-rename-dialog/>
    <saved-search-edit-alert-dialog/>
    <credit-limit-dialog/>

  </v-app>
</template>


<script setup>
defineOptions({ name: 'App' });

import { ref, computed, onMounted, onBeforeMount, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import UserToolbarMenu from '@/components/User/UserToolbarMenu.vue';
import SavedSearchRenameDialog from '@/components/SavedSearch/SavedSearchRenameDialog.vue';
import SavedSearchEditAlertDialog from '@/components/SavedSearch/SavedSearchEditAlertDialog.vue';
import CreditLimitDialog from '@/components/CreditLimitDialog.vue';
import SiteFooter from './components/SiteFooter.vue';

import SearchBox from '@/components/SearchBox.vue';
import EntityDrawer from '@/components/Entity/EntityDrawer.vue';
import EntityTypeSelector from '@/components/EntityTypeSelector.vue';
import WaldenToggle from '@/components/WaldenToggle.vue';
import ImpersonationBanner from '@/components/ImpersonationBanner.vue';
import AppSidebar from '@/components/AppSidebar.vue';

const store = useStore();
const router = useRouter();

const { mobile, smAndDown } = useDisplay();

const exportObj = ref({ progress: 0 });

const globalIsLoading = computed(() => store.getters.globalIsLoading);
const isImpersonating = computed(() => store.getters['user/isImpersonating']);
const hasBanner = computed(() => isImpersonating.value);


const homeRoute = computed(() => {
  const route = { name: 'Home' };
  if (store.state.useV2) {
    route.query = { 'data-version': '2' };
  }
  return route;
});

// Head
useHead({
  titleTemplate: (title) => (title ? `${title} | OpenAlex` : 'OpenAlex'),
  link: [],
  meta: []
});

function setFeatureFlags() {
  let urlParams = new URLSearchParams(window.location.search);
  
  // Handle legacy v2 parameter - redirect to data-version=2
  if (urlParams.has('v2')) {
    urlParams.delete('v2');
    urlParams.set('data-version', '2');
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.replaceState({}, '', newUrl);
  }
  
  const ui = urlParams.get('ui');
  if (ui) {
    store.state.uiVariant = ui;
  }
  const useElastic = urlParams.has('elastic');
  if (useElastic) {
    store.commit("setUseElasticForAnalytics", true);
  }
  const useV2 = urlParams.get('data-version') === '2';
  if (useV2) {
    store.state.useV2 = true;
  }
  const showEntityPageStats = urlParams.has('entity-stats');
  if (showEntityPageStats) {
    store.commit("setShowEntityPageStats", true);
  }
}

// Lifecycle
onBeforeMount(() => {
  setFeatureFlags();

  if (router) {
    router.afterEach((to) => {
      if (window.zE) {
        if (to.path.startsWith('/analytics') || to.path.startsWith('/s/') || to.path === '/s') {
          window.zE('webWidget', 'show');
        } else {
          window.zE('webWidget', 'hide');
        }
      }
    });

    if (window.zE) {
      const currPath = router.currentRoute.value.path;
      if (currPath.startsWith('/analytics') || currPath.startsWith('/s/')) {
        window.zE('webWidget', 'show');
      } else {
        window.zE('webWidget', 'hide');
      }
    }
  }
});

onMounted(() => {
  // Load plans at app boot for use across the app
  store.dispatch('fetchPlans');

  // Refresh rate-limit data every minute
  setInterval(() => {
    store.dispatch('fetchRateLimitData');
  }, 60 * 1000);

  setInterval(async () => {
    if (!store.state.exportProgressUrl) return;
    const resp = await axios.get(store.state.exportProgressUrl);
    exportObj.value = resp.data;
    if (exportObj.value?.progress === 1 || exportObj.value === 1) {
      exportObj.value = null;
      store.state.exportProgressUrl = null;
    }
  }, 1000);
});
</script>


<style lang="scss">
$color-3: #fff;
// $color-2: #f0f0f0;
$color-2: #f5f5f5;
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

// Prevent layout shift from sidebar drawer animating on mount
.v-navigation-drawer:not(.v-navigation-drawer--temporary) {
  transition: none !important;
}
.v-main {
  background-color: #fafafa;
  transition: none !important;
  display: flex !important;
  flex-direction: column;
  min-height: 100vh;
}
.v-main > :first-child {
  flex: 1 0 auto;
}
.color-3 {
  background-color: $color-3 !important;
}
.color-2 {
  background-color: $color-2 !important;
}
.color-1 {
  background-color: $color-1 !important;
}
.color-0 {
  background-color: $color-0 !important;
}
.hover-color-3:hover {
  background-color: $color-3 !important;
  transition: background-color 500ms;
}
.hover-color-white:hover {
  background-color: white !important;
  transition: background-color 500ms;
}
.hover-color-2:hover {
  background-color: $color-2 !important;
  transition: background-color 500ms;
}
.hover-color-1:hover {
  background-color: $color-1 !important;
  transition: background-color 500ms;
}
.hover-color-0:hover {
  background-color: $color-0 !important;
  transition: background-color 500ms;
}
.rounded-o {
  border-radius: 15px !important;
}
.v-card.factoid-card {
  //background-color: #EEF5FC;
  background-color: $color-3;
  border: none;
  box-shadow: none;
  .v-card__title {
    background-color: $color-1;
  }
  .v-card__text {
    padding-top: 12px;
    background-color: white;
  }
}
.v-card.button-card {
  transition: background-color 300ms;
  background-color: $color-3;
  border: none;
  &:hover {
    background-color: $color-2;
    &.no-hover {
      background-color: $color-1;
    }

  }
}
.v-toolbar__content,
.v-toolbar__extension {
    padding: 4px 16px;
}
.keyboard-shortcut {
  color: #9e9e9e; // vuetify grey--text
  border: 1px solid #ccc;
  padding: 0 5px;
  border-radius: 5px;
}
// don't show when a card has focus because we don't care.
.v-card--link:focus:before {
  opacity: 0;
}

// Override Vuetify's default outline color
.v-card--variant-outlined {
  border: 0.5px solid rgba(0, 0, 0, 0.12) !important;
}
html, body {
  // overflow-y: initial is required so Vuetify's v-scroll-lock directive works.
  // overflow-x: hidden prevents horizontal scroll caused by the fixed sidebar.
  overflow-y: initial;
  overflow-x: hidden;
  background-color: #fafafa;
}
.theme--dark.v-card {
  background-color: #444;
}
.theme--dark.v-sheet {
  background-color: #444;
}
.v-btn--active.no-active::before {
  opacity: 0.00005 !important;
}
.v-btn.v-size--default {
  //opacity: 0.00005 !important;
  font-size: 1rem;
}
.monospace {
  font-family: monospace !important;
  &.body-1 {
    font-family: monospace !important;
  }
  &.body-2 {
    font-family: monospace !important;
  }
}
// ===========================================
// LINEAR-STYLE BUTTON OVERRIDES FOR VUETIFY 3
// ===========================================

// Base button resets
.v-btn {
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 500 !important;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;
  min-width: auto !important;
  
  .v-ripple__container {
    display: none !important;
  }
}

// -------------------------------------------
// SIZE ADJUSTMENTS
// -------------------------------------------

// Default size (remapped to Linear's default)
.v-btn:not(.v-btn--size-x-small):not(.v-btn--size-small):not(.v-btn--size-large):not(.v-btn--size-x-large):not(.v-btn--icon) {
  height: 32px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 6px !important;
}

// Small
.v-btn--size-small {
  height: 28px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
  border-radius: 5px !important;
}

// X-Small
.v-btn--size-x-small {
  height: 24px !important;
  padding: 0 8px !important;
  font-size: 11px !important;
  border-radius: 4px !important;
}

// Large
.v-btn--size-large {
  height: 36px !important;
  padding: 0 14px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
}

// X-Large
.v-btn--size-x-large {
  height: 40px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  border-radius: 8px !important;
}

// -------------------------------------------
// ICON BUTTON ADJUSTMENTS
// -------------------------------------------

.v-btn--icon {
  &.v-btn--size-default,
  &:not(.v-btn--size-x-small):not(.v-btn--size-small):not(.v-btn--size-large):not(.v-btn--size-x-large) {
    width: 32px !important;
    height: 32px !important;
  }
  &.v-btn--size-small {
    width: 28px !important;
    height: 28px !important;
  }
  &.v-btn--size-x-small {
    width: 24px !important;
    height: 24px !important;
  }
}

// -------------------------------------------
// PRIMARY VARIANT (flat)
// -------------------------------------------

.v-btn--variant-flat.bg-primary,
.v-btn--variant-flat.text-primary,
.v-btn.bg-primary {
  background-color: #000000 !important;
  color: white !important;
  border: none !important;
  
  &:hover:not(:disabled) {
    background-color: #333333 !important;
  }
  
  &:active:not(:disabled) {
    background-color: #1A1A1A !important;
  }
}

// -------------------------------------------
// SECONDARY VARIANT (outlined)
// -------------------------------------------

.v-btn--variant-outlined {
  background-color: transparent !important;
  border: 1px solid #E0E0E0 !important;
  color: #1A1A1A !important;
  
  &:hover:not(:disabled) {
    background-color: #F5F5F5 !important;
    border-color: #D0D0D0 !important;
  }
  
  &:active:not(:disabled) {
    background-color: #EBEBEB !important;
  }
}

// -------------------------------------------
// GHOST VARIANT (text)
// -------------------------------------------

.v-btn--variant-text,
.v-btn--variant-plain {
  background-color: transparent !important;
  color: #1A1A1A !important;
  border: none !important;
  opacity: 1 !important;
  
  &:hover:not(:disabled) {
    background-color: #F0F0F0 !important;
  }
  
  &:active:not(:disabled) {
    background-color: #E5E5E5 !important;
  }
}

// -------------------------------------------
// DISABLED STATE (all variants)
// -------------------------------------------

.v-btn:disabled,
.v-btn--disabled {
  background-color: #F5F5F5 !important;
  color: #9CA3AF !important;
  border-color: #E5E5E5 !important;
  opacity: 1 !important;
  cursor: not-allowed;
}

// -------------------------------------------
// BUTTONS WITH ICONS
// -------------------------------------------

.v-btn .v-icon {
  font-size: 16px;
  opacity: 0.8;
}

.v-btn--size-small .v-icon {
  font-size: 14px;
}

.v-btn--size-x-small .v-icon {
  font-size: 12px;
}

.v-btn:not(.v-btn--icon) {
  .v-icon--start {
    margin-right: 6px;
    margin-left: -2px;
  }
  .v-icon--end {
    margin-left: 6px;
    margin-right: -2px;
  }
}

.v-btn .v-icon--end[class*="chevron"] {
  font-size: 14px;
  opacity: 0.6;
}

// -------------------------------------------
// DESTRUCTIVE BUTTON (text variant with error color)
// -------------------------------------------

.v-btn--variant-text.text-error,
.v-btn--variant-plain.text-error {
  color: #DC2626 !important;
  
  &:hover:not(:disabled) {
    background-color: #FEF2F2 !important;
    color: #B91C1C !important;
  }
}

// Remove elevation from all buttons
.v-btn--is-elevated {
  box-shadow: none !important;
}
.white-space-normal {
  white-space: normal !important;
}
$logo-link-height: 35px;
a.logo-link {
  text-decoration: none;
  &:hover {
    text-decoration: none !important;
  }
  display: flex;
  align-items: center;
  //padding-left: 30px;
  .logo-icon {
    height: $logo-link-height;
    //margin-top: -5px;
  }
  .logo-text {
    //padding: 0 14px;
    padding-left: .15em;
    line-height: 1.2;
    //border-left: 1px solid #333;
    color: #000;
    font-family: Dosis;
    font-size: $logo-link-height * 0.75;
    font-weight: 500;
  }
  &.logo-old {
    display: none;
  }
  &.logo-new {
    .logo-icon {
      height: $logo-link-height * .60;
      margin-bottom:0;
    }
    .logo-text {
      padding-left: .15em;
      line-height: 1.2;
      font-family: Inter;
      font-size: $logo-link-height * .68;
      font-weight: bold;
      letter-spacing: -0.02em;
    }
  }
}

body {
  font-family: Inter, sans-serif;
  line-height: 1.5;
}

// Vuetify 3 Global Font Configuration
// This is the recommended approach for setting a global font family
.v-application {
  --app-bar-height: 0px;

  font-family: Inter, sans-serif !important;

  // Target all Vuetify typography classes with a single selector
  [class*='text-'] {
    font-family: Inter, sans-serif !important;
  }
  
  // Keep links blue for usability (Vercel/Linear style)
  a:not(.v-btn):not(.v-list-item):not(.v-tab):not(.novice-link) {
    color: #1976D2 !important;  // Material Design blue
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  // For text links inside components
  .text-decoration-none,
  .link-text {
    color: #1976D2 !important;
  }
  
  // Override for specific link-like text that should remain blue
  // but exclude buttons
  .v-list-item-title a:not(.v-btn),
  .v-card-text a:not(.v-btn),
  p a:not(.v-btn),
  span a:not(.v-btn) {
    color: #1976D2 !important;
  }

  //background: #F7F9FC !important;
  //background: #fff !important;
  //background: pink !important;
  .body-1, .body-2 {
    letter-spacing: normal !important;
  }
  .body-1 {
    font-size: 16px !important;
  }
  .body-2 {
    font-size: 14px !important;
  }
  .subtitle-1 {
    font-size: 17px !important;
  }
  .text-h6 {
    line-height: 1.3;
  }
  .text-initial {
    text-transform: initial !important;
  }
}
.low-key-button {
  text-transform: none !important;
  font-weight: normal !important;
  letter-spacing: 0 !important;
}
.capitalize-first-letter::first-letter {
  text-transform: uppercase !important;
}
img.site-footer-logo {
  width: 60px;
}
.page {
  margin-top: 50px;
}
.v-tabs--icons-and-text .v-tab {
  font-size: 12px !important;
  text-transform: capitalize;
}
.v-menu {
  // Ensure menu content has solid background (fixes transparency from Linear-style list overrides)
  > .v-overlay__content {
    background-color: white !important;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  }
}

// ===========================================
// SETTINGS PAGE CONTROL STYLES (Linear-style)
// ===========================================

// Settings page container
.settings-page {
  max-width: 680px;
  padding: 48px;
  
  @media (max-width: 600px) {
    padding: 16px;
  }
}

.settings-page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 32px;
}

// Compact select for settings
.settings-select {
  .v-field {
    min-height: 32px !important;
    border-radius: 6px;
  }
  
  .v-field__input {
    padding: 4px 8px !important;
    min-height: 32px !important;
    font-size: 13px;
  }
  
  .v-field__append-inner {
    padding-top: 4px;
  }
  
  max-width: 160px;
  min-width: 100px;
  
  @media (max-width: 600px) {
    max-width: 100%;
    width: 100%;
  }
}

// Compact text input for settings
.settings-input {
  .v-field {
    min-height: 32px !important;
    border-radius: 6px;
  }
  
  .v-field__input {
    padding: 4px 12px !important;
    min-height: 32px !important;
    font-size: 13px;
  }
  
  max-width: 240px;
  
  @media (max-width: 600px) {
    max-width: 100%;
    width: 100%;
  }
}

// Text button actions in settings
.settings-action {
  font-size: 13px !important;
  font-weight: 500 !important;
  padding: 4px 8px !important;
  min-width: auto !important;
  height: auto !important;
  color: #6B6B6B !important;
  
  &:hover {
    color: #1A1A1A !important;
    background-color: #F5F5F5 !important;
  }
  
  &.text-error {
    color: #DC2626 !important;
    
    &:hover {
      background-color: #FEF2F2 !important;
    }
  }
}

// Switch styling for settings (make it smaller)
.settings-row .v-switch {
  .v-selection-control {
    min-height: 24px;
  }
  
  .v-switch__track {
    height: 16px;
    width: 32px;
  }
  
  .v-switch__thumb {
    height: 12px;
    width: 12px;
  }
}

// Display value with inline styling
.settings-value {
  font-size: 13px;
  color: #1A1A1A;
  background-color: #F5F5F5;
  padding: 4px 8px;
  border-radius: 4px;
}

// Code value with monospace (for API keys, org IDs, etc.)
.settings-code-value {
  font-size: 13px;
  color: #1A1A1A;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  background-color: #F5F5F5;
  padding: 4px 8px;
  border-radius: 4px;
}

// ===========================================
// SNACKBAR STYLES
// ===========================================
.snackbar-outlined {
  .v-snackbar__wrapper {
    border: 0.5px solid rgba(0, 0, 0, 0.12) !important;
  }
  .v-snackbar__content {
    color: #1A1A1A !important;
  }
}

// ===========================================
// TOOLTIP STYLES
// ===========================================
.v-tooltip > .v-overlay__content {
  background-color: white !important;
  color: #1A1A1A !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  padding: 6px 10px !important;
}

.tooltip-light {
  background-color: white !important;
  color: #1A1A1A !important;
  border: 0.5px solid rgba(0, 0, 0, 0.12) !important;
}

// ===========================================
// ICON SIZE OVERRIDES (Linear-style)
// ===========================================

// Default icon size (was 24px, now 18px)
.v-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

// Size variants
.v-icon--size-x-small {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
}

.v-icon--size-small {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
}

.v-icon--size-default {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

.v-icon--size-large {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
}

.v-icon--size-x-large {
  font-size: 26px !important;
  width: 26px !important;
  height: 26px !important;
}

// Icons in specific contexts
.v-list-item .v-icon {
  font-size: 18px !important;
  opacity: 0.7;  // Linear icons are slightly muted
}

// ===========================================
// LIST DENSITY OVERRIDES (Linear-style)
// ===========================================

// Base list styling
.v-list {
  padding: 4px 0 !important;
  background: transparent !important;
}

// List items - the core of Linear's density
.v-list-item {
  min-height: 32px !important;
  padding: 6px 12px !important;
  margin: 1px 8px !important;
  border-radius: 6px !important;
  
  // Typography
  font-size: 13px !important;
  font-weight: 500;
  color: #374151;
  
  // Transitions
  transition: background-color 0.1s ease;
  
  &:hover {
    background-color: #F5F5F5 !important;
  }
  
  &.v-list-item--active {
    background-color: #F0F0F0 !important;
    color: #1A1A1A !important;
    
    .v-icon {
      opacity: 1;
    }
  }
}

// Remove Vuetify's default active indicator bar
.v-list-item--active > .v-list-item__overlay {
  opacity: 0 !important;
}

// Prepended icons (left side)
.v-list-item__prepend {
  width: 28px !important;  // Fixed width for alignment
  
  .v-icon {
    margin-right: 0 !important;
  }
}

// Gap between icon and text
.v-list-item__prepend > .v-icon ~ .v-list-item__spacer {
  width: 10px !important;
}

// List item content
.v-list-item__content {
  padding: 0 !important;
}

.v-list-item-title {
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
}

.v-list-item-subtitle {
  font-size: 11px !important;
  color: #6B7280 !important;
  line-height: 1.3 !important;
  margin-top: 1px !important;
}

// Appended content (right side)
.v-list-item__append {
  .v-icon {
    font-size: 14px !important;
    opacity: 0.5;
  }
}

// -------------------------------------------
// LIST SUBHEADERS (Section Headers)
// -------------------------------------------

.v-list-subheader,
.linear-list-subheader {
  min-height: 32px !important;
  padding: 16px 12px 4px 20px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #9CA3AF !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  
  // First subheader doesn't need top padding
  &:first-child {
    padding-top: 8px !important;
  }
}

// -------------------------------------------
// LIST GROUPS (Expandable sections)
// -------------------------------------------

.v-list-group {
  .v-list-group__items {
    .v-list-item {
      padding-left: 44px !important;  // Indent children
    }
  }
}

// -------------------------------------------
// NAVIGATION LISTS (Sidebars)
// -------------------------------------------

// For lists used as navigation (like your Admin sidebar)
.v-list--nav {
  padding: 8px !important;
  
  .v-list-item {
    margin: 1px 0 !important;
  }
}

// -------------------------------------------
// TEXT FIELD HEIGHT (Linear-style compact inputs)
// -------------------------------------------

// Override the default 40px height for compact density inputs to 32px
// This makes text fields match button heights for a cleaner UI
// Must target the variant-specific selectors to override Vuetify's defaults
.v-input--density-compact {
  --v-input-control-height: 32px;
  --v-input-padding-top: 4px;
  
  .v-field--variant-outlined,
  .v-field--variant-solo,
  .v-field--variant-solo-inverted,
  .v-field--variant-solo-filled,
  .v-field--variant-filled {
    --v-input-control-height: 32px;
    --v-field-padding-bottom: 0px;
  }
  
  // Reduce font size for compact inputs (default is 16px, reduce to 14px)
  .v-field__input {
    font-size: 14px;
  }
}

// -------------------------------------------
// DENSITY VARIANTS
// -------------------------------------------

// Since standard is now compact, "compact" becomes extra-compact
.v-list--density-compact {
  .v-list-item {
    min-height: 28px !important;
    padding: 4px 12px !important;
    font-size: 12px !important;
  }
}

// "Comfortable" is now what "default" used to be (for rare cases)
.v-list--density-comfortable {
  .v-list-item {
    min-height: 40px !important;
    padding: 8px 16px !important;
  }
}

// ===========================================
// SETTINGS/ADMIN SIDEBAR (Linear-style)
// ===========================================

.settings-sidebar {
  width: 220px;
  padding: 8px;
  border-right: 1px solid #E5E5E5;
  background: #FAFAFA;
  
  // Title at top of sidebar
  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: #1A1A1A;
    padding: 12px 12px 16px;
  }
  
  // "Back to app" link
  .sidebar-back-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #6B6B6B;
    text-decoration: none;
    border-radius: 6px;
    
    &:hover {
      background-color: #F0F0F0;
      color: #1A1A1A;
    }
    
    .v-icon {
      font-size: 14px !important;
    }
  }
  
  // Section headers
  .sidebar-section-header {
    font-size: 11px;
    font-weight: 600;
    color: #9CA3AF;
    text-transform: none;
    letter-spacing: normal;
    padding: 16px 12px 6px;
    
    &:first-of-type {
      padding-top: 8px;
    }
  }
  
  // Nav items
  .v-list-item {
    min-height: 32px !important;
    margin: 1px 0 !important;
    border-radius: 6px !important;
    
    // "Coming soon" items
    &.disabled-item {
      opacity: 0.5;
      pointer-events: none;
      
      .v-list-item-subtitle {
        font-size: 10px;
        color: #9CA3AF;
      }
    }
  }
}

</style>