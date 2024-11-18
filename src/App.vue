<template>
  <v-app>
    <v-progress-linear
      v-if="globalIsLoading"
      indeterminate
      fixed
      color="primary"
      style="z-index: 9999"
    />
    
    <v-app-bar
      app
      flat
      :height="isMobile ? undefined : 70"
      color="transparent"
      absolute
      :extended="isMobile && $route.name === 'Serp'"
      extension-height="70"
    >
      <router-link :to="{ name: 'Home' }" class="logo-link ml-3">
        <img src="@/assets/openalex-logo-icon-black-and-white.png" class="logo-icon mr-0 colorizable" />
        <span class="logo-text colorizable">OpenAlex</span>
      </router-link>

      <div class="flex-grow-1 mr-3 ml-6 d-flex justify-center" v-if="$route.name === 'Serp'">
        <entity-type-selector v-if="!isMobile" />
        <shortcut-box style="max-width: 800px;" class="flex-grow-1 d-none d-lg-block" />
      </div>

      <div v-if="$route.name !== 'Serp'" class="flex-grow-1"></div>
      <user-toolbar-menu/>

      <v-menu v-if="!isMobile" offset-y>
        <template v-slot:activator="{ on }">
          <v-btn icon v-bind="on">
            <v-icon icon="mdi-help-circle-outline"></v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
            <span>
              <v-icon icon="mdi-comment-question-outline"></v-icon>
            </span>
            
              <v-list-item-title>Contact support</v-list-item-title>
            
          </v-list-item>
          <v-list-item href="https://help.openalex.org/" target="_blank">
            <span>
              <v-icon icon="mdi-help-circle-outline"></v-icon>
            </span>
            
              <v-list-item-title>Visit help center</v-list-item-title>
            
          </v-list-item>
        </v-list>
      </v-menu>

      <template v-slot:extension v-if="isMobile && $route.name === 'Serp'">
        <entity-type-selector />
        <shortcut-box class="flex-grow-1" />
      </template>
    </v-app-bar>

    <v-main class="ma-0 pb-0">
      <router-view></router-view>
    </v-main>
    <site-footer />

    <v-snackbar bottom v-model="snackbarIsOpen">
      <v-icon dark left v-if="snackbarIcon">{{ snackbarIcon }}</v-icon>
      {{ snackbarMsg }}
      <template v-slot:action="{ attrs }">
        <v-btn icon v-bind="attrs" @click="closeSnackbar">
          <v-icon icon="mdi-close"></v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <saved-search-rename-dialog />
    <saved-search-edit-alert-dialog />
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import axios from 'axios';
import SiteFooter from './components/SiteFooter.vue';
import UserToolbarMenu from '@/components/user/UserToolbarMenu.vue';
import ShortcutBox from '@/components/ShortcutBox.vue';
import EntityTypeSelector from '@/components/EntityTypeSelector.vue';
import SavedSearchRenameDialog from '@/components/SavedSearchRenameDialog.vue';
import SavedSearchEditAlertDialog from '@/components/SavedSearchEditAlertDialog.vue';

export default defineComponent({
  name: 'App',
  components: {
    SiteFooter,
    UserToolbarMenu,
    ShortcutBox,
    EntityTypeSelector,
    SavedSearchRenameDialog,
    SavedSearchEditAlertDialog,
  },
  setup() {
    // Vuetify display breakpoints
    const { xs, smAndDown } = useDisplay();
    const isMobile = computed(() => xs.value || smAndDown.value);

    // Vuex store and router
    const store = useStore();
    const route = useRoute();

    // Reactive data
    const exportProgress = ref(0);
    const exportObj = ref<{ progress: number | null }>({ progress: 0 });
    const snackbarIsOpen = computed(() => store.state.snackbarIsOpen);
    const snackbarMsg = computed(() => store.state.snackbarMsg);
    const snackbarIcon = computed(() => store.state.snackbarIcon);
    const globalIsLoading = computed(() => store.getters.globalIsLoading);

    // Methods
    const copyToClipboard = async (content: string) => {
      await navigator.clipboard.writeText(content);
      store.commit('snackbar', 'Copied to clipboard.');
    };

    const cancelExport = () => {
      exportObj.value = { progress: 0 };
      store.state.exportProgressUrl = null;
      store.commit('snackbar', 'Export cancelled.');
    };

    const closeSnackbar = () => {
      store.commit('closeSnackbar');
    };

    onMounted(() => {
      setInterval(async () => {
        if (!store.state.exportProgressUrl) return;
        try {
          const resp = await axios.get(store.state.exportProgressUrl);
          exportObj.value = resp.data;
          if (exportObj.value.progress === 1) {
            exportObj.value = { progress: 0 };
            store.state.exportProgressUrl = null;
          }
        } catch (error) {
          console.error("Error fetching export progress:", error);
        }
      }, 1000);
    });

    watch(route, () => {
      const isLocalHost = window.location.hostname === 'localhost';
      const isStaging = window.location.hostname === 'staging.openalex.org';
      store.state.isDevEnv = isLocalHost || isStaging;
    });

    return {
      isMobile,
      exportProgress,
      exportObj,
      snackbarIsOpen,
      snackbarMsg,
      snackbarIcon,
      globalIsLoading,
      copyToClipboard,
      cancelExport,
      closeSnackbar,
    };
  },
});
</script>
<style lang="scss">

$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.v-main {
  background-color: #fff;
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

  .v-card__actions {
    //background-color: $color-1;

  }
}

.v-card.button-card {
  transition: background-color 300ms;
  background-color: $color-3;
  //background-color: #ddd;

  border: none;

  &:hover {
    background-color: $color-2;

    &.no-hover {
      background-color: $color-1;
    }

  }
}

.v-toolbar__extension {
  padding: 4px;
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

.v-btn {
  font-weight: 500;
  letter-spacing: normal;
  text-transform: none;
}

.v-btn--is-elevated {
  box-shadow: none;
}

//.v-navigation-drawer__content {
//  overflow-y: hidden !important;
//}

.theme--light.v-list-item--active::before {
  //opacity: 0;
}

$logo-link-height: 35px;


.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  // margin-left: 25px !important;
  padding-left: 17px;
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

// https://stackoverflow.com/a/40444657
//.colorizable { filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.4) hue-rotate(70deg);}


.v-btn--active.no-active {
  //text-decoration: underline !important;
  //border-bottom: 3px solid #333;
}
.v-messages{
  min-height: 0;
}

body {
  //font-size: 16px;
  .v-application--wrap {
    flex: 1 1 auto;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: 100%;
    position: relative;
  }
  .v-btn__content {
    align-items: center;
    color: inherit;
    display: flex;
    flex: 1 0 auto;
    justify-content: inherit;
    line-height: normal;
    position: relative;
    transition: inherit;
    transition-property: opacity;
  }
  .v-btn--size-default{
      font-size: 1rem;
  }

  .v-select {
    position: relativel;

    &:not(.v-select--is-multi).v-text-field--single-line .v-select__selections {
        flex-wrap: nowrap
    }

    &>.v-input__control>.v-input__slot {
          cursor: pointer
    }

    .v-chip {
      flex: 0 1 auto;
      margin: 4px
    }


    .v-chip--selected:after {
      opacity: .22
    }

    .fade-transition-leave-active {
      position: absolute;
      left: 0
    }

    &.v-input--is-dirty ::-moz-placeholder {
      color: transparent!important
    }

    &.v-input--is-dirty ::placeholder {
      color: transparent!important
    }
    &:not(.v-input--is-dirty):not(.v-input--is-focused) .v-text-field__prefix {
      line-height: 20px;
      top: 7px;
      transition: .3s cubic-bezier(.25,.8,.5,1)
    }
  }


  .v-application {
    .text-h5,  
    .text-h6 {
      line-height: 2rem;
      font-family: Roboto, sans-serif !important;
    }
    .text-h5 {
      font-size: 1.5rem !important;
      font-weight: 400;
      letter-spacing: normal !important;
    }
    .ml-3 {
      margin-left: 12px !important;
    }
    .mb-3 {
      margin-bottom: 12px !important;
    }
    
    a {
        color: #1976d2;
    }
    .v-card-actions a{
      color: rgba(0, 0, 0, 0.87);
    }
    a {
        cursor: pointer;
    }
    .v-btn.v-btn--icon .v-icon {
      color: rgba(0, 0, 0, .54);
    }
    .v-field--focused .mdi-magnify, .mdi-close{
      color: #1976d2 !important;
      caret-color: #1976d2 !important;
      opacity: 1;
    }

    .text-h5, .text-h6 {
        line-height: 2rem;
        font-family: Roboto, sans-serif !important;
    }

    .text-h5 {
        font-size: 1.5rem !important;
        font-weight: 400;
        letter-spacing: normal !important;
    }
    .ml-3 {
        margin-left: 12px !important;
    }
    .mb-3 {
        margin-bottom: 12px !important;
    }
    a {
      color: #1976d2;
    }
    //background: #F7F9FC !important;
    background: #fff !important;

    .rounded {
      border-radius: 15px !important;
    }

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

.v-icon.mdi-checkbox-blank-outline,
.v-icon.mdi-checkbox-blank-circle-outline {
  //opacity: 0.2 !important;
}

.v-icon.mdi-plus {
  //opacity: .7 !important;
}

.v-list-item__icon {
  //margin-top: 8px !important;
}

.v-list-item__action, {
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


.v-expansion-panel-content__wrap {
  //padding: 0 16px 16px;
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


</style>
