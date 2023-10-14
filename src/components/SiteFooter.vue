<template>
  <v-footer class="py-10 site-footer" dark color="#555">
    <v-container>
      <v-row>
        <v-col cols="12" sm="2">
          <div>
            <router-link to="/about">About</router-link>
          </div>
          <div>
            <router-link to="/testimonials">Testimonials</router-link>
          </div>
          <div>
            <router-link to="/pricing">Pricing</router-link>
          </div>
          <div>
            <router-link to="/help">Help</router-link>
          </div>
          <div>
            <router-link to="/webinars">Webinars</router-link>
          </div>
          <div>
            <router-link to="/stats">Statistics</router-link>
          </div>
        </v-col>
        <v-col cols="12" sm="2">
          <a href="https://docs.openalex.org/" target="_blank">
            Read the docs
            <v-icon small>mdi-open-in-new</v-icon>
          </a>
          <div>
            <router-link to="/about#contact">Contact</router-link>
          </div>
          <div>
            <a href="https://groups.google.com/g/openalex-users" target="_blank">Mailing list</a>
          </div>
          <div>
            <a href="https://twitter.com/openalex_org" target="_blank">Twitter</a>
          </div>
          <div>
            <a href="https://github.com/orgs/ourresearch/repositories?language=&q=openalex&sort=&type=public"
              target="_blank">Source code</a>
          </div>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <router-link to="/">
            <img class="site-footer-logo" src="@/assets/openalex-logo-icon-reverse.png" alt=""/>
          </router-link>
        </v-col>
        <v-col cols="12" sm="4" class="body-2">
          OpenAlex is made with ❤︎ by <a style="text-decoration: underline;"
            href="https://ourresearch.org">OurResearch,</a> with generous support from <a
            style="text-decoration: underline;" href="https://www.arcadiafund.org.uk/">Arcadia&mdash;a
            charitable fund of Lisbet Rausing and Peter Baldwin</a>.
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
export default {
  name: "SiteFooter"
}
</script>

<style scoped lang="scss">
.site-footer {
  line-height: 1.8;
  margin-top: 150px;

  .body-2 {
    font-family: Inconsolata;
  }

  a {
    text-decoration: none;
    color: #fff;

    &:hover {
      text-decoration: underline;
    }
  }
}

img.site-footer-logo {
  width: 70px;
  opacity: 1;

}
</style>