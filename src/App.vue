<template>
  <v-app>
    <v-progress-linear
            indeterminate
            fixed color="primary"
            style="z-index: 9999"
            v-if="globalIsLoading"
    />
    <v-app-bar
            app
            color="white"
            class="pl-0"
            :class="{mobile: $vuetify.breakpoint.mobile}"
            absolute
            :extended="$vuetify.breakpoint.mobile"

    >
      <v-container :class="{'px-0': $vuetify.breakpoint.mobile}">
        <v-row>

          <v-col cols="6" sm="6" class="d-flex align-center">
            <router-link
                    :to="{name: 'Home'}"
                    class="logo-link pl-1"
                    v-if="$route.name !== 'Home'"
            >
              <img
                      src="@/assets/openalex-logo-icon-black-and-white.png"
                      class="logo-icon mr-0 colorizable"
                      :style="logoStyle"
              />
              <span
                      class="logo-text colorizable"
                      :style="logoStyle"
              >
                OpenAlex
                <!--                <span class="grey&#45;&#45;text">-->
                <!--                  {{ selectedEntityTypeConfig.displayName }}-->
                <!--                </span>-->
              </span>
            </router-link>


          </v-col>
          <v-col cols="6" class="d-flex align-center">
            <v-spacer></v-spacer>


            <entity-type-selector/>

<v-btn
            icon
            target="_blank"
            @click="copyToClipboard('https://alpha.openalex.org' + $route.fullPath)"
        >
          <v-icon>mdi-share-variant-outline</v-icon>
        </v-btn>


            <v-menu offset-y content-class="no-highlight" min-width="150">
              <template v-slot:activator="{on}">
                <v-btn icon color="" v-on="on">
                  <v-icon class="">mdi-menu</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/">
                  Home
                </v-list-item>
                <v-list-item to="/about">
                  About
                </v-list-item>
                <v-list-item to="/premium">
                  Premium
                </v-list-item>
                <v-list-item to="/help">
                  Help
                </v-list-item>
              </v-list>
            </v-menu>

          </v-col>
        </v-row>

      </v-container>
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-footer
            class="py-10 site-footer"
            style="margin-top: 150px;"
            :style="{paddingRight: 0}"
            dark
            color="#363636"
    >
      <v-container>
        <v-row>
          <v-col cols="12" sm="4">
            <div>
              <router-link to="/">Home</router-link>
            </div>
            <div>
              <!--              <a href="/about">-->
              <!--                About-->
              <!--              </a>-->
            </div>
          </v-col>
          <v-col cols="12" sm="4" class="text-center">
            <router-link to="/">
              <img class="site-footer-logo" src="@/assets/openalex-logo-icon-reverse.png" alt=""/>
            </router-link>
          </v-col>
          <v-col cols="12" sm="4" class="body-2">
            OurResearch is supported in part by <a
                  style="text-decoration: underline;"
                  href="https://www.arcadiafund.org.uk/">Arcadia&mdash;a
            charitable fund of Lisbet Rausing and Peter Baldwin</a>.
          </v-col>
        </v-row>
      </v-container>
    </v-footer>


    <v-snackbar
            bottom
            v-model="$store.state.snackbarIsOpen"
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


  </v-app>
</template>

<script>


import {mapActions, mapGetters, mapMutations} from "vuex";
import {sleep} from "./util";
import UserToolbarMenu from "./components/user/UserToolbarMenu.vue";
import EntityTypeSelector from "./components/EntityTypeSelector.vue";

export default {
    name: 'App',
    metaInfo: {
        titleTemplate: 'OpenAlex | %s',
        link: [],

        meta: []
    },
    components: {
        EntityTypeSelector,
        UserToolbarMenu,
    },


    data: function () {
        return {
            dialogs: {
                showAlpha: false
            }
        }
    },
    computed: {
        ...mapGetters([
            "searchFacetConfigs",
            "resultsFilters",
            "globalIsLoading",
        ]),

        logoStyle() {
            return "opacity: .7;"
            return `filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.5) hue-rotate(${this.logoColorRotation}deg);`
        },
        isLocalHost() {
            return window.location.hostname === "localhost"
        },
    },
    methods: {
        ...mapMutations([
            "setFiltersZoom",
            "openFacetsDialog",
            "snackbar",
        ]),
        ...mapActions([]),
        async copyToClipboard(content) {
            await navigator.clipboard.writeText(content);
            this.snackbar("Copied to clipboard.")
        },
    },
    async mounted() {
        // await sleep(2000)
        // console.log("disable body scroll")
        // bodyScrollLock.disableBodyScroll()
    }
};
</script>
<style lang="scss">

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

.v-navigation-drawer__content {
  overflow-y: hidden !important;
}

.theme--light.v-list-item--active::before {
  //opacity: 0;
}

$logo-link-height: 38px;

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

    margin: 5px 0 5px 10px;
    line-height: 1.2;
    //border-left: 1px solid #333;
    color: #000;


    font-family: Dosis;
    letter-spacing: .03em;
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
    background: #F7F9FC !important;

    .body-1, .body-2 {
      letter-spacing: normal !important;
    }

    .body-1 {
      font-size: 15px !important;
    }

    .body-2 {
      font-size: 13px !important;
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
}

.v-list-item__action, {
  align-self: flex-start;
  margin-top: 8px;
}

.v-list--two-line.v-list--dense .v-list-item {
  min-height: unset;
}


.site-footer {
  line-height: 1.8;

  a {
    text-decoration: none;
    color: #fff !important;

    &:hover {
      text-decoration: underline;
    }
  }
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
</style>
