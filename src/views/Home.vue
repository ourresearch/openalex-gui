<template>
  <div class="home" style="min-height: 90vh;">
      <v-container class="">
        <div class="results">
          results:
          <div
              :key="JSON.stringify(result)"
              v-for="result in results"
              class="my-12 py-12"
          >
            <div class="text-h5">{{result.original_title}}</div>
            <div>
              <span class="date">
                {{ result.year}}
              </span>
              <span class="sep">-</span>
              <span class="authors">Authors unknown</span>
              <span class="sep">-</span>
              <span class="venue">Venue unknown</span>
            </div>
            <div>
              <v-row
                  :key="resultKey"
                  class="pa-0 mt-4"
                v-for="resultKey in Object.keys(result)"
              >
                <v-col cols="2" class="pa-0 text-right pr-2">
                  {{resultKey}}
                </v-col>
                <v-col cols="10" class="pa-0">
                  {{result[resultKey]}}
                </v-col>

              </v-row>
            </div>

          </div>
        </div>
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
    async doSearch(){
      const resp = await axios.get("https://api.openalex.org/works/query?filter=continent:Asia,genre:proceedings&details")
      this.results = resp.data.response
      console.log("got a response!", resp.data.response)

    }
  },
  mounted() {
    this.doSearch()
  },
}
</script>

<style lang="scss">

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
