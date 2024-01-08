<template>
  <v-container class="">
    <v-row class="above-the-fold flex-column align-center" style="height: 100vh;">
      <v-col cols="3"></v-col>
      <v-col class="">
        <v-card flat :height="logoHeight" class="landing-page-logo">
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
<!--          <div class="text-body-2 text-md-body-1 mt-8 text-center">-->
<!--            <span>Search and analyze the world's research ecosystem:</span>-->
<!--          </div>-->
        <div class="mt-8 d-flex justify-center">
          <filter-bar style="max-width: 800px" />
        </div>


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
        <v-card flat max-width="800" class="mb-12">
          <v-card-title>About us:</v-card-title>
          <div class="pa-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
          </div>
          <div class="pa-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
          </div>
          <div class="pa-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
          </div>
        </v-card>

      </v-col>


    </v-row>

    </v-container>



    <!--        <homepage-user-logos/>-->

    <!--        <homepage-selling-points />-->

    <!--        <homepage-testimonials />-->






</template>

<script>

import FilterBar from "@/components/FilterBar/FilterBar.vue";

export default {
  name: 'home',
  components: {
    FilterBar,
  },
  metaInfo: {
    title: "OpenAlex: The open catalog to the global research system",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      userEmail: "",
      errorMsg: ""
    }
  },
  computed: {
    logoHeight() {
      return this.$vuetify.breakpoint.mobile ?
          50 :
          100
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
