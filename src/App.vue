<template>
  <v-app :style="{ background: backgroundColor }">

    <!--
    <v-progress-linear
        indeterminate
        fixed color="primary"
        style="z-index: 9999"
        v-if="$store.state.search.is_completed === false"
    />
    -->
    <v-app-bar
        app
        flat
        :height="$vuetify.breakpoint.mobile ? undefined : 70"
        color="transparent"
        class=""
        absolute
        :extended="$vuetify.breakpoint.mobile && $route.name === 'Serp'"
        extension-height="70"
        @click.meta.stop="pinkMode"
    >
      <!--        v-if="$vuetify.breakpoint.smAndDown || $route.name !== 'Serp'"-->

      <router-link
          :to="{name: 'Home'}"
          class="logo-link ml-3"
      >
        <img
            src="@/assets/openalex-logo-icon-black-and-white.png"
            class="logo-icon mr-0 colorizable"
        />
        <span
            class="logo-text colorizable"
        >
                OpenAlex
              </span>

      </router-link>
      <div class="flex-grow-1"></div>
      <v-menu offset-y rounded>
        <template v-slot:activator="{on}">
          <v-chip
              v-on="on"
              outlined
              class="ml-3 mt-1 mr-2"
              v-if="environment !== 'production'"
              :color="environment === 'local' ? '' : 'warning'"
          >
            <v-icon left small v-if="environment === 'local'">mdi-cog-outline</v-icon>
            <v-icon left small v-else-if="environment === 'staging'">mdi-flask-outline</v-icon>
            {{ environment }}
            <v-icon small right>mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item
              :href="localUrl"
              target="_blank"
              :class="{'v-list-item--active primary--text': environment === 'local'}"
          >
            <v-list-item-icon>
              <v-icon>mdi-cog-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Local
                <v-icon x-small>mdi-open-in-new</v-icon>
              </v-list-item-title>
              <v-list-item-subtitle>
                localhost:8080
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
              :href="stagingUrl"
              target="_blank"
              :class="{'v-list-item--active primary--text': environment === 'staging'}"
          >
            <v-list-item-icon>
              <v-icon>mdi-flask-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Staging
                <v-icon x-small>mdi-open-in-new</v-icon>
              </v-list-item-title>
                <v-list-item-subtitle>
                  staging.openalex.org
                </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon @click.prevent.stop="copyToClipboard(stagingUrl)">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn icon to="/tests">
        <v-icon>mdi-clipboard-check-multiple-outline</v-icon>
      </v-btn>

      <user-toolbar-menu/>

      <v-menu v-if="!$vuetify.breakpoint.mobile" offset-y>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on">
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-comment-question-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Contact support
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item href="https://help.openalex.org/" target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-help-circle-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Visit help center
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <template v-slot:extension v-if="$vuetify.breakpoint.mobile && $route.name === 'Serp'">
        <!-- <entity-type-selector/> -->
        <shortcut-box
            class="flex-grow-1"
        />
      </template>
    </v-app-bar>
    <div>
    </div>
    <v-main class="ma-0 pb-0">
      <router-view></router-view>
    </v-main>
    <v-navigation-drawer right app temporary v-model="isNavDrawerOpen" width="400">
      <!--      <v-toolbar flat dense>-->
      <!--        <v-btn icon @click="isNavDrawerOpen=false">-->
      <!--          <v-icon>mdi-close</v-icon>-->
      <!--        </v-btn>-->
      <!--        <v-spacer/>-->
      <!--        <v-btn icon :to="$store.state.zoomId">-->
      <!--          <v-icon>mdi-link</v-icon>-->
      <!--        </v-btn>-->
      <!--        <v-btn icon :href="`https://api.openalex.org/${$store.state.zoomId}`" target="_blank">-->
      <!--          <v-icon>mdi-api</v-icon>-->
      <!--        </v-btn>-->

      <!--      </v-toolbar>-->
      <entity
          class="pa-4"
          v-if="$store.state.zoomId" :id="$store.state.zoomId"
          closeable
          small-buttons
          @close="$store.state.zoomId = null"
      />
    </v-navigation-drawer>
    <site-footer/>


    <v-snackbar
        top
        v-model="$store.state.snackbarIsOpen"
        :color="$store.state.snackbarColor"
    >
      <v-icon dark left v-if="$store.state.snackbarIcon">{{ $store.state.snackbarIcon }}</v-icon>
      {{ $store.state.snackbarMsg }}

      <template v-slot:action="{ attrs }">
        <v-btn
            icon
            v-bind="attrs"
            @click="$store.commit('closeSnackbar')"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!--<saved-search-rename-dialog/>
    <saved-search-edit-alert-dialog/>-- removed to prevent mapgetters calling entityType which doesn't exist on RA> -->


  </v-app>
</template>


<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import {sleep} from "./util";
import axios from "axios";
import {filtersFromUrlStr} from "@/filterConfigs";
import SiteFooter from "./components/SiteFooter.vue";
import SiteNav from "@/components/SiteNav.vue";
import {url} from "@/url";
import SearchBox from "@/components/EntityTypeSelector.vue";
import UserToolbarMenu from "@/components/user/UserToolbarMenu.vue";


import Template from "@/components/SerpToolbar/SerpToolbarMenu.vue";
import SerpToolbar from "@/components/SerpToolbar/SerpToolbar.vue";

import ShortcutBox from "@/components/ShortcutBox.vue";
//import EntityTypeSelector from "@/components/EntityTypeSelector.vue";
import {entity} from "@/entity";
import Entity from "@/components/Entity/Entity.vue";
import SearchFromText from "@/components/SearchFromText.vue";
import router from "@/router";


export default {
  name: 'App',
  metaInfo: {
    titleTemplate: 'OpenAlex | %s',
    link: [],
    meta: []
  },
  components: {
    SiteFooter,
    UserToolbarMenu,
    Entity,
    SearchFromText,
    ShortcutBox,
    //EntityTypeSelector,
  },
  data: function () {
    return {
      exportProgress: 0,
      backgroundColor: "hsl(220, 60%, 96%)", // light blue
      // backgroundColor: "hsl(214, 54%, 98%)",  // gmail grey
      isSiteNavOpen: !this.$vuetify.breakpoint.mobile,
      exportObj: {
        progress: 0,
      },
      dialogs: {
        showAlpha: false
      },
      url,
    }
  },
  computed: {
    ...mapGetters([
      "globalIsLoading",
      "environment",
    ]),
    localUrl() {
      return `http://localhost:8080${this.$route.fullPath}`;
    },
    stagingUrl() {
      return `https://staging.openalex.org${this.$route.fullPath}`;
    },
    logoStyle() {
      return "opacity: .7;"
      return `filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.5) hue-rotate(${this.logoColorRotation}deg);`
    },
    isLocalHost() {
      return window.location.hostname === "localhost"
    },
    exportIsFinished() {
      return this.exportObj.progress === 1
    },
    isNavDrawerOpen: {
      get() {
        return !!this.$store.state.zoomId
      },
      set(val) {
        if (!val) this.$store.state.zoomId = null
      }
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("Copied to clipboard.")
    },
    cancelExport() {
      this.exportObj = null
      this.$store.state.exportProgressUrl = null
      this.snackbar("Export cancelled.")
    },
    pinkMode() {
      const newColor = '#FF69B4';
      this.backgroundColor = "#FFCCDC"
      this.$vuetify.theme.themes.light.primary = newColor
      this.$vuetify.theme.currentTheme.primary = newColor
    },
    setUIVariant() {
      // Check if "ui" param exists on URL and if so set it's value on state.ui
      const urlParams = new URLSearchParams(window.location.search);
      const ui = urlParams.get('ui');
      if (ui) {
        this.$store.state.uiVariant = ui
      }
    }
  },
  created() {
    this.setUIVariant()
  },
  async mounted() {
    const configResp = await axios.get("https://api.openalex.org/entities/config")
    this.$root.config = configResp.data

    setInterval(async () => {
      if (!this.$store.state.exportProgressUrl) return
      const resp = await axios.get(this.$store.state.exportProgressUrl)
      console.log(resp.data)
      this.exportObj = resp.data
      if (this.exportObj === 1) {
        this.exportObj = null
        this.$store.state.exportProgressUrl = null
      }
    }, 1000)
    // await sleep(2000)
    // console.log("disable body scroll")
    // bodyScrollLock.disableBodyScroll()
  },
  watch: {
    '$route': {
      immediate: true,
      handler(to, from) {

      }
    },
  }
};
</script>
<style lang="scss">

$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.v-main {
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

//.v-navigation-drawer__content {
//  overflow-y: hidden !important;
//}

.theme--light.v-list-item--active::before {
  //opacity: 0;
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

// https://stackoverflow.com/a/40444657
//.colorizable { filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.4) hue-rotate(70deg);}


.v-btn--active.no-active {
  //text-decoration: underline !important;
  //border-bottom: 3px solid #333;
}

body {
  //font-size: 16px;

  .v-application {
    //background: #F7F9FC !important;
    //background: #fff !important;
    //background: pink !important;

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
