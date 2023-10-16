<template>
  <v-footer color="#fff" class="site-footer" style="border-top: 2px dashed #ccc; padding:50px 0 100px;">
    <v-container>
      <v-row>
        <v-col cols="12" sm="5" class="">
          <div>
            <img
                src="@/assets/openalex-logo-icon-black-and-white.png"
                class="logo-icon mr-0 colorizable"
                style="height: 35px;"
            />
          </div>
          OpenAlex is a free index for the world's research ecosystem. It's made by <a
            href="https://ourresearch.org">OurResearch</a> with support from

          <a href="https://www.arcadiafund.org.uk/">Arcadia</a>&mdash;a
          charitable fund of Lisbet Rausing and Peter Baldwin.
        </v-col>
        <v-spacer/>
        <v-col cols="12" sm="2">
          <div class=" mb-4">Use</div>


          <div>
            <a href="https://cookbook.openalex.org/" target="_blank">
              Cookbook
              <v-icon small color="primary">mdi-open-in-new</v-icon>
            </a>
          </div>

          <div>
            <router-link to="/pricing">Pricing</router-link>
          </div>
          <div>
          <router-link to="/testimonials">
            Testimonials
          </router-link>

          </div>


        </v-col>


        <v-col cols="12" sm="2">
          <div class=" mb-4">Learn</div>


          <div>
            <a href="https://help.openalex.org/" target="_blank">
              Data reference
              <v-icon small color="primary">mdi-open-in-new</v-icon>
            </a>
          </div>

          <div>
            <a href="https://docs.openalex.org/" target="_blank">
              Developers guide
              <v-icon small color="primary">mdi-open-in-new</v-icon>
            </a>

          </div>

          <div>
            <router-link to="/stats">Coverage stats</router-link>
          </div>
        </v-col>

        <v-col cols="12" sm="2">
          <div class=" mb-4">Connect</div>


          <div>
            <router-link to="/help">Contact</router-link>
          </div>
          <div>
            <router-link to="/webinars">Webinars</router-link>
          </div>
          <div>
            <a href="https://groups.google.com/g/openalex-users" target="_blank">Mailing list</a>
          </div>
          <div>
            <a href="https://twitter.com/openalex_org" target="_blank">Twitter</a>
          </div>


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
    //color: #fff;

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