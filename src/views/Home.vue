<template>
  <div class="home">
    <v-container style="min-height: 75vh;" class="d-flex align-center">
      <v-row>
        <v-col cols="3" class="hidden-xs-only"></v-col>
        <v-col>
          <v-card flat class="">
            <v-text-field
                solo
                disabled
                label="Search is coming soon..."
            />
            <div class="d-flex justify-center">
              <v-btn large disabled class="mr-2">Search</v-btn>
              <v-menu offset-y content-class="no-highlight" min-width="150">
                <template v-slot:activator="{on}">
                  <v-btn large v-on="on">
                    I'm feeling lucky
                    <v-icon>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item to="/works/random">📄 random &nbsp; <strong>work</strong></v-list-item>
                  <v-list-item to="/authors/random">👩🏻 random &nbsp; <strong>author</strong></v-list-item>
                  <v-list-item to="/venues/random">📚 random &nbsp; <strong>venue</strong></v-list-item>
                  <v-list-item to="/institutions/random">🏫 random &nbsp; <strong>institution</strong></v-list-item>
                  <v-list-item to="/concepts/random">💡 random &nbsp; <strong>concept</strong></v-list-item>
                  <!--            <v-list-item to="./projects">Projects</v-list-item>-->
                  <!--            <v-list-item to="./transparency">Transparency</v-list-item>-->
                </v-list>
              </v-menu>

            </div>
            <div>
            </div>
          </v-card>

        </v-col>
        <v-col cols="3" class="hidden-xs-only"></v-col>

      </v-row>

    </v-container>


    <!--        <homepage-user-logos/>-->

    <!--        <homepage-selling-points />-->

    <!--        <homepage-testimonials />-->

    <!--        <v-card flat tile class=""  style="margin-bottom: -50px; padding: 150px 0;">-->
    <!--            <v-container class="text-center my-12 py-6">-->
    <!--                <div class="text-h4 py-2">-->
    <!--                    Want to learn more?-->
    <!--                </div>-->
    <!--                <div class="text-h5">-->
    <!--                    Schedule a free custom demo, or watch our video guided tour.-->
    <!--                </div>-->
    <!--                <div class="mt-4">-->
    <!--                    <v-btn-->
    <!--                            to="./request-demo"-->
    <!--                            x-large-->
    <!--                            class="ma-4"-->
    <!--                            dark-->
    <!--                            color="primary"-->
    <!--                    >-->
    <!--                        Get your demo-->
    <!--                    </v-btn>-->
    <!--                    <v-btn-->
    <!--                            href="https://vimeo.com/420183913"-->
    <!--                            target="_blank"-->
    <!--                            x-large-->
    <!--                            class="ma-4">-->
    <!--                        Watch video-->
    <!--                        <v-icon small class="ml-2">mdi-open-in-new</v-icon>-->
    <!--                    </v-btn>-->

    <!--                </div>-->
    <!--            </v-container>-->

    <!--        </v-card>-->


  </div>


</template>

<script>

import axios from "axios";

export default {
  name: 'home',
  components: {},
  metaInfo: {
    title: "OpenAlex GUI",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      results: []

    }
  },
  computed: {},
  methods: {
    async doSearch() {
      const resp = await axios.get("https://api.openalex.org/works/query?filter=continent:Asia,genre:proceedings&details")
      this.results = resp.data.response
      console.log("got a response!", resp.data.response)

    }
  },
  mounted() {
    // this.doSearch()
  },
}
</script>

<style lang="scss">

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
