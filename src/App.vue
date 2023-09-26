<template>
  <v-app>
    <!--    <v-navigation-drawer app dark absolute clipped width="320" style="height: 100%;">-->
    <!--      <filter-list :filters="resultsFilters" />-->
    <!--    </v-navigation-drawer>-->
    <v-progress-linear
        indeterminate
        fixed color="primary"
        style="z-index: 9999"
        v-if="globalIsLoading"
    />
    <v-app-bar
        app
        flat

        color="white"
        class="pl-0"
        absolute
        :extended="$vuetify.breakpoint.mobile"
        extension-height="100"


    >
      <v-container class="d-flex align-center" :class="{'pr-0': $vuetify.breakpoint.mobile}">
<!--            v-if="$route.name !== 'Home'"-->
        <router-link
            :to="{name: 'Home'}"
            class="logo-link pl-1"
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
        <v-spacer />
        <search-box-new class="flex-grow-1" v-if="!$vuetify.breakpoint.mobile" />
        <v-spacer/>
<!--        <v-btn light target="_blank"-->

<!--               color="warning"-->
<!--               rounded-->
<!--               outlined-->
<!--               class="ml-3"-->
<!--               v-if="$vuetify.breakpoint.smAndUp"-->
<!--               href="https://docs.google.com/document/d/1G0_HBvaeH30rQTGwxhVwVtdh5rX&#45;&#45;7dWb9poBDUGdA0/edit#heading=h.oyun2a4w33cz">-->
<!--          <v-icon left>mdi-alert</v-icon>-->
<!--          Alpha version-->
<!--        </v-btn>-->


        <v-menu offset-y v-if="$store.state.exportProgressUrl">
          <template v-slot:activator="{on}">
            <v-btn
                icon
                class="elevation-0"
                color="primary"
                dark
                v-on="on"
                style="position: relative;"
            >
              <v-icon x-small v-if="!exportIsFinished">mdi-arrow-down</v-icon>
              <v-icon v-if="exportIsFinished">mdi-tray-arrow-down</v-icon>
              <v-progress-circular
                  style="position: absolute;"
                  rotate="-90"
                  :value="exportObj.progress * 100" size="25"
                  v-if="!exportIsFinished"
              />
              <!--                  {{ Math.round(exportObj.progress * 100) }}%-->
              <!--                  <v-icon right>mdi-menu-down</v-icon>-->
            </v-btn>
          </template>
          <v-card>
            <v-card-title>Export {{ (exportIsFinished) ? 'complete' : 'in progress' }}</v-card-title>
            <v-card-text>
              Your requested export is <strong>{{ exportObj.progress * 100 | toPrecision }}%</strong> complete.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="cancelExport">Cancel</v-btn>
              <v-btn text color="primary" :disabled="!exportIsFinished" :href="exportObj.result_url"
                     target="_blank">
                <v-icon left>mdi-tray-arrow-down</v-icon>
                Download
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>



        <v-menu offset-y content-class="no-highlight" min-width="150">
          <template v-slot:activator="{on}">
            <v-btn icon color="" v-on="on">
              <v-icon class="">mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/about">
              About
            </v-list-item>
            <v-list-item to="/testimonials">
              Testimonials
            </v-list-item>
            <v-list-item to="/pricing">
              Pricing
            </v-list-item>
            <v-list-item to="/help">
              Help
            </v-list-item>
            <v-list-item to="/about#contact">
              Contact
            </v-list-item>
            <v-list-item href="https://docs.openalex.org/">
              Read the docs
              <v-icon small right>mdi-open-in-new</v-icon>
            </v-list-item>
          </v-list>
        </v-menu>


      </v-container>

      <template v-slot:extension v-if="$vuetify.breakpoint.mobile">
        <search-box-new class="flex-grow-1"  />

      </template>

    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <site-footer />

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
import axios from "axios";
import {filtersFromUrlStr} from "@/filterConfigs";
import SearchBoxNew from "@/components/SearchBoxNew.vue";
import SiteFooter from "./components/SiteFooter.vue";

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
  },


  data: function () {
    return {
      exportProgress: 0,
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
    //background: #444 !important;

    .rounded {
      border-radius: 15px !important;
    }

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
