<template>
  <div class="">
    <div class="above-the-fold">
      <v-container style="margin-top: 150px">
        <div class="text-h2" style="line-height: 1.3;">
          A free index for the world's research
        </div>
        <div class="mt-12">
          <p style="">

            Inspired by the ancient Library of Alexandria, OpenAlex is an index of hundreds of millions of interconnected entities across the global research system. We're 100% free and open source, and offer access via a web interface, API, and database snapshot.
          </p>

        </div>
        <div class="mt-8">
          <v-btn x-large
                 rounded
              class=""
              color="primary"
              href="https://docs.openalex.org/"
          >
            Read the docs
            <v-icon right>mdi-open-in-new</v-icon>
          </v-btn>
          <v-btn
              x-large
              rounded
              outlined
              color="primary"
              to="/testimonials"
              class="ml-4"
          >
            Read testimonials


          </v-btn>


<!--          <v-btn-->
<!--              x-large-->
<!--              class=""-->
<!--              text-->
<!--              color="primary"-->
<!--              href="http://eepurl.com/hA8PhL"-->
<!--              target="_blank"-->
<!--          >-->
<!--            Join mailing list-->
<!--            <v-icon right>mdi-open-in-new</v-icon>-->
<!--          </v-btn>-->

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

<style lang="scss" scoped>



.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
