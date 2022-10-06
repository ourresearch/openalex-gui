<template>
  <router-view />
</template>

<script>
import Facet from "./components/Facet/Facet";
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
    Facet,
  },


  data: function () {
    return {}
  },
  computed: {
    ...mapGetters([
      "searchFacetConfigs",
    ]),
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

//
//
//#entity-zoom {
//  position: fixed;
//  top: 64px;
//  right: 0;
//  bottom: 0;
//  z-index: 5;
//  background: #fff;
//  transition: width 200ms;
//
//
//}
//
//#entity-zoom-content {
//  position: absolute;
//  overflow-y: scroll;
//  top: 48px;
//  right: 0;
//  bottom: 0;
//  left: 0;
//}
//
//#zoom-overlay {
//  position: fixed;
//  top: 0;
//  bottom: 0;
//  left: 0;
//  right: 0;
//  z-index: 4;
//  background: rgba(0, 0, 0, .5);
//}

// hack to get rid of vue's active class on buttons, which makes them display different
// when they are linking to the page you're on right now.
// https://github.com/vuetifyjs/vuetify/issues/8172#issuecomment-596935920
// you have to also add this to the button:
// <v-btn active-class="no-active"></v-btn>
.v-btn--active.no-active::before {
  opacity: 0.00005 !important;
}

.theme--light.v-list-item--active::before {
  opacity: 0;
}


.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  //padding-left: 30px;
  .logo-icon {
    height: 38px;
    //margin-top: -5px;
    opacity: .7;
  }

  .logo-text {
    //padding: 0 14px;

    margin: 5px 15px 5px 10px;
    line-height: 1.2;
    //border-left: 1px solid #333;
    color: #000;


    font-family: Dosis;
    letter-spacing: .03em;
    opacity: .7;
    font-size: 28px;
    font-weight: 400;
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
  text-transform: none !important;
  font-weight: normal !important;
  letter-spacing: 0 !important;
}

.v-icon.mdi-checkbox-blank-outline {
  opacity: 0.2 !important;
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
