<template>
  <v-app>
    <v-navigation-drawer
        v-model="isSiteNavOpen"
        app
        color="#fafafa"
        v-if="0"
    >
      <site-nav/>


    </v-navigation-drawer>
    <v-progress-linear
        indeterminate
        fixed color="primary"
        style="z-index: 9999"
        v-if="globalIsLoading"
    />
    <v-app-bar
        app
        flat
        dense

        color="white"
        class="pl-0"
        absolute


    >
        <!--            v-if="$route.name !== 'Home'"-->
        <router-link
            :to="{name: 'Home'}"
            class="logo-link"
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
              </span>

        </router-link>


<!--        <v-menu v-if="$route.name === 'Serp'" rounded offset-y content-class="no-highlight" min-width="150">-->
<!--          <template v-slot:activator="{on}">-->
<!--            <v-btn icon color="" v-on="on">-->
<!--              <v-icon class="">mdi-cog</v-icon>-->
<!--            </v-btn>-->
<!--          </template>-->
<!--          <v-list>-->
<!--            <v-list-item @click="$store.state.isApiEditorShowing = !$store.state.isApiEditorShowing">-->
<!--              <v-list-item-icon>-->
<!--                <v-icon v-if="$store.state.isApiEditorShowing">mdi-check</v-icon>-->
<!--              </v-list-item-icon>-->
<!--              <v-list-item-content>-->
<!--                <v-list-item-title>-->
<!--                  Show API query-->
<!--                </v-list-item-title>-->
<!--              </v-list-item-content>-->
<!--            </v-list-item>-->
<!--          </v-list>-->
<!--        </v-menu>-->

      <v-spacer />

<!--        <v-btn-->
<!--            icon-->
<!--            @click="isSiteNavOpen = !isSiteNavOpen"-->
<!--            style="margin-left: -10px;"-->
<!--        >-->
<!--          <v-icon>mdi-menu</v-icon>-->
<!--        </v-btn>-->




    </v-app-bar>
    <v-main>
      <router-view></router-view>
      <site-footer/>
    </v-main>

    <v-snackbar
        top
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
import axios from "axios";
import {filtersFromUrlStr} from "@/filterConfigs";
import SearchBoxNew from "@/components/SearchBoxNew.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteNav from "@/components/SiteNav.vue";

export default {
  name: 'App',
  metaInfo: {
    titleTemplate: 'OpenAlex | %s',
    link: [],

    meta: []
  },
  components: {
    SearchBoxNew,
    SiteFooter,
    SiteNav,
  },


  data: function () {
    return {
      exportProgress: 0,
      isSiteNavOpen: !this.$vuetify.breakpoint.mobile,
      exportObj: {
        progress: 0,
      },
      dialogs: {
        showAlpha: false
      },
      resultsFilters: [],
    }
  },
  computed: {
    ...mapGetters([
      "searchFacetConfigs",
      "globalIsLoading",
      "entityType",
    ]),

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
    cancelExport() {
      this.exportObj = null
      this.$store.state.exportProgressUrl = null
      this.snackbar("Export cancelled.")
    }
  },
  async mounted() {
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
        this.resultsFilters = filtersFromUrlStr(
            this.entityType,
            to?.query?.filter
        )
      }
    }
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

//.v-navigation-drawer__content {
//  overflow-y: hidden !important;
//}

.theme--light.v-list-item--active::before {
  //opacity: 0;
}

$logo-link-height: 32px;

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

    margin: 5px 0 5px 15px;
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
}

.v-list-item__action, {
  align-self: flex-start;
  margin-top: 8px;
}

.v-list--two-line.v-list--dense .v-list-item {
  min-height: unset;
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

.v-tabs--icons-and-text .v-tab{
  font-size: 12px !important;
  text-transform: capitalize;
}


</style>
