<template>
  <v-app>
    <v-app-bar
        app
        color="white"
        class="pl-0"
        :class="{mobile: $vuetify.breakpoint.mobile}"
        absolute
        flat
        height="75"

    >
      <div class="d-flex flex-fill justify-space-between align-center">
        <div class="d-flex flex-fill">
          <router-link :to="{name: 'Home'}" class="logo-link pl-2" style="width: 300px;">
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
          <!--          {{ logoColorRotation }}-->
          <search-box
              v-if="!$vuetify.breakpoint.mobile"
              class="ml-5 d-md-block d-none mt-1 flex-fill"
              style="max-width: 700px;"
          />
        </div>

        <div class="">
          <v-menu offset-y content-class="no-highlight" min-width="150">
            <template v-slot:activator="{on}">
              <v-btn icon color="" v-on="on">
                <v-icon class="">mdi-menu</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item to="/">Home</v-list-item>
              <v-list-item href="/about">
                About
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
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
              <a href="/about">
                About
              </a>
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

  </v-app>
</template>

<script>
import EntityZoom from "./components/Zoom/ZoomEntity";


import {mapActions, mapGetters, mapMutations} from "vuex";
import {sleep} from "./util";


export default {
  name: 'App',
  metaInfo: {
    titleTemplate: '%s | OpenAlex',
    link: [],

    meta: []
  },
  components: {
    EntityZoom,
  },


  data: function () {
    return {}
  },
  computed: {
    ...mapGetters([
      "searchFacetConfigs",
    ]),

    logoStyle() {
      return "opacity: .7;"
      return `filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.5) hue-rotate(${this.logoColorRotation}deg);`
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([]),
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

$logo-link-height: 42px;

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
    font-size: $logo-link-height * 0.66666666;
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
  opacity: 0.2 !important;
}

.v-icon.mdi-plus {
  //opacity: .7 !important;
}

.v-list-item__icon {
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


.capitalize-first-letter:first-letter {
  text-transform: uppercase !important;
}

img.site-footer-logo {
  width: 60px;

}
</style>
