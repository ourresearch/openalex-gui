<template>
  <div style="padding-bottom: 150px;">
    <v-container class="">
      <v-row class="above-the-fold flex-column align-center" style="height: 100vh;">
        <v-col cols="3"></v-col>
        <v-col class="flex-grow-0">
          <!-- logo -->
          <v-card color="transparent" flat :height="logoHeight" class="landing-page-logo">
            <img
                src="@/assets/openalex-logo-icon-black-and-white.png"
                class="logo-icon mr-0 colorizable"
            />
            <span
                class="logo-text colorizable"
                :style="'font-size:' + logoHeight * .75 + 'px'"
            >
                OpenAlex
              </span>

          </v-card>
        </v-col>
        <v-col>
          <v-card flat rounded class="color-2 pa-0" max-width="600" style="margin: 0 auto;">
            <div class="pa-5 pb-0 px-6 d-flex align-center">
                Search and analyze the world's research.
<!--               <vue-typer-->
<!--                   class="font-weight-bold"-->
<!--                   :text="textToType"-->
<!--                   :pre-erase-delay='1000'-->
<!--               />-->
              <v-spacer></v-spacer>
              <v-btn icon @click="$vuetify.goTo('#learn-more')">
                <v-icon>mdi-information-outline</v-icon>

              </v-btn>

            </div>
            <div class="pa-5">
              <search-bar />
            </div>

          </v-card>


        </v-col>
        <v-spacer></v-spacer>
        <v-btn text rounded class="mb-3" @click="$vuetify.goTo('#learn-more')">
          <v-icon>mdi-chevron-down</v-icon>
          Learn more
        </v-btn>
      </v-row>

      <!--        <p style="">-->
      <!--          Inspired by the ancient library of Alexandria, OpenAlex catalogs 250M scholarly works, along with their-->
      <!--          citations, authors, institutional affiliations, and more &mdash; and we're 100% free and open source.-->
      <!--        </p>-->

      <v-row class="" id="learn-more">
        <v-col class="d-flex justify-center">
          <v-card flat rounded max-width="900" class="mb-12 pa-8">
            <v-card-title>About us:</v-card-title>
            <div class="pa-3">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum
            </div>
            <div class="pa-3">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum
            </div>
            <div class="pa-3">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum
            </div>
          </v-card>

        </v-col>


      </v-row>

    </v-container>
  </div>


  <!--        <homepage-user-logos/>-->

  <!--        <homepage-selling-points />-->

  <!--        <homepage-testimonials />-->


</template>

<script>

import FilterBar from "@/components/FilterBar/FilterBar.vue";
import SearchBar from "@/components/SearchBar.vue";
import { VueTyper } from 'vue-typer'
export default {
  name: 'home',
  components: {
    SearchBar,
    VueTyper,
  },
  metaInfo: {
    title: "OpenAlex: The open catalog to the global research system",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      userEmail: "",
      errorMsg: "",
      textToType: [
          "the world's research ecosystem",
          "Tim Berners-Lee",
          "Sorbonne",
          "solar power",
          "doi:10.7717/peerj.4375",
      ]
    }
  },
  computed: {
    logoHeight() {
      return 75

      return this.$vuetify.breakpoint.mobile ?
          50 :
          75
    }
  },
  methods: {},
  mounted() {
  },
}
</script>

<style lang="scss" scoped>
.landing-page-logo {

  display: flex;
  align-items: center;
  justify-content: center;

  .logo-icon {
    height: 100%;
  }

  .logo-text {
    margin: 0;
    line-height: 1.2;
    color: #000;
    font-family: Dosis;
    padding-left: .3em;
    font-weight: 500;
  }
}


.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
