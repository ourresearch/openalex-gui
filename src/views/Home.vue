<template>
  <div class="home d-flex justify-center align-center" style="min-height: 90vh;">
    <div class="above-the-fold">
      <v-container class="">
        <div class="text-h3" style="line-height: 1.3;">
          An open, comprehensive catalog of scholarly papers, authors, institutions, and more.
        </div>
        <div class="text-h5 mt-6">
          <p style="">
            OpenAlex will launch in December 2021, as a drop-in replacement for
            <a href="https://www.microsoft.com/en-us/research/project/academic/articles/microsoft-academic-to-expand-horizons-with-community-driven-approach/">Microsoft
              Academic Graph.</a> Learn more in our latest blog post, and join the mailing list to stay up-to-date.
          </p>

        </div>
        <div class="mt-8 d-flex">
          <v-btn
              x-large
              class=""
              color="primary"
              href="http://eepurl.com/hA8PhL"
              target="_blank"
          >
            Join mailing list
            <v-icon right>mdi-open-in-new</v-icon>
          </v-btn>
          <v-btn
              x-large
              class="ml-4"
              color="primary"
              text
              href="https://blog.ourresearch.org/openalex-update-june"
              target="_blank"
          >
            Read latest blog post
            <v-icon right>mdi-open-in-new</v-icon>
          </v-btn>

        </div>
      </v-container>

    </div>


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

export default {
  name: 'home',
  components: {},
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
  computed: {},
  methods: {},
  mounted() {
  },
}
</script>

<style lang="scss">

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
