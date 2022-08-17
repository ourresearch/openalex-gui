<template>
  <v-app>
    <v-app-bar
        app
        fixed
        clipped-right
        color="white"
        class=""
        elevate-on-scroll

    >
      <router-link to="/" class="logo-link">
        <img
            src="@/assets/openalex-logo-icon.png"
            class="logo-icon"
        />
        <span class="logo-text">
          OpenAlex
        </span>
      </router-link>

      <search-box v-if="$route.name !== 'Home'" />
      <v-spacer></v-spacer>

      <!--      DESKTOP MENU -->
      <v-toolbar-items class=" hidden-sm-and-down">
        <v-btn class="no-active low-key-button" text to="/">Home</v-btn>
        <v-btn class="no-active low-key-button" text href="/about">
          About
        </v-btn>
        <!--        <v-btn class="no-active low-key-button" text to="./projects">Projects</v-btn>-->
        <!--        <v-btn class="no-active low-key-button" text to="./transparency">Transparency</v-btn>-->
      </v-toolbar-items>

      <!--      MOBILE MENU -->
      <div class=" hidden-md-and-up">
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
            <!--            <v-list-item to="./projects">Projects</v-list-item>-->
            <!--            <v-list-item to="./transparency">Transparency</v-list-item>-->
          </v-list>
        </v-menu>
      </div>


    </v-app-bar>

    <!--    <v-navigation-drawer app clipped>-->
    <!--      hi-->
    <!--    </v-navigation-drawer>-->

    <div
        :style="{width: entityZoomWidth}"
        id="entity-zoom"
    >
      <v-toolbar flat fixed dense>
        <template>
          <v-btn icon @click="closeEntityZoom">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <div id="entity-zoom-content" v-if="$store.state.entityZoomData" v-scroll-lock="true">


        <entity-work v-if="$store.state.entityZoomType==='works'" :data="$store.state.entityZoomData"/>
        <entity-author v-if="$store.state.entityZoomType==='authors'" :data="$store.state.entityZoomData"/>
        <entity-venue v-if="$store.state.entityZoomType==='venues'" :data="$store.state.entityZoomData"/>
        <entity-institution v-if="$store.state.entityZoomType==='institutions'" :data="$store.state.entityZoomData"/>
        <entity-concept v-if="$store.state.entityZoomType==='concepts'" :data="$store.state.entityZoomData"/>
      </div>
    </div>

    <v-main :style="{paddingRight: 0}">
      <v-fade-transition>
        <div id="zoom-overlay" v-if="applyOverlay"></div>
      </v-fade-transition>
      <router-view/>
    </v-main>

    <v-footer
        class="py-10 site-footer"
        style="margin-top: 150px;"
        :style="{paddingRight: 0}"
        dark
        color="#555"
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


    <v-snackbar
        bottom
        v-model="$store.state.snackbarIsOpen">
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
import SearchBox from "./components/SearchBox";

import Facet from "./components/Facet/Facet";

import EntityWork from "./components/EntityWork";
import EntityAuthor from "./components/EntityAuthor";
import EntityVenue from "./components/EntityVenue";
import EntityInstitution from "./components/EntityInstitution";
import EntityConcept from "./components/EntityConcept";
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
    SearchBox,
    EntityWork,
    EntityAuthor,
    EntityVenue,
    EntityInstitution,
    EntityConcept,

    Facet,
  },


  data: function () {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "searchFacetConfigs",
    ]),
    entityZoomWidth() {
      return this.$store.state.entityZoomIsOpen ? "95%" : 0
    },
    bodyScrollLock() {
      return this.$store.state.entityZoomIsOpen
    },
    applyOverlay(){
      return this.$store.state.entityZoomIsOpen

    }
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([]),
    closeEntityZoom() {
      this.$store.dispatch("closeEntityZoomDrawer")
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


#entity-zoom {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  z-index: 5;
  background: #fff;
  transition: width 200ms;


}

#entity-zoom-content {
  position: absolute;
  overflow-y: scroll;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
}

#zoom-overlay {
  position: absolute;
  top:0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,.5);
}

// hack to get rid of vue's active class on buttons, which makes them display different
// when they are linking to the page you're on right now.
// https://github.com/vuetifyjs/vuetify/issues/8172#issuecomment-596935920
// you have to also add this to the button:
// <v-btn active-class="no-active"></v-btn>
.v-btn--active.no-active::before {
  opacity: 0.05 !important;
}

.logo-link {
  text-decoration: none;
  width: 500px;
  display: flex;
  align-items: center;
  padding-left: 7px;

  .logo-icon {
    height: 45px;
  }

  .logo-text {
    padding: 0 14px;
    margin: 5px 15px;
    line-height: 1.2;
    border-left: 1px solid #333;
    color: #000;
    font-family: Dosis;
    letter-spacing: .03em;
    font-size: 30px;
    font-weight: 300;
  }

}

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
  font-size: 16px !important;
  text-transform: none !important;
  font-weight: normal !important;
  letter-spacing: 0 !important;
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
    text-transform: uppercase;
}
img.site-footer-logo {
  width: 60px;

}
</style>
