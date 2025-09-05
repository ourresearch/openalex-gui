<template>
  <v-app>
    <v-progress-linear
      indeterminate
      color="primary"
      style="position: fixed; top: 0; left: 0; width: 100%; z-index: 9999"
      v-if="globalIsLoading"
    />
    <v-app-bar
      flat
      :height="smAndDown ? undefined : 70"
      color="white"
      class=""
      absolute
      :extended="smAndDown && $route.name === 'Serp'"
      extension-height="70"
    >
      <router-link :to="{name: 'Home'}" class="logo-link ml-3">
        <img
          src="@/assets/openalex-logo-icon-black-and-white.png"
          class="logo-icon mr-0 colorizable"
        />
        <span class="logo-text colorizable">OpenAlex</span>
      </router-link>
      <div
        v-if="$route.name === 'Serp'"    
        class="flex-grow-1 mr-3 ml-6 d-flex justify-center"
      >
        <entity-type-selector v-if="!smAndDown"/>
        <shortcut-box
          v-if="!smAndDown"
          style="max-width: 800px;"
          class="flex-grow-1 d-lg-block"
        />
      </div>
      <div v-if="$route.name !== 'Serp'" class="flex-grow-1"></div>

      <v-spacer/>

      <user-toolbar-menu/>

      <v-menu v-if="!smAndDown">
        <template v-slot:activator="{props}">
          <v-btn icon variant="plain" v-bind="props">
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item 
            href="https://openalex.zendesk.com/hc/en-us/requests/new" 
            target="_blank"
            prepend-icon="mdi-comment-question-outline"
          >
            <v-list-item-title>
              Contact support
            </v-list-item-title>
          </v-list-item>

          <v-list-item 
            href="https://help.openalex.org/" 
            target="_blank"
            prepend-icon="mdi-help-circle-outline">
            <v-list-item-title>
              Visit help center
            </v-list-item-title>
            
          </v-list-item>
        </v-list>
      </v-menu>

      <template v-slot:extension v-if="smAndDown && $route.name === 'Serp'">
        <entity-type-selector/>
        <shortcut-box class="flex-grow-1"/>
      </template>
    </v-app-bar>
    <div>
    </div>

    <v-main class="ma-0 pb-0">
      <router-view></router-view>
    </v-main>

    <entity-drawer />

    <site-footer/>

    <v-snackbar
      location="top"
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

import { getConfigs } from '@/oaxConfigs';

import UserToolbarMenu from '@/components/User/UserToolbarMenu.vue';
import SavedSearchRenameDialog from '@/components/SavedSearch/SavedSearchRenameDialog.vue';
import SavedSearchEditAlertDialog from '@/components/SavedSearch/SavedSearchEditAlertDialog.vue';
import SiteFooter from './components/SiteFooter.vue';
import ShortcutBox from '@/components/ShortcutBox.vue';
import EntityDrawer from '@/components/Entity/EntityDrawer.vue';
import EntityTypeSelector from '@/components/EntityTypeSelector.vue';

const store = useStore();
const router = useRouter();

const { mobile, smAndDown } = useDisplay();

const exportObj = ref({ progress: 0 });

const globalIsLoading = computed(() => store.getters.globalIsLoading);

// Head
useHead({
  titleTemplate: (title) => (title ? `${title} | OpenAlex` : 'OpenAlex'),
  link: [],
  meta: []
});

function setFeatureFlags() {
  const urlParams = new URLSearchParams(window.location.search);
  const ui = urlParams.get('ui');
  if (ui) {
    store.state.uiVariant = ui;
  }
  const useElastic = urlParams.has('elastic');
  if (useElastic) {
    store.commit("setUseElasticForAnalytics", true);
  }
  const useV2 = urlParams.has('v2');
  if (useV2) {
    store.state.useV2 = true;
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
  const root = getCurrentInstance().appContext.app;
  root.configs = getConfigs();

  setInterval(async () => {
    if (!store.state.exportProgressUrl) return;
    const resp = await axios.get(store.state.exportProgressUrl);
    console.log(resp.data);
    exportObj.value = resp.data;
    if (exportObj.value === 1) {
      exportObj.value = null;
      store.state.exportProgressUrl = null;
    }
  }, 1000);
});
</script>


<style lang="scss">

$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.v-main {
  background-color: #fff
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
html, body {
  // THIS IS REQUIRED to disable styles that Vuetify applies,
  // which keep the v-scroll-lock directive from working.
  overflow: initial;
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
.v-btn {
  font-weight: 500;
  letter-spacing: normal;
  text-transform: none;
}
.v-btn--is-elevated {
  box-shadow: none;
}
.white-space-normal {
  white-space: normal !important;
}
$logo-link-height: 35px;
.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  //padding-left: 30px;
  .logo-icon {
    height: $logo-link-height;
    //margin-top: -5px;
  }
  .logo-text {
    //padding: 0 14px;
    padding-left: .3em;
    line-height: 1.2;
    //border-left: 1px solid #333;
    color: #000;
    font-family: Dosis;
    font-size: $logo-link-height * 0.75;
    font-weight: 500;
  }
}
body {
  font-family: Roboto, sans-serif;
  line-height: 1.5;

  .v-application {
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
}
.low-key-button {
  text-transform: none !important;
  font-weight: normal !important;
  letter-spacing: 0 !important;
}
.v-list-item__prepend {
  display: inline !important;
}

.v-list-item__action {
  align-self: flex-start;
  margin-top: 8px;
}
.v-list--two-line.v-list--dense .v-list-item {
  min-height: unset;
}
.v-list-item {
  min-height: unset !important;
  .v-list-item__content {
    padding: 10px 0 !important;
  }
}
.v-application--is-ltr .v-list-item__action:first-child, .v-application--is-ltr .v-list-item__icon:first-child {
  margin-right: 8px;
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
  overflow: hidden;
}

</style>