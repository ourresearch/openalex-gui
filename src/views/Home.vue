<template>
  <v-app>

    <v-container fill-height>
      <v-row style="margin-top: -20vh;">
        <v-col>
          <v-row justify="center" class="mb-8">
            <span class="logo-link">
              <img
                  src="@/assets/openalex-logo-icon-black-and-white.png"
                  class="logo-icon"
                  :style="logoStyle"
              />
              <span
                  class="logo-text"
                  :style="logoStyle"
              >
                OpenAlex
              </span>
            </span>
          </v-row>

          <v-row class="mx-1" justify="center">
            <search-box color="#333" is-alone-on-page style="max-width: 600px;"/>
          </v-row>
        </v-col>
      </v-row>

    </v-container>


  </v-app>


</template>

<script>

import axios from "axios";
import {entityConfigs} from "../entityConfigs";
import {mapGetters} from "vuex";

export default {
  name: 'home',
  components: {},
  metaInfo: {
    title: "OpenAlex GUI",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      results: [],
      entityConfigs,
      logoColorRotation: 0,

    }
  },
  computed: {
    ...mapGetters([]),
    logoStyle() {
      return "opacity: 0.8"
      // return `filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.5) hue-rotate(${this.logoColorRotation}deg);`
    },
  },
  methods: {
    goSearch() {
      // this.$router.push(this.serpUrl)
    }
  },
  beforeMount() {
    // this.doSearch()
    console.log("mounting the home page")
    this.$store.commit("resetSearch")
  },
  watch: {

    logoColorRotation: {
      immediate: true,
      handler(to, from) {
        setTimeout(() => {
          const date = new Date()
          const seconds = date.getSeconds()
          const rotation = seconds * 18
          this.logoColorRotation = rotation

        }, 1000)
      }
    },
  }
}
</script>

<style scoped lang="scss">
$logo-link-height: 90px;
.logo-link {
  .logo-icon {
    height: $logo-link-height;
  }

  .logo-text {
    font-size: $logo-link-height * 0.75;
  }
}

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
