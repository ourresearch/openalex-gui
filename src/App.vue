<template>
  <router-view />
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
  overflow-y:hidden !important;
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

.v-icon.mdi-checkbox-blank-circle-outline  {
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
