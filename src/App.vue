<template>
  <v-app>
    <v-app-bar
            app
            color="white"
            class="pl-0"
            :class="{mobile: $vuetify.breakpoint.mobile}"
            absolute
            flat
            :extended="$vuetify.breakpoint.mobile"

    >
      <v-container :class="{'px-0': $vuetify.breakpoint.mobile}">
        <v-row>

          <v-col cols="8" sm="2">
            <router-link
                    :to="{name: 'Home'}"
                    class="logo-link pl-1"
                    style="width: 180px;"
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
          <v-col cols="6" v-if="!$vuetify.breakpoint.mobile && $route.name === 'Serp'" class="d-flex">

            <!--            <v-btn-->
            <!--                    @click="openFacetsDialog"-->
            <!--                    color="green"-->
            <!--                    dark-->
            <!--                    large-->
            <!--                    style="height: 39px;"-->
            <!--            >-->
            <!--              &lt;!&ndash;                  :disabled="singleWork"&ndash;&gt;-->
            <!--              <v-icon class="">mdi-filter-menu-outline</v-icon>-->
            <!--            </v-btn>-->


            <search-box-new

                    class="flex-grow-1"
                    style="max-width: 600px;"
            />

          </v-col>
          <v-col cols="4" class="d-flex">
            <v-spacer></v-spacer>


            <user-toolbar-menu />

            <v-btn
                    icon
                    target="_blank"
                    @click="copyToClipboard('https://alpha.openalex.org' + $route.fullPath)"
                    v-if="isLocalHost"
            >
              <v-icon color="primary">mdi-share-variant-outline</v-icon>
            </v-btn>


            <!--            <v-menu offset-y content-class="no-highlight" min-width="150">-->
            <!--              <template v-slot:activator="{on}">-->
            <!--                <v-btn icon color="" v-on="on">-->
            <!--                  <v-icon class="">mdi-menu</v-icon>-->
            <!--                </v-btn>-->
            <!--              </template>-->
            <!--              <v-list>-->
            <!--                <v-list-item to="/">-->
            <!--                  Home-->
            <!--                </v-list-item>-->
            <!--                <v-list-item to="/about">-->
            <!--                  About-->
            <!--                </v-list-item>-->
            <!--                <v-list-item to="/premium">-->
            <!--                  Premium-->
            <!--                </v-list-item>-->
            <!--                <v-list-item to="/help">-->
            <!--                  Help-->
            <!--                </v-list-item>-->
            <!--              </v-list>-->
            <!--            </v-menu>-->

          </v-col>
        </v-row>

      </v-container>
      <template v-slot:extension v-if="$vuetify.breakpoint.mobile">
        <v-btn
                fab
                @click="openFacetsDialog"
                color="green"
                dark
                small
                class="mt-3 mr-3"
        >
          <!--            :disabled="singleWork"-->
          <v-icon class="">mdi-filter-menu-outline</v-icon>
        </v-btn>
        <search-box-new class="pt-3" style="width: 100%;"/>
      </template>
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

    <v-dialog v-if="!isLocalHost" persistent max-width="500" v-model="dialogs.showAlpha">
      <v-card>
        <v-toolbar dark color="error">
          <v-icon left>mdi-alert</v-icon>
          <v-toolbar-title>
            This is unfinished software
          </v-toolbar-title>
        </v-toolbar>
        <v-card>
          <v-card-text>
            <p>
              You're looking at our <a href="https://en.wikipedia.org/wiki/Software_release_life_cycle#Alpha" target="_blank">alpha
              version:</a> that means it's <strong>buggy, incomplete, and changing daily.</strong>
            </p>
            <p>
              If you like adventure and providing feedback, this is the version for you! <a
                    href="https://openalex.org/help">Share your thoughts here.</a>
            </p>
            <p>
              If you'd like to <em>evaluate</em> OpenAlex, we recommend you wait for the beta version, which launches in July.
            </p>

          </v-card-text>
          <v-card-actions>
            <v-btn
                    outlined
                    color="error"
                    @click="dialogs.showAlpha = false"
            >
<!--              <v-icon left>mdi-alert-outline</v-icon>-->
              try alpha
            </v-btn>
            <v-btn
                    text
                    color="error"
                    @click="dialogs.showAlpha = false"
                    href="https://forms.gle/NDoXAQVKGQLpkF5U8" target="_blank"
            >
<!--              <v-icon left>mdi-alert-outline</v-icon>-->
              wait for beta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card>
    </v-dialog>


  </v-app>
</template>

<script>


import {mapActions, mapGetters, mapMutations} from "vuex";
import {sleep} from "./util";
import SearchBoxNew from "@/components/SearchBoxNew.vue";
import UserToolbarMenu from "./components/user/UserToolbarMenu.vue";


export default {
    name: 'App',
    metaInfo: {
        titleTemplate: 'OpenAlex | %s',
        link: [],

        meta: []
    },
    components: {
        SearchBoxNew,
        UserToolbarMenu,
    },


    data: function () {
        return {
            dialogs: {
                showAlpha: true
            }
        }
    },
    computed: {
        ...mapGetters([
            "searchFacetConfigs",
            "resultsFilters",
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

.v-navigation-drawer__content {
  overflow-y: hidden !important;
}

.theme--light.v-list-item--active::before {
  opacity: 0;
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
  font-size: 16px;

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
