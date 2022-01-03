<template>
  <v-app>
    <v-app-bar
        app
        elevate-on-scroll
        fixed
        color="white"

    >
      <router-link to="/" class=" text-decoration-none">
<!--        <v-img-->
<!--            alt="OurResearch Logo"-->
<!--            class="shrink mr-2"-->
<!--            contain-->
<!--            src="@/assets/logos/ourresearch_logo.png"-->
<!--            transition="scale-transition"-->
<!--            width="200"-->
<!--        />-->
        <img
          src="@/assets/explore-OpenAlex-logo.png"
          style="height: 40px;"
        />
      </router-link>

      <v-spacer></v-spacer>

<!--      DESKTOP MENU -->
      <v-toolbar-items class="d-none hidden-sm-and-down">
        <v-btn class="no-active low-key-button" text to="/">Home</v-btn>
        <v-btn class="no-active low-key-button" text to="./about">About</v-btn>
        <v-btn class="no-active low-key-button" text to="./projects">Projects</v-btn>
        <v-btn class="no-active low-key-button" text to="./transparency">Transparency</v-btn>
      </v-toolbar-items>

<!--      MOBILE MENU -->
      <div class="d-none hidden-md-and-up">
        <v-menu offset-y content-class="no-highlight" min-width="150">
          <template v-slot:activator="{on}">
            <v-btn icon color="" v-on="on">
              <v-icon class="">mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/">Home</v-list-item>
            <v-list-item to="./about">About</v-list-item>
            <v-list-item to="./projects">Projects</v-list-item>
            <v-list-item to="./transparency">Transparency</v-list-item>
          </v-list>
        </v-menu>
      </div>


    </v-app-bar>

    <v-main>
      <router-view  :key="$route.fullPath"/>
    </v-main>

    <v-footer
        v-if="0"
        class="py-10 site-footer"
        style="margin-top: 150px;"
        dark
        color="#555"
    >
      <v-container>
        <v-row>
          <v-col cols="12" sm="2">
            <div>
              <router-link to="/">Home</router-link>
            </div>
            <div>
              <router-link to="/about">About</router-link>
            </div>
            <div>
              <router-link to="/projects">Projects</router-link>
            </div>
            <div>
              <router-link to="/transparency">Transparency</router-link>
            </div>
            <div>
              <router-link to="/accessibility">Accessibility</router-link>
            </div>
          </v-col>
          <v-col cols="12" sm="2">
            <div><a href="https://twitter.com/OurResearch_org" target="_blank">Twitter</a></div>
            <div><a href="https://blog.ourresearch.org" target="_blank">Blog</a></div>
            <div><a href="https://github.com/ourresearch" target="_blank">GitHub</a></div>
            <div><a href="mailto:team@ourresearch.org">Email</a></div>
          </v-col>
          <v-col cols="12" sm="4" class="text-center">
            <router-link to="/">
              <img class="site-footer-logo" src="@/assets/logos/ourresearch-logo-icon-white.png" alt=""/>
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

export default {
  name: 'App',
    metaInfo: {
    titleTemplate: '%s | OpenAlex Web',
    link: [
    ],

    meta: []
  },

  data: () => ({
    //
  }),
};
</script>
<style lang="scss">

// hack to get rid of vue's active class on buttons, which makes them display different
// when they are linking to the page you're on right now.
// https://github.com/vuetifyjs/vuetify/issues/8172#issuecomment-596935920
// you have to also add this to the button:
// <v-btn active-class="no-active"></v-btn>
.v-btn--active.no-active::before {
  opacity: 0.05 !important;
}
.v-btn--active.no-active {
    //text-decoration: underline !important;
  //border-bottom: 3px solid #333;
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

img.site-footer-logo {
  width: 30px;

}
</style>
